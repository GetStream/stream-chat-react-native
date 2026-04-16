import QuartzCore
import UIKit

/// Native shimmer view used by the Fabric component view.
///
/// It renders a base layer and a moving gradient highlight entirely in native code, so shimmer
/// animation stays off the JS thread. The view updates its gradient when size or colors change and
/// stops animation when it is not drawable (backgrounded, detached, hidden, or zero sized).
@objcMembers
public final class StreamShimmerView: UIView {
  private static let edgeHighlightAlpha: CGFloat = 0.1
  private static let softHighlightAlpha: CGFloat = 0.24
  private static let midHighlightAlpha: CGFloat = 0.48
  private static let innerHighlightAlpha: CGFloat = 0.72
  private static let defaultHighlightAlpha: CGFloat = 0.35
  private static let defaultShimmerDuration: CFTimeInterval = 1.2
  private static let shimmerStripWidthRatio: CGFloat = 1.25
  private static let shimmerAnimationKey = "stream_shimmer_translate_x"

  private let baseLayer = CALayer()
  private let shimmerLayer = CAGradientLayer()

  private var baseColor: UIColor = UIColor(white: 1, alpha: 0)
  private var gradientColor: UIColor = UIColor(white: 1, alpha: defaultHighlightAlpha)
  private var enabled = false
  private var shimmerDuration: CFTimeInterval = defaultShimmerDuration
  private var lastAnimatedDuration: CFTimeInterval = 0
  private var lastAnimatedSize: CGSize = .zero
  private var isAppActive = true

  public override init(frame: CGRect) {
    super.init(frame: frame)
    setupLayers()
    setupLifecycleObservers()
  }

