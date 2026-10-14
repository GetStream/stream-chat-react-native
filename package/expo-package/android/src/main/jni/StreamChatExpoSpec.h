#pragma once

// The app's autolinking includes `<StreamChatExpoSpec.h>` to register this package's TurboModules and
// component descriptors. This directory comes first on the include path (see CMakeLists.txt), so
// that include lands here: forward to the codegen-generated header, and add the hand-written
// PerfText component descriptor, which codegen does not generate (`interfaceOnly` component).
#include_next <StreamChatExpoSpec.h>

#include "PerfTextComponentDescriptor.h"
