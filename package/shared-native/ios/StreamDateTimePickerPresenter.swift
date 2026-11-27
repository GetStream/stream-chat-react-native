import UIKit
#if canImport(StreamChatNativeInterfaces)
import StreamChatNativeInterfaces
#endif

/// Presents `UIDatePicker` in a centred card with confirm and cancel buttons, using the inline
/// calendar for dates and wheels for times. The card appears above any React Native content,
/// including a `<Modal>`. Only one picker is shown at a time, and every call completes exactly once.
@objc(StreamDateTimePickerPresenter)
@objcMembers
public final class StreamDateTimePickerPresenter: NSObject {
  private static weak var current: StreamDateTimePickerController?
  /// The number of presentation attempts while the presenting controller is in a transition.
  private static let maxPresentAttempts = 40

  @objc(presentWithMode:value:minimumDate:maximumDate:confirmLabel:cancelLabel:presenter:completion:)
  public static func present(
    mode: String,
    value: Double,
    minimumDate: NSNumber?,
    maximumDate: NSNumber?,
    confirmLabel: String,
    cancelLabel: String,
    presenter: @escaping () -> UIViewController?,
    completion: @escaping (NSNumber?) -> Void
  ) {
    DispatchQueue.main.async {
      guard current == nil else {
        completion(nil)
        return
      }
      let controller = StreamDateTimePickerController(
        mode: mode == "time" ? .time : .date,
        value: Date(milliseconds: value),
        minimumDate: minimumDate.map { Date(milliseconds: $0.doubleValue) },
        maximumDate: maximumDate.map { Date(milliseconds: $0.doubleValue) },
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
        completion: { result in
          // Cleared before resolving, so a picker requested immediately afterwards can be presented.
          current = nil
          completion(result)
        }
      )
      current = controller
      presentWhenReady(controller, presenter: presenter, attempt: 0)
    }
  }

  @objc(dismissPresented)
  public static func dismissPresented() {
    DispatchQueue.main.async {
      current?.finish(with: nil)
    }
  }

  /// Presents the controller once `host` has no transition in progress, since UIKit refuses to
  /// present over a controller that is being presented or dismissed.
  private static func presentWhenReady(
    _ controller: StreamDateTimePickerController,
    presenter: @escaping () -> UIViewController?,
    attempt: Int
  ) {
    guard current === controller else { return }
    guard let host = presenter(), host.viewIfLoaded?.window != nil else {
      controller.finish(with: nil)
      return
    }
    let busy = host.isBeingPresented || host.isBeingDismissed || host.presentedViewController != nil
    guard busy else {
      host.present(controller, animated: false)
      return
    }
    guard attempt < maxPresentAttempts else {
      controller.finish(with: nil)
      return
    }
    if let coordinator = host.transitionCoordinator {
      coordinator.animate(alongsideTransition: nil) { _ in
        presentWhenReady(controller, presenter: presenter, attempt: attempt + 1)
      }
    } else {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
        presentWhenReady(controller, presenter: presenter, attempt: attempt + 1)
      }
    }
  }
}

extension StreamDateTimePickerPresenter: StreamDateTimePickerPresenterAPI {}

private extension Date {
  init(milliseconds: Double) {
    self.init(timeIntervalSince1970: milliseconds / 1000)
  }

  var milliseconds: Double { timeIntervalSince1970 * 1000 }
}

/// A dimmed backdrop with a card holding the picker and its buttons, animated in and out like a
/// system alert. It is presented `.overFullScreen`, so the presenting content stays in the window.
final class StreamDateTimePickerController: UIViewController {
  private let mode: UIDatePicker.Mode
  private let picker = UIDatePicker()
  private let backdrop = UIView()
  private let card = UIView()
  private let confirmLabel: String
  private let cancelLabel: String
  private var completion: ((NSNumber?) -> Void)?
  private let maxCardWidth: CGFloat = 400