  public required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupLayers()
    setupLifecycleObservers()
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    updateLayersForCurrentState()
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      // Detaching from window means this view is no longer drawable. Stop and clear animation so
      // a later reattach starts from a clean state.
      stopAnimation()
    } else {
      // Reattaching (including reparenting across windows) re-evaluates state and restarts only
      // when needed by current bounds/visibility/enablement.
      updateLayersForCurrentState()
    }
  }

  public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)
    if let previousTraitCollection,
      traitCollection.hasDifferentColorAppearance(comparedTo: previousTraitCollection)
    {
      // In current usage, colors are typically driven by JS props. We still refresh on trait
      // changes so dynamically resolved native colors remain correct if that path is used later.
      updateLayersForCurrentState()
    }
  }

  public func apply(
    baseColor: UIColor,
    gradientColor: UIColor,
    durationMilliseconds: Double,
    enabled: Bool
  ) {
    self.baseColor = baseColor
    self.gradientColor = gradientColor
    shimmerDuration = Self.normalizedDuration(milliseconds: durationMilliseconds)
    self.enabled = enabled
    updateLayersForCurrentState()
  }

  public func stopAnimation() {
    shimmerLayer.removeAnimation(forKey: Self.shimmerAnimationKey)
    lastAnimatedDuration = 0
    lastAnimatedSize = .zero
  }

  private func setupLayers() {
    isUserInteractionEnabled = false

    shimmerLayer.contentsScale = UIScreen.main.scale
    shimmerLayer.allowsEdgeAntialiasing = true
    shimmerLayer.startPoint = CGPoint(x: 0, y: 0.5)
    shimmerLayer.endPoint = CGPoint(x: 1, y: 0.5)
    shimmerLayer.locations = [0.0, 0.08, 0.2, 0.32, 0.4, 0.5, 0.6, 0.68, 0.8, 0.92, 1.0]

    layer.addSublayer(baseLayer)
    layer.addSublayer(shimmerLayer)
  }

  private func setupLifecycleObservers() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleWillEnterForeground),
      name: UIApplication.willEnterForegroundNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleDidEnterBackground),
      name: UIApplication.didEnterBackgroundNotification,
      object: nil
    )
  }

  @objc
  private func handleWillEnterForeground() {
    // iOS can drop active layer animations while the app is backgrounded. We explicitly rerun
    // a state update on foreground so shimmer reliably restarts when returning to the app.
    isAppActive = true
    updateLayersForCurrentState()
  }

  @objc
  private func handleDidEnterBackground() {
    isAppActive = false
    stopAnimation()
  }

  private func updateLayersForCurrentState() {
    let bounds = self.bounds
    guard !bounds.isEmpty else {
      stopAnimation()
      return
    }

    baseLayer.frame = bounds
    baseLayer.backgroundColor = baseColor.cgColor

    updateShimmerLayer(for: bounds)
    updateShimmerAnimation(for: bounds)
  }

  private func updateShimmerLayer(for bounds: CGRect) {
    // Rebuild the shimmer gradient for current width/colors. Keep this tied to real state changes
    // such as layout/prop updates, not continuous per frame calls.
    let shimmerWidth = max(bounds.width * Self.shimmerStripWidthRatio, 1)
    let transparentHighlight = color(gradientColor, alphaFactor: 0)
    shimmerLayer.frame = CGRect(x: -shimmerWidth, y: 0, width: shimmerWidth, height: bounds.height)
    shimmerLayer.colors = [
      transparentHighlight.cgColor,
      color(gradientColor, alphaFactor: Self.edgeHighlightAlpha).cgColor,
      color(gradientColor, alphaFactor: Self.softHighlightAlpha).cgColor,
      color(gradientColor, alphaFactor: Self.midHighlightAlpha).cgColor,
      color(gradientColor, alphaFactor: Self.innerHighlightAlpha).cgColor,
      gradientColor.cgColor,
      color(gradientColor, alphaFactor: Self.innerHighlightAlpha).cgColor,
      color(gradientColor, alphaFactor: Self.midHighlightAlpha).cgColor,
      color(gradientColor, alphaFactor: Self.softHighlightAlpha).cgColor,
      color(gradientColor, alphaFactor: Self.edgeHighlightAlpha).cgColor,
      transparentHighlight.cgColor,
    ]
    shimmerLayer.isHidden = !enabled
  }

  private func updateShimmerAnimation(for bounds: CGRect) {
    guard enabled, isAppActive, window != nil, bounds.width > 0, bounds.height > 0 else {
      stopAnimation()
      return
    }

    // If an animation already exists for the same size, keep it running instead of restarting.
    if shimmerLayer.animation(forKey: Self.shimmerAnimationKey) != nil,
      lastAnimatedSize == bounds.size,
      lastAnimatedDuration == shimmerDuration
    {
      return
    }

    stopAnimation()

    // Start just outside the left edge and sweep fully past the right edge for a clean pass.
    let shimmerWidth = max(bounds.width * Self.shimmerStripWidthRatio, 1)
    let animation = CABasicAnimation(keyPath: "transform.translation.x")
    animation.fromValue = 0
    animation.toValue = bounds.width + shimmerWidth
    animation.duration = shimmerDuration
    animation.repeatCount = .infinity
    animation.timingFunction = CAMediaTimingFunction(name: .linear)
    animation.isRemovedOnCompletion = true
    shimmerLayer.add(animation, forKey: Self.shimmerAnimationKey)
    lastAnimatedDuration = shimmerDuration
    lastAnimatedSize = bounds.size
  }

  private static func normalizedDuration(milliseconds: Double) -> CFTimeInterval {
    guard milliseconds > 0 else { return defaultShimmerDuration }
    return milliseconds / 1000
  }

  private func color(_ color: UIColor, alphaFactor: CGFloat) -> UIColor {
    // Preserve the resolved color channels and shape only alpha for smooth highlight falloff.
    let resolvedColor = color.resolvedColor(with: traitCollection)

    var red: CGFloat = 0
    var green: CGFloat = 0
    var blue: CGFloat = 0
    var alpha: CGFloat = 0

    if resolvedColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha) {
      return UIColor(red: red, green: green, blue: blue, alpha: alpha * alphaFactor)
    }

    guard
      let converted = resolvedColor.cgColor.converted(
        to: CGColorSpace(name: CGColorSpace.extendedSRGB)!,
        intent: .defaultIntent,
        options: nil
      ),
      let components = converted.components
    else {
      return resolvedColor.withAlphaComponent(resolvedColor.cgColor.alpha * alphaFactor)
    }

    switch components.count {
    case 2:
      return UIColor(
        white: components[0],
        alpha: components[1] * alphaFactor
      )
    case 4:
      return UIColor(
        red: components[0],
        green: components[1],
        blue: components[2],
        alpha: components[3] * alphaFactor
      )
    default:
      return resolvedColor.withAlphaComponent(resolvedColor.cgColor.alpha * alphaFactor)
    }
  }
}
