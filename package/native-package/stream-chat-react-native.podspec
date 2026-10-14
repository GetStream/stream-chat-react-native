require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "stream-chat-react-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
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
  dictation_enabled =
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

  if dictation_enabled
    s.frameworks = "Speech"
  else
    s.exclude_files = ["ios/shared/AIDictation.h", "ios/shared/AIDictation.mm", "ios/shared/AIDictationModule.swift"]
  end

  install_modules_dependencies(s)
end
