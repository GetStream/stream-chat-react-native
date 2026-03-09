require "json"

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

  install_modules_dependencies(s)
end
