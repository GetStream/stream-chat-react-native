const fs = require('fs');
const {
  withPlugins,
  createRunOncePlugin,
  withDangerousMod,
  withPodfileProperties,
  IOSConfig,
} = require('@expo/config-plugins');
const modifyPodfile = (podfilePath) => {
  const preInstallBlock = `
  pre_install do |installer|
    installer.pod_targets.each do |pod|
      if pod.name.eql?('op-sqlite')
        def pod.build_type
          Pod::BuildType.static_library
        end
      end
    end
  end
`;
  if (fs.existsSync(podfilePath)) {
    let podfileContent = fs.readFileSync(podfilePath, 'utf-8');
    // Look for the `use_frameworks!` line
    const useFrameworksLine =
      "use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']";
    if (podfileContent.includes(useFrameworksLine)) {
      // Insert the pre_install block just before the use_frameworks line
      const modifiedContent = podfileContent.replace(
        useFrameworksLine,
        preInstallBlock + '\n' + useFrameworksLine,
      );
      // Write the modified content back to the Podfile
      fs.writeFileSync(podfilePath, modifiedContent);
      console.log('CUSTOM MODIFY PODFILE PLUGIN: Podfile modified to include pre_install block.');
    } else {
      console.log('CUSTOM MODIFY PODFILE PLUGIN: use_frameworks line not found in Podfile.');
    }
  } else {
    console.log('CUSTOM MODIFY PODFILE PLUGIN: Podfile not found.');
  }
};
// we create a mod plugin here
const withModifyPodfile = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const path = IOSConfig.Paths.getPodfilePath(config.modRequest.projectRoot);
      modifyPodfile(path);
      return config;
    },
  ]);
};
// this config plugin is only needed if we have expo-updates installed, reference: https://op-engineering.github.io/op-sqlite/docs/installation/#expo-updates
const withUseThirdPartySQLitePod = (expoConfig) => {
  return withPodfileProperties(expoConfig, (config) => {
    config.modResults = {
      ...config.modResults,
      'expo.updates.useThirdPartySQLitePod': 'true',
    };
    return config;
  });
};
const withStreamOfflineMode = (config) => {
  return withPlugins(config, [
    withModifyPodfile,
    // only add this is expo-updates is installed
    withUseThirdPartySQLitePod,
  ]);
};
module.exports = createRunOncePlugin(
  withStreamOfflineMode,
  'custom-modify-podfile-plugin',
  '0.0.1',
);