  init(
    mode: UIDatePicker.Mode,
    value: Date,
    minimumDate: Date?,
    maximumDate: Date?,
    confirmLabel: String,
    cancelLabel: String,
    completion: @escaping (NSNumber?) -> Void
  ) {
    self.mode = mode
    self.confirmLabel = confirmLabel
    self.cancelLabel = cancelLabel
    self.completion = completion
    super.init(nibName: nil, bundle: nil)
    modalPresentationStyle = .overFullScreen
    picker.datePickerMode = mode
    picker.minimumDate = minimumDate
    picker.maximumDate = maximumDate
    picker.date = value
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .clear

    backdrop.backgroundColor = UIColor.black.withAlphaComponent(0.4)
    backdrop.translatesAutoresizingMaskIntoConstraints = false
    backdrop.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(cancel)))
    view.addSubview(backdrop)

    // White in light mode and the elevated grey of system alerts in dark mode.
    card.backgroundColor = UIColor { traits in
      traits.userInterfaceStyle == .dark ? .secondarySystemBackground : .systemBackground
    }
    card.layer.cornerRadius = 32
    card.layer.cornerCurve = .continuous
    card.layer.shadowColor = UIColor.black.cgColor
    card.layer.shadowOpacity = 0.16
    card.layer.shadowOffset = CGSize(width: 0, height: 12)
    card.layer.shadowRadius = 16
    card.translatesAutoresizingMaskIntoConstraints = false
    card.accessibilityViewIsModal = true
    view.addSubview(card)

    // The selection uses the label colour, as in the design, instead of the app tint.
    picker.tintColor = .label
    picker.preferredDatePickerStyle = mode == .time ? .wheels : .inline
    picker.translatesAutoresizingMaskIntoConstraints = false

    let titleFont = UIConfigurationTextAttributesTransformer { attributes in
      var attributes = attributes
      attributes.font = UIFont.preferredFont(forTextStyle: .headline)
      return attributes
    }

    var confirmConfiguration = UIButton.Configuration.filled()
    confirmConfiguration.title = confirmLabel
    confirmConfiguration.cornerStyle = .capsule
    confirmConfiguration.titleTextAttributesTransformer = titleFont
    let confirmButton = UIButton(configuration: confirmConfiguration)
    confirmButton.addTarget(self, action: #selector(confirmPicked), for: .primaryActionTriggered)

    var cancelConfiguration = UIButton.Configuration.bordered()
    cancelConfiguration.title = cancelLabel
    cancelConfiguration.cornerStyle = .capsule
    cancelConfiguration.titleTextAttributesTransformer = titleFont
    cancelConfiguration.baseForegroundColor = .label
    cancelConfiguration.baseBackgroundColor = .clear
    cancelConfiguration.background.strokeColor = .systemGray4
    cancelConfiguration.background.strokeWidth = 1
    let cancelButton = UIButton(configuration: cancelConfiguration)
    cancelButton.addTarget(self, action: #selector(cancel), for: .primaryActionTriggered)

    let buttons = UIStackView(arrangedSubviews: [confirmButton, cancelButton])
    buttons.axis = .vertical
    buttons.spacing = 8

    let content = UIStackView(arrangedSubviews: [picker, buttons])
    content.axis = .vertical
    content.spacing = 32
    content.translatesAutoresizingMaskIntoConstraints = false
    card.addSubview(content)

    NSLayoutConstraint.activate([
      backdrop.topAnchor.constraint(equalTo: view.topAnchor),
      backdrop.bottomAnchor.constraint(equalTo: view.bottomAnchor),
      backdrop.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      backdrop.trailingAnchor.constraint(equalTo: view.trailingAnchor),

      card.centerXAnchor.constraint(equalTo: view.centerXAnchor),
      card.centerYAnchor.constraint(equalTo: view.centerYAnchor),
      card.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 24),
      card.widthAnchor.constraint(lessThanOrEqualToConstant: maxCardWidth),
      card.topAnchor.constraint(greaterThanOrEqualTo: view.safeAreaLayoutGuide.topAnchor),

      content.topAnchor.constraint(equalTo: card.topAnchor, constant: 32),
      content.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -24),
      content.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 24),
      content.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -24),

      confirmButton.heightAnchor.constraint(equalToConstant: 48),
      cancelButton.heightAnchor.constraint(equalToConstant: 48),
    ])
    // Fills the available width, up to a phone-sized maximum on larger screens.
    let preferredWidth = card.widthAnchor.constraint(equalToConstant: maxCardWidth)
    preferredWidth.priority = .defaultHigh
    preferredWidth.isActive = true

    backdrop.alpha = 0
    card.alpha = 0
    card.transform = CGAffineTransform(scaleX: 1.08, y: 1.08)
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    // An explicit shadow path avoids an offscreen rendering pass.
    card.layer.shadowPath = UIBezierPath(
      roundedRect: card.bounds,
      cornerRadius: card.layer.cornerRadius
    ).cgPath
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    UIView.animate(withDuration: 0.25, delay: 0, options: [.curveEaseOut, .allowUserInteraction]) {
      self.backdrop.alpha = 1
      self.card.alpha = 1
      self.card.transform = .identity
    }
    UIAccessibility.post(notification: .screenChanged, argument: card)
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    // When a controller underneath is dismissed, for example a modal closed from JS, UIKit removes
    // this dialog without calling `finish`, so the call is resolved as cancelled here. A controller
    // presented on top only covers the dialog and is ignored.
    DispatchQueue.main.async {
      guard self.completion != nil, self.presentedViewController == nil else { return }
      guard self.presentingViewController == nil || self.view.window == nil else { return }
      self.finish(with: nil)
    }
  }

  override func accessibilityPerformEscape() -> Bool {
    cancel()
    return true
  }

  @objc private func confirmPicked() {
    finish(with: NSNumber(value: picker.date.milliseconds))
  }

  @objc private func cancel() {
    finish(with: nil)
  }

  /// Animates the dialog out, dismisses it and calls the completion. Subsequent calls do nothing.
  func finish(with result: NSNumber?) {
    guard let completion else { return }
    self.completion = nil
    view.isUserInteractionEnabled = false

    let complete = { completion(result) }
    guard presentingViewController != nil else {
      complete()
      return
    }
    UIView.animate(withDuration: 0.2, delay: 0, options: [.curveEaseIn]) {
      self.backdrop.alpha = 0
      self.card.alpha = 0
      self.card.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
    } completion: { _ in
      self.dismiss(animated: false, completion: complete)
    }
  }
}
