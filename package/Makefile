.PHONY: netlify
.PHONY: example-build example-deps

EXAMPLES_PATH = ../examples
NATIVE_EXAMPLES = NativeMessaging SampleApp TypeScriptMessaging
NATIVE_EXAMPLES_APPS = $(addprefix $(EXAMPLES_PATH)/,$(NATIVE_EXAMPLES))
NATIVE_EXAMPLES_APPS_DEPS = $(addsuffix /node_modules/installed_dependencies,$(NATIVE_EXAMPLES_APPS))

EXPO_EXAMPLES = ExpoMessaging
EXPO_EXAMPLES_APPS = $(addprefix $(EXAMPLES_PATH)/,$(EXPO_EXAMPLES))
EXPO_EXAMPLES_APPS_DEPS = $(addsuffix /node_modules/installed_dependencies,$(EXPO_EXAMPLES_APPS))

WRAPPER_PACKAGES = native-package expo-package
WRAPPER_PACKAGES_DEPS = $(addsuffix /node_modules/installed_dependencies,$(WRAPPER_PACKAGES))

SOURCES = $(filter(%$(EXAMPLES_PATH)/, $(wildcard *.js) $(wildcard */*.js) $(wildcard */*.scss) $(wildcard */*.png) $(wildcard */*.html) $(wildcard ../client/*/*.js) $(wildcard ../client/*.js))
LIB_SOURCES = $(wildcard *.js) $(wildcard */*.js) $(wildcard */*.scss) $(wildcard */*.png) $(wildcard */*.html) $(wildcard ../client/*/*.js) $(wildcard ../client/*.js)

CHAT_DEPS = ../client/package.json

native-example-deps: $(NATIVE_EXAMPLES_APPS_DEPS)
expo-example-deps: $(EXPO_EXAMPLES_APPS_DEPS)

$(NATIVE_EXAMPLES_APPS_DEPS): %/node_modules/installed_dependencies: %/yarn.lock %/package.json $(SOURCES) $(WRAPPER_PACKAGES_DEPS)
	cd $* && yarn install && npx pod-install
	touch $@

$(EXPO_EXAMPLES_APPS_DEPS): %/node_modules/installed_dependencies: %/yarn.lock %/package.json $(SOURCES) $(WRAPPER_PACKAGES_DEPS)
	cd $* && yarn install
	touch $@

$(WRAPPER_PACKAGES_DEPS): %/node_modules/installed_dependencies: %/yarn.lock %/package.json $(SOURCES) node_modules/installed_dependencies
	cd $* && yarn install
	touch $@

node_modules/installed_dependencies: yarn.lock package.json
	yarn install
	touch $@

dist/built: $(LIB_SOURCES) node_modules/installed_dependencies
	yarn build
	touch $@ q

clean:
	rm -rf $(addsuffix /node_modules,$(EXAMPLES_APPS)) || true
	rm -rf $(addsuffix /node_modules,$(WRAPPER_PACKAGES)) || true
	rm -rf dist || true
	rm -rf node_modules || true
