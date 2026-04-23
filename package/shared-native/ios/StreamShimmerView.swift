import QuartzCore
import UIKit

private protocol StreamShimmerAppLifecycleObserving: AnyObject {
  func shimmerAppLifecycleDidChange(isActive: Bool)
}

private final class StreamShimmerAppLifecycleCoordinator: NSObject {
  static let shared = StreamShimmerAppLifecycleCoordinator()

  private let observers = NSHashTable<AnyObject>.weakObjects()

  private(set) var isAppActive: Bool

  private init(notificationCenter: NotificationCenter = .default) {
    isAppActive = Self.currentAppActiveState()
    super.init()

    notificationCenter.addObserver(
      self,
      selector: #selector(handleWillEnterForeground),
      name: UIApplication.willEnterForegroundNotification,
      object: nil
    )
    notificationCenter.addObserver(
      self,
      selector: #selector(handleDidEnterBackground),
      name: UIApplication.didEnterBackgroundNotification,
      object: nil
    )
  }

  func addObserver(_ observer: StreamShimmerAppLifecycleObserving) {
    observers.add(observer as AnyObject)
    observer.shimmerAppLifecycleDidChange(isActive: isAppActive)
  }

  func removeObserver(_ observer: StreamShimmerAppLifecycleObserving) {
    observers.remove(observer as AnyObject)
  }

  @objc
  private func handleWillEnterForeground() {
    broadcastAppState(isActive: true)
  }

  @objc
  private func handleDidEnterBackground() {
    broadcastAppState(isActive: false)
  }

  private func broadcastAppState(isActive: Bool) {
    self.isAppActive = isActive

    for case let observer as StreamShimmerAppLifecycleObserving in observers.allObjects {
      observer.shimmerAppLifecycleDidChange(isActive: isActive)
    }
  }

  private static func currentAppActiveState() -> Bool {
    switch UIApplication.shared.applicationState {
    case .active, .inactive:
      return true
    case .background:
      return false
    @unknown default:
      return true
    }
  }
}

/// Native shimmer view used by the Fabric component view.
///
/// It renders a base layer and a moving gradient highlight entirely in native code, so shimmer
/// animation stays off the JS thread. The view updates its gradient when size or colors change and
/// stops animation when it is not drawable (backgrounded, detached, hidden, or zero sized).
@objcMembers
public final class StreamShimmerView: UIView {
  private static let softHighlightAlpha: CGFloat = 0.24
  private static let defaultHighlightAlpha: CGFloat = 0.35
  private static let defaultShimmerDuration: CFTimeInterval = 1.2
  private static let shimmerStripWidthRatio: CGFloat = 1.25
  private static let shimmerAnimationKey = "stream_shimmer_translate_x"
  private static let gradientLocations: [NSNumber] = [0.0, 0.35, 0.5, 0.65, 1.0]
  private static let gradientAlphaFactors: [CGFloat] = [0, softHighlightAlpha, 1, softHighlightAlpha, 0]
  private static var animationDistanceTolerance: CGFloat {
    1 / max(UIScreen.main.scale, 1)
  }

  private let baseLayer = CALayer()
  private let shimmerLayer = CAGradientLayer()

  private var baseColor: UIColor = UIColor(white: 1, alpha: 0)
  private var gradientColor: UIColor = UIColor(white: 1, alpha: defaultHighlightAlpha)
  private var enabled = false
  private var shimmerDuration: CFTimeInterval = defaultShimmerDuration
  private var lastAnimatedDuration: CFTimeInterval = 0
  private var lastAnimatedTravelDistance: CGFloat = 0
  private var isAppActive = StreamShimmerAppLifecycleCoordinator.shared.isAppActive
  private var needsBaseColorUpdate = true
  private var needsGradientColorUpdate = true

  public override var isHidden: Bool {
    didSet {
      updateLayersForCurrentState()
    }
  }

  public override var alpha: CGFloat {
    didSet {
      updateLayersForCurrentState()
    }
  }

  public override init(frame: CGRect) {
    super.init(frame: frame)
    setupLayers()
    StreamShimmerAppLifecycleCoordinator.shared.addObserver(self)
  }

