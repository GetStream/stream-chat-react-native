require "json"
require "pathname"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "stream-chat-expo"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://www.npmjs.com/package/stream-chat-expo"
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "./ios", :tag => "#{s.version}" }
  s.prepare_command = <<-CMD
    if [ -d ../shared-native/ios ]; then
      mkdir -p ios/shared
      rsync -a --delete ../shared-native/ios/ ios/shared/
    fi
  CMD
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.private_header_files = "ios/**/*.h"

  # Dictation (`ai-components` speech-to-text) references the Speech framework, and App Store Connect
  # requires a speech recognition usage description from every app whose binary does. It is therefore
  # only compiled into apps that opt in, through any of:
  #   - `$StreamChatEnableDictation = true` in the Podfile (before `use_native_modules!`)
  #   - `"stream-chat.enableDictation": "true"` in Podfile.properties.json (set by the Expo plugin)
  #   - the `STREAM_CHAT_ENABLE_DICTATION=1` environment variable during `pod install`
  #   - `"stream-chat": { "enableDictation": true }` in the app's package.json, which Swift Package
  #     Manager builds read as well (see Package.swift)
  podfile_dictation_enabled =
    begin
      if defined?($StreamChatEnableDictation) && !$StreamChatEnableDictation.nil?
        $StreamChatEnableDictation.to_s == "true"
      elsif ENV["STREAM_CHAT_ENABLE_DICTATION"]
        ["1", "true"].include?(ENV["STREAM_CHAT_ENABLE_DICTATION"])
      else
        properties_path = File.join(Pod::Config.instance.installation_root.to_s, "Podfile.properties.json")
        File.exist?(properties_path) &&
          JSON.parse(File.read(properties_path))["stream-chat.enableDictation"].to_s == "true"
      end
    rescue StandardError
      false
    end

  # The app's package.json is the closest one above the Podfile that has a `stream-chat` section.
  package_json_dictation_enabled =
    begin
      directory = Pathname.new(Pod::Config.instance.installation_root.to_s).expand_path
      config = nil
      until config || directory.root?
        package_json = directory + "package.json"
        config = JSON.parse(package_json.read)["stream-chat"] if package_json.file?
        config = nil unless config.is_a?(Hash)
        directory = directory.parent
      end
      config ? config["enableDictation"] == true : false
    rescue StandardError
      false
    end

  dictation_enabled = podfile_dictation_enabled || package_json_dictation_enabled

  # `AIAgent` (the agent components' install id and tool-call sign-ins) opens sign-ins in
  # `ASWebAuthenticationSession`, which needs no usage description, so it is always compiled.
  if dictation_enabled
    s.frameworks = ["AuthenticationServices", "Speech"]
  else
    s.frameworks = "AuthenticationServices"
    s.exclude_files = ["ios/shared/AIDictation.h", "ios/shared/AIDictation.mm", "ios/shared/AIDictationModule.swift"]
  end

  install_modules_dependencies(s)
end
