module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: 'import com.streamchatexpo.StreamChatExpoPackage;',
        packageInstance: 'new StreamChatExpoPackage()',
        // A custom CMakeLists, needed to compile the hand-written PerfText shadow node next to the
        // codegen output. Listing the descriptors replaces the ones autolinking would detect, so the
        // codegen-generated StreamShimmerView descriptor has to be listed as well.
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
        componentDescriptors: [
          'StreamShimmerViewComponentDescriptor',
          'PerfTextComponentDescriptor',
        ],
      },
    },
  },
};