  public required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupLayers()
    StreamShimmerAppLifecycleCoordinator.shared.addObserver(self)
  }

  deinit {
    StreamShimmerAppLifecycleCoordinator.shared.removeObserver(self)
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
      invalidateResolvedColors()
      updateLayersForCurrentState()
    }
  }

  public func apply(
    baseColor: UIColor,
    gradientColor: UIColor,
    durationMilliseconds: Double,
    enabled: Bool
  ) {
    let normalizedDuration = Self.normalizedDuration(milliseconds: durationMilliseconds)
    let baseColorChanged = !self.baseColor.isEqual(baseColor)
    let gradientColorChanged = !self.gradientColor.isEqual(gradientColor)
    let durationChanged = shimmerDuration != normalizedDuration
    let enabledChanged = self.enabled != enabled

    if baseColorChanged {
      self.baseColor = baseColor
      needsBaseColorUpdate = true
    }

    if gradientColorChanged {
      self.gradientColor = gradientColor
      needsGradientColorUpdate = true
    }

    shimmerDuration = normalizedDuration
    self.enabled = enabled

    if baseColorChanged || gradientColorChanged || durationChanged || enabledChanged {
      updateLayersForCurrentState()
    }
  }

  public func stopAnimation() {
    shimmerLayer.removeAnimation(forKey: Self.shimmerAnimationKey)
    lastAnimatedDuration = 0
    lastAnimatedTravelDistance = 0
  }

  private func setupLayers() {
    isUserInteractionEnabled = false

    shimmerLayer.contentsScale = UIScreen.main.scale
    shimmerLayer.allowsEdgeAntialiasing = true
    shimmerLayer.startPoint = CGPoint(x: 0, y: 0.5)
    shimmerLayer.endPoint = CGPoint(x: 1, y: 0.5)
    shimmerLayer.locations = Self.gradientLocations

    layer.addSublayer(baseLayer)
    layer.addSublayer(shimmerLayer)
  }

  private func updateLayersForCurrentState() {
    let bounds = self.bounds
    let shouldHideShimmer = !enabled || bounds.isEmpty || isHidden || alpha <= 0.01

    shimmerLayer.isHidden = shouldHideShimmer

    guard !bounds.isEmpty else {
      stopAnimation()
      return
    }

    baseLayer.frame = bounds
    updateBaseLayerColorIfNeeded()
    updateShimmerGeometry(for: bounds)
    updateShimmerColorsIfNeeded()
    updateShimmerAnimation(for: bounds)
  }

  private func updateBaseLayerColorIfNeeded() {
    guard needsBaseColorUpdate else { return }
    baseLayer.backgroundColor = baseColor.resolvedColor(with: traitCollection).cgColor
    needsBaseColorUpdate = false
  }

  private func updateShimmerGeometry(for bounds: CGRect) {
    let shimmerWidth = max(bounds.width * Self.shimmerStripWidthRatio, 1)
    shimmerLayer.frame = CGRect(x: -shimmerWidth, y: 0, width: shimmerWidth, height: bounds.height)
  }

  private func updateShimmerColorsIfNeeded() {
    guard needsGradientColorUpdate else { return }

    let resolvedGradientColor = gradientColor.resolvedColor(with: traitCollection)
    shimmerLayer.colors = Self.gradientAlphaFactors.map {
      color(resolvedGradientColor, alphaFactor: $0).cgColor
    }
    needsGradientColorUpdate = false
  }

  private func updateShimmerAnimation(for bounds: CGRect) {
    guard
      enabled,
      isAppActive,
      window != nil,
      !isHidden,
      alpha > 0.01,
      bounds.width > 0,
      bounds.height > 0
    else {
      stopAnimation()
      return
    }

    let shimmerWidth = max(bounds.width * Self.shimmerStripWidthRatio, 1)
    let animationTravelDistance = bounds.width + shimmerWidth

    // If an animation already exists for the same travel distance, keep it running instead of
    // restarting. Fabric can relayout the view for height-only or subpixel changes that do not
    // require a new horizontal sweep.
    if shimmerLayer.animation(forKey: Self.shimmerAnimationKey) != nil,
      abs(lastAnimatedTravelDistance - animationTravelDistance) <= Self.animationDistanceTolerance,
      lastAnimatedDuration == shimmerDuration
    {
      return
    }

    stopAnimation()

    // Start just outside the left edge and sweep fully past the right edge for a clean pass.
    let animation = CABasicAnimation(keyPath: "transform.translation.x")
    animation.fromValue = 0
    animation.toValue = animationTravelDistance
    animation.duration = shimmerDuration
    animation.repeatCount = .infinity
    animation.timingFunction = CAMediaTimingFunction(name: .linear)
    animation.isRemovedOnCompletion = true
    shimmerLayer.add(animation, forKey: Self.shimmerAnimationKey)
    lastAnimatedDuration = shimmerDuration
    lastAnimatedTravelDistance = animationTravelDistance
  }

  private static func normalizedDuration(milliseconds: Double) -> CFTimeInterval {
    guard milliseconds > 0 else { return defaultShimmerDuration }
    return milliseconds / 1000
  }

  private func invalidateResolvedColors() {
    needsBaseColorUpdate = true
    needsGradientColorUpdate = true
  }

  private func color(_ color: UIColor, alphaFactor: CGFloat) -> UIColor {
    var red: CGFloat = 0
    var green: CGFloat = 0
    var blue: CGFloat = 0
    var alpha: CGFloat = 0

    if color.getRed(&red, green: &green, blue: &blue, alpha: &alpha) {
      return UIColor(red: red, green: green, blue: blue, alpha: alpha * alphaFactor)
    }

    guard
      let converted = color.cgColor.converted(
        to: CGColorSpace(name: CGColorSpace.extendedSRGB)!,
        intent: .defaultIntent,
        options: nil
      ),
      let components = converted.components
    else {
      return color.withAlphaComponent(color.cgColor.alpha * alphaFactor)
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
      return color.withAlphaComponent(color.cgColor.alpha * alphaFactor)
    }
  }
}

extension StreamShimmerView: StreamShimmerAppLifecycleObserving {
  func shimmerAppLifecycleDidChange(isActive: Bool) {
    // iOS can drop active layer animations while the app is backgrounded. We explicitly rerun
    // a state update on foreground so shimmer reliably restarts when returning to the app.
    self.isAppActive = isActive
    if isActive {
      updateLayersForCurrentState()
    } else {
      stopAnimation()
    }
  }
}
