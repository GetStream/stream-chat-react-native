import { registerNativeHandlers } from 'stream-chat-react-native-core';

export * from 'stream-chat-react-native-core';

type NativeHandlers = Parameters<typeof registerNativeHandlers>[0];

/**
 * A colour `processColor` can reduce to a plain ARGB integer: a colour string
 * (`'#FFFFFF'`, `'white'`, `'rgba(255, 255, 255, 1)'`) or an RGBA integer — note the
 * channel order, `0xRRGGBBAA`, so opaque white is `0xFFFFFFFF`. `null` is treated the same
 * as omitting it: no background is painted.
 *
 * The colour's own alpha is ignored — the background is always painted fully opaque. A
 * see-through background would be flattened away again by the first encoder without an alpha
 * channel, leaving the platform-dependent result this option exists to replace.
 *
 * Narrower than react-native's `ColorValue` on purpose. `ColorValue` admits
 * `PlatformColor`/`DynamicColorIOS`, which cannot cross the bridge as an integer and are
 * rejected at runtime — and `compressImage` swallows that rejection and silently returns the
 * uncompressed image, so this type is the only guardrail a caller actually gets. `ColorValue`
 * also has two live definitions across the supported react-native range, the older of which
 * excludes `number` and would reject the integer form documented above.
 */
type BackgroundColor = string | number | null;

// Declared inline rather than imported from `src/handlers/compressImage.ts`, even though that
// duplicates the shape.
//
// This file is the package's published type surface (`"types": "types/index.d.ts"`), so
// anything it imports is pulled into the *consumer's* TypeScript program and checked with
// *their* compiler options — `skipLibCheck` covers `.d.ts` but not `.ts`. Importing the source
// would make our public types only as portable as each consumer's config, across a
// `react-native >=0.76` peer range, and from a workspace whose own tsconfig is deliberately
// laxer than a strict app's (see the `strictNullChecks: false` rationale in ../tsconfig.json).
// Two failures are reproducible today: `moduleResolution: node10` (react-native publishes its
// types behind `exports`) and any project without `jsx` set (`../native` resolves to a `.tsx`).
// Both land as errors inside `node_modules`, in files the integrator does not own.
//
// The cost is that this must be kept in sync by hand with `BackgroundColor` in
// `src/native/types.ts` and `CompressImageParams` in `src/handlers/compressImage.ts`, which
// share a single source-side definition. It is five properties; if it grows, add a
// compile-time assertion under `src/` (inside the workspace tsconfig's `include`, never
// imported at runtime) rather than importing the source here.
/**
 * This package's `compressImage`, which accepts one option the shared `CompressImage`
 * contract in `stream-chat-react-native-core` does not: `backgroundColor`, painted behind the
 * image so an alpha channel is flattened onto it instead of being dropped by an encoder that
 * has none (JPEG).
 *
 * Defaults to `'#FFFFFF'`. Left to the platform the same transparent PNG comes out black on
 * Android and white on iOS, so the default exists to make the two agree; pass `null` to opt out
 * and get that platform behaviour back.
 *
 * `stream-chat-expo` has no equivalent — `expo-image-manipulator` can only fill a background
 * while *extending* an image, and marks that option `@platform web` — which is why the
 * widening lives on this wrapper rather than in core's shared contract. An Expo app therefore
 * keeps the platform default.
 */
type CompressImageWithBackground = (params: {
  backgroundColor?: BackgroundColor;
  compressImageQuality: number;
  height: number;
  uri: string;
  width: number;
}) => Promise<string>;

/**
 * The default native handlers this package registers with the core SDK.
 *
 * Exposed so integrators can compose or wrap a single handler (for example to
 * force `takePhoto` to capture images only) without reimplementing it or
 * reaching into internal module paths. Register your override *after* importing
 * this package so it takes precedence.
 *
 * Example:
 *
 * ```ts
 * import { registerNativeHandlers, defaultNativeHandlers } from 'stream-chat-react-native';
 *
 * const localTakePhoto = defaultNativeHandlers.takePhoto;
 *
 * registerNativeHandlers({
 *   takePhoto: localTakePhoto
 *     ? (options) => localTakePhoto({ ...options, mediaType: 'image' })
 *     : undefined,
 * });
 * ```
 *
 * The same pattern is the only way to reach `compressImage`'s `backgroundColor`: the SDK's own
 * attachment path forwards just `compressImageQuality`/`height`/`uri`/`width`, so wrap the
 * default handler to add a backdrop to every image the composer compresses.
 *
 * ```ts
 * const localCompressImage = defaultNativeHandlers.compressImage;
 *
 * registerNativeHandlers({
 *   compressImage: localCompressImage
 *     ? (params) => localCompressImage({ ...params, backgroundColor: '#FFFFFF' })
 *     : undefined,
 * });
 * ```
 */
export declare const defaultNativeHandlers: Omit<NativeHandlers, 'compressImage'> & {
  compressImage?: CompressImageWithBackground;
};
