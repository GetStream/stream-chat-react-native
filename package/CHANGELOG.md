# Change Log

### [5.28.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.28.0...v5.28.1) (2024-04-26)


### Bug Fixes

* image gallery handle height ts issue ([#2496](https://github.com/GetStream/stream-chat-react-native/issues/2496)) ([51f68aa](https://github.com/GetStream/stream-chat-react-native/commit/51f68aad495cdca036f6bbd080b3031a7d3abc14))

## [5.28.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.27.1...v5.28.0) (2024-04-23)


### Features

* add sender and receiver message theme background color ([#2485](https://github.com/GetStream/stream-chat-react-native/issues/2485)) ([7c2567c](https://github.com/GetStream/stream-chat-react-native/commit/7c2567ca684ecb7d883b550deca7d37c3ddcfd5b))
* introduce grouped message theming for message and fix message pinned header styles ([#2488](https://github.com/GetStream/stream-chat-react-native/issues/2488)) ([93a7b25](https://github.com/GetStream/stream-chat-react-native/commit/93a7b2546372c090558333a6c7a95dba5be7df1f))


### Bug Fixes

* broken imports in SDK as per TS ([#2487](https://github.com/GetStream/stream-chat-react-native/issues/2487)) ([6d7af92](https://github.com/GetStream/stream-chat-react-native/commit/6d7af925d7e772506d90d0ef169ec3f3f77e6288))
* improve attachment picker and image gallery bottom sheet implementation ([#2490](https://github.com/GetStream/stream-chat-react-native/issues/2490)) ([54bd86f](https://github.com/GetStream/stream-chat-react-native/commit/54bd86fab5fcfa3b68601cf97f0c88117a8c47e7))
* return type of setInterval and setTimeout ([#2489](https://github.com/GetStream/stream-chat-react-native/issues/2489)) ([46f5fef](https://github.com/GetStream/stream-chat-react-native/commit/46f5fefba7c59fbe1647dd5b9db9ddfada58f51f))
* ts issue in getPhotos around Platform.Version ([#2493](https://github.com/GetStream/stream-chat-react-native/issues/2493)) ([1f3751a](https://github.com/GetStream/stream-chat-react-native/commit/1f3751ae4d7cb594b1e06ab62b1e6a0157631773))

### [5.27.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.27.0...v5.27.1) (2024-04-15)


### Bug Fixes

* giphy border radius and color issue ([cfcb22e](https://github.com/GetStream/stream-chat-react-native/commit/cfcb22e4a1575020919f85c6a77c984a2dd7f5eb))
* giphy border radius and color issue ([#2484](https://github.com/GetStream/stream-chat-react-native/issues/2484)) ([8814112](https://github.com/GetStream/stream-chat-react-native/commit/8814112496f21a09efb99bea4fb8ef355d727404))
* messages not received when connection recovered and do not reload channel when sending message ([#2479](https://github.com/GetStream/stream-chat-react-native/issues/2479)) ([8dff165](https://github.com/GetStream/stream-chat-react-native/commit/8dff165ca21e134d07cf806c1b407546b701131d))

## [5.27.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.26.0...v5.27.0) (2024-04-03)


### Features

* add customizability for attachment picker ios select more photos component ([#2458](https://github.com/GetStream/stream-chat-react-native/issues/2458)) ([bacabd9](https://github.com/GetStream/stream-chat-react-native/commit/bacabd96482d40b1847bb57464b593a4c3798ed1))
* expo 50 version upgrade in sample app ([#2463](https://github.com/GetStream/stream-chat-react-native/issues/2463)) ([4f39e6a](https://github.com/GetStream/stream-chat-react-native/commit/4f39e6a9149db2ac1991501aa34b2daed4f22f34))


### Bug Fixes

* **offline-support:** foreign constraint failure ([#2472](https://github.com/GetStream/stream-chat-react-native/issues/2472)) ([0119754](https://github.com/GetStream/stream-chat-react-native/commit/0119754be82657109c47d24b299b8db331df5a12))
* add channel prop to ChannelPreviewStatus and fix docs props information ([#2455](https://github.com/GetStream/stream-chat-react-native/issues/2455)) ([2ce2548](https://github.com/GetStream/stream-chat-react-native/commit/2ce2548679c304cffe26f662ac7b2a73a9fcef93))
* add missing support for scroll to messageid inside thread ([0b53ffb](https://github.com/GetStream/stream-chat-react-native/commit/0b53ffbdd401c1d48979460b6bbb251d4972f75f))
* attachment picker ios select more photos component theme ([22c57e3](https://github.com/GetStream/stream-chat-react-native/commit/22c57e328c69102c220ea432fa6e9cb47406c276))
* crashes due to negative bottom sheet snap points ([#2473](https://github.com/GetStream/stream-chat-react-native/issues/2473)) ([746280a](https://github.com/GetStream/stream-chat-react-native/commit/746280ae6488e189291f8bae5ffeb5929de3f100))
* deprecate global config from usage and add resizableCDNHosts to resizableCDNHosts ([#2457](https://github.com/GetStream/stream-chat-react-native/issues/2457)) ([47d503d](https://github.com/GetStream/stream-chat-react-native/commit/47d503d8e82bad5b4692ab2a2eda16883972b133))
* image gallery image opening issue ([dbd3805](https://github.com/GetStream/stream-chat-react-native/commit/dbd3805832c6dee6d5114edb19b9560bb795bebd))
* offline support saving cyclic structure ([#2469](https://github.com/GetStream/stream-chat-react-native/issues/2469)) ([792b4c9](https://github.com/GetStream/stream-chat-react-native/commit/792b4c9e09138cafdcb564649274b24d21d5a7f3))
* playing video in image gallery even when thumb_url not present ([#2466](https://github.com/GetStream/stream-chat-react-native/issues/2466)) ([14fb017](https://github.com/GetStream/stream-chat-react-native/commit/14fb01787ee82e7db33056efe96ca586bad6ef5a))
* scroll to bottom issue when the message list is empty ([#2471](https://github.com/GetStream/stream-chat-react-native/issues/2471)) ([a05573f](https://github.com/GetStream/stream-chat-react-native/commit/a05573fcdb024c270c06c1223125d90f53859817))
* theme for MessageList and SendMessageDisallowedIndicator ([#2470](https://github.com/GetStream/stream-chat-react-native/issues/2470)) ([a2119af](https://github.com/GetStream/stream-chat-react-native/commit/a2119afa86980ab7db03981394427783d47ecd46))
* **offline-support:** when user is not connected don't render null ([#2462](https://github.com/GetStream/stream-chat-react-native/issues/2462)) ([1934634](https://github.com/GetStream/stream-chat-react-native/commit/19346344e40867d4b8f06843ac930c2e3fd30ce7))
* undefined local states for reaction count ([#2460](https://github.com/GetStream/stream-chat-react-native/issues/2460)) ([e2c94d8](https://github.com/GetStream/stream-chat-react-native/commit/e2c94d80ce1d71addcccc0043681053591349ddf))

## [5.26.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.25.0...v5.26.0) (2024-03-08)


### Features

* add optional logging for sqlite methods ([#2453](https://github.com/GetStream/stream-chat-react-native/issues/2453)) ([3f39283](https://github.com/GetStream/stream-chat-react-native/commit/3f392830db7e3880366034a71b4e42bcebd9f075))
* add portuguese translation ([#2224](https://github.com/GetStream/stream-chat-react-native/issues/2224)) ([ecffe87](https://github.com/GetStream/stream-chat-react-native/commit/ecffe87bbb0756e535f9943cdb241665d5009537))


### Bug Fixes

* add back channel prop to ChannelPreviewTitle and ChannelPreviewUnreadCount ([#2451](https://github.com/GetStream/stream-chat-react-native/issues/2451)) ([b317e18](https://github.com/GetStream/stream-chat-react-native/commit/b317e18b85c1c09beaf65cbd9b3cc86fc1e4b8f4))
* authorNameFooterContainer theme in Card component ([#2449](https://github.com/GetStream/stream-chat-react-native/issues/2449)) ([068d722](https://github.com/GetStream/stream-chat-react-native/commit/068d72265d2f9200d5f9434a9ec14e3c5a7534e6))
* disable auto merge sets messages addition ([392af2c](https://github.com/GetStream/stream-chat-react-native/commit/392af2c16722c1a34a78d500d8a14cdd73fe5f8d))
* do not merge message sets during targeted message highlighting ([5ec367d](https://github.com/GetStream/stream-chat-react-native/commit/5ec367df4ab7e4d33ec4766f55bcc70f530e81d4))
* race condition on initial channel load with a message id ([11126eb](https://github.com/GetStream/stream-chat-react-native/commit/11126ebef1ea948b5ee2d6c0b89cad62fd99725c))
* scroll to message after channel state is copied reliably ([93f521b](https://github.com/GetStream/stream-chat-react-native/commit/93f521b30b9cf6b272837a4ecfea7473440b1bf7))

## [5.25.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.24.0...v5.25.0) (2024-02-29)


### Features

* ability to override the emoji auto complete search input results using emojiSearchIndex ([#2423](https://github.com/GetStream/stream-chat-react-native/issues/2423)) ([e1dc39f](https://github.com/GetStream/stream-chat-react-native/commit/e1dc39f40c311c3ff9e9074b208b6537d6c6ca3e))
* add a way to  insert a custom field into a message through message input context ([#2422](https://github.com/GetStream/stream-chat-react-native/issues/2422)) ([1f46e31](https://github.com/GetStream/stream-chat-react-native/commit/1f46e31f6662e3179b77483812cd1abe5b1fe15e))
* introduce upload progress indicator spinner theme color ([#2437](https://github.com/GetStream/stream-chat-react-native/issues/2437)) ([9d2ff5f](https://github.com/GetStream/stream-chat-react-native/commit/9d2ff5f565e819293bca68e7d85b429eee57764c))


### Bug Fixes

* auto complete suggestion list container theme ([#2429](https://github.com/GetStream/stream-chat-react-native/issues/2429)) ([93b1eb2](https://github.com/GetStream/stream-chat-react-native/commit/93b1eb2ef9e29c707fd01523175027e90357fd16))
* channel disabled/frozen UI re-render issue ([#2436](https://github.com/GetStream/stream-chat-react-native/issues/2436)) ([f18e4a5](https://github.com/GetStream/stream-chat-react-native/commit/f18e4a5bfbcb7b2c1cce6d3e2933061109da7ae9))
* do not render channels on offline support but db init ([#2444](https://github.com/GetStream/stream-chat-react-native/issues/2444)) ([2a6a6da](https://github.com/GetStream/stream-chat-react-native/commit/2a6a6da047f08395a3e992f6e3eb640ace0c78f4))
* lint in language translations ([#2421](https://github.com/GetStream/stream-chat-react-native/issues/2421)) ([ed8adc0](https://github.com/GetStream/stream-chat-react-native/commit/ed8adc0e975d1e66d480ba72ef2214b6abf539c0))
* undefined thumb_url when image grid opens in image gallery ([#2438](https://github.com/GetStream/stream-chat-react-native/issues/2438)) ([00c817a](https://github.com/GetStream/stream-chat-react-native/commit/00c817a2e267fcb75053f17590ced4685eccd070))

## [5.24.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.23.2...v5.24.0) (2024-02-08)


### Features

* add ability to handle bounced message ([#2415](https://github.com/GetStream/stream-chat-react-native/issues/2415)) ([a2ed1bd](https://github.com/GetStream/stream-chat-react-native/commit/a2ed1bd83f7605551387d6704fdb689588c6f3e5))
* Moderation: show Blocked messages in SDK ([#2408](https://github.com/GetStream/stream-chat-react-native/issues/2408)) ([5d76f6e](https://github.com/GetStream/stream-chat-react-native/commit/5d76f6e597be20fc360ec3b179196fa932a6bbac))


### Bug Fixes

* keyboard transition issue when switching from attachment picker to keyboard ([#2404](https://github.com/GetStream/stream-chat-react-native/issues/2404)) ([965691f](https://github.com/GetStream/stream-chat-react-native/commit/965691f3f76d60b12844839291256aa5dc28c5cd))
* my message theme not passed to overlay ([#2416](https://github.com/GetStream/stream-chat-react-native/issues/2416)) ([3589004](https://github.com/GetStream/stream-chat-react-native/commit/3589004df4020ad428675b97d6b2d03b0f6b4bb1))
* outdated unread count on offline support ([#2412](https://github.com/GetStream/stream-chat-react-native/issues/2412)) ([4d1bf2d](https://github.com/GetStream/stream-chat-react-native/commit/4d1bf2d8ae495b44df8ebc49d2f7e18fe19c0f5b))
* scroll to bottom when message is removed from message list ([#2411](https://github.com/GetStream/stream-chat-react-native/issues/2411)) ([88238fd](https://github.com/GetStream/stream-chat-react-native/commit/88238fd0f362e83cb4c44d07186121f2bca44909))
* send button icon theme ([#2417](https://github.com/GetStream/stream-chat-react-native/issues/2417)) ([14ab52f](https://github.com/GetStream/stream-chat-react-native/commit/14ab52f5c3ffdc2076f3a33628d7ff2e2e5c15ee))

### [5.23.2](https://github.com/GetStream/stream-chat-react-native/compare/v5.23.1...v5.23.2) (2024-01-23)


### Bug Fixes

* autocomplete suggestion list scroll issue ([#2394](https://github.com/GetStream/stream-chat-react-native/issues/2394)) ([8c8bfad](https://github.com/GetStream/stream-chat-react-native/commit/8c8bfad564e36c8311ae929b202737484cd8dc59))
* unnecessary thread reload ([#2397](https://github.com/GetStream/stream-chat-react-native/issues/2397)) ([da7eb56](https://github.com/GetStream/stream-chat-react-native/commit/da7eb56632356600cb6c39da9720d3c5f887ceb9))

### [5.23.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.23.0...v5.23.1) (2024-01-22)


### Bug Fixes

* crash when sending a very long emoji ([#2392](https://github.com/GetStream/stream-chat-react-native/issues/2392)) ([e96e9bf](https://github.com/GetStream/stream-chat-react-native/commit/e96e9bfd5e9f150d70f4d89f77c1e5519a4b97fc))

## [5.23.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.22.1...v5.23.0) (2024-01-18)


### Features

* compress images selected through file picker while upload ([#2359](https://github.com/GetStream/stream-chat-react-native/issues/2359)) ([71c756d](https://github.com/GetStream/stream-chat-react-native/commit/71c756d41b410650199a70601f254df68fed53d8))
* introduce focused message input styling using theme ([#2336](https://github.com/GetStream/stream-chat-react-native/issues/2336)) ([e22b8f1](https://github.com/GetStream/stream-chat-react-native/commit/e22b8f116bd3e77853043bbda649a4e34ae85af5))
* optimise message list scrolling performance ([#2388](https://github.com/GetStream/stream-chat-react-native/issues/2388)) ([09737b8](https://github.com/GetStream/stream-chat-react-native/commit/09737b85fa973c4445bb98ae33061307ce2db3d0)), closes [#2352](https://github.com/GetStream/stream-chat-react-native/issues/2352) [#2348](https://github.com/GetStream/stream-chat-react-native/issues/2348) [#2350](https://github.com/GetStream/stream-chat-react-native/issues/2350) [#2359](https://github.com/GetStream/stream-chat-react-native/issues/2359) [#2355](https://github.com/GetStream/stream-chat-react-native/issues/2355)


### Bug Fixes

* do not clear the scroll failure timeouts before the failure scroll completes execution ([#2347](https://github.com/GetStream/stream-chat-react-native/issues/2347)) ([054dcf0](https://github.com/GetStream/stream-chat-react-native/commit/054dcf0ec3a1a73c53dfb39e060a7ead529bc7bb))
* emoji skin_variations undefined warning when emoji is not found ([#2381](https://github.com/GetStream/stream-chat-react-native/issues/2381)) ([206910d](https://github.com/GetStream/stream-chat-react-native/commit/206910d9be7fb5d0ab16fc095720e59121e183dd))
* incorrect message list state when non recent messages are loaded ([#2342](https://github.com/GetStream/stream-chat-react-native/issues/2342)) ([11e8b01](https://github.com/GetStream/stream-chat-react-native/commit/11e8b013f9b044444ba16f7f2ce2134dd0810118))
* limit to max 3 render windows for channel around message method ([c449795](https://github.com/GetStream/stream-chat-react-native/commit/c4497958aaafe9d23fe7fd914033aedc85f432b3))
* make iOS14RefreshGallerySelection optional ([#2346](https://github.com/GetStream/stream-chat-react-native/issues/2346)) ([ed083e9](https://github.com/GetStream/stream-chat-react-native/commit/ed083e9a5023dc1a1348034e49189f295e9a7377))
* message action list item title theme ([#2352](https://github.com/GetStream/stream-chat-react-native/issues/2352)) ([615c47c](https://github.com/GetStream/stream-chat-react-native/commit/615c47c48fb1779b56e657b7a18f0c69358628ed))
* myMessageTheme prop change did not cause a rerender ([#2390](https://github.com/GetStream/stream-chat-react-native/issues/2390)) ([b45417f](https://github.com/GetStream/stream-chat-react-native/commit/b45417fc6b00d57da054178436d5d699ff1eb155))
* null check attachment duration ([#2348](https://github.com/GetStream/stream-chat-react-native/issues/2348)) ([0f516cd](https://github.com/GetStream/stream-chat-react-native/commit/0f516cdfa5479e0ff0fc9f8fc2d58044d46f67eb))
* parsing links from message text having links in markdown format ([#2391](https://github.com/GetStream/stream-chat-react-native/issues/2391)) ([0b62d4f](https://github.com/GetStream/stream-chat-react-native/commit/0b62d4fd436c364d2a48d19cdac5240e648a0460))
* remove url encoding ([#2345](https://github.com/GetStream/stream-chat-react-native/issues/2345)) ([7d33f05](https://github.com/GetStream/stream-chat-react-native/commit/7d33f056892839da5933f8e59cd28569ee9fe02a))
* width and height passed to ImageResizer were reversed ([#2350](https://github.com/GetStream/stream-chat-react-native/issues/2350)) ([8523efb](https://github.com/GetStream/stream-chat-react-native/commit/8523efb039bea1e080d542d2506c2628f4ca2fa0))

### [5.22.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.22.0...v5.22.1) (2023-11-29)


### Bug Fixes

* upgrade stream-chat to fix uploadFile issue ([#2334](https://github.com/GetStream/stream-chat-react-native/issues/2334)) ([e9f88cc](https://github.com/GetStream/stream-chat-react-native/commit/e9f88cc5278085314978d86619639cdda2c72d8b))

## [5.22.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.21.0...v5.22.0) (2023-11-28)


### Features

* add empty channel list translations ([#2307](https://github.com/GetStream/stream-chat-react-native/issues/2307)) ([e286ce6](https://github.com/GetStream/stream-chat-react-native/commit/e286ce6d59264256ecc7b790ffb70a404bcf6bb2))
* Add Spanish translations ([#2292](https://github.com/GetStream/stream-chat-react-native/issues/2292)) ([899aaf2](https://github.com/GetStream/stream-chat-react-native/commit/899aaf2219ff8f2d0c536000f93ea584c0ee7a7a))
* add theme to override the reaction list icon color ([#2306](https://github.com/GetStream/stream-chat-react-native/issues/2306)) ([c30bd36](https://github.com/GetStream/stream-chat-react-native/commit/c30bd361716d94fd8a3b85cb46a5ad63a8211044))
* update stream-chat package to 8.14.3 ([89b5efa](https://github.com/GetStream/stream-chat-react-native/commit/89b5efa4e9afca8880cf1ecd2a3c7f775aad7355))


### Bug Fixes

* app crash when the message links have special characters in it ([#2318](https://github.com/GetStream/stream-chat-react-native/issues/2318)) ([b54afee](https://github.com/GetStream/stream-chat-react-native/commit/b54afeefa5f6cb86a7a84c4d0d9b47c2b60602fc))
* auto restart video in gallery when end reached on Expo ([#2304](https://github.com/GetStream/stream-chat-react-native/issues/2304)) ([9bfa408](https://github.com/GetStream/stream-chat-react-native/commit/9bfa40873d6996bb5f08818f7a78e02d3b0edc9a))
* do not send two upload requests when offline support is enabled ([#2328](https://github.com/GetStream/stream-chat-react-native/issues/2328)) ([c05b335](https://github.com/GetStream/stream-chat-react-native/commit/c05b3350c470fcdc553bff50cf97337d95459cea)), closes [#2331](https://github.com/GetStream/stream-chat-react-native/issues/2331)
* if camera permission cannot be requested go to settings ([#2299](https://github.com/GetStream/stream-chat-react-native/issues/2299)) ([80c2c36](https://github.com/GetStream/stream-chat-react-native/commit/80c2c3677211c6e87c9f697df30034e39ff338a1))
* inability to handle long URLs with params properly when clicked on message ([#2321](https://github.com/GetStream/stream-chat-react-native/issues/2321)) ([8cbc927](https://github.com/GetStream/stream-chat-react-native/commit/8cbc9279d4440083751602d0d4f5565dcc9ebea7))
* issue with camera permissions when clicking the camera picker ([#2315](https://github.com/GetStream/stream-chat-react-native/issues/2315)) ([2e39142](https://github.com/GetStream/stream-chat-react-native/commit/2e3914221319917a9f8e3d4b7c18c6810796748e))
* sample-app crash because of viewport changes ([#2313](https://github.com/GetStream/stream-chat-react-native/issues/2313)) ([be241e1](https://github.com/GetStream/stream-chat-react-native/commit/be241e16690d85fc6d7a123ce304a355ff19e01c))
* unnecessary reanimated warning ([#2311](https://github.com/GetStream/stream-chat-react-native/issues/2311)) ([e723d16](https://github.com/GetStream/stream-chat-react-native/commit/e723d163be4056ad72d694789ce7fb7c45e2ea0f))
* update dimensions dynamically in the SDK ([#2310](https://github.com/GetStream/stream-chat-react-native/issues/2310)) ([813cb12](https://github.com/GetStream/stream-chat-react-native/commit/813cb12b82b8f8d6298c9e5e42b788b057c6068e))
* update editing and quoted state within context correctly ([#2333](https://github.com/GetStream/stream-chat-react-native/issues/2333)) ([2c50dc8](https://github.com/GetStream/stream-chat-react-native/commit/2c50dc89981c1326560acbf51302b23cc8dea032))
* upload progress indicator component type ([#2325](https://github.com/GetStream/stream-chat-react-native/issues/2325)) ([e0dbfae](https://github.com/GetStream/stream-chat-react-native/commit/e0dbfaed8955280723fd3cc8bc6f0f1b51d849fd))

## [5.21.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.20.0...v5.21.0) (2023-11-09)


### Features

* add ability to customize the message error component ([#2296](https://github.com/GetStream/stream-chat-react-native/issues/2296)) ([cf1734b](https://github.com/GetStream/stream-chat-react-native/commit/cf1734bd6492c105633a43954a1d7b1798e90b04))
* add maximum file size limit release translations ([#2294](https://github.com/GetStream/stream-chat-react-native/issues/2294)) ([357c77a](https://github.com/GetStream/stream-chat-react-native/commit/357c77aab8fda5a72282fc3d40087515c8008ff9))
* support refreshing photo selection on iOS ([#2291](https://github.com/GetStream/stream-chat-react-native/issues/2291)) ([5613dfd](https://github.com/GetStream/stream-chat-react-native/commit/5613dfd28eaac32ad15167cfd3d2f61f534508f4))


### Bug Fixes

* apply max file size limit translations ([#2295](https://github.com/GetStream/stream-chat-react-native/issues/2295)) ([20bbaed](https://github.com/GetStream/stream-chat-react-native/commit/20bbaedcdd728d268a723e5dbbacdc46f09adb48))
* resolve mentioned user as user rather than link ([#2289](https://github.com/GetStream/stream-chat-react-native/issues/2289)) ([ff07769](https://github.com/GetStream/stream-chat-react-native/commit/ff077693c96bcd87633f0d47e5240fe947abd8ed))

## [5.20.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.19.3...v5.20.0) (2023-11-06)


### Features

* apply theme to SendButton internal icons ([#2280](https://github.com/GetStream/stream-chat-react-native/issues/2280)) ([c884bf2](https://github.com/GetStream/stream-chat-react-native/commit/c884bf2a9d1df0ede204c03adbd12124fe2ef6f4))
* upgrade axios to v1 ([#2281](https://github.com/GetStream/stream-chat-react-native/issues/2281)) ([ec7767c](https://github.com/GetStream/stream-chat-react-native/commit/ec7767c3e83abe117c0dd052939eac437a3522a4))


### Bug Fixes

* **expo:** do not show reconnecting status while showing gallery ([63f5a8a](https://github.com/GetStream/stream-chat-react-native/commit/63f5a8a337a7366c7094aa37022c21d04e6aba47))
* crash when opening null url ([#2134](https://github.com/GetStream/stream-chat-react-native/issues/2134)) ([660c19d](https://github.com/GetStream/stream-chat-react-native/commit/660c19d20d007268d18bebd75c6f9328fdf48e16))
* multiple mentions render in message text ([#2286](https://github.com/GetStream/stream-chat-react-native/issues/2286)) ([97e9c46](https://github.com/GetStream/stream-chat-react-native/commit/97e9c46260d141d0d98ec5681eb30be992a41374))

### [5.19.3](https://github.com/GetStream/stream-chat-react-native/compare/v5.19.2...v5.19.3) (2023-10-26)


### Bug Fixes

* overlay reactions got cut off when it was not scrollable ([6cfdfbc](https://github.com/GetStream/stream-chat-react-native/commit/6cfdfbc6df3d6b7aa17b471ccd596f130f7914a9))

### [5.19.2](https://github.com/GetStream/stream-chat-react-native/compare/v5.19.1...v5.19.2) (2023-10-20)


### Bug Fixes

* issue with String.replaceAll being undefined function ([#2271](https://github.com/GetStream/stream-chat-react-native/issues/2271)) ([af9050a](https://github.com/GetStream/stream-chat-react-native/commit/af9050a3fb46346ed5d0ba387b42d5a85d937e93))

### [5.19.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.19.0...v5.19.1) (2023-10-19)


### Bug Fixes

* update stream-chat to fix failing get requests with undefined param ([#2269](https://github.com/GetStream/stream-chat-react-native/issues/2269)) ([a85d71a](https://github.com/GetStream/stream-chat-react-native/commit/a85d71af17c87aaa0703a6d71bce0d4bd704266e))

## [5.19.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.18.1...v5.19.0) (2023-10-11)


### Features

* upgrade bottom-sheet to 4.4.8 ([#2255](https://github.com/GetStream/stream-chat-react-native/issues/2255)) ([52b69b0](https://github.com/GetStream/stream-chat-react-native/commit/52b69b0c5081ac0e18d83fa5b8d11f90f2683c75))
* upgrade bottom-sheet to 4.4.8 ([#2255](https://github.com/GetStream/stream-chat-react-native/issues/2255)) ([e5760e9](https://github.com/GetStream/stream-chat-react-native/commit/e5760e9a62474b52efe7a9ebafb2c4e717ba749c))

### [5.18.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.18.0...v5.18.1) (2023-10-04)


### Bug Fixes

* long message content overflowing issue in overlay ([#2244](https://github.com/GetStream/stream-chat-react-native/issues/2244)) ([0e37670](https://github.com/GetStream/stream-chat-react-native/commit/0e37670063fdda71680fc64e119ec0533150459c))
* missing Japanese translation ([#2243](https://github.com/GetStream/stream-chat-react-native/issues/2243)) ([ed2754f](https://github.com/GetStream/stream-chat-react-native/commit/ed2754f9fc011eb91f007789308950b50b66363b))
* url param serialisation issue on iOS 17 ([#2246](https://github.com/GetStream/stream-chat-react-native/issues/2246)) ([0f23d93](https://github.com/GetStream/stream-chat-react-native/commit/0f23d93079c18301aa5717e9140c247e15e307dd))

## [5.18.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.17.1...v5.18.0) (2023-09-26)


### Features

* customize message padding ([#2202](https://github.com/GetStream/stream-chat-react-native/issues/2202)) ([b2f3708](https://github.com/GetStream/stream-chat-react-native/commit/b2f37084e50d5d3232cf5348c90a083fd5211048))


### Bug Fixes

* add pointerEvents to ReactionList ([#2196](https://github.com/GetStream/stream-chat-react-native/issues/2196)) ([f559a0f](https://github.com/GetStream/stream-chat-react-native/commit/f559a0f304f69b1f04613e646a4887bda170b1f9))
* fix reply border style ([#2197](https://github.com/GetStream/stream-chat-react-native/issues/2197)) ([0e84191](https://github.com/GetStream/stream-chat-react-native/commit/0e84191525ab33b713ddd065e3a3933f6000a540))
* inline unread count indicator flickering on muted channels ([#2232](https://github.com/GetStream/stream-chat-react-native/issues/2232)) ([b55d561](https://github.com/GetStream/stream-chat-react-native/commit/b55d56147e387f2efebc4cc33aed16c02c528d65))
* iPad landscape mode broke the height reactions list ([#2226](https://github.com/GetStream/stream-chat-react-native/issues/2226)) ([4449c1d](https://github.com/GetStream/stream-chat-react-native/commit/4449c1dd87d3a63b7cec0d5bac4f9f7cdf61e900))
* parsing the links with unconventional tlds ([#2241](https://github.com/GetStream/stream-chat-react-native/issues/2241)) ([a69d73f](https://github.com/GetStream/stream-chat-react-native/commit/a69d73fadd208d54932e328367970a4f62c330ef))
* special character in mentioned user name causes crash ([#2229](https://github.com/GetStream/stream-chat-react-native/issues/2229)) ([1144c5b](https://github.com/GetStream/stream-chat-react-native/commit/1144c5be0c22fa2a0eed41a9c38b40143e0c3ed2))
* unable to apply reaction list fill color ([#2231](https://github.com/GetStream/stream-chat-react-native/issues/2231)) ([0e1659e](https://github.com/GetStream/stream-chat-react-native/commit/0e1659ebc9775a863aa977a3a8785f2d1c794c3a))

### [5.17.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.17.0...v5.17.1) (2023-09-01)


### Bug Fixes

* image/video picker upload issue from expo apps and getLocalAssetURI improvements ([#2220](https://github.com/GetStream/stream-chat-react-native/issues/2220)) ([6bd6ecd](https://github.com/GetStream/stream-chat-react-native/commit/6bd6ecd82702e620efbc95b28da2b01aa6d0252d))
* order of application of theme for gallery images ([#2221](https://github.com/GetStream/stream-chat-react-native/issues/2221)) ([64ef4e3](https://github.com/GetStream/stream-chat-react-native/commit/64ef4e318bd7959d394f569b75ff1d6d4c4f8e4d))

## [5.17.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.16.0...v5.17.0) (2023-08-30)


### Features

* introduce ability to add theme for the gallery image thumbnail ([#2216](https://github.com/GetStream/stream-chat-react-native/issues/2216)) ([5ea9a76](https://github.com/GetStream/stream-chat-react-native/commit/5ea9a761e76f1e9e7881152286e50dc7342550b2))


### Bug Fixes

* remove message from local state when the status is failed ([#2214](https://github.com/GetStream/stream-chat-react-native/issues/2214)) ([8c00f62](https://github.com/GetStream/stream-chat-react-native/commit/8c00f624171da52d72557d97064669af6ca00dea)), closes [#2215](https://github.com/GetStream/stream-chat-react-native/issues/2215)

## [5.16.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.15.3...v5.16.0) (2023-08-07)


### Features

* add ability to autoplay videos in gallery ([#2195](https://github.com/GetStream/stream-chat-react-native/issues/2195)) ([88dca0c](https://github.com/GetStream/stream-chat-react-native/commit/88dca0c5da13b05a1e07566d0d805169f765a248))


### Bug Fixes

* android picker loop on refuse permission ([#2130](https://github.com/GetStream/stream-chat-react-native/issues/2130)) ([133affc](https://github.com/GetStream/stream-chat-react-native/commit/133affc427c5a9efb49304bbea6edd29c8d4bedf))
* date separators were not visible if previous message was same day of the week ([#2200](https://github.com/GetStream/stream-chat-react-native/issues/2200)) ([e359465](https://github.com/GetStream/stream-chat-react-native/commit/e3594656cf7bdb655831dfdc5de6f8554acc45a5))
* issue with picking files through filePicker with recent version of expo-document-picker ([#2203](https://github.com/GetStream/stream-chat-react-native/issues/2203)) ([b7d1fa6](https://github.com/GetStream/stream-chat-react-native/commit/b7d1fa690a5138e89cfacf63b11be6af28d45747))
* video upload issue through image picker ([#2204](https://github.com/GetStream/stream-chat-react-native/issues/2204)) ([8dbd9a8](https://github.com/GetStream/stream-chat-react-native/commit/8dbd9a868873f4b64ae3772a0af73c2a1daef719))

### [5.15.3](https://github.com/GetStream/stream-chat-react-native/compare/v5.15.2...v5.15.3) (2023-07-18)


### Bug Fixes

* do not render message list items when channel is disconnected ([#2179](https://github.com/GetStream/stream-chat-react-native/issues/2179)) ([53d29c2](https://github.com/GetStream/stream-chat-react-native/commit/53d29c2281c41ad57ccbb78d2dcd27b074832b25))
* hmr issue due to disconnect ([#2169](https://github.com/GetStream/stream-chat-react-native/issues/2169)) ([9c8150f](https://github.com/GetStream/stream-chat-react-native/commit/9c8150fcc08f84a7c5ecbd892e6b327f66729382))
* image upload issue for expo apps ([#2166](https://github.com/GetStream/stream-chat-react-native/issues/2166)) ([84b8a13](https://github.com/GetStream/stream-chat-react-native/commit/84b8a1377a712250fb76a67a0ec7a2fd3c657fb8))
* message action list border overflow ([#2167](https://github.com/GetStream/stream-chat-react-native/issues/2167)) ([ec515b6](https://github.com/GetStream/stream-chat-react-native/commit/ec515b6e80cba456855311143054b4ea1b093bd8))
* ui issue when customizing unread count when there is no count ([#2180](https://github.com/GetStream/stream-chat-react-native/issues/2180)) ([7254bb6](https://github.com/GetStream/stream-chat-react-native/commit/7254bb6cc6a2b5e715f163e5b28e3b98098cbef1))

### [5.15.2](https://github.com/GetStream/stream-chat-react-native/compare/v5.15.1...v5.15.2) (2023-07-03)


### Bug Fixes

* do not sync if last sync is too old ([#2161](https://github.com/GetStream/stream-chat-react-native/issues/2161)) ([3b5e2ff](https://github.com/GetStream/stream-chat-react-native/commit/3b5e2ffe0e836bba86e186ca642317e5626de811))
* double check whether we scroll to an existing index when messageId is… ([#2148](https://github.com/GetStream/stream-chat-react-native/issues/2148)) ([a87b095](https://github.com/GetStream/stream-chat-react-native/commit/a87b0951dc3a8868ec4481f438d312bedaaad4a5))
* message status failed shows sent check mark ([#2127](https://github.com/GetStream/stream-chat-react-native/issues/2127)) ([00941e7](https://github.com/GetStream/stream-chat-react-native/commit/00941e776cfcb6d82d5e444fa3cc4295e40435b5))

### [5.15.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.15.0...v5.15.1) (2023-06-12)


### Bug Fixes

* incorrect typing of getPhotos between expo and native ([#2146](https://github.com/GetStream/stream-chat-react-native/issues/2146)) ([0fa3d94](https://github.com/GetStream/stream-chat-react-native/commit/0fa3d9480a2a044ecda15e970266a62c942695b8))
* use ChannelPreviewMutedStatus prop in the ChannelList ([#2128](https://github.com/GetStream/stream-chat-react-native/issues/2128)) ([4b3010a](https://github.com/GetStream/stream-chat-react-native/commit/4b3010a0100d00c5f4229369ad2d45c60e64d090))

## [5.15.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.14.1...v5.15.0) (2023-05-25)


### Features

* upgrading flatlist mvcp dep. ([#2112](https://github.com/GetStream/stream-chat-react-native/issues/2112)) ([3039600](https://github.com/GetStream/stream-chat-react-native/commit/30396003bc7c8736b54138488dbbd0cd2b5287b3))


### Bug Fixes

* do not sync when there are no channels ([#2117](https://github.com/GetStream/stream-chat-react-native/issues/2117)) ([91162ef](https://github.com/GetStream/stream-chat-react-native/commit/91162ef61f58f9173d0540d753ef4c2550b1c540))
* duplicate failed messages on offline support ([fd14657](https://github.com/GetStream/stream-chat-react-native/commit/fd14657175a0fbfea028d638bdea318a5b612356))
* expo optional dependencies import ([#2118](https://github.com/GetStream/stream-chat-react-native/issues/2118)) ([ac3dbf9](https://github.com/GetStream/stream-chat-react-native/commit/ac3dbf9b3b89ccdc886887a5b043f31ff2a20a1a))
* remove default require in expo sharing ([cc549d9](https://github.com/GetStream/stream-chat-react-native/commit/cc549d9763000591fe6e0d6bd30246fe1b433932))
* require expo-document-picker  v11 ([#2100](https://github.com/GetStream/stream-chat-react-native/issues/2100)) ([f0def5c](https://github.com/GetStream/stream-chat-react-native/commit/f0def5cebd824a8767ffbde582685a1cbac3fe4f))
* restore failed messages present in db ([#2111](https://github.com/GetStream/stream-chat-react-native/issues/2111)) ([4eb0e16](https://github.com/GetStream/stream-chat-react-native/commit/4eb0e167ea8280e6cd4426500aa6feb956231104))

### [5.14.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.14.0...v5.14.1) (2023-05-15)


### Bug Fixes

* AutoCompleteInput setInputBoxRef typing ([#2095](https://github.com/GetStream/stream-chat-react-native/issues/2095)) ([9fd7cfc](https://github.com/GetStream/stream-chat-react-native/commit/9fd7cfcbc554ef5d813541b53e018cdf16201238))
* make ws connection more robust when user is not set yet ([#2098](https://github.com/GetStream/stream-chat-react-native/issues/2098)) ([548e5ae](https://github.com/GetStream/stream-chat-react-native/commit/548e5ae719870b3bc5fffe851395bc2547227acb))

## [5.14.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.13.0...v5.14.0) (2023-05-02)


### Features

* enabling offline support with RNQS v8 and removing support for v4 ([#2067](https://github.com/GetStream/stream-chat-react-native/issues/2067)) ([22a541c](https://github.com/GetStream/stream-chat-react-native/commit/22a541c13d35188157ccf0d0442ef18142b35086))
* resizable cdn hosts ([#2058](https://github.com/GetStream/stream-chat-react-native/issues/2058)) ([d90a49c](https://github.com/GetStream/stream-chat-react-native/commit/d90a49cc46df1f7f097c95d2473689b818f3d4a8))


### Bug Fixes

* addPinnedMessages after clearing a channel's state ([#2054](https://github.com/GetStream/stream-chat-react-native/issues/2054)) ([1af97ba](https://github.com/GetStream/stream-chat-react-native/commit/1af97babb123a9b3b2957417c19df6b77f70dc91))
* disable send button if enableOfflineSupport is on and images and files are not uploaded ([#2070](https://github.com/GetStream/stream-chat-react-native/issues/2070)) ([832c377](https://github.com/GetStream/stream-chat-react-native/commit/832c3772a1f642fe4b2363a30b4b030a9e371eba))
* missing translation for pinned by ([#2051](https://github.com/GetStream/stream-chat-react-native/issues/2051)) ([478167b](https://github.com/GetStream/stream-chat-react-native/commit/478167b080b8ced93eb41b0ecf30741e8ad63801))
* remove return null check from OverlayProvider and Chat component ([#2039](https://github.com/GetStream/stream-chat-react-native/issues/2039)) ([c3ceb8c](https://github.com/GetStream/stream-chat-react-native/commit/c3ceb8c8d33f5198eba8274c837b91373d84e080))
* upgrade stream-chat version to 8.6.0 to solve offline support update channel preview issue ([4ebf23c](https://github.com/GetStream/stream-chat-react-native/commit/4ebf23cb53005522d58f06d8156ee8897a352da1))


### Reverts

* Revert "chore: upgrade stream-chat version to 8.6.0 (#2077)" (#2078) ([bffe460](https://github.com/GetStream/stream-chat-react-native/commit/bffe460670efa173710930a06e18ffcd0b7d8a05)), closes [#2077](https://github.com/GetStream/stream-chat-react-native/issues/2077) [#2078](https://github.com/GetStream/stream-chat-react-native/issues/2078)

## [5.13.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.12.1...v5.13.0) (2023-04-13)


### Features

* allow to use different i18n library ([#2038](https://github.com/GetStream/stream-chat-react-native/issues/2038)) ([42e9c67](https://github.com/GetStream/stream-chat-react-native/commit/42e9c6749fc278b43cb6ee4a116c50d921840795))


### Bug Fixes

* do not skip initialisation when querying channels ([#2034](https://github.com/GetStream/stream-chat-react-native/issues/2034)) ([f639ffb](https://github.com/GetStream/stream-chat-react-native/commit/f639ffbb5393daa896031d9ad814fc1725aeded8))
* failing optimistic update tests ([ac334ae](https://github.com/GetStream/stream-chat-react-native/commit/ac334aee7211fb378c7e4bcf3073eff46cc8a63b))
* getPhotos doesn't work if you use android targetSdkVersion 33 ([#2036](https://github.com/GetStream/stream-chat-react-native/issues/2036)) ([a17957d](https://github.com/GetStream/stream-chat-react-native/commit/a17957da62111ececf5eb943ed01caec4ac50f3a))
* offline support tests break randomly as they run parallel by default ([#2046](https://github.com/GetStream/stream-chat-react-native/issues/2046)) ([ab2a335](https://github.com/GetStream/stream-chat-react-native/commit/ab2a33598db6a75f32cfd8d0fc3f5d08a27ccd54))
* using Pressable over TouchableOpacity of gesture handle due to unreli… ([#2052](https://github.com/GetStream/stream-chat-react-native/issues/2052)) ([3da078c](https://github.com/GetStream/stream-chat-react-native/commit/3da078cc6db1e8119cc59becbc7ca9d7fc31f894))

### [5.12.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.12.0...v5.12.1) (2023-03-31)


### Bug Fixes

* make takePhoto native handler compatible with latest expo versions ([#2029](https://github.com/GetStream/stream-chat-react-native/issues/2029)) ([6c447dd](https://github.com/GetStream/stream-chat-react-native/commit/6c447ddf650f9154d70d9b43e5afbc0f7d2c81d5))
* removing a reaction outside of the latest reactions causes to add it ([#2028](https://github.com/GetStream/stream-chat-react-native/issues/2028)) ([87cf045](https://github.com/GetStream/stream-chat-react-native/commit/87cf045adde463b7b0a044ab3bd50dbc676f0122))

## [5.12.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.11.2...v5.12.0) (2023-03-21)


### Features

* add retry ability for image load failure ([#2011](https://github.com/GetStream/stream-chat-react-native/issues/2011)) ([3b5a315](https://github.com/GetStream/stream-chat-react-native/commit/3b5a3153dd2689609453e1a8bc03c311d06ca178))


### Bug Fixes

* Add style prop to Bullet component ([#2008](https://github.com/GetStream/stream-chat-react-native/issues/2008)) ([59b4b64](https://github.com/GetStream/stream-chat-react-native/commit/59b4b64eae7b2efe025072a1b3dd86bc7b8c6c5f))
* android list is inverted when custom flatlist style is used ([#2016](https://github.com/GetStream/stream-chat-react-native/issues/2016)) ([edabea1](https://github.com/GetStream/stream-chat-react-native/commit/edabea13afa1398f7d0cc8865ac80941088a6c06))
* blank screen on offline support if user id is lazily set ([#2003](https://github.com/GetStream/stream-chat-react-native/issues/2003)) ([2cc2d4a](https://github.com/GetStream/stream-chat-react-native/commit/2cc2d4a7618adeb26f83425e2bff9b418fc2edf0))
* eslint sort errors and mode cover in compressImage.ts of native-package ([#2005](https://github.com/GetStream/stream-chat-react-native/issues/2005)) ([107cfef](https://github.com/GetStream/stream-chat-react-native/commit/107cfeff6e30345355da2103ce861a8b0d0c0380))
* initial scroll to first unread message was broken when there more than 55 unread messages ([#2020](https://github.com/GetStream/stream-chat-react-native/issues/2020)) ([76f9ee3](https://github.com/GetStream/stream-chat-react-native/commit/76f9ee3ed2da1e71725d236e64c511d714fcd37b))
* listen to ios more photos selection in gallery ([#1994](https://github.com/GetStream/stream-chat-react-native/issues/1994)) ([2b47ee3](https://github.com/GetStream/stream-chat-react-native/commit/2b47ee3f1357843b4ada8eb98732bef3eddfb5c2))
* misplaced date header, header/footer component in messageList on android 33 ([#1977](https://github.com/GetStream/stream-chat-react-native/issues/1977)) ([e0386be](https://github.com/GetStream/stream-chat-react-native/commit/e0386be1aaca0a9d773b84dfa5f8e0a7aa6410bd))
* missing userSyncStatus db table upon clean install ([#2001](https://github.com/GetStream/stream-chat-react-native/issues/2001)) ([36eb866](https://github.com/GetStream/stream-chat-react-native/commit/36eb866288002853baa34f063a08cdb8eb35c71f))
* rendering the URL Preview for appropriate attachments in message list ([2469075](https://github.com/GetStream/stream-chat-react-native/commit/2469075f65aadd982411ea5cf6fe157355e78367))
* rendering the URL Preview for appropriate attachments in message list ([ee721f0](https://github.com/GetStream/stream-chat-react-native/commit/ee721f0ea438da2cfe5900ed510a62c765d46921))
* scrollToFirstUnreadMessage not working ([#2004](https://github.com/GetStream/stream-chat-react-native/issues/2004)) ([973c21b](https://github.com/GetStream/stream-chat-react-native/commit/973c21bd1031ff79b2e711a9e2e231b29302784e))
* stop sending typing events when the event is not enabled on dashboard ([#2014](https://github.com/GetStream/stream-chat-react-native/issues/2014)) ([04c2206](https://github.com/GetStream/stream-chat-react-native/commit/04c220689f85f96f6ed09c1e781bab8a35ae3828))
* update yarn.lock file of the root, packages and the example apps ([#1986](https://github.com/GetStream/stream-chat-react-native/issues/1986)) ([e7089ac](https://github.com/GetStream/stream-chat-react-native/commit/e7089ac065edf85782c2b7ca1b0b2d86ec4df787))

### [5.11.2](https://github.com/GetStream/stream-chat-react-native/compare/v5.11.1...v5.11.2) (2023-02-17)


### Bug Fixes

* misplaced date header, header/footer component in messageList on android 33 ([#1977](https://github.com/GetStream/stream-chat-react-native/issues/1977)) ([#1978](https://github.com/GetStream/stream-chat-react-native/issues/1978)) ([17908b1](https://github.com/GetStream/stream-chat-react-native/commit/17908b15fa7be070935e34e003d23015b7b8395f))

### [5.11.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.11.0...v5.11.1) (2023-02-14)


### Bug Fixes

* empty state component was falsely inverted ([#1971](https://github.com/GetStream/stream-chat-react-native/issues/1971)) ([14b667a](https://github.com/GetStream/stream-chat-react-native/commit/14b667a57f7cea040f55c4fbf37b87c3cb8eee69))

## [5.11.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.10.0...v5.11.0) (2023-02-10)


### Features

* **build:** add shared github action to install and build SDK ([#1962](https://github.com/GetStream/stream-chat-react-native/issues/1962)) ([3bd0fcc](https://github.com/GetStream/stream-chat-react-native/commit/3bd0fccf4e4e91979795cd5c66ef224d53cd0d4c))


### Bug Fixes

* apply workaround for android anr ([#1964](https://github.com/GetStream/stream-chat-react-native/issues/1964)) ([a356cef](https://github.com/GetStream/stream-chat-react-native/commit/a356cef0fc5b21d95066d7ef05e70d5b367015b7))

## [5.10.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.9.1...v5.10.0) (2023-02-09)


### Features

* add prop for helping multiple channel list implementation ([#1951](https://github.com/GetStream/stream-chat-react-native/issues/1951)) ([e6f700c](https://github.com/GetStream/stream-chat-react-native/commit/e6f700cd91e4a8ad308e18560b37536e282f6e61))


### Bug Fixes

* do not report invalid tlds as valid urls ([#1950](https://github.com/GetStream/stream-chat-react-native/issues/1950)) ([6917dcd](https://github.com/GetStream/stream-chat-react-native/commit/6917dcd9a547ecdbf0574aa50865bfc01c590122))

### [5.9.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.9.0...v5.9.1) (2023-02-02)


### Bug Fixes

* fixes clipboard detection on android when not installed ([#1936](https://github.com/GetStream/stream-chat-react-native/issues/1936)) ([a9ce8b3](https://github.com/GetStream/stream-chat-react-native/commit/a9ce8b303f93ae58d392c3cfed937571955639b1))
* users can receive/send message after returning to app ([#1943](https://github.com/GetStream/stream-chat-react-native/issues/1943)) ([d5059a6](https://github.com/GetStream/stream-chat-react-native/commit/d5059a64f97367c548699a2d3d1407f0c3f9e0fb))

## [5.9.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.8.0...v5.9.0) (2023-01-26)


### Features

* Override `message.new` event function ([#1913](https://github.com/GetStream/stream-chat-react-native/issues/1913)) ([77f218a](https://github.com/GetStream/stream-chat-react-native/commit/77f218abb022dfa0c1f2cc0273f4557eeefbbd8a))


### Bug Fixes

* improve ChannelList performance by improving threshold calls and rerenders of Header ([#1919](https://github.com/GetStream/stream-chat-react-native/issues/1919)) ([6ebabb6](https://github.com/GetStream/stream-chat-react-native/commit/6ebabb609f1cea748762ce01f472a84109b0efdf))
* messageAction type ([#1924](https://github.com/GetStream/stream-chat-react-native/issues/1924)) ([b90cabf](https://github.com/GetStream/stream-chat-react-native/commit/b90cabf64d0b62bea946472112af219bb71f0d95))
* selected video attachment in attachment picker isn't recognized as selected and upload issues on android ([#1931](https://github.com/GetStream/stream-chat-react-native/issues/1931)) ([f1603ff](https://github.com/GetStream/stream-chat-react-native/commit/f1603ff2d7f127fa688d59494fe621854fc46eec))


### Reverts

* Revert "fix: show appropriate channel according to filter type defined when new message received (#1920)" (#1926) ([a73fa86](https://github.com/GetStream/stream-chat-react-native/commit/a73fa8676a2070e3e7131273fdc46ff47fa98140)), closes [#1920](https://github.com/GetStream/stream-chat-react-native/issues/1920) [#1926](https://github.com/GetStream/stream-chat-react-native/issues/1926)

## [5.8.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.7.0...v5.8.0) (2023-01-19)


### Features

* add max file upload size limit of 100MB ([#1888](https://github.com/GetStream/stream-chat-react-native/issues/1888)) ([7ff1698](https://github.com/GetStream/stream-chat-react-native/commit/7ff169818e66cf9bbdf4b4de28fa804f48ea076b))
* add resizeMode prop to the Video component and update native_handlers docs ([878caf0](https://github.com/GetStream/stream-chat-react-native/commit/878caf095995dfc391d2ea827d51b267f9bd0a5d))
* add resizeMode prop to the Video component and update native_handlers docs ([b7379b9](https://github.com/GetStream/stream-chat-react-native/commit/b7379b9e67e85e023d342c491fa684c80be93264))
* update expo example app to expo 47 ([#1892](https://github.com/GetStream/stream-chat-react-native/issues/1892)) ([e396ec0](https://github.com/GetStream/stream-chat-react-native/commit/e396ec09e281f659f63efa55a3f2499d6ce0d310))
* upgrading stream-chat to v8.2.1 ([25e94e9](https://github.com/GetStream/stream-chat-react-native/commit/25e94e9b902e267ffd55bb6788d6b5d0cc2d5610))
* upgrading stream-chat tov8.2.1 ([679bcc1](https://github.com/GetStream/stream-chat-react-native/commit/679bcc1df6cda9fa73564fb5aebcfdae4223fb26))
* upgrading stream-chat tov8.2.1 ([6febba9](https://github.com/GetStream/stream-chat-react-native/commit/6febba919c06d9f70bda145e44e9861d02cf8177))


### Bug Fixes

* add resizeMode support in expo package handlers ([715540f](https://github.com/GetStream/stream-chat-react-native/commit/715540ffe8d590d7c783e240999a9299f1eb7d05))
* avoid double commas in generated channel names ([#1800](https://github.com/GetStream/stream-chat-react-native/issues/1800)) ([99dfee5](https://github.com/GetStream/stream-chat-react-native/commit/99dfee56b3078cc3937180fc34372081614e7b99))
* commands with username must be replaced with userId ([#1890](https://github.com/GetStream/stream-chat-react-native/issues/1890)) ([8001e4d](https://github.com/GetStream/stream-chat-react-native/commit/8001e4dcb0436e4dc0c6402b98246945098ac3ea))
* do not fixate on unnecessary peer dependency versions ([#1903](https://github.com/GetStream/stream-chat-react-native/issues/1903)) ([6cc5bde](https://github.com/GetStream/stream-chat-react-native/commit/6cc5bdebd00860e581f6c8432763424f6137be1f))
* do render images twice on markdown ([#1897](https://github.com/GetStream/stream-chat-react-native/issues/1897)) ([72c80f6](https://github.com/GetStream/stream-chat-react-native/commit/72c80f61fff48df7a500abdc6b845a6dc98dad02))
* trimmed mentioned user text in messages when special characters used ([#1909](https://github.com/GetStream/stream-chat-react-native/issues/1909)) ([e64b1d6](https://github.com/GetStream/stream-chat-react-native/commit/e64b1d6b4abac8fcf5c6002d7657ab6dd6b53417))

## [5.7.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.6.1...v5.7.0) (2022-12-23)


### Features

* allow theming the container for pinned messages ([#1867](https://github.com/GetStream/stream-chat-react-native/issues/1867)) ([f6ee974](https://github.com/GetStream/stream-chat-react-native/commit/f6ee974274d8bd7fb2db4336293dd8647e7b2ab1))
* initial unread count example ([#1868](https://github.com/GetStream/stream-chat-react-native/issues/1868)) ([d283267](https://github.com/GetStream/stream-chat-react-native/commit/d283267db8bd3d577a9c46d02d0e2894b8341915))


### Bug Fixes

* expo module version incompatibilities ([#1855](https://github.com/GetStream/stream-chat-react-native/issues/1855)) ([a2c0357](https://github.com/GetStream/stream-chat-react-native/commit/a2c0357dd676dc3b91eae2fb57157e971db209b5))

### [5.6.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.6.0...v5.6.1) (2022-12-03)


### Bug Fixes

* expo app crashes due to sqlite being null ([#1845](https://github.com/GetStream/stream-chat-react-native/issues/1845)) ([718e28d](https://github.com/GetStream/stream-chat-react-native/commit/718e28df043e8cdfe051106d9299c60ddcbe8fc3))
* syncStatus of DBSyncManager is not updated correctly ([#1842](https://github.com/GetStream/stream-chat-react-native/issues/1842)) ([92be75a](https://github.com/GetStream/stream-chat-react-native/commit/92be75a563080bb9ebf4a3a91106a2de658d0779))

## [5.6.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.5.1...v5.6.0) (2022-12-01)


### Features

* Make the DocumentPicker dependency optional ([#1809](https://github.com/GetStream/stream-chat-react-native/issues/1809)) ([8b1eff9](https://github.com/GetStream/stream-chat-react-native/commit/8b1eff9583ad0e6a6892f8037e3e40e0a972968c))
* optimistic DB and UI updates for reactions and messages ([#1758](https://github.com/GetStream/stream-chat-react-native/issues/1758)) ([abe2b70](https://github.com/GetStream/stream-chat-react-native/commit/abe2b70d91bcfb689daa2b7bbf6be205c038fe57))


### Bug Fixes

* Add theme config for BottomSheetFlatList in ImageGrid ([#1831](https://github.com/GetStream/stream-chat-react-native/issues/1831)) ([8411df9](https://github.com/GetStream/stream-chat-react-native/commit/8411df9d5b34359a9bf2a3866cae5a339ce35482))
* remove the unnecessary remapping of chat-core import ([#1837](https://github.com/GetStream/stream-chat-react-native/issues/1837)) ([25815d5](https://github.com/GetStream/stream-chat-react-native/commit/25815d5cd950d954b3130e448ccc70dbee74c924))
* unmatched border radius for attachment picker ([#1829](https://github.com/GetStream/stream-chat-react-native/issues/1829)) ([32d9af8](https://github.com/GetStream/stream-chat-react-native/commit/32d9af84b379b238b34074618b2f085f78d6f7a4))

### [5.5.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.5.0...v5.5.1) (2022-11-25)


### Bug Fixes

* import React Dependency into Video / Sound files ([#1828](https://github.com/GetStream/stream-chat-react-native/issues/1828)) ([47f2e60](https://github.com/GetStream/stream-chat-react-native/commit/47f2e601595ce5afcf245077a1fdadc9c6832343))

## [5.5.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.4.3...v5.5.0) (2022-11-18)


### Features

* make the clipboard dependency optional ([#1781](https://github.com/GetStream/stream-chat-react-native/issues/1781)) ([1179a94](https://github.com/GetStream/stream-chat-react-native/commit/1179a94bee7b4bcbc9f32c1b51ff4215b3d32c39))


### Bug Fixes

* close db function is broken ([1781bbc](https://github.com/GetStream/stream-chat-react-native/commit/1781bbc4c29d385daaa918eef0bdfb28f85c3a97))
* don't allow empty cids for sync api call ([#1814](https://github.com/GetStream/stream-chat-react-native/issues/1814)) ([a31d899](https://github.com/GetStream/stream-chat-react-native/commit/a31d899025b42cdc0e34c3b21813fa19b59b3cda))
* drop unnecessary react-art dependency ([#1806](https://github.com/GetStream/stream-chat-react-native/issues/1806)) ([92ba10e](https://github.com/GetStream/stream-chat-react-native/commit/92ba10e9988f5674de03d0c7d7f46d83e32df169))
* event handlers when channels is null on channel list component ([#1812](https://github.com/GetStream/stream-chat-react-native/issues/1812)) ([be7c6c0](https://github.com/GetStream/stream-chat-react-native/commit/be7c6c03654e81e3d3f5dfbcd739aff6db8935dc))
* read receipts should not be removed due to message update ([#1808](https://github.com/GetStream/stream-chat-react-native/issues/1808)) ([9da4dba](https://github.com/GetStream/stream-chat-react-native/commit/9da4dba35dd06364cd1c8082b6b010f713508acd))

### [5.4.3](https://github.com/GetStream/stream-chat-react-native/compare/v5.4.2...v5.4.3) (2022-11-15)


### Bug Fixes

* avoid requesting app settings if the client isn't connected ([#1779](https://github.com/GetStream/stream-chat-react-native/issues/1779)) ([0efadaf](https://github.com/GetStream/stream-chat-react-native/commit/0efadaf2bfec0e3dc06add9180cd6098e1a4c729))

### [5.4.2](https://github.com/GetStream/stream-chat-react-native/compare/v5.4.1...v5.4.2) (2022-10-21)


### Bug Fixes

* check-pr and next-release GH actions are broken after bottomsheet upgrade ([#1764](https://github.com/GetStream/stream-chat-react-native/issues/1764)) ([affd3c7](https://github.com/GetStream/stream-chat-react-native/commit/affd3c75f4bf63ca2d69d3db3536ea1367354e63))
* only autofocus when giphy is active ([#1770](https://github.com/GetStream/stream-chat-react-native/issues/1770)) ([3e07b61](https://github.com/GetStream/stream-chat-react-native/commit/3e07b61d73d04bcb5f3a9065d02e689bc4311253))
* **android:** various attachment picker issues ([#1760](https://github.com/GetStream/stream-chat-react-native/issues/1760)) ([ad25f20](https://github.com/GetStream/stream-chat-react-native/commit/ad25f205797a53c5ee78c8c6fae38d4b949dac75))
* messages rendered in correct order when message list is not inve… ([#1751](https://github.com/GetStream/stream-chat-react-native/issues/1751)) ([c603cad](https://github.com/GetStream/stream-chat-react-native/commit/c603cade2f72e0a56a208a851538a61441534c09))
* type of image parameter in MessageInputContext's uploadNewImage prop to Partial<Asset> ([#1762](https://github.com/GetStream/stream-chat-react-native/issues/1762)) ([6d76e3f](https://github.com/GetStream/stream-chat-react-native/commit/6d76e3fccc14d6ca4d0dc061fd8b066b0e45257f))

### [5.4.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.4.0...v5.4.1) (2022-10-12)


### Bug Fixes

* use the default export of haptic feedback ([#1754](https://github.com/GetStream/stream-chat-react-native/issues/1754)) ([e3788a7](https://github.com/GetStream/stream-chat-react-native/commit/e3788a7d53ea2eb34da039626cc7607fe7458c2c))

## [5.4.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.3.1...v5.4.0) (2022-10-10)


### Features

* added support for prop 'getMessagesGroupStyles' on Channel ([#1749](https://github.com/GetStream/stream-chat-react-native/issues/1749)) ([206c898](https://github.com/GetStream/stream-chat-react-native/commit/206c89832d5fdfb67c9d82f05764315699f60b8e))
* always open connection when app goes to foreground ([a168336](https://github.com/GetStream/stream-chat-react-native/commit/a168336fe38655dbd431513b2023fbbedc40d641))
* always open connection when app goes to foreground ([437f9d7](https://github.com/GetStream/stream-chat-react-native/commit/437f9d7f46e8d3665b800ecdc9c599a952bdd109))
* make react-native-share and react-native-haptic-feedback optional ([#1744](https://github.com/GetStream/stream-chat-react-native/issues/1744)) ([7e5e874](https://github.com/GetStream/stream-chat-react-native/commit/7e5e87445fa601fbe0f34f78ed692ed761614562))


### Bug Fixes

* add memoization in ReactionList to update MessageOverlay in Real time ([#1737](https://github.com/GetStream/stream-chat-react-native/issues/1737)) ([eb9a3d8](https://github.com/GetStream/stream-chat-react-native/commit/eb9a3d8d75d1ed6ea8422730b3c8ae415a83795f))
* auto focus on input box on mount and command selection ([60f8194](https://github.com/GetStream/stream-chat-react-native/commit/60f819495a407b5b932500dbb7d1e65ccd0f4ba2))
* auto focus on input box on mount and command selection ([41035ad](https://github.com/GetStream/stream-chat-react-native/commit/41035ad46d75f35a499d9c62d329c7261ee61934))
* export pickDocument from the handler dir ([#1752](https://github.com/GetStream/stream-chat-react-native/issues/1752)) ([9d4e1eb](https://github.com/GetStream/stream-chat-react-native/commit/9d4e1eb2b917ae37102dc5cd6348ee855e22fa7a))
* unresponsive clear button when the file type is not supported ([5ff90fa](https://github.com/GetStream/stream-chat-react-native/commit/5ff90fae60bdec385befa3d9e4640f6b3dbe81e5))
* unresponsve clear button when the file type is not supported ([1f4e439](https://github.com/GetStream/stream-chat-react-native/commit/1f4e439baf44dfe54661b6ab62979cba30e727fa))

### [5.3.1](https://github.com/GetStream/stream-chat-react-native/compare/v5.3.0...v5.3.1) (2022-09-22)


### Bug Fixes

* display date separators before visible messages ([#1733](https://github.com/GetStream/stream-chat-react-native/issues/1733)) ([a5ff69d](https://github.com/GetStream/stream-chat-react-native/commit/a5ff69d04f45173106e2affdb20e188735b03221))
* don't parse [@user](https://github.com/user).name as URLs ([ed05ebc](https://github.com/GetStream/stream-chat-react-native/commit/ed05ebc996562fb4952d05653ff254f8b529bf39))
* don't parse [@user](https://github.com/user).name as URLs ([758d938](https://github.com/GetStream/stream-chat-react-native/commit/758d93817b951457e244a7fade73d510612d81dd))
* remove lookbehind, strip user names from the input instead ([2ccb577](https://github.com/GetStream/stream-chat-react-native/commit/2ccb5773e7dfca30ebeb5d8ec77bbf6de834459a))

## [5.3.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.2.0...v5.3.0) (2022-09-13)


### Features

* capability to cache images locally ([#1692](https://github.com/GetStream/stream-chat-react-native/issues/1692)) ([c89a3e7](https://github.com/GetStream/stream-chat-react-native/commit/c89a3e7574bd49789a4ec6bc37c9ea848734364b))


### Bug Fixes

* handling of empty channels corresponding to filters/sort in offline support ([#1708](https://github.com/GetStream/stream-chat-react-native/issues/1708)) ([51381fd](https://github.com/GetStream/stream-chat-react-native/commit/51381fd81c3bb0f6560f4f51b74dad090064240c))
* typescript definition was wrong for getLocalAssetUri and initializeSound ([#1714](https://github.com/GetStream/stream-chat-react-native/issues/1714)) ([d66e6bb](https://github.com/GetStream/stream-chat-react-native/commit/d66e6bb2e1080f3cda552e5a6128580b192b6c82))

## [5.2.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.1.0...v5.2.0) (2022-09-06)


### Features

* add debugcontext to send/receive data to/from the flipper plugin ([14d1e35](https://github.com/GetStream/stream-chat-react-native/commit/14d1e350c6db75fb630f3d737eed4149b4438fe7))
* debug mode for SDK using Flipper plugin ([c5fc2a3](https://github.com/GetStream/stream-chat-react-native/commit/c5fc2a36894f2ab8c67673cb15b44460afee4e6b))
* send client data to the desktop plugin ([268c99c](https://github.com/GetStream/stream-chat-react-native/commit/268c99cd88b5740e6e1f5eeb6a4d7e731d21289b))


### Bug Fixes

* erroneous usage of AudioAttachment and its props from message input context ([9331343](https://github.com/GetStream/stream-chat-react-native/commit/93313432ae3e9f068a29b8715532e1dc0aa5e41c))
* multiple video controls in ImageGallery ([29aab59](https://github.com/GetStream/stream-chat-react-native/commit/29aab59cbe51907e79f4a6523af74862e70ca789))
* repeat memoization and support of new version of rn-video on android ([d0cd043](https://github.com/GetStream/stream-chat-react-native/commit/d0cd043c4f5e18199f7b2d9ebe664e55f0567346))
* theming colors of image gallery video control's progress and duration text ([b6dcec6](https://github.com/GetStream/stream-chat-react-native/commit/b6dcec640e449750c463eab82a86ed10b0b059b6))
* video controls for multiple videos in image gallery ([c5981df](https://github.com/GetStream/stream-chat-react-native/commit/c5981df9d139f4bab8d17835e8d3068753177f2d))

## [5.1.0](https://github.com/GetStream/stream-chat-react-native/compare/v5.0.0...v5.1.0) (2022-08-31)


### Features

* allow customization of the close icon for uploads ([#1668](https://github.com/GetStream/stream-chat-react-native/issues/1668)) ([9a7cfa9](https://github.com/GetStream/stream-chat-react-native/commit/9a7cfa9963d2f0cb0b1675bfc4b6db0d0ad27824))

## [4.15.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.14.0...v4.15.0) (2022-08-17)


### Features

* add asset url for file attachment's press event emitter ([#1637](https://github.com/GetStream/stream-chat-react-native/issues/1637)) ([9df8e59](https://github.com/GetStream/stream-chat-react-native/commit/9df8e59c137e48d87da149e0dce8094addabd6b3))


### Bug Fixes

* channel preview message only updates on the first last message ([#1636](https://github.com/GetStream/stream-chat-react-native/issues/1636)) ([920a776](https://github.com/GetStream/stream-chat-react-native/commit/920a776ade74cecf65a35b44f2cccc396f9b0410))
* generics typing issues if js client is above 6.7.1 ([#1645](https://github.com/GetStream/stream-chat-react-native/issues/1645)) ([79296e0](https://github.com/GetStream/stream-chat-react-native/commit/79296e023d7f72c4c3ca6fe0951254ea2948cc72))
* make onPressMessage possible to override for TextLink ([#1635](https://github.com/GetStream/stream-chat-react-native/issues/1635)) ([0a57442](https://github.com/GetStream/stream-chat-react-native/commit/0a574421a56aa0e536b6ad9043169b2f2f111d08))

## [4.14.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.13.0...v4.14.0) (2022-08-10)


### Features

* add support for sharing mp4 and webp giphy attachments ([#1612](https://github.com/GetStream/stream-chat-react-native/issues/1612)) ([11012d0](https://github.com/GetStream/stream-chat-react-native/commit/11012d04f292184a5ac3289c9b8f08e86233987e))


### Bug Fixes

* handle hidden channels in message.new listener ([#1624](https://github.com/GetStream/stream-chat-react-native/issues/1624)) ([ec9a524](https://github.com/GetStream/stream-chat-react-native/commit/ec9a524dec3b3a7dd80a10b0a31dc8587b62d331))
* rerender message text container when markdown style prop updates ([#1628](https://github.com/GetStream/stream-chat-react-native/issues/1628)) ([dc36f2b](https://github.com/GetStream/stream-chat-react-native/commit/dc36f2ba86deba4f9f6939be6d64ca88da195f82))

## [4.13.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.12.2...v4.13.0) (2022-08-05)


### Features

* update markdown package ([0c23acd](https://github.com/GetStream/stream-chat-react-native/commit/0c23acd99ee45d3e2543350a43fbb18465b19934))


### Bug Fixes

* allow overriding message from props on gallery component ([#1620](https://github.com/GetStream/stream-chat-react-native/issues/1620)) ([44ecf98](https://github.com/GetStream/stream-chat-react-native/commit/44ecf98cc59ff4701dfd95e725ecd68231ffa3c0))
* update markdown package to fix prop types import error ([1438321](https://github.com/GetStream/stream-chat-react-native/commit/1438321c396750aeee8b51680452783846d850d3))


### Reverts

* Revert "Revert "fix: update markdown package to fix prop types import error " (#1622)" (#1623) ([12ab5d5](https://github.com/GetStream/stream-chat-react-native/commit/12ab5d5d20daed6534e423f570b4b99d531e8015)), closes [#1622](https://github.com/GetStream/stream-chat-react-native/issues/1622) [#1623](https://github.com/GetStream/stream-chat-react-native/issues/1623)

### [4.12.2](https://github.com/GetStream/stream-chat-react-native/compare/v4.12.1...v4.12.2) (2022-08-03)


### Bug Fixes

* reactions and pinning are not updating on attachments ([#1609](https://github.com/GetStream/stream-chat-react-native/issues/1609)) ([fc55611](https://github.com/GetStream/stream-chat-react-native/commit/fc55611f9fbc8c09fcbea464273cfa0fe6d6f384))

### [4.12.1](https://github.com/GetStream/stream-chat-react-native/compare/v4.12.0...v4.12.1) (2022-08-01)


### Bug Fixes

* broken touch listeners on reaction list ([#1600](https://github.com/GetStream/stream-chat-react-native/issues/1600)) ([5510e62](https://github.com/GetStream/stream-chat-react-native/commit/5510e629295136089f6d96505ac859a05647a925))

## [4.12.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.11.0...v4.12.0) (2022-07-29)


### Features

* show audio attachments in message list ([#1582](https://github.com/GetStream/stream-chat-react-native/issues/1582)) ([d2bc714](https://github.com/GetStream/stream-chat-react-native/commit/d2bc714a13bacd7656c439250211811c368d8456))
* support playing audio attachments from message input ([#1489](https://github.com/GetStream/stream-chat-react-native/issues/1489)) ([d7dd0f7](https://github.com/GetStream/stream-chat-react-native/commit/d7dd0f7926e99199c8eee421f27e4727dcd32fe5))


### Bug Fixes

* add pathFill to the image and file upload Close icon ([#1573](https://github.com/GetStream/stream-chat-react-native/issues/1573)) ([b51a71e](https://github.com/GetStream/stream-chat-react-native/commit/b51a71e80623b8fcc5bb8379486c4e3ff2609ddb))
* added condition to render only the video thumbnail in video reply and fix styles and theming ([#1565](https://github.com/GetStream/stream-chat-react-native/issues/1565)) ([d4d7fd2](https://github.com/GetStream/stream-chat-react-native/commit/d4d7fd2a06d53fdbce815dc599d9c02c9a24d593))
* allow pound sign in link paths ([#1581](https://github.com/GetStream/stream-chat-react-native/issues/1581)) ([6711b7d](https://github.com/GetStream/stream-chat-react-native/commit/6711b7dbe2c01b73a1c7947541634b79990ff9c9))
* center align the image loading indicator ([#1593](https://github.com/GetStream/stream-chat-react-native/issues/1593)) ([db4248f](https://github.com/GetStream/stream-chat-react-native/commit/db4248fbe3e88988f4a845eb56f7351dfb5fdc60))
* erroneous usage of AudioAttachment and its props from message input context ([#1588](https://github.com/GetStream/stream-chat-react-native/issues/1588)) ([75561fd](https://github.com/GetStream/stream-chat-react-native/commit/75561fdc2d59732a6b8a35dd12d3a0f2b6a56126))
* ignore thread response from latest message preview on channel list ([#1580](https://github.com/GetStream/stream-chat-react-native/issues/1580)) ([07c6f89](https://github.com/GetStream/stream-chat-react-native/commit/07c6f894b4596b69dcecff5b1da9933749b92e53))
* image sharing in android ([#1575](https://github.com/GetStream/stream-chat-react-native/issues/1575)) ([b638eec](https://github.com/GetStream/stream-chat-react-native/commit/b638eecf3a26b03ae9cd1a6826c8f4c310f2db49))
* reposition image error indicator ([#1577](https://github.com/GetStream/stream-chat-react-native/issues/1577)) ([edfd8ca](https://github.com/GetStream/stream-chat-react-native/commit/edfd8cac42284cc08afa46e249cbe66debddb111))

## [4.11.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.10.0...v4.11.0) (2022-07-20)


### Features

* upgrade react-native-reanimated to 2.7.0 ([#1560](https://github.com/GetStream/stream-chat-react-native/issues/1560)) ([602f728](https://github.com/GetStream/stream-chat-react-native/commit/602f7282eed3ee18b58432329c79defc5f889344))


### Bug Fixes

* added translation for Video label in Reply and changed ImageGalleryOverlay header text ([ad6c9f9](https://github.com/GetStream/stream-chat-react-native/commit/ad6c9f97cc2b45a6b9162a9972f8fac865ddb51b))
* added translation for Video label in Reply and changed ImageGalleryOverlay header text ([559c9ca](https://github.com/GetStream/stream-chat-react-native/commit/559c9cacb3c5b8f2433a92b20f4eb9e18b4d0d56))
* avoid use of finally as redux middlewares remove it ([#1558](https://github.com/GetStream/stream-chat-react-native/issues/1558)) ([0a35e31](https://github.com/GetStream/stream-chat-react-native/commit/0a35e311098c6eb9d8e69c33ecde08225a268aad))
* image gallery footer background color for dark mode ([19447f0](https://github.com/GetStream/stream-chat-react-native/commit/19447f02078c512247acd6170937cbefddfcb8c7))
* image gallery footer background color for dark mode ([9631dd3](https://github.com/GetStream/stream-chat-react-native/commit/9631dd3caf71a6173a7a163a0e5ecfa556fc0e00))
* update flat list mvcp lib in core ([#1557](https://github.com/GetStream/stream-chat-react-native/issues/1557)) ([72641c4](https://github.com/GetStream/stream-chat-react-native/commit/72641c4a56f3cba16fe3d672c5493740cc07e460))

## [4.10.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.9.0...v4.10.0) (2022-07-13)


### Features

* support automatically translated messages ([#1526](https://github.com/GetStream/stream-chat-react-native/issues/1526)) ([b50ed73](https://github.com/GetStream/stream-chat-react-native/commit/b50ed73904c72748b3ad2306c91742574f6da010))


### Bug Fixes

* image and giphy sharing issue ([5d7cf30](https://github.com/GetStream/stream-chat-react-native/commit/5d7cf303df4a092e6e2a0d6cc8d4a50d12633cc9))
* update bottom sheet lib to avoid race condition ([#1553](https://github.com/GetStream/stream-chat-react-native/issues/1553)) ([8e4b2a4](https://github.com/GetStream/stream-chat-react-native/commit/8e4b2a46e8e304d54b0d28c116ce399259dfef5f))

## [4.9.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.8.0...v4.9.0) (2022-07-11)


### Features

* add loading indicator to gallery images ([0b33e2e](https://github.com/GetStream/stream-chat-react-native/commit/0b33e2ec04b2a83de7f597432c9a72f8ecdfc3d3))
* replace static video thumbnails with actual thumbnails ([12caa9d](https://github.com/GetStream/stream-chat-react-native/commit/12caa9da9d260e68f75c8c2f7b0fbd023a20620a))


### Bug Fixes

* align placeholderText to right when when in RTL ([a072c5f](https://github.com/GetStream/stream-chat-react-native/commit/a072c5f34a1e971e90ce26ba8131b239294b4383))
* RTL command up ([217f945](https://github.com/GetStream/stream-chat-react-native/commit/217f9452ab5435774501be2a6e5203fc36729e05))
* rtl-blocked-file-&-image-indicator ([80a5a91](https://github.com/GetStream/stream-chat-react-native/commit/80a5a91047b272eb6e4c42170fc4376fc213316b))

## [4.8.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.7.3...v4.8.0) (2022-06-29)


### Features

* hebrew locale support ([20a73f0](https://github.com/GetStream/stream-chat-react-native/commit/20a73f0ee46742b8117bdc175c56fc70ee6074a5))

### [4.7.3](https://github.com/GetStream/stream-chat-react-native/compare/v4.7.2...v4.7.3) (2022-06-22)


### Bug Fixes

* video attachment when video dependency is not installed ([9d9f65c](https://github.com/GetStream/stream-chat-react-native/commit/9d9f65c3c1a179f06370c8f2b60cf4fdcd9c1a5c))

### [4.7.2](https://github.com/GetStream/stream-chat-react-native/compare/v4.7.1...v4.7.2) (2022-06-17)


### Bug Fixes

* remove error thrown in useMessageContext ([4673f21](https://github.com/GetStream/stream-chat-react-native/commit/4673f210798f310bbbf809d4147041e022eca74e))

### [4.7.1](https://github.com/GetStream/stream-chat-react-native/compare/v4.7.0...v4.7.1) (2022-06-15)


### Bug Fixes

* consistent link preview component ([0e3c003](https://github.com/GetStream/stream-chat-react-native/commit/0e3c003e282e88291b3b92a6910157943fec5ee3))
* Error handling of the context consumer hooks [CRNS - 430] ([066d08a](https://github.com/GetStream/stream-chat-react-native/commit/066d08a8d2c0b1d9c8584d4e35776597d373d149))
* image uploads issue in iOS devices ([f6844f2](https://github.com/GetStream/stream-chat-react-native/commit/f6844f2a9cb6db1a1f28997ade1a596d43207580))

## [4.7.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.6.1...v4.7.0) (2022-06-07)


### Features

* ability to customize onPress handler for urls ([e5b840f](https://github.com/GetStream/stream-chat-react-native/commit/e5b840f07983c71cc58322194c5b62ebbefa9252))
* allow video upload from image picker and file picker ([6009d36](https://github.com/GetStream/stream-chat-react-native/commit/6009d3626bed416c1bd043fbf1c6ebb156186677))
* inline video renderer/player support for SDK ([862c4bb](https://github.com/GetStream/stream-chat-react-native/commit/862c4bb990f98f26c6c81e2335692569a44018b9))


### Bug Fixes

* correctly truncate channel name in useChannelPreviewDisplayName ([cdabaa3](https://github.com/GetStream/stream-chat-react-native/commit/cdabaa3682747c3590df37a2ad86380c67e0ef29))
* filePicker appearing issue on tapping the attachment picker icon after file is selected ([ae19950](https://github.com/GetStream/stream-chat-react-native/commit/ae19950b397b5e999e10c9ae7f1a41ad5dfdec12))
* issue with the link text overflowing the reply view ([1c5aa3e](https://github.com/GetStream/stream-chat-react-native/commit/1c5aa3eac161f115a4c6799dfecd48966f770c06))
* issues with video upload in expo from attachment picker and component displayname ([d8d621d](https://github.com/GetStream/stream-chat-react-native/commit/d8d621d0754d0d7962791a8756142955b2d661d6))
* smart gallery rendering while optimistically adding a message to list ([748f36b](https://github.com/GetStream/stream-chat-react-native/commit/748f36b7db4ce69c8d39cad24d9588359b6346f3))

### [4.6.1](https://github.com/GetStream/stream-chat-react-native/compare/v4.6.0...v4.6.1) (2022-05-25)


### Bug Fixes

* hotfixes borderRadius ([1dd116d](https://github.com/GetStream/stream-chat-react-native/commit/1dd116de7d402a8b301438c88e996a28ba15970e))

## [4.6.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.5.0...v4.6.0) (2022-05-25)


### Features

* allow video upload from image picker ([6989c1d](https://github.com/GetStream/stream-chat-react-native/commit/6989c1d72133518687a5c94f2e44ee38f46efacd))


### Bug Fixes

* race condition when bottom sheet is closed during keyboard show ([994addf](https://github.com/GetStream/stream-chat-react-native/commit/994addf9e907f5ba78e81cd9fb46a93221a6070f))

## [4.5.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.4.0...v4.5.0) (2022-05-17)


### Features

* ability to add onPress handler for mentioned user names - [Documentation link](https://getstream.io/chat/docs/sdk/reactnative/core-components/channel/#onpressmessage) ([7894bf9](https://github.com/GetStream/stream-chat-react-native/commit/7894bf92eeb5a02cc0e5028f25f19486214f6306))
* add theming support for the chevron icon in scroll to bottom button ([2a4bc9a](https://github.com/GetStream/stream-chat-react-native/commit/2a4bc9a647595aff0ea2f3e57718219d0b60f7e2))


### Bug Fixes

* url without http/s opening issue ([46da678](https://github.com/GetStream/stream-chat-react-native/commit/46da6787423f751f7e1de02d1d865b1e5fe8a07a))

### [4.3.1](https://github.com/GetStream/stream-chat-react-native/compare/v4.3.0...v4.3.1) (2022-04-12)


### Bug Fixes

* fixes the broken giphy "shuffle" behaviour ([16f139a](https://github.com/GetStream/stream-chat-react-native/commit/16f139ab609304193d3d19488bd5227d0078e17d))
* typescript for "giphyVersion" prop on `OverlayProvider` component ([35c1c10](https://github.com/GetStream/stream-chat-react-native/commit/35c1c10889d30106002bcd0b7b2e55ca27fbcbcb))


### Reverts

* "feat: add appSettings to ChatContext" ([5d947a3](https://github.com/GetStream/stream-chat-react-native/commit/5d947a30222ef99c50d6568cff4f8770bf16a237))

## [4.3.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.2.0...v4.3.0) (2022-04-04)


### Features

* add isAttachmentEqual props around memoization of custom properties [CRNS - 290] ([cd51ee8](https://github.com/GetStream/stream-chat-react-native/commit/cd51ee89ab959cd3e38bbdbd5e949bc401b40ec4))
* editing state header, reply state header and giphy input customization [CRNS - 535] ([4c1d67d](https://github.com/GetStream/stream-chat-react-native/commit/4c1d67d9a4e45050a45a402a53c2cf9b6fbc39b8))
* open giphy in image viewer when pressed [CRNS - 540] ([3cc2e93](https://github.com/GetStream/stream-chat-react-native/commit/3cc2e939bb4f935e245e46006d4fb607f4cde47c))


### Bug Fixes

* handling the case of undefined updated_at on message ([bad1f45](https://github.com/GetStream/stream-chat-react-native/commit/bad1f45d1d6466532d8b5cbc4d2806221b639f03))
* issues with opening old Giphy on ImageGallery ([7f21b6c](https://github.com/GetStream/stream-chat-react-native/commit/7f21b6c5c98dca210d8b77030c4442c644bb86a1))
* re-render ownCapabilitiesContext when channel capabilities are u… ([9bbf25e](https://github.com/GetStream/stream-chat-react-native/commit/9bbf25e9237c1a0bf770bd194b67e0737046def8))

## [4.2.0](https://github.com/GetStream/stream-chat-react-native/compare/v4.1.4...v4.2.0) (2022-03-17)


### Features

* add giphy size customisation [CRNS-514] ([90c87da](https://github.com/GetStream/stream-chat-react-native/commit/90c87da095bd6f243613853091f11a9b6564632e))
* update core to rn 0.67 [CRNS-539] ([46e9b37](https://github.com/GetStream/stream-chat-react-native/commit/46e9b3761021c0f6ddbe03f5afb81e3426877625))
* upgrade react native gesture handler version to 2.3.1 ([f9eba70](https://github.com/GetStream/stream-chat-react-native/commit/f9eba70d5f961f2aed7f52eeb458b4ea6f18678e))


### Bug Fixes

* show background for Giphy on long press ([459a595](https://github.com/GetStream/stream-chat-react-native/commit/459a59522c7acb9d20b5e78809efc31084201257))

### [4.1.4](https://github.com/GetStream/stream-chat-react-native/compare/v4.1.3...v4.1.4) (2022-03-13)


### Bug Fixes

* overrideOwnCapabilities typescript issue ([a8010ef](https://github.com/GetStream/stream-chat-react-native/commit/a8010efe6d841d447c32bf7f1fe0e3ecab2761c3))

### [4.1.3](https://github.com/GetStream/stream-chat-react-native/compare/v4.1.2...v4.1.3) (2022-03-10)


### Bug Fixes

* add missing own_capabilities field after channel.updated event [CRNS-537] ([0a27963](https://github.com/GetStream/stream-chat-react-native/commit/0a279637dbf0cc4474b0ffc3052f6df6cdbfacf1))
* cleanup of keyboard listeners ([7f4d6f2](https://github.com/GetStream/stream-chat-react-native/commit/7f4d6f27e061c66a8f6631a3840a7a911650c423))
* pull to refresh functionality [CRNS-536] ([df6e6df](https://github.com/GetStream/stream-chat-react-native/commit/df6e6df3b70a6c9f986723b9328c8a99def67511))

### [4.1.2](https://github.com/GetStream/stream-chat-react-native/compare/v4.1.1...v4.1.2) (2022-03-07)


### Bug Fixes

* export ownCapabilitiesContext from SDK ([e0a9f75](https://github.com/GetStream/stream-chat-react-native/commit/e0a9f757e431bd29310e8bfc16f4abf5fdca0ae2))

### [4.1.1](https://github.com/GetStream/stream-chat-react-native/compare/v4.1.0...v4.1.1) (2022-03-03)


### Bug Fixes

* image gallery cleanup and fixing race condition ([4c53f33](https://github.com/GetStream/stream-chat-react-native/commit/4c53f3374a7ebe7e42f61473480acd7642de489d))
* mark channel as read when messages length is less than visible screen ([2dd87b3](https://github.com/GetStream/stream-chat-react-native/commit/2dd87b340d4d5d66911c9306b58d8307e089ed33))

### [3.10.2](https://github.com/GetStream/stream-chat-react-native/compare/v3.10.1...v3.10.2) (2021-11-23)


### Bug Fixes

* 'Block User' message action ([9959955](https://github.com/GetStream/stream-chat-react-native/commit/9959955fd665b708172d27fc0bbeb4cee4d104eb))

### [3.10.1](https://github.com/GetStream/stream-chat-react-native/compare/v3.10.0...v3.10.1) (2021-11-15)


### Bug Fixes

* render attachment type video in FileAttachment view [CRNS-480] ([1649ee3](https://github.com/GetStream/stream-chat-react-native/commit/1649ee3bee43b3062ed1998d7683025429aad5a9))

## [3.10.0](https://github.com/GetStream/stream-chat-react-native/compare/v3.9.2...v3.10.0) (2021-11-11)


### Features

* added support for channelListSkeleton.maskFillColor theme property [CRNS-471] ([e20e6c7](https://github.com/GetStream/stream-chat-react-native/commit/e20e6c7d3bbc34e9e9ce8f5c912236005c1e9aed))

### [3.9.2](https://github.com/GetStream/stream-chat-react-native/compare/v3.9.1...v3.9.2) (2021-11-02)


### Bug Fixes

* handling the errors when channel which is open gets deleted [CRNS-468] ([2598091](https://github.com/GetStream/stream-chat-react-native/commit/25980911841c8dc213a0b799036eca6e3638d588))
* update message text when theme changes [CRNS-467] ([17ad925](https://github.com/GetStream/stream-chat-react-native/commit/17ad92519e328b0453f1c1d760ed5b3883978c71))

### [3.9.1](https://github.com/GetStream/stream-chat-react-native/compare/v3.9.0...v3.9.1) (2021-10-22)


### Bug Fixes

* fixed react warnings - Can not perform a React state update on an unmounted component [CRNS-444] ([6240948](https://github.com/GetStream/stream-chat-react-native/commit/6240948d731ea8a6d98c3aa9c8896344392d1a40))

## [3.9.0](https://github.com/GetStream/stream-chat-react-native/compare/v3.8.3...v3.9.0) (2021-10-12)


### Features

* added 'stateUpdateThrottleInterval' prop on Channel component ([ce471fc](https://github.com/GetStream/stream-chat-react-native/commit/ce471fcf14fcedbb307fdc7fb9d3adbc6c7fab19))
* added a support for prop 'newMessageStateUpdateThrottleInterval' ([04b0b83](https://github.com/GetStream/stream-chat-react-native/commit/04b0b83ac5e6876f054400c8eed7dac121c47f2d))
* added support for 'enableMessageGroupingByUser' prop ([e704519](https://github.com/GetStream/stream-chat-react-native/commit/e704519c8755ac65908f83864f0bf7ca2cbba123))
* added support for 'hideStickyDateHeader' prop ([969575e](https://github.com/GetStream/stream-chat-react-native/commit/969575e00e78775648890d7b1daffb8d5592eb45))
* added support for prop 'legacyImageViewerSwipeBehaviour' ([95d15e0](https://github.com/GetStream/stream-chat-react-native/commit/95d15e08f9d6f43f1d9e314fc200d60e1ce04413))


### Bug Fixes

* avoid unnecessary gallery image re-rendering upon message update ([198c437](https://github.com/GetStream/stream-chat-react-native/commit/198c437dafd1d531f7c9cd537bfaebaa46406f52))
* fixed AppState subscription logic to support RN 0.65 ([8a1ec82](https://github.com/GetStream/stream-chat-react-native/commit/8a1ec82b306542d931056932defaea779af61c57))
* fixed markRead() logic when Channel is mounted ([53e495e](https://github.com/GetStream/stream-chat-react-native/commit/53e495e9fd1d7d2a1becd5fc65b2e100632f9fd4))
* fixed offset-limit logic for channel list pagination ([cd77227](https://github.com/GetStream/stream-chat-react-native/commit/cd77227fb321d67617c00f86d78e972f00418fc9))
* fixed UX of removing of failed attachment ([ef91d30](https://github.com/GetStream/stream-chat-react-native/commit/ef91d3065e67758aea6030658e8e465c129577cc))
* fixing deprecated warning around AppState for RN 0.65 compatibility ([08679d5](https://github.com/GetStream/stream-chat-react-native/commit/08679d593064c80a252adb86c1376dbc2edb2dc8))
* issue with autocomplete suggestions for channel with more than 100 members ([f91b4be](https://github.com/GetStream/stream-chat-react-native/commit/f91b4befbf359c8ce07feae6c0b18848784d62b7))
* **Channel:** Copy channel state on leading edge of throttling ([56a47d4](https://github.com/GetStream/stream-chat-react-native/commit/56a47d4f3fa5e67ef84f9ed5d000edc595e03145))

### [3.8.3](https://github.com/GetStream/stream-chat-react-native/compare/v3.8.2...v3.8.3) (2021-09-16)


### Bug Fixes

* type definition directory structure ([9a4d2c3](https://github.com/GetStream/stream-chat-react-native/commit/9a4d2c30fef18222f25396e7453686d503a69462))

### [3.8.2](https://github.com/GetStream/stream-chat-react-native/compare/v3.8.1...v3.8.2) (2021-09-14)


### Bug Fixes

* fixed markdown issues with lists ([e40777a](https://github.com/GetStream/stream-chat-react-native/commit/e40777a7dedeb8f89ba8f03e295d06b9c7df610f))

### [3.8.1](https://github.com/GetStream/stream-chat-react-native/compare/v3.8.0...v3.8.1) (2021-09-13)


### Bug Fixes

* allow images attached through file picker to display in gallery view ([afd84a9](https://github.com/GetStream/stream-chat-react-native/commit/afd84a9d7536f2e47ce1e7888ca29c46a9f81e32))
* delegate content type detection to backend for image/file uploads ([8de7d8d](https://github.com/GetStream/stream-chat-react-native/commit/8de7d8d22a3e6152185db3f86ce705af904e75c6))
* share photo functionality ([41231a0](https://github.com/GetStream/stream-chat-react-native/commit/41231a0eee5e74a7063bdc6f901862c028e55880))

## [3.8.0](https://github.com/GetStream/stream-chat-react-native/compare/v3.7.3...v3.8.0) (2021-08-30)


### Features

* added support for japanese and korean language ([5708201](https://github.com/GetStream/stream-chat-react-native/commit/5708201c43b7e12c4cb96879527ccd59026b73a8))
* added support for props - `autoCompleteSuggestionsLimit`, `mentionAllAppUsersEnabled` and `mentionAllAppUsersQuery` on Channel component ([ff15650](https://github.com/GetStream/stream-chat-react-native/commit/ff1565085182516fb02c8699c198332b71a2cc35))

## [4.0.0](https://github.com/GetStream/stream-chat-react-native/compare/v3.7.3...v4.0.0) (2021-08-22)


### ⚠ BREAKING CHANGES

* Parent channels rendering threads should add a threadList prop if thread is active

### Features

* added support for props - `autoCompleteSuggestionsLimit`, `mentionAllAppUsersEnabled` and `mentionAllAppUsersQuery` on Channel component ([ff15650](https://github.com/GetStream/stream-chat-react-native/commit/ff1565085182516fb02c8699c198332b71a2cc35))


### Bug Fixes

* **concurrency:** Channels concurrency general improvements ([bfb9f66](https://github.com/GetStream/stream-chat-react-native/commit/bfb9f66f309bbfaf6b96e9b0afbfca6601cf1143))
* Channel concurrency fixes ([eab95f0](https://github.com/GetStream/stream-chat-react-native/commit/eab95f0be97226793f9bc8bc2bc2ad4cfe2c93aa))
* move channel states to parent level & filter out active channels on channel list refresh ([7c7b714](https://github.com/GetStream/stream-chat-react-native/commit/7c7b71426fd3bacf029f1af68dc894fc01e7348d))

### [3.7.3](https://github.com/GetStream/stream-chat-react-native/compare/v3.7.2...v3.7.3) (2021-08-20)


### Bug Fixes

* Hotfix for peer deps collision ([83cf002](https://github.com/GetStream/stream-chat-react-native/commit/83cf002a86c3ccd683b2ad7440388f8e781baa11))

### [3.7.2](https://github.com/GetStream/stream-chat-react-native/compare/v3.7.1...v3.7.2) (2021-08-04)


### Bug Fixes

* **attachment-picker:** fixing sync logic between `imageUploads` and `selectedImages` ([46de905](https://github.com/GetStream/stream-chat-react-native/commit/46de9055b1df3e0a9cedbe2018628f7025f5cb27))
* Fix infinite loop in bottom sheet or image gallery on notched iOS phones ([1bc81f0](https://github.com/GetStream/stream-chat-react-native/commit/1bc81f0aabedbd42d70624d4b3a13abe2e77d826))

### [3.7.1](https://github.com/GetStream/stream-chat-react-native/compare/v3.7.0...v3.7.1) (2021-07-30)


### Bug Fixes

* Fix giphy and attachment icon hiding issue ([1b1f8fe](https://github.com/GetStream/stream-chat-react-native/commit/1b1f8fef5a263a735922cd2dc2057b384676866c))

## [3.7.0](https://github.com/GetStream/stream-chat-react-native/compare/v3.6.7...v3.7.0) (2021-07-29)


### Features

* added mutesEnabled prop on Channel component, to toggle  "Mute User" action ([b5c1f38](https://github.com/GetStream/stream-chat-react-native/commit/b5c1f38cf5a4510283a2ff30c2884eaf73662577))
* Allow images and attachments on the same message ([9a36352](https://github.com/GetStream/stream-chat-react-native/commit/9a36352cd34c36b0dcf0552fe5dc50c5ebc9f513))


### Bug Fixes

* Fix messages disappearing on reconnect ([dc0fc3d](https://github.com/GetStream/stream-chat-react-native/commit/dc0fc3d21cbb38d3442f8f94d30bd1f795fb2ba8))
* Fix quoted images/attachments ([2bb1f14](https://github.com/GetStream/stream-chat-react-native/commit/2bb1f14ce60d7455c4ff7272440965be0a7e32c8))


### [3.6.7](https://github.com/GetStream/stream-chat-react-native/compare/v3.6.6...v3.6.7) (2021-07-20)


### Bug Fixes

* Clean user's typing state when app goes to background ([d4b9f3e](https://github.com/GetStream/stream-chat-react-native/commit/d4b9f3e1b18af62b02620f68eb341624ebcfa5d3))


### [3.6.6](https://github.com/GetStream/stream-chat-react-native/compare/v3.6.5...v3.6.6) (2021-07-19)


### Bug Fixes

* Fix missing translations for message deleted ([7e7f653](https://github.com/GetStream/stream-chat-react-native/commit/7e7f6533904510fa0f02a22f5c7b45d4171cdefc))


### [3.6.5](https://github.com/GetStream/stream-chat-react-native/compare/v3.6.4...v3.6.5) (2021-07-15)


### Bug Fixes

* **reactions:** Fix overflowing reactions list and double scroll on Android ([04dbc9b](https://github.com/GetStream/stream-chat-react-native/commit/04dbc9bf3e0f334215b6bac3221a8963951e97e2))



## [3.6.4](https://github.com/GetStream/stream-chat-react-native/compare/stream-chat-react-native-core@3.6.3...stream-chat-react-native-core@3.6.4) (2021-07-13)

**Note:** Version bump only for package stream-chat-react-native-core





## [3.6.3](https://github.com/GetStream/stream-chat-react-native/compare/stream-chat-react-native-core@3.6.2...stream-chat-react-native-core@3.6.3) (2021-07-13)

**Note:** Version bump only for package stream-chat-react-native-core





## 3.6.2 (2021-07-13)


### Bug Fixes

* **android:** use react native FlatList instead of RNGH's on ChannelListMessenger ([1267f64](https://github.com/GetStream/stream-chat-react-native/commit/1267f64d2f003477e12edbb8b1e833872416510d))





## 3.6.2-rc.0 (2021-07-13)


### Bug Fixes

* **android:** use react native FlatList instead of RNGH's on ChannelListMessenger ([1267f64](https://github.com/GetStream/stream-chat-react-native/commit/1267f64d2f003477e12edbb8b1e833872416510d))





## [3.6.1] (2021-07-07)

- Fixed problem where it wasn't possible to clear giphy messages inside of a thread [6d8977d](https://github.com/GetStream/stream-chat-react-native/commit/6d8977d43e804db95c44d95b7a546f6534d0f5c7)

## [3.6.0] (2021-06-22)

This release provides full support for Expo 41 and React Native 0.64

Please make sure to upgrade following packages to specified versions:

- `react-native-reanimated@2.1.0`
- `react-native-share@6.0.1`

## [3.5.0] (2021-05-28)

###  **🛑 BREAKING**

Following props have been renamed:

- `reply` -> `quotedReply`
- `handleReply` -> `handleQuotedReply`
- `handleReplyMessage` -> `handleQuotedReplyMessage`
### Features

- Added new props to Channel component [219b307](https://github.com/GetStream/stream-chat-react-native/commit/219b307e3d2db36a6974e4870dc0eb00213bcca2)

  - maxMessageLength (number)
  - reactionsEnabled (boolean)
  - readEventsEnabled (boolean)
  - repliesEnabled (boolean)
  - typingEventsEnabled (boolean)
  - uploadsEnabled (boolean)
  - quoteRepliesEnabled (boolean)
  - threadRepliesEnabled (boolean)

### Bug fixes
- Update messages when mute status updates [885f8c2](https://github.com/GetStream/stream-chat-react-native/commit/885f8c20306ef46eb6ad20cd2942618acf967741)
- Fixed broken "Resend message" functionality for failed messages [359c192](https://github.com/GetStream/stream-chat-react-native/commit/359c192903b3e34836ffadcca55f2a4e0a7fc509)
- Fixed read receipts [f7510e8](https://github.com/GetStream/stream-chat-react-native/commit/f7510e8134ad14fbfa1d920e68267d3080d2b1ba)
- Fixed images as attachment from File Picker [5ca1a25](https://github.com/GetStream/stream-chat-react-native/commit/5ca1a250a9d1c75c86e9c89dda1c116dd77bb1b3)

## [3.4.0] (2021-05-14)

### Features
- Updated implementation around network recovery for smooth UX [#658](https://github.com/GetStream/stream-chat-react-native/pull/658)
- Added support for `MessageDeleted` prop on Channel component, for overriding default deleted message component [65861d9](https://github.com/GetStream/stream-chat-react-native/commit/65861d9a52e8d289d6e66bbc63d2814aa6f87c9e)
- Refresh channel list when `sort` prop updates, on ChannelList [42450fa](https://github.com/GetStream/stream-chat-react-native/commit/42450fa23d6221931b0b14d5f39fba2484b7dadf)
- Added support for typing indicator in threads [6f518ca](https://github.com/GetStream/stream-chat-react-native/commit/6f518ca1879943edaa6606209c2f63672df1dd75)
- Added handler for `channel.visible` event [476c36e](https://github.com/GetStream/stream-chat-react-native/commit/476c36e30eb41ca5843c0f679c18880e46d7564e)

### Bug fixes

- Added default sizes to Icons in `OverlayReactionList` component. [6b4db5f](https://github.com/GetStream/stream-chat-react-native/commit/6b4db5fd1ad4816506a2f567409201374d6d3f3c)
- Miscellaneous fixes around image picker opening and closing [950f746](https://github.com/GetStream/stream-chat-react-native/commit/950f746412422cdb2fb6b358a24a3bc694a9032a) [4845e4e](https://github.com/GetStream/stream-chat-react-native/commit/4845e4e08e6725b612f17360d1fe031c0acf6578)

##  [3.3.2] (2021-04-13)

- Allow re-rerendering of MessageInput component, on changes to `additionalTextInputProps` [1b95a64](https://github.com/GetStream/stream-chat-react-native/commit/1b95a64f15642829d2b4296615c2d8572065f213)
- Fixed Android camera permissions check [5b77516](https://github.com/GetStream/stream-chat-react-native/commit/5b775160b814c9d69fdb5f9879662c76064581af)

##  [3.3.1] (2021-04-09)

- Fixed `supportedReactions` prop support on `OverlayReactions` [#594](https://github.com/GetStream/stream-chat-react-native/pull/594/files)
- Fixed mentions autocomplete functionality for channels with > 100 members [e8c93d3](https://github.com/GetStream/stream-chat-react-native/commit/e8c93d39825ecf7e3fb01dc6da8a1096cef50bf3)
- Fixed theming issue on overlay for sent message (or my message) [7f11364](https://github.com/GetStream/stream-chat-react-native/commit/7f113649975620391dca1ff447e70ae89c08b5bb)
- Exporting following components and hooks from SDK
  - ChannelListLoadingIndicator
  - ChannelPreviewMessage
  - ChannelPreviewStatus
  - ChannelPreviewTitle
  - ChannelPreviewUnreadCount
  - InputButtons
  - useAppStateListener

##  [3.3.0] (2021-04-07)

### New Features 🎉

- Added inline date separators, which can be customized by adding your own UI component [#581](https://github.com/GetStream/stream-chat-react-native/pull/581/files)

  ```jsx
  <Channel
    InlineDateSeparator={({ date }) => { /** Your custom UI */ }}
    maxTimeBetweenGroupedMessages={40000} // number of ms, after which further messages will be considered part of new group.
  >
  ```

- Added ability to override default onLongPress, onPress, onPressIn and onDoubleTap handlers using following props on Channel component:

  - onLongPressMessage
  - onPressMessage
  - onPressInMessage
  - onDoubleTapMessage

  You will have access to payload of that handler as param:

  ```jsx
  <Channel
    ...
    onLongPressMessage={({
      actionHandlers: {
          deleteMessage, // () => Promise<void>;
          editMessage, // () => void;
          reply, // () => void;
          resendMessage, // () => Promise<void>;
          showMessageOverlay, // () => void;
          toggleBanUser, // () => Promise<void>;
          toggleMuteUser, // () => Promise<void>;
          toggleReaction, // (reactionType: string) => Promise<void>;
      },
      defaultHandler, // () => void
      event, // any event object corresponding to touchable feedback
      emitter, // which component trigged this touchable feedback e.g. card, fileAttachment, gallery, message ... etc
      message // message object on which longPress occurred
    }) => {
      /** Your custom action */
    }}
  />
  ```

###  **🛑 BREAKING**

- Following props are no longer accessible on `Input` component (which is used to customize underlying input box). They should be accessed from `MessageInputContext` (or corresponding hook - `useMessageInputContext`)

  - openAttachmentPicker
  - closeAttachmentPicker
  - toggleAttachmentPicker
  - openCommandsPicker
  - openMentionsPicker
  - openFilePicker

- Value `typing` (which is list of users who are typing), has been moved from `ChannelContext` to its own separate context - `TypingContext` [c450719](https://github.com/GetStream/stream-chat-react-native/commit/c4507194956360ae27731fc81fed1d7dc1ed1861)


### Fixes

- [#522](https://github.com/GetStream/stream-chat-react-native/issues/522) `initialValue` not being set for inputbox [63b3d79](https://github.com/GetStream/stream-chat-react-native/pull/572/commits/63b3d7995b30dccf23aece51cbc7479388890fd0)
- Fixed goToMessage functionality (when you press on quotedMessage) in MessageList [#580](https://github.com/GetStream/stream-chat-react-native/pull/580)
- Fixed image picker not loading when swapping from keyboard [a180ad4](https://github.com/GetStream/stream-chat-react-native/commit/a180ad43fb1766f0252467c4d6aec84ca7c9e26d)

##  [3.2.0] (2021-03-23)

###  **🛑 BREAKING**

- Minimum required `stream-chat` version is `3.5.1`.
- Following values have been moved from `MessagesContext` a separate context - `PaginatedMessageListContext`
  - hasMore
  - messages
  - loadMore
  - loadMoreRecent
  - loadMoreThread
  - loadingMore
  - loadingMoreRecent

### Non breaking:

#### Websocket and Push

From this release when app goes to background, websocket connection will be dropped by default.
This is necessary to allow push notifications.

We only send push notification, when user doesn't have any active websocket connection (which is established when you call `client.connectUser`). When your app goes to background, your device will keep the ws connection alive for around 15-20 seconds, and so within this period you won't receive any push notification. Until now, it was upto end user to drop the connection by explicitly calling `client.closeConnection()` or `client.wsConnection.disconnect()`, when app goes to background.
But from this release, we have moved this functionality to OOTB.

- If you don't have push system configured for your application, you can disable this functionality by adding a prop on Chat component - `closeConnectionOnBackground={false}`
- As described earlier, please make sure you are on `stream-chat >= 3.5.1`

#### Other

- Allow use of Channel component with uninitialized channel
- Allow custom config of i18next config
- UI fixes and animation improvements for reactions

## [3.1.2] (2021-03-17)

**NO CODE CHANGE**

Fixed version.json during package publishing, which we use to track the version of RN sdk through
`client.setUserAgent` call

## [3.1.1] (2021-03-17)

Fixed type definition pointers in package.json

- [Issue #560](https://github.com/GetStream/stream-chat-react-native/issues/560)

## [3.1.0] (2021-03-15)

- **🛑 BREAKING**: Removed a prop `handleOnPress` on `Input` component.
- Added support for new props on `Input` component, which can be used on Channel component as prop to replace undelying input component ([reference](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#how-to-change-the-layout-of-messageinput-component))
    - closeAttachmentPicker (function)
    - openAttachmentPicker (function)
    - openCommandsPicker (function)
    - toggleAttachmentPicker (function)

- Added support for new prop on `Channel` component - `InputButtons`, to replace the extra buttons on the left on input box [#536](https://github.com/GetStream/stream-chat-react-native/pull/536)

- Added support for `messageActions` prop as callback. Also added support for prop `messageActions` on Channel component [#548](https://github.com/GetStream/stream-chat-react-native/pull/548)
  Earlier you could override messageActions prop as following:

  ```jsx
  <Channel
    messageActions=[
      {
        action: () => { /** Some message action logic */ };
        title: "Pin Message";
        icon: PinIcon;
        titleStyle: {};
      },
      {
        action: () => { /** Some message action logic */ };
        title: "Delete Message";
        icon: PinIcon;
        titleStyle: {};
      }
    ]
  >
    {/** MessageList and MessageInput component here */}
  </Channel>
  ```

  But now, you can selectly keep certain action and remove some:

  ```jsx
  /** Lets say you only want to keep threadReply and copyMessage actions */
  <Channel
    messageActions={({
      blockUser,
      copyMessage,
      deleteMessage,
      editMessage,
      flagMessage,
      muteUser,
      reply,
      retry,
      threadReply,
    }) => ([
      threadReply, copyMessage
    ])}
  >
    {/** MessageList and MessageInput component here */}
  </Channel>
  ```

- Issue fix: make OverlayReactions customizable through props. [c7a83b8](https://github.com/GetStream/stream-chat-react-native/commit/c7a83b87804d9492ce01ef0dfa63fe9b6cc203ad)
- Issue fix: Image upload for expo and assets-library [5a2d0e8](https://github.com/GetStream/stream-chat-react-native/commit/5a2d0e827dd4a4067058787b49b07c584f3e370c)
- Issue fix: Compatibility with jest as described in [#508](https://github.com/GetStream/stream-chat-react-native/issues/508) [a172c15](https://github.com/GetStream/stream-chat-react-native/commit/a172c15b1304932051f0f699daf47981e488fde4)


## [3.0.0] (2021-02-23)

Version 3.x is a major revamp of the SDK and comes with **many breaking changes**. The new implementation takes advantage of React Context along with many popular community libraries such as Reanimated V2 to deliver a superior chat experience. **Upgrading will require re-implementing** your integration but will yield performance and functional benefits. It is highly recommended you read the Cookbook and examine the SampleApp / TypeScriptMessaging apps before upgrading to understand what is required.

### New features

  - Modern UX around reaction picker functionality, similar to iMessage
  - Inline replies
  - "Also send to channel" option on Threads
  - In app attachment picker
  - Improved avatars for grouped channels.
  - Rich image viewers with options to share the image outside the app, or view the image in gallery view.
  - "Copy Message" action as part of message actions.

### Improvements

- In previous versions, we did a lot of prop drilling throughout component trees, which makes it quite hard for end user to decide exactly where to set a particular prop. We have tried to centralize component customization on following three higher order components:

  - OverlayProvider
  - ChannelList
  - Channel

  We have prepared a visual guide to help you with component customizations - [Guide](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#custom-components)

- In v2.x.x, we decided to move away from class based components, towards functional components along with react hooks. React hooks are definitely a big addition to react eco-system, but when not careful it has potential to hammer the performance. We have handled all these issues as part of v3.0.0 using careful revamp around all the contexts and memoizations, which improves the app performance by a great margin.

- We have decided to abondon styled-components, are decided to have our own implementation

  - Removed dot notation for theming applications
  - Removed css string notation for styles on theme
  - Added displayName to components with bracket notation denoting the theme path e.g. `MessageStatus.displayName = 'MessageStatus{message{status}}';` indicates the theme path would be modified via `const customTheme: DeepPartial<Theme> = { message: { status: { ...customizations } } }`. Please check our [theme docs](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#theme) for more details.

### Dependency changes:

- Added peer dependencies for:
  - BlurView using one of these
    - Expo: [expo-blur](https://docs.expo.io/versions/latest/sdk/blur-view/#installation)
    - React Native: [@react-native-community/blur](https://github.com/Kureev/react-native-blur#installation)
  - Image Compression using one of these
    - Expo: [expo-image-manipulator](https://docs.expo.io/versions/latest/sdk/imagemanipulator/#installation)
    - React Native: [react-native-image-resizer](https://github.com/bamlab/react-native-image-resizer#setup)
  - FileSystem using one of these
    - Expo: [expo-file-system](https://docs.expo.io/versions/latest/sdk/filesystem/#installation)
    - React Native: [react-native-fs](https://github.com/itinance/react-native-fs/)
  - Share using one of these
    - Expo [expo-sharing](https://docs.expo.io/versions/latest/sdk/sharing/#installation)
    - React Native: [react-native-share](https://github.com/react-native-share/react-native-share#getting-started)
  - Image Picking using one of these
    - Expo [expo-media-library](https://docs.expo.io/versions/latest/sdk/media-library/#installation)
    - React Native: [react-native-cameraroll](https://github.com/react-native-cameraroll/react-native-cameraroll#getting-started)
  - [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/#installation)
  - [react-native-reanimated v2](https://docs.swmansion.com/react-native-reanimated/docs/installation)
  - [react-native-svg](https://github.com/react-native-svg/react-native-svg#installation)

- Removed peer dependencies for:
  - [react-native-get-random-values](https://github.com/LinusU/react-native-get-random-values)

- Removed seamless-immutable
- Removed styled-components:

Please find detailed docs about this release in our [wiki](https://github.com/GetStream/stream-chat-react-native/wiki#v300)


### Note for Expo

- As of this release, expo is on version 40 which uses a version of React Native with a bug in the Dimensions API that occurs upon reloading an app in the simulator. Version 3.x uses relative sizing widely and depends on this API so issues will be visible in Expo until they update the custom React Native version they ship.

- [Android] As part of this release, we implemented a new feature - inline replies, similar to whatsapp. Bi-directional scrolling/pagination was necessary for this feature. To keep smooth scrolling experience, we implemented our [own solution](https://github.com/GetStream/flat-list-mvcp#maintainvisiblecontentposition-prop-support-for-android-react-native) for react-native. Although, Expo being close-source project, we can't do any such thing for Expo. So inline reply feature is not recommended to use in Expo, since you will not have a good scroll experience on Android, while scrolling down in message list.


## [2.2.2] 2021-02-07

Handling the case of standlone Channel component (without ChannelList) on top of fix in [v2.2.1](https://github.com/GetStream/stream-chat-react-native/releases/tag/v2.2.1) - [ba7d744](https://github.com/GetStream/stream-chat-react-native/commit/ba7d744dcdf76e16bcee29a9daa6f8879ef0ec79)

## [2.2.1] 2021-02-03

For push notifications, we usually recommend users to disconnect websocket when app goes to background and reconnect when app comes to foreground. But channel list UI doesn't update properly once the ws is re-connected. This issue has been fixed in this commit [8a35e50](https://github.com/GetStream/stream-chat-react-native/commit/8a35e505fadb059b0a3b48fdc33a3a72021bd158)

## [2.2.0] 2021-02-02

- Switched to `react-native-markdown-package` for markdown of message text [#505](https://github.com/GetStream/stream-chat-react-native/pull/505/files)

## [2.1.4] 2021-01-29

Fixed broken re-send message functionality, upon failure [b3c028f](https://github.com/GetStream/stream-chat-react-native/commit/b3c028f7bb91d00286717564764cb0fcf42b75b3)

## [2.1.3] 2021-01-26

- Fix markdown on message
  - fixes [#498](https://github.com/GetStream/stream-chat-react-native/issues/498)
  - commit [d4713aa](https://github.com/GetStream/stream-chat-react-native/commit/d4713aa32515df8c4726860508661645ade13598)
- Fixes issue with un-necessary queryChannels api call, when filters are provided as inline object [9f4528b](https://github.com/GetStream/stream-chat-react-native/commit/9f4528b0035cbcc5898f5da88109e703413b2f4f)
## [2.1.2] 2021-01-09

- Fixed infinite re-rendering issue on mentions suggestion box [5fd521a](https://github.com/GetStream/stream-chat-react-native/commit/5fd521a075170004fe551dd3ffbac111256274fe)

## [2.1.1] 2020-12-21

- Fixed broken mentions autocomplete feature for channels with more than 100 members. #457
- Added a new prop autocompleteSuggestionsLimit on MessageInput - Max number of suggestions to display in list. Defaults to 10.

## [2.1.0] 2020-12-07

### Dependency changes
- Bumping dependency to stream-chat@2.9.0

### Fixes
- Fixed plenty of issues around reload/refresh of channellist upon failures.
- Fixing retry message functionality [7a423f7](https://github.com/GetStream/stream-chat-react-native/commit/7a423f7c059336f770fd107ff8cc6f2bd6e4a939)

### New Props:
- MessageList component
  - MessageNotification [5b5c2ac](https://github.com/GetStream/stream-chat-react-native/commit/5b5c2ac1a021018834696b57c4dfb030635c9cb8)
  - onListScroll [5b5c2ac](https://github.com/GetStream/stream-chat-react-native/commit/5b5c2ac1a021018834696b57c4dfb030635c9cb8)
  - FooterComponent [d803bab](https://github.com/GetStream/stream-chat-react-native/commit/d803bab3d25a4e34bb8192e06fd41db5bfd07ea7)
  - inverted [d803bab](https://github.com/GetStream/stream-chat-react-native/commit/d803bab3d25a4e34bb8192e06fd41db5bfd07ea7)
  - NetworkDownIndicator [e09b9fc](https://github.com/GetStream/stream-chat-react-native/commit/e09b9fc93fb5064efe16b1c6c7572116d8f2ee69)

## [2.0.2] 2020-11-16

- Fixing issue - when you cancel 'edit message' flow, input box attachments don't get cleared [425db22](https://github.com/GetStream/stream-chat-react-native/commit/425db22cc1ad51be651e61e64af92128763f51ca)

- Adding reload behaviour on error indicator on messagelist [6047671](https://github.com/GetStream/stream-chat-react-native/commit/604767192daeb1c621b3763d4a56be95688bff12)

## [2.0.1] 2020-11-16

- Fixed issue - When you edit a message which has image attachments, images disappear from message - [68c0acb](https://github.com/GetStream/stream-chat-react-native/commit/68c0acbbb66e2f116db84be503054c8d2046778f)
- Fixed maxFiles value on image picker and file picker taking into account already selected number of attachments - [176f675](https://github.com/GetStream/stream-chat-react-native/commit/176f6751d2240cd502d1d84b91fa07b849c943ea)

## [2.0.0] 2020-10-29

Please check [Upgrade Docs](https://github.com/GetStream/stream-chat-react-native/wiki/Upgrade-helper#upgrade-from-0xx-to-2xx) for upgrading from 0.x.x to 2.x.x

**BREAKING CHANGES**

- You will need to install https://github.com/LinusU/react-native-get-random-values and add this line `import 'react-native-get-random-values';` to your `index.js`
- Expo 39 is now the lowest supported version

### Typescript

This library has been moved to full typescript. Please check [Typescript doc](https://github.com/GetStream/stream-chat-react-native/wiki/Typescript-support) for details

### Component prop changes

*Channel*
- add `additionalKeyboardAvoidingViewProps` prop to allow custom keyboard props

*ChannelListMessenger*
- remove `setActiveChannel` prop

*ChannelPreviewMessenger*
- renamed the `latestMessage` prop to `latestMessagePreview`. This name change is more semantic to what the prop does and reduces confusion with the `lastMessage` prop

*MessageContent*
- removed `retrySendMessage` prop in favor of `retrySendMessage` within `MessagesContext`

*MessageInput*
- remove `parent` prop to `parent_id` as it needs to be just an id string instead of the entire parent object
- add `setInputRef` prop to actually allow forwarding of the TextInput ref controls

*MessageSystem*
- add `formatDate` prop to allow custom date formatting

*ChannelContext*

- We have split the `ChannelContext` into three separate contexts to further modularize the code and reduce renders as items in context change. The following contexts now contain the following values, previously all held within the `ChannelContext`:

  - `ChannelContext`:

    - `channel`
    - `disabled`
    - `EmptyStateIndicator`
    - `error`
    - `eventHistory`
    - `lastRead`
    - `loading`
    - `LoadingIndicator`
    - `markRead`
    - `members`
    - `read`
    - `setLastRead`
    - `typing`
    - `watcherCount`
    - `watchers`

  - `MessagesContext`

    - `Attachment`
    - `clearEditingState`
    - `editing`
    - `editMessage`
    - `emojiData`
    - `hasMore`
    - `loadingMore`
    - `loadMore`
    - `Message`
    - `messages`
    - `removeMessage`
    - `retrySendMessage`
    - `sendMessage`
    - `setEditingState`
    - `updateMessage`

  - `ThreadContext`

    - `closeThread`
    - `loadMoreThread`
    - `openThread`
    - `thread`
    - `threadHasMore`
    - `threadLoadingMore`
    - `threadMessages`

- All contexts are exported and any values can be accessed through a higher order component (ex: `withMessagesContext`) or with one of our custom context hooks (ex: access `MessagesContext` by `const { messages } = useMessagesContext();`).

## [1.3.5] 2020-10-27

- Fixing [keyboard issue](https://github.com/GetStream/stream-chat-react-native/issues/397) during app state change [a8aa4ed](https://github.com/GetStream/stream-chat-react-native/commit/a8aa4edebd723120ea41d88b2f9d45df5a75f848)

## [1.3.4] 2020-10-13

- Fixing keyboard glitch functionality for android [a7f94b9](https://github.com/GetStream/stream-chat-react-native/commit/a7f94b93a12c997055a706316902aafbd256f29b)

## [1.3.3] 2020-10-05

- Fixing retry upload functionality [e89b87f](https://github.com/GetStream/stream-chat-react-native/commit/e89b87fb6b519d5433717d14ba12591236459586)

## [1.3.2] 2020-10-02

- SuggestionsList (for user-mentions feature in MessageInput) doesn't update the position as per keyboard position. For the time being, we have fixed this by dismissing the suggestions list when keyboard gets dismissed  - [0fdff4f](https://github.com/GetStream/stream-chat-react-native/commit/0fdff4f327908d4b554b8d4172028e666df65242)

- Exported IconBadge and IconSquare components, to fix the tutorial [f1b6a39](https://github.com/GetStream/stream-chat-react-native/commit/f1b6a393930e7fcd1571d7d80b56937154454b47)

- Added file size to file attachment [7e653a4](https://github.com/GetStream/stream-chat-react-native/commit/7e653a4a302ba24e5f9b664d2fccba778084ed0b)

## [1.3.1] 2020-09-29

**No changes**

## [1.3.0] 2020-09-25

**BREAKING CHANGES**

## MessageInput

- Replaced the default image picker [react-native-image-picker](https://github.com/react-native-community/react-native-image-picker) for [react-native-image-crop-picker](https://github.com/ivpusic/react-native-image-crop-picker) and added `compressImageQuality` prop to support image compression out-of-the-box
- Added `FileUploadPreview` and `ImageUploadPreview` props to support custom overrides to those components

## KeyboardCompatibleView and Channel component

Implementation of internal KeyboardCompatibleView has been changed so as to make animations smoother and fix existing issues with keyboard behavior.
Support for following props have been dropped from Channel and KeyboardCompatibleView

- keyboardDismissAnimationDuration
- keyboardOpenAnimationDuration

Following new props have been introduced on `Channel` component. They are the same props accepted by KeyboardAvoidingView of react-native.

- keyboardBehavior ['height' | 'position' | 'padding']
- keyboardVerticalOffset


## ChannelList

- We converted the ChannelList component from a class to a function and abstracted the event listener logic into custom hooks. The default event handlers can still be overridden by providing custom prop functions to the ChannelList component. Custom logic can be provided for the following events:

  - `onAddedToChannel` overrides `notification.added_to_channel` default
  - `onChannelDeleted` overrides `channel.deleted` default
  - `onChannelHidden` overrides `channel.hidden` default
  - `onChannelTruncated` overrides `channel.truncated` default
  - `onChannelUpdated` overrides `channel.updated` default
  - `onMessageNew` overrides `notification.message_new` default
  - `onRemovedFromChannel` overrides `notification.removed_from_channel` default

- All custom event handlers now accept two arguments, with the `this` reference no longer needed in the functional component.

  - 1st argument: `setChannels` reference to the `useState` hook that sets the `channels` in the React Native FlatList
  - 2nd argument: `event` object returned by the StreamChat instance

e.g.,

```js
// In following example we will override the default handler for notification.added_to_channel
<ChannelList
  filters={}
  onAddedToChannel={(setChannels, event) => {
    setChannels(channels => {
      // Do additional actions on channels array.
      return channels;
    })
  }}
>
```
- On upgrading to this release, ensure events and any custom handling functions (ex: `onAddedToChannel` or `onMessageNew`) are properly processed and update the list UI as expected.

## FileUploadPreview

- We fixed a bug for being unable to remove a file from the `MessageInput` and made it consistent to `ImageUploadPreview`
- We have removed support for the `fileUploadPreview.dismissText` theme value
- We have added support for `fileUploadPreview.dismiss`, `fileUploadPreview.dismissImage`, and `fileUploadPreview.imageContainer` theme values

## MessageInput

- We replaced the default image picker [react-native-image-picker](https://github.com/react-native-community/react-native-image-picker) for [react-native-image-crop-picker](https://github.com/ivpusic/react-native-image-crop-picker) and added `compressImageQuality` prop to support image compression out-of-the-box
- Added `FileUploadPreview` and `ImageUploadPreview` props to support custom overrides to those components

## MessageSystem

- Added `formatDate` prop to support custom date formatting

## Deprecated Props

- We have removed support for the `MessageList` component's `onMessageTouch` prop. Please use the `onPress` prop on the `MessageSimple` component to perform an action on touch of a message.

- We have removed support for the `Message` component's `readOnly` prop. Please use the `disabled` value from the `ChannelContext` instead.

- We renamed the `latestMessage` prop on the `ChannelPreviewMessenger` component to `latestMessagePreview`. This name change is more semantic to what the prop does and reduces confusion with the `lastMessage` prop.

- We have also dropped support for the following `MessageList` props:
  - `dateSeparator` (use DateSeparator instead)
  - `headerComponent` (use HeaderComponent instead)

## this Reference Removal

- We have removed the `this` class component reference from the prop functions in `MessageSimple`. For example, if you wish to override the SDK's standard long press behavior on a message, the `onLongPress` function passed in to `MessageSimple` no longer takes the `this` component reference as it's first argument. The message and the event object become the first and second arguments, respectively.

## renderText Function

- The `renderText` function utilized in the `MessageTextContainer` component now accepts a single object containing `markdownRules`, `markdownStyles`, and `message`. Previously each value was a separate function parameter.

## [1.2.0] 2020-08-21

**NO BREAKING CHANGES**

- Following components have been converted to functional component from class based component.

  - Chat
  - KeyboardCompatibleView
  - SuggestionsProvider
  - AutoCompleteInput
  - Spinner

- So far we exported bundled/transpiled version of components from package as single file - dist/index.js, dist/index.es using rollup. But now we are moving away from this approach and instead distributing original source of components since react-native handles bundling/transpiling part anyways. This also makes it easy for end-users to debug components exported from stream-chat-react-native.

## [1.1.1] 2020-08-03

- Fixed [#270](https://github.com/GetStream/stream-chat-react-native/issues/270) - [8ec70bd](https://github.com/GetStream/stream-chat-react-native/pull/273/commits/8ec70bdd2bae4f03c595466ba60d247c44f4c474)

- Upgraded `@testing-library/react-native` to v7 [4c687b4](https://github.com/GetStream/stream-chat-react-native/commit/4c687b48d689abb97ba00228224169d70c245076)

## [1.1.0] 2020-07-31

- Fixed exports of MessageStatus, MessageContent, MessageAvatar, MessageTextContainer components [#268](https://github.com/GetStream/stream-chat-react-native/pull/268)

- Moving following components to functional components

  - ChannelPreview
  - ChannelPreviewMessenger
  - Attachment
  - Card
  - FileAttachment
  - EmptyStateIndicator, LoadingIndicator, LoadingErrorIndicator

- Decoupled actionsheet from MessageInput component [59618ad](https://github.com/GetStream/stream-chat-react-native/commit/59618adbc238763cf7fd3d5ba3dd0304012877de)

## [1.0.0] 2020-07-29

We've already been on a v1 release for a while but never updated our versioning. Right now we're in the process of rewriting our components to be more future proof and we started using hooks, hence the v1.0.0 today.

Breaking change: stream-chat-react-native now relies on hooks and will need react-native >= 0.59.0 to work

Rewrite will involve following changes:

1. Functional components instead of class based components
2. Static typing using typescript
3. UI tests

We are going to incrementally implement these changes and will try to keep everything backwards compatible unless really necessary.

## [0.15.2] 2020-07-29

- Exporting `AutoCompleteInput` component [d41d0d5](https://github.com/GetStream/stream-chat-react-native/commit/d41d0d58ce02556cedf1825a2adb6a5c366a770c)

## [0.15.1] 2020-07-29 (Bad release)

## [0.15.0] 2020-07-27

- Upgrading @stream-io/react-native-simple-markdown to 1.2.1 [d89f012](https://github.com/GetStream/react-native-simple-markdown/commit/d89f0128e6c4f179f2afe9f9a896b289288e2afd)

  It fixes the issue with markdown where text like "#stream" was treated as heading, thus disallowing anyone to use hashtags in chat.

- Internal directory restructuring of components

## [0.14.0] 2020-07-16

- Fixing compatibility issues with react-native 0.63 [88721a0](https://github.com/GetStream/stream-chat-react-native/commit/88721a077b3bb3369c3d8dbde9451d84f6761d87)
- Updating stream-chat to 0.13.x [4af1b1d](https://github.com/GetStream/stream-chat-react-native/commit/4af1b1d63a3c7dec662f8c75426ea7a7082f26a4)

## [0.13.1] 2020-07-14

- [84ded29](https://github.com/GetStream/stream-chat-react-native/commit/84ded29bf7afd9e9e5178e76e79953d8b27dc77c) Bug fix - **Only** set active channel in ChannelList component on complete reload, which happens in following cases:

  - first load on chat
  - changes in filters

## [0.13.0] 2020-07-08

- Upgrading `@stream-io/react-native-simple-markdown` to 1.2.0. It fixes markdown related issues regarding line breaks
- Added a new prop to the MessageInput component - `sendImageAsync`. It’s value defaults to false, but when set to true, if the user hits send on a message before an attached image has finished uploading, the message text will be sent immediately and the image will be sent as a follow-up message as soon as a successful response has been received by the CDN [455571d](https://github.com/GetStream/stream-chat-react-native/commit/455571d68db5e617882b59a81e15f934f0365952)
- Fixed typescript for isMyMessage function [7d55134](https://github.com/GetStream/stream-chat-react-native/commit/7d5513479e55b014562b7d07082628f4215e4a92)

## [0.12.4] 2020-06-30

- Improving MessageInput component, to better handle the case of rapid typing [3fddf06](https://github.com/GetStream/stream-chat-react-native/commit/3fddf06426cce5a9cc8dad1e80f9dec1efb4751d)
- Fixing fallback avatar for MentionsItem component [159fcb8](https://github.com/GetStream/stream-chat-react-native/commit/159fcb856171eaa1f0e2f57f5e9442177eb10b88)

## [0.12.3 2020-06-17

- Fixing `enabled` prop on KeyboardCompatibleView

## [0.12.2] 2020-06-17

- Fixing broken file upload functionality on android [2cb26e7](https://github.com/GetStream/stream-chat-react-native/commit/2cb26e7951e2030f1c319ad82c55bf0273ef6532)

## [0.12.1] 2020-06-16

- Allow search for special characters in mentions autocomplete [a2cb083](https://github.com/GetStream/stream-chat-react-native/commit/a2cb083a3d6657b5c3a122fcd5843d0c9f51a5a6)

## [0.12.0] 2020-06-15

- **Improvements to autocomplete feature in MessageInput component**.

Until now if your channel had more than 100 members, then you couldn't see members (besides first 100) in mentions popup box. This was because queryChannels api only populates 100 members in channel state and mentions feature was based on searching for members in channel state.

From now on, autocomplete input (specifically mentions autocomplete) will be api based search. So that mentions feature will work even for the channels with more than 100 members.

## [0.11.0] 2020-06-01

**Non breaking changes**

### UX improvements of ChannelList component

  <div style="display: inline">
    <img src="./screenshots/7.png" alt="IMAGE ALT TEXT HERE" width="250" border="1" style="margin-right: 30px" />
    <img src="./screenshots/8.png" alt="IMAGE ALT TEXT HERE" width="250" border="1" style="margin-right: 30px" />
    <img src="./screenshots/9.png" alt="IMAGE ALT TEXT HERE" width="250" border="1" />
  </div>

  - So far we only had `LoadingErrorIndicator` (which can be customized using prop `LoadingErrorIndicator`). This error indicator replaces the entire channel
  list on screen. So if your 2nd page of list results in error, we used to remove all the already fetched channels and show this full screen error indicator.
  Instead we have introduced following error indicators, which will be displayed at top of the list in case or error. Please note that if first page of
  queryChannels api results in error, we will display LoadingErrorIndicator

    - HeaderErrorIndicator
    - HeaderNetworkDownIndicator

  - Introducing following new props to ChannelList component

    - `FooterLoadingIndicator` {UI Component} To override default spinner at footer of channel list (introduced in this release)
    - `HeaderErrorIndicator` {UI Component} To override default HeaderErrorIndicator
    - `HeaderNetworkDownIndicator`{UI Component} To override default HeaderNetworkDownIndicator

  - Introduced pull to refresh functionality, to refresh the ChannelList in case of failure.
  - Adding following prop to `LoadingErrorIndicator`

    - `retry` {func} If you are using custom `LoadingErrorIndicator` for your ChannelList component, you can attach this function to CTA button
    to reload the ChannelList.

  - Added retry mechanism to ChannelList's queryChannels api call. In case of failure, api will be retried 3 times (max) at the interval of 2 seconds.

## [0.10.3] 2020-05-15

- Updating `stream-chat` to `1.10.1` in add [token refresh functionality](https://github.com/GetStream/stream-chat-js/blob/main/docs/userToken.md)
- Disable longPress on Image gallery [f7aacb5](https://github.com/GetStream/stream-chat-react-native/commit/f7aacb5741e85811de37d5e3b550d2be539b89a4)
- Fixing markdown issue [ac621f0](https://github.com/GetStream/stream-chat-react-native/commit/ac621f0eb1f6be7f0496b82ee425f3bc90c10839)

## [0.10.2] 2020-04-29

- Fixing crashes in KeyboardCompatibleView and better handling of AppState changes
  - https://github.com/GetStream/stream-chat-react-native/pull/193
  - [84cf8f7](https://github.com/GetStream/stream-chat-react-native/commit/84cf8f772d454b471c0e9ad81a10acd219ba6be2)

- Fixes with message component [2d21b19](https://github.com/GetStream/stream-chat-react-native/commit/2d21b19ad3856f516efcc3c0a19c52f145f7fcec)

   - Adding support for prop `additionalTouchableProps` in `MessageSimple` to allow adding additional prop to inner TouchableOpacity components
   - Same (additionalTouchableProps) prop gets forwarded to all inner components which has some touchable feedback attached such as Gallery, FileAttachment, etc

- Adding `setFlatListRef` function prop to ChannelList and MessageList to get access to ref to inner FlatList component [4c49373](https://github.com/GetStream/stream-chat-react-native/commit/4c4937334c10e71a918d360bf6c95daf74222b5b)
- Fix for threadMessages in event handler for Channel component - [17f32df](https://github.com/GetStream/stream-chat-react-native/commit/17f32df69cb06237e9c5590a3745a3d557c56b1b)
- Adding margin for very last MessageSystem [f4661d6](https://github.com/GetStream/stream-chat-react-native/commit/f4661d6ec842d6a1a797d01a5953125a7fb1f863)
- Hiding AttachButton if both `hasImagePicker` and `hasFilePicker` props are false [7de46b5](https://github.com/GetStream/stream-chat-react-native/commit/7de46b55b7f431df4d957bf9502af370c6221782)
- Fixing custom reactions [5deea55](https://github.com/GetStream/stream-chat-react-native/commit/5deea5529a0647f42e259185b547b24effc9c15f)


## [0.10.1] 2020-04-15

- Adding following theme keys [7ae43d4](https://github.com/GetStream/stream-chat-react-native/commit/7ae43d4d1788b14ee9cd7c6d0f3d6d49ac5ebdf5)
  - messageInput.suggestions.command.args
  - messageInput.suggestions.command.description

- Handling `channel.hidden` event in  `ChannelList` component
- Adding support for function prop `onChannelHide` on `ChannelList`
- Avoid breaking markRead api call if channel is disconnected [a1cfd96](https://github.com/GetStream/stream-chat-react-native/commit/a1cfd96ebfcd2859164c60a0535abe8791f826ac)
- Updating `stream-chat` version to `1.7.3`
- Fixing the error: `[Unhandled promise rejection: TypeError: mimeType.startsWith is not a function. (In 'mimeType.startsWith('image/')', 'mimeType.startsWith' is undefined)]` [451b2a4](https://github.com/GetStream/stream-chat-react-native/commit/451b2a4e19ad202f5c5f428b369301ee312e0c3f)

## [0.10.0] 2020-04-09

**All the changes are non-breaking**

- Adding support for custom UI component prop - `Input` to `MessageInput`. It allows shuffling of UI inside MessageInput

- Adding support for following UI component props to `MessageSimple`

  - UrlPreview
  - Giphy
  - FileAttachment
  - FileAttachmentGroup
  - Card
  - CardHeader
  - CardCover
  - CardFooter

- Adding support for following UI component props to `Attachment`

  - UrlPreview
  - Giphy
  - FileAttachment
  - FileAttachmentGroup
  - Card
  - CardHeader
  - CardCover
  - CardFooter

- Adding support for following UI component props to `Card`

  - Header
  - Cover
  - Footer

- Adding following theme keys:

  - `message.card.footer.title` (Text)
  - `message.card.footer.description` (Text)
  - `message.card.footer.link` (Text)
  - `message.card.footer.logo` (Image)
  - `iconSquare.container` (TouchableOpacity or View)

- Fixing typos in docs
- Updating format of message date time to `LT` from `hh:ssA`, to allow i18n
- Fixing pagination logic for ChannelList in case of duplicates

## [0.9.2] 2020-04-04

**NOTE** Please make sure to use `stream-chat@^1.7.0`

- Fixing moderator, owner, admin checks for message actions [80dfb86](https://github.com/GetStream/stream-chat-react-native/commit/80dfb86ff7f07d1eb223be0c766eef991fb438db)

## [0.9.1] 2020-04-02

- Adding support for following props on MessageInput component [c5ada59](https://github.com/GetStream/stream-chat-react-native/commit/c5ada5951a9528eaab7945bf4ed2e74b4c9724f2)

  - onChangeText
  - initialValue

## [0.9.0] 2020-04-02

- Disabling (disabling `TouchableOpacity` wrapper) `SendButton` if message is not valid (empty text and no attachments)
- Syncing this `rc` with latest master (0.8.1)
- Moving external expo dependencies to peerDependencies
- Fixing issue with MessageStatus not showing up on mount [61388c3](https://github.com/GetStream/stream-chat-react-native/commit/61388c3ac4f80cf264bda3fc3a5fed2f7ede9761)

### Prop changes to components (non-breaking)

- MessageSimple

  **new props**

  - `MessageReplies` UI component to override default `2 replies` text/component
  - `MessageHeader` UI component to add some content on top of message content (text, attachments)
  - `ReactionList` UI component to override default ReactionList component
  - `supportedReactions` Array of reactions which should be available or supported in reaction picker. [Example](https://github.com/GetStream/stream-chat-react-native/blob/vishal/docs-improvement/docs/cookbook.md#message-with-custom-reactions)

  **deprecated props**

  - `emojiDate` Please use supportedReactions instead

- MessageAvatar

  **new props**

  - `alignment` ('right' | 'left')

- MessageContent

  **new props**

  - All the new props to MessageSimple are available in MessageContent
  - `alignment` ('right' | 'left')

- ReactionPickerWrapper

  In previous version, you could open reaction picker only after clicking/pressing `ReactionList`, which made it hard to change the
  functionality of `ReactionList` without copy pasting lots of code regarding opening of `ReactionPicker`. And also ReactionPicker
  logic was tightly coupled with MessageContent component (which meant added complexity)
  With ReactionPickerWrapper, we are taking out all the ReactionPicker related logic (setting the position of reaction picker
  at message which was touched) from MessageContent. So you can now add _open reaction picker on press_ functionality
  on any component that you wish. You just need to wrap your component with `ReactionPickerWrapper` component.

  You can also adjust the relative position at which ReactionPicker opens up or shows up by altering `offset`
  prop on ReactionPickerWrapper.

  Default value is:

  ```
  {
      top: 40,
      left: 30,
      right: 10,
  }
  ```

  NOTE: This component was present in repository in previous versions as well, but it was super buggy.

  **TL;DR** Enables you to build custom ReactionList, on touch of which, ReactionPicker will open up

  Please check this example from cookbook for details - https://github.com/GetStream/stream-chat-react-native/blob/vishal/docs-improvement/docs/cookbook.md#message-bubble-with-reactions-at-bottom-of-message

- Channel

  - Update the component, when `channel` prop changes.


## [0.9.0-rc.3] 2020-04-02

- Fixing issue with MessageStatus not showing up on mount [61388c3](https://github.com/GetStream/stream-chat-react-native/commit/61388c3ac4f80cf264bda3fc3a5fed2f7ede9761)

## [0.9.0-rc.2] 2020-04-02

- Moving external expo dependencies to peerDependencies

## [0.9.0-rc.1] 2020-04-02

- Disabling (disabling `TouchableOpacity` wrapper) `SendButton` if message is not valid (empty text and no attachments)
- Syncing this `rc` with latest master (0.8.1)

## [0.8.1] 2020-04-01

- Disabling interactions with MessageList and MessageInput if channel is frozen. [2c4e1a2](https://github.com/GetStream/stream-chat-react-native/commit/2c4e1a2713825b861717e002da483c182e80213c)
- Adding missing `style` to all our component in typescript [a2ac0b4](https://github.com/GetStream/stream-chat-react-native/commit/a2ac0b44882913db065e8099bd03a7b286255d47)

## [0.9.0-rc.0] 2020-03-31

### Non-breaking changes

- MessageSimple

  **new props**

  - `MessageReplies` UI component to override default `2 replies` text/component
  - `MessageHeader` UI component to add some content on top of message content (text, attachments)
  - `ReactionList` UI component to override default ReactionList component
  - `supportedReactions` Array of reactions which should be available or supported in reaction picker. [Example](https://github.com/GetStream/stream-chat-react-native/blob/vishal/docs-improvement/docs/cookbook.md#message-with-custom-reactions)

  **deprecated props**

  - `emojiDate` Please use supportedReactions instead

- MessageAvatar

  **new props**

  - `alignment` ('right' | 'left')

- MessageContent

  **new props**

  - All the new props to MessageSimple are available in MessageContent
  - `alignment` ('right' | 'left')

- ReactionPickerWrapper

  In previous version, you could open reaction picker only after clicking/pressing `ReactionList`, which made it hard to change the
  functionality of `ReactionList` without copy pasting lots of code regarding opening of `ReactionPicker`. And also ReactionPicker
  logic was tightly coupled with MessageContent component (which meant added complexity)
  With ReactionPickerWrapper, we are taking out all the ReactionPicker related logic (setting the position of reaction picker
  at message which was touched) from MessageContent. So you can now add _open reaction picker on press_ functionality
  on any component that you wish. You just need to wrap your component with `ReactionPickerWrapper` component.

  You can also adjust the relative position at which ReactionPicker opens up or shows up by altering `offset`
  prop on ReactionPickerWrapper.

  Default value is:

  ```
  {
      top: 40,
      left: 30,
      right: 10,
  }
  ```

  NOTE: This component was present in repository in previous versions as well, but it was super buggy.

  **TL;DR** Enables you to build custom ReactionList, on touch of which, ReactionPicker will open up

  Please check this example from cookbook for details - https://github.com/GetStream/stream-chat-react-native/blob/vishal/docs-improvement/docs/cookbook.md#message-bubble-with-reactions-at-bottom-of-message

- Channel

  - Update the component, when `channel` prop changes.

## [0.8.0] 2020-03-30

- Replacing momentjs with dayjs
  - [8294baf](https://github.com/GetStream/stream-chat-react-native/commit/8294bafcdfcb6078cd8f3a18690da70aa5b93539)
  - [a81e69e](https://github.com/GetStream/stream-chat-react-native/commit/a81e69ef18d0ad8c2257a52ca3c14fb168fdc577)
  - [0a119bd](https://github.com/GetStream/stream-chat-react-native/commit/0a119bde5b9105448aa1fadc605e778099fa02ce)
- Changes to `Streami18n` constructor options:
  - **Breaking change:** replacing `momentLocaleConfigForLanguage` with `dayjsLocaleConfigForLanguage`
  - deprecating `Moment`. Instead use `DateTimeParser`
- Updating `stream-chat` to `1.6.0` [b62fa95](https://github.com/GetStream/stream-chat-react-native/commit/b62fa9542bc82192a4ffc7a9e9bf61b52155c932)
- Avoid showing empty cover if image url is empty [ddbbadb](https://github.com/GetStream/stream-chat-react-native/commit/ddbbadba8f125cca6196495ceaf5d9442afb4fdb)
- Subscribing ChannelList to `user.updated` event [7ea6110](https://github.com/GetStream/stream-chat-react-native/commit/7ea6110c0238319833033e39356b7b2055164ea2)
- Fixing channel.updated and channel.deleted event handler to not break if channel is not in list [1404860](https://github.com/GetStream/stream-chat-react-native/commit/140486018f8eecf17d2bea27bdc65f26360aa016)

## [0.7.2] 2020-03-20

- Extending style support for `TypingIndicator` component, [5874b73](https://github.com/GetStream/stream-chat-react-native/commit/5874b7368890fd1de5247b521381f3e076201fec)
- Added styling support for editing box of `MessageInput`. [2968684](https://github.com/GetStream/stream-chat-react-native/commit/2968684d459bbeeb16bf836c0de731eda5807aaf)
- Adding prop `doMarkReadRequest` to Channel component, to override markRead api call. [1afda94](https://github.com/GetStream/stream-chat-react-native/commit/1afda948360eb80a4af763111b5bb4de86744f25)
- Adding boolean prop `hideReactionCount` and `hideReactionOwners` in `MessageSimple` component. [3814266](https://github.com/GetStream/stream-chat-react-native/commit/38142667fb3290b4c81495a5a92fbfda7856bfe4)
- `MessageInput` and `MessageList` component as prop in `Thread` component. [db97289](https://github.com/GetStream/stream-chat-react-native/commit/db97289f7f79c055816cfdc6377b590076e178ee)
- Disabling keyboard listeners when app goes to background [8a372e6](https://github.com/GetStream/stream-chat-react-native/commit/8a372e62f56cdd9389d73dfc4ab5ba8d5077a37e)
- Dismiss keyboard when opening action sheet. [bb12a55](https://github.com/GetStream/stream-chat-react-native/commit/bb12a55c9125c6168289f642f10d0340ea3b3abe)
- Disable escaping in translator function. [a5118dc](https://github.com/GetStream/stream-chat-react-native/commit/a5118dc9606878242de3a2c9015a88fc6ccd7021)
- Allow moderator to edit/delete message. [44165f6](https://github.com/GetStream/stream-chat-react-native/commit/44165f677d5883ab53c908a615bbd914ccb9401b)

## [0.7.1] 2020-03-18

- Adding support for custom moment object in Streami18n class [7557c70](https://github.com/GetStream/stream-chat-react-native/commit/7557c70687181d40db3f6f0dda7ddf86c063abd5)

## [0.7.0] 2020-03-17

- Introducing internationalization (i18n) support for the sdk https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/docs/Streami18n.md

## [0.6.6] 2020-02-20

- Adding following props to KeyboardCompatibleView component [6650109](https://github.com/GetStream/stream-chat-react-native/commit/6650109669cdd13c3b2a5bc59cc235d7a2796b3e)

  - keyboardDismissAnimationDuration
  - keyboardOpenAnimationDuration
  - enabled

- Adding following props to Channel component [6650109](https://github.com/GetStream/stream-chat-react-native/commit/6650109669cdd13c3b2a5bc59cc235d7a2796b3e)

  - KeyboardCompatibleView
  - disableKeyboardCompatibleView

- Fixing title of send button [0990cb5](https://github.com/GetStream/stream-chat-react-native/commit/0990cb55982d7233d617950c5d6a679f9c13f133)

- Fixing channel preview avatar for one-on-one conversation [790b0b9](https://github.com/GetStream/stream-chat-react-native/commit/790b0b91b6cbb9d4d16bfa15b5b3fa42015381bc)

- Fixing types for context providers - [dc40c8a](https://github.com/GetStream/stream-chat-react-native/commit/dc40c8a92d0f9bc8244d5c211afdbf3064521a68)

## [0.6.5] 2020-02-04

- Adding a simple check to see if lastReceivedId has changed, before updating the state - to avoid infinite loop [3da5e4a](https://github.com/GetStream/stream-chat-react-native/commit/3da5e4a2a8fb6db0f86a031102e0d5b6cd5197cc)

## [0.6.4] 2020-02-04

- Fixing image index for Image viewer ([d16e86c](https://github.com/GetStream/stream-chat-react-native/commit/d16e86c555e2fb0d65a882fa7434b24a22e50d70))

  Issue - if attachment gallery, when you click/touch on 1st photo, it opens image viewer at 1st photo. But if you touch 2nd photo, it still opens image viewer at first photo.

## [0.6.3] 2020-01-29

- Adding support for prop `formatLatestMessageDate` in `ChannelPreviewMessenger` component ([9a8d9a3](https://github.com/GetStream/stream-chat-react-native/commit/9a8d9a3ca57fbc9474e24d60928fe92d377cb728))
- Adding support for prop `latestMessageLength` in `ChannelPreviewMessenger` component ([ef5b887](https://github.com/GetStream/stream-chat-react-native/commit/ef5b887b075d0a7dba60772dbffa95303a96193f))
- Adding types for `SendButton` to typescript file ([ad5c728](https://github.com/GetStream/stream-chat-react-native/commit/ad5c728bdea1929d0d6d39802efdf94a41eb4b0d))
- Fixing date issue in `MessageSystem` component. ([35c18e3](https://github.com/GetStream/stream-chat-react-native/commit/35c18e3da0503f152d8caec9011d9d2132529661))
- Adding prop for AttachButton to MessageInput ([600b1d2](https://github.com/GetStream/stream-chat-react-native/commit/600b1d28d87e837de7f1249880bb436065277e0f))
- Adding prop `formatDate` to `MessageSimple` component ([c3cfdf6](https://github.com/GetStream/stream-chat-react-native/commit/c3cfdf67b7887f7bb171f21daf1ed980da21f44b))
- Adding style and text customization to LoadingIndicator ([232241c](https://github.com/GetStream/stream-chat-react-native/commit/232241c1b84a7cf9f6729039e8e1a404e092818e))

## [0.6.2] 2020-01-20

- Added support for following props to `Channel` component:
  1. doSendMessageRequest [c75be29](https://github.com/GetStream/stream-chat-react-native/commit/c75be290cbe4a44e84b10652615e3c21215353e6)
  2. doUpdateMessageRequest [7227c19](https://github.com/GetStream/stream-chat-react-native/commit/7227c1992148f8bf4cfd2871a09a8aa4acf889bb)

## [0.6.1] 2020-01-14

- When you change the filters prop on the ChannelList component this now we will refresh the channels with the new query

## [0.6.0] 2020-01-07

- Exporting all the missing components and utils
  - AutoCompleteInput
  - Card
  - CommandsItem
  - DateSeparator
  - EmptyStateIndicator
  - EventIndicator
  - FileAttachmentGroup
  - FileUploadPreview
  - Gallery
  - IconSquare
  - ImageUploadPreview
  - KeyboardCompatibleView
  - LoadingErrorIndicator
  - LoadingIndicator
  - MentionsItem
  - Message
  - MessageNotification
  - MessageSystem
  - ReactionList
  - Spinner
  - SuggestionsProvider
  - UploadProgressIndicator
- Refining prop-types and typescript types for components.
- Fixed issue about app crash when document picker is cancelled - [#110](https://github.com/GetStream/stream-chat-react-native/issues/110)
- Adding `onPress` and `onLongPress` props on `MessageSimple` component
  - Fixes issue [#108](https://github.com/GetStream/stream-chat-react-native/issues/108)
  - commit [9e3064d](https://github.com/GetStream/stream-chat-react-native/commit/8ffde0010a6e8a4a61c47063570350849fd995f4)
- Fixing theme paths for MessageNotification component.

#### Breaking Change

- Replacing theme path `messageList.messageNotificationText` with `messageList.messageNotification.text` ([#3593dfb](https://github.com/GetStream/stream-chat-react-native/commit/9ad366562996edaef09b66bbee4eb657a99fb89e#diff-bff2172a77e0b6357dc54230974c9a61))
- Replacing theme path `messageList.messageNotification` with `messageList.messageNotification.container` ([#3593dfb](https://github.com/GetStream/stream-chat-react-native/commit/9ad366562996edaef09b66bbee4eb657a99fb89e#diff-bff2172a77e0b6357dc54230974c9a61))

## [0.5.1] 2019-12-23

#### stream-chat-expo (Expo package)

- Adding support for following props
  - `additionalParentMessageProps`
  - `additionalMessageListProps`
  - `additionalMessageInputProps`
- Adding missing types for prop `additionalFlatListProps` in MessageList and ChannelList

#### stream-chat-react-native (Native package)

- Adding support for following props
  - `additionalParentMessageProps`
  - `additionalMessageListProps`
  - `additionalMessageInputProps`
- Adding missing types for prop `additionalFlatListProps` in MessageList and ChannelList

## [0.5.0] 2019-12-23

#### stream-chat-expo (Expo package)

- Changes to add compatibility for Expo 36. Adding [netinfo](https://github.com/react-native-community/react-native-netinfo) as peer dependency - https://github.com/GetStream/stream-chat-react-native/issues/97
- Disabling the long press on image viewer (in Attachment) - https://github.com/GetStream/stream-chat-react-native/issues/100 to avoid freezing of UI.
- Fixing broken threads issue
- Support for `additionalFlatListProps` prop in `MessageList` and `ChannelList` component
- Changing prop-type for component type props to `elementType` instead of `func`

#### stream-chat-react-native (Native package)

- Disabling the long press on image viewer (in Attachment) - https://github.com/GetStream/stream-chat-react-native/issues/100 to avoid freezing of UI.
- Fixing broken threads issue
- Support for `additionalFlatListProps` prop in `MessageList` and `ChannelList` component
- Changing prop-type for component type props to `elementType` instead of `func`

## [0.4.0] 2019-12-16

- Adding support for customizing markdown styles - https://github.com/GetStream/stream-chat-react-native/pull/99/files#diff-ede54911d9164ea37e65e92f2e18cb91R56
- Removing `text` property theme with `textContainer`.

## [0.3.12] 2019-12-03

- Adding support for `onChannelTruncated` prop to ChannelList
- Updating channel from channel list once `channel.truncated` event is received
- Fixed image picker for native package and examples

## [0.3.11] 2019-12-02

- Adding support for `onChannelDeleted` prop to ChannelList
- Removing channel from channel list once `channel.deleted` event is received

## [0.3.10] 2019-11-28

- Adding strict string type check for channel name
- Updated example apps
- Updated readme doc

## [0.3.9] 2019-11-20

- Showing TypingIndicatorContainer only when necessary

## [0.3.8] 2019-11-06

- Adding logs to Chat, ChannelList and Channel component
- Optimizing MessageList and ChannelList component - https://github.com/GetStream/stream-chat-react-native/pull/84

## [0.3.7] 2019-11-04

- Adding support for `AttachmentFileIcon` prop.

## [0.3.6] 2019-11-04

- Adding support for `actionSheetStyles` prop, so as to add more customization for styles of action sheet.

## [0.3.5] 2019-10-28

- Fixing some styles for action sheet in MessageSimple component.

## [0.3.4] 2019-10-03

- Avoiding query channel api call when there are no more messages to render
- Making markRead api call only if unread count is > 0

## [0.3.3] 2019-10-02

- Making empty value of `typing` object - immutable
- Adding support for `SendButton` UI component prop

## [0.3.2] 2019-10-01

- Fixing bug in themed HOC

## [0.3.1] 2019-09-30

- Adding typescript declaration file for expo and native package

## [0.3.0] 2019-09-30

- Adding typescript declaration file
- Adding style customization support for action sheet

## [0.2.6] 2019-09-23

- Fixing expo package for NetInfo changes

## [0.2.5] 2019-09-23

- Fixing deprecated warnings coming from NetInfo library
- Adding onMessageTouch and dismissKeyboardOnMessageTouch prop for MessageList component
- Fixing style issue (background color) of MessageText component, introduced in 0.2.4

## [0.2.4] 2019-09-13

- Fixing bug in theme logic
- Adding ability to customize more the MessageSimple component

## [0.2.3] 2019-09-09

- Fixing pagination issue when oldest message is not received yet

## [0.2.2] 2019-09-06

- Updated example two to react native 0.60
- Fixing UX for image/file picker - closing keyboard when you open file/image picker action sheet

## [0.2.1] 2019-09-02

- Making sdk compatible with Expo 33 and 34

## [0.2.0] 2019-08-26

- Making sdk compatible with react native 0.60

## [0.1.19] 2019-08-26

- Updating ChannelPreviewMessenger component to show other member's name as channel title if channel has no explicate name in channel.data

## [0.1.18] 2019-08-12

- Fixing keyboard compatible view for android. Status bar height was not taken into account while calculating the height of channel after opening keyboard.

## [0.1.17] 2019-08-08

- Fixing prop to override Attachment UI component

## [0.1.16] 2019-08-07

- Attachment for URL preview were broken. Fixed.

## [0.1.15] 2019-07-18

- Adding prop function `onChannelUpdated` as callback for event `channel.updated`
- Bug fix - Channel list component doesn't update when custom data on channel is updated.
