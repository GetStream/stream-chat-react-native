cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# Must match codegenConfig.name in package.json — threads through the target name,
# the generated header path, and every #include of the codegen Props/EventEmitters.
set(LIB_LITERAL StreamChatReactNativeSpec)
set(LIB_TARGET_NAME react_codegen_${LIB_LITERAL})

set(LIB_ANDROID_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../..)
set(LIB_COMPONENTS_DIR ${LIB_ANDROID_DIR}/src/main/jni)
set(LIB_ANDROID_GENERATED_JNI_DIR ${LIB_ANDROID_DIR}/build/generated/source/codegen/jni)
set(LIB_ANDROID_GENERATED_COMPONENTS_DIR ${LIB_ANDROID_GENERATED_JNI_DIR}/react/renderer/components/${LIB_LITERAL})

# Our hand-written C++ (this dir) + the codegen-emitted component sources. This
# CMakeLists replaces the auto-generated codegen one (via cmakeListsPath in
# react-native.config.js), so it must compile both.
file(GLOB LIB_COMPONENT_SRCS CONFIGURE_DEPENDS *.cpp ${LIB_COMPONENTS_DIR}/*.cpp)
# Codegen sources: the jni ROOT (StreamChatReactNativeSpec-generated.cpp — defines the TurboModule
# *_ModuleProvider that autolinking.cpp calls) AND the components subdir (Props/ShadowNodes/etc).
# Globbing only components/ misses the module provider → undefined symbol at link.
file(GLOB LIB_CODEGEN_SRCS CONFIGURE_DEPENDS ${LIB_ANDROID_GENERATED_JNI_DIR}/*.cpp ${LIB_ANDROID_GENERATED_COMPONENTS_DIR}/*.cpp)

add_library(
  ${LIB_TARGET_NAME}
  OBJECT
  ${LIB_COMPONENT_SRCS}
  ${LIB_CODEGEN_SRCS}
)

target_include_directories(
  ${LIB_TARGET_NAME}
  PUBLIC
  .
  ${LIB_COMPONENTS_DIR}
  ${LIB_ANDROID_GENERATED_JNI_DIR}
  ${LIB_ANDROID_GENERATED_COMPONENTS_DIR}
)

target_link_libraries(
  ${LIB_TARGET_NAME}
  fbjni
  jsi
  reactnative
)

if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 80)
  target_compile_reactnative_options(${LIB_TARGET_NAME} PRIVATE)
else()
  target_compile_options(
    ${LIB_TARGET_NAME}
    PRIVATE
    -DLOG_TAG=\"ReactNative\"
    -fexceptions
    -frtti
    -std=c++20
    -Wall
  )
endif()

target_include_directories(
 ${CMAKE_PROJECT_NAME}
 PUBLIC
 ${CMAKE_CURRENT_SOURCE_DIR}
)
