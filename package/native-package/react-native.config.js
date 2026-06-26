module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: 'import com.streamchatreactnative.StreamChatReactNativePackage;',
        packageInstance: 'new StreamChatReactNativePackage()',
        // The native list's hand-written C++ ComponentDescriptor (android/src/main/jni/) — paired
        // with `interfaceOnly: true` on the StreamMessageListView spec — overrides codegen's default
        // ShadowNode to report the scroll offset into Fabric (getContentOriginOffset). cmakeListsPath
        // replaces the auto-generated codegen CMakeLists so our C++ + the codegen sources compile.
        componentDescriptors: ['StreamMessageListViewComponentDescriptor'],
        cmakeListsPath: '../android/src/main/jni/CMakeLists.txt',
      },
    },
  },
};
