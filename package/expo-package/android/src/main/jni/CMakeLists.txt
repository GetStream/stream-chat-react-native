cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# Custom CMakeLists for this package's codegen library, registered through `cmakeListsPath` in
# react-native.config.js. It builds everything the codegen-generated CMakeLists would, plus the
# hand-written C++ of the Android-only PerfText component used by `ai-components`.

set(LIB_LITERAL StreamChatExpoSpec)
set(LIB_TARGET_NAME react_codegen_${LIB_LITERAL})

# REALPATH: the package is often reached through a symlink (workspaces, `yarn link`), and CMake
# collapses `..` lexically, which would otherwise resolve relative paths against the symlink.
get_filename_component(LIB_ANDROID_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../.. REALPATH)
set(LIB_GENERATED_JNI_DIR ${LIB_ANDROID_DIR}/build/generated/source/codegen/jni)
set(LIB_GENERATED_COMPONENTS_DIR ${LIB_GENERATED_JNI_DIR}/react/renderer/components/${LIB_LITERAL})

# Shared C++ sources: read straight from the monorepo during development, otherwise from the copy
# synced into this package (scripts/sync-shared-native.sh, run before publishing).
get_filename_component(MONOREPO_SHARED_CPP_DIR ${LIB_ANDROID_DIR}/../../shared-native/android/jni REALPATH)
if(EXISTS ${MONOREPO_SHARED_CPP_DIR})
  set(SHARED_CPP_DIR ${MONOREPO_SHARED_CPP_DIR})
else()
  set(SHARED_CPP_DIR ${LIB_ANDROID_DIR}/src/main/java/com/streamchatreactnative/shared/jni)
endif()

file(GLOB LIB_SRCS CONFIGURE_DEPENDS
  ${LIB_GENERATED_JNI_DIR}/*.cpp
  ${LIB_GENERATED_COMPONENTS_DIR}/*.cpp
  ${SHARED_CPP_DIR}/*.cpp
)

add_library(${LIB_TARGET_NAME} OBJECT ${LIB_SRCS})

# This directory must come first: see StreamChatExpoSpec.h next to this file.
target_include_directories(
  ${LIB_TARGET_NAME}
  PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}
  ${SHARED_CPP_DIR}
  ${LIB_GENERATED_JNI_DIR}
  ${LIB_GENERATED_COMPONENTS_DIR}
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
