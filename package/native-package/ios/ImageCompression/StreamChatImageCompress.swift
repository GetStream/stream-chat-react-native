import SDWebImageWebPCoder

internal enum ImageFormat: String {
  case jpeg
  case jpg
  case png
  case webp

  var fileExtension: String {
    switch self {
      case .jpeg, .jpg:
        return "jpeg"
      case .png:
        return "png"
      case .webp:
        return "webp"
    }
  }
}

internal struct SaveImageOptions {
  var base64: Bool = false
  var compressImageQuality: Double = 1.0
  var format: ImageFormat = .jpeg
}

internal typealias SaveImageResult = (url: URL, data: Data)

func imageData(from image: UIImage, options: SaveImageOptions) -> Data? {
  switch options.format {
    case .jpeg, .jpg:
      return image.jpegData(compressionQuality: options.compressImageQuality)
    case .png:
      return image.pngData()
    case .webp:
      return SDImageWebPCoder.shared.encodedData(with: image, format: .webP, options: [.encodeCompressionQuality: options.compressImageQuality])
  }
}


@objc(StreamChatImageCompress)
class StreamChatImageCompress: NSObject {
  private func saveImage(image: UIImage, options: SaveImageOptions) -> SaveImageResult? {
    // First create a file path
    let fileManager = FileManager.default
    let tempDirectory = fileManager.temporaryDirectory
    let fileName = UUID().uuidString
    let filePath = tempDirectory.appendingPathComponent(fileName).appendingPathExtension(options.format.fileExtension)

    // Then save the image to the file path
    guard let data = imageData(from: image, options: options) else {
        print("Failed to get image data")
        return nil
    }

    do {
      try data.write(to: filePath, options: .atomic)
    } catch {
      // Log the error
      print("Error saving image: \(error)")
      return nil
    }

    return SaveImageResult(url: filePath, data: data)
  }

  private func parseSaveImageOptions(from dict: NSDictionary) -> SaveImageOptions {
    var options = SaveImageOptions()

    if let quality = dict["compressImageQuality"] as? Double {
      options.compressImageQuality = quality
    }

    if let formatString = dict["format"] as? String,
      let format = ImageFormat(rawValue: formatString.lowercased()) {
      options.format = format
    }

    if let base64 = dict["base64"] as? Bool {
      options.base64 = base64
    }

    return options
  }

  @objc
  func compressImage(_ imageURL: String,
                     options: NSDictionary,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    let savedOptions = parseSaveImageOptions(from: options)

    print("Compressing image at \(imageURL)")

    // Convert URL string to path
    var imagePath = imageURL
    if imageURL.hasPrefix("file://") {
      if let url = URL(string: imageURL) {
        imagePath = url.path
      }
    }

    print("Compressing image at \(imagePath)")


    // First load the image
    guard let image = UIImage(contentsOfFile: imagePath) else {
      reject("Failed to load image", "Failed to load image", nil)
      return
    }

    // Then compress the image
    guard let result = saveImage(image: image, options: savedOptions) else {
      reject("IMAGE_SAVE_ERROR", "Failed to save compressed image", nil)
      return
    }

    resolve(result.url.absoluteString)
  }
}
