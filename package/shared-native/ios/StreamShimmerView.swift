import QuartzCore
import UIKit

@objcMembers
public final class StreamShimmerView: UIView {
  private static let edgeHighlightAlpha: CGFloat = 0.45
  private static let midHighlightAlpha: CGFloat = 0.75
  private static let centerGradientAlpha: CGFloat = 0.35
  private static let shimmerStripWidthRatio: CGFloat = 1.1
  private static let shimmerDuration: CFTimeInterval = 1.2
  private static let shimmerAnimationKey = "stream_shimmer_translate_x"

  private let baseLayer = CALayer()
  private let shimmerLayer = CAGradientLayer()
  private let centerGradientLayer = CAGradientLayer()

  private var baseColor: UIColor = UIColor(white: 1, alpha: 0)
  private var highlightColor: UIColor = UIColor(white: 1, alpha: centerGradientAlpha)
  private var gradientColor: UIColor = .white
  private var gradientWidth: CGFloat = 0
  private var gradientHeight: CGFloat = 0
  private var enabled = false

  public override init(frame: CGRect) {
    super.init(frame: frame)
    setupLayers()
  }

  public required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupLayers()
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    updateLayersForCurrentState()
  }

  public func apply(
    baseColor: UIColor,
    highlightColor: UIColor,
    gradientColor: UIColor,
    gradientWidth: CGFloat,
    gradientHeight: CGFloat,
    enabled: Bool
  ) {
    self.baseColor = baseColor
    self.highlightColor = highlightColor
    self.gradientColor = gradientColor
    self.gradientWidth = max(gradientWidth, 0)
    self.gradientHeight = max(gradientHeight, 0)
    self.enabled = enabled
    updateLayersForCurrentState()
  }

  public func stopAnimation() {
    shimmerLayer.removeAnimation(forKey: Self.shimmerAnimationKey)
  }

  private func setupLayers() {
    isUserInteractionEnabled = false

    shimmerLayer.contentsScale = UIScreen.main.scale
    shimmerLayer.allowsEdgeAntialiasing = true
    shimmerLayer.startPoint = CGPoint(x: 0, y: 0.5)
    shimmerLayer.endPoint = CGPoint(x: 1, y: 0.5)
    shimmerLayer.locations = [0.0, 0.2, 0.34, 0.44, 0.56, 0.66, 0.8, 1.0]

    centerGradientLayer.contentsScale = UIScreen.main.scale
    centerGradientLayer.startPoint = CGPoint(x: 0, y: 0.5)
    centerGradientLayer.endPoint = CGPoint(x: 1, y: 0.5)
    centerGradientLayer.locations = [0.0, 0.5, 1.0]

    layer.addSublayer(baseLayer)
    layer.addSublayer(shimmerLayer)
    layer.addSublayer(centerGradientLayer)
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
    updateCenterGradientLayer(for: bounds)
    updateShimmerAnimation(for: bounds)
  }

  private func updateShimmerLayer(for bounds: CGRect) {
    let shimmerWidth = max(bounds.width * Self.shimmerStripWidthRatio, 1)
    shimmerLayer.frame = CGRect(x: -shimmerWidth, y: 0, width: shimmerWidth, height: bounds.height)
    shimmerLayer.colors = [
      baseColor.cgColor,
      color(highlightColor, alphaFactor: Self.edgeHighlightAlpha).cgColor,
      color(highlightColor, alphaFactor: Self.midHighlightAlpha).cgColor,
      highlightColor.cgColor,
      highlightColor.cgColor,
      color(highlightColor, alphaFactor: Self.midHighlightAlpha).cgColor,
      color(highlightColor, alphaFactor: Self.edgeHighlightAlpha).cgColor,
      baseColor.cgColor,
    ]
    shimmerLayer.isHidden = !enabled
  }

  private func updateCenterGradientLayer(for bounds: CGRect) {
    guard gradientWidth > 0, gradientHeight > 0 else {
      centerGradientLayer.isHidden = true
      return
    }

    let left = (bounds.width - gradientWidth) / 2
    let top = (bounds.height - gradientHeight) / 2
    centerGradientLayer.frame = CGRect(x: left, y: top, width: gradientWidth, height: gradientHeight)
    centerGradientLayer.colors = [
      color(gradientColor, alphaFactor: 0).cgColor,
      color(gradientColor, alphaFactor: Self.centerGradientAlpha).cgColor,
      color(gradientColor, alphaFactor: 0).cgColor,
    ]
    centerGradientLayer.isHidden = false
  }

  private func updateShimmerAnimation(for bounds: CGRect) {
    guard enabled, bounds.width > 0, bounds.height > 0 else {
      stopAnimation()
      return
    }

    stopAnimation()

    let shimmerWidth = max(bounds.width * Self.shimmerStripWidthRatio, 1)
    let animation = CABasicAnimation(keyPath: "transform.translation.x")
    animation.fromValue = 0
    animation.toValue = bounds.width + shimmerWidth
    animation.duration = Self.shimmerDuration
    animation.repeatCount = .infinity
    animation.timingFunction = CAMediaTimingFunction(name: .linear)
    animation.isRemovedOnCompletion = true
    shimmerLayer.add(animation, forKey: Self.shimmerAnimationKey)
  }

  private func color(_ color: UIColor, alphaFactor: CGFloat) -> UIColor {
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
