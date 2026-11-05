// The basic catalog's components, drawn natively in StreamChatA2UI's look: its spacing, radii and
// type, in the AI components' colors.
import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import {
  type DimensionValue,
  I18nManager,
  Image,
  type ImageStyle,
  type ImageResizeMode,
  Modal as NativeModal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import Svg, { Path } from 'react-native-svg';

import type { ComponentContext } from '@a2ui/web_core';

import { DateTimeInputView } from './DateTimeInput';
import { A2UI_ICON_PATHS } from './iconPaths';
import { AudioView, VideoView } from './Media';

import type { A2UIComponentProps, A2UIComponents } from './types';

import { useAITranslation, useTheme } from '../../ai-components/contexts';
import { isRecord } from '../../ai-components/generative-ui/AIUIHelpers';
import { primitives } from '../../ai-components/internal/tokens';
import { Markdown } from '../../ai-components/markdown';
import { A2UIEngineContext } from '../A2UIContexts';
import { A2UIAxisContext, A2UIChild, A2UIChildren } from '../A2UISurface';

// Whether a Text is the label of a Button, where it shows as words rather than as Markdown.
const A2UILabelContext = createContext<TextStyle | undefined>(undefined);

const textOf = (value: unknown) =>
  typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value);

const stringsOf = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const errorsOf = ({ isValid, validationErrors }: Record<string, unknown>) =>
  isValid === false ? stringsOf(validationErrors) : [];

const setterOf = (props: Record<string, unknown>, key: string) => {
  const setter = props[`set${key.charAt(0).toUpperCase()}${key.slice(1)}`];
  return typeof setter === 'function' ? (setter as (value: unknown) => void) : undefined;
};

// The look of the catalog's parts the app's theme sets.
const useA2UITheme = () => useTheme().theme.a2ui ?? {};

// The catalog's colors: the theme's `a2ui.colors`, over ones from the AI components' own.
const usePalette = () => {
  const {
    theme: { a2ui, colors },
  } = useTheme();
  const own = a2ui?.colors;
  return useMemo(
    () => ({
      accent: colors.accent_blue,
      border: colors.grey_gainsboro,
      error: colors.accent_red,
      onAccent: colors.white,
      secondaryText: colors.grey,
      subtleSurface: colors.white_smoke,
      surface: colors.white,
      text: colors.black,
      ...own,
    }),
    [colors, own],
  );
};

// An accent color at `alpha`, for what is selected.
const tint = (color: string, alpha: number) =>
  /^#[0-9a-f]{6}$/i.test(color)
    ? `${color}${Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0')}`
    : color;

// What a part's checks found, under it.
const Problems = ({ errors }: { errors: string[] }) => {
  const palette = usePalette();
  return errors.length ? (
    <NativeText accessibilityRole='alert' style={[styles.problems, { color: palette.error }]}>
      {errors.join(' ')}
    </NativeText>
  ) : null;
};

const HEADINGS: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 25 },
  h4: { fontSize: primitives.typographyFontSizeLg, fontWeight: '700', lineHeight: 23 },
  h5: { fontSize: primitives.typographyFontSizeMd, fontWeight: '600', lineHeight: 21 },
};

const Text = ({ props }: A2UIComponentProps) => {
  const theme = useA2UITheme();
  const engine = useContext(A2UIEngineContext);
  const label = useContext(A2UILabelContext);
  const palette = usePalette();
  const text = textOf(props.text);
  const variant = textOf(props.variant);
  if (label) return <NativeText style={label}>{text}</NativeText>;
  if (HEADINGS[variant]) {
    return (
      <NativeText accessibilityRole='header' style={[HEADINGS[variant], { color: palette.text }]}>
        {text}
      </NativeText>
    );
  }
  if (variant === 'caption') {
    return (
      <NativeText style={[styles.caption, { color: palette.secondaryText }, theme.caption]}>
        {text}
      </NativeText>
    );
  }
  return <Markdown onLink={(url) => engine?.host.open(url)}>{text}</Markdown>;
};

const IMAGE_SIZES: Record<string, ImageStyle> = {
  avatar: { borderRadius: 24, height: 48, width: 48 },
  header: { height: 200, width: '100%' },
  icon: { height: 24, width: 24 },
  largeFeature: { height: 240, width: '100%' },
  mediumFeature: { height: 160, width: '100%' },
  smallFeature: { height: 72, width: 72 },
};

const RESIZE_MODES: Record<string, ImageResizeMode> = {
  contain: 'contain',
  cover: 'cover',
  fill: 'stretch',
  none: 'center',
  scaleDown: 'contain',
};

// The address to load for a link the agent wrote, as the renderer's `mediaUrl` allows: by
// default a public web link, never one on the person's network.
const useMediaSource = (value: unknown) => useContext(A2UIEngineContext)?.mediaSource(value);

const ImageComponent = ({ props }: A2UIComponentProps) => {
  const theme = useA2UITheme();
  const palette = usePalette();
  const url = useMediaSource(props.url);
  if (!url) return null;
  const size = IMAGE_SIZES[textOf(props.variant)] ?? IMAGE_SIZES.mediumFeature;
  const description = textOf(props.description);
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel={description || undefined}
      accessible={!!description}
      resizeMode={RESIZE_MODES[textOf(props.fit)] ?? 'cover'}
      source={{ uri: url }}
      style={[styles.image, { backgroundColor: palette.subtleSurface }, size, theme.image]}
    />
  );
};

// Icons that point somewhere, which a right-to-left layout turns around.
const MIRRORED_ICONS = new Set(['arrowBack', 'arrowForward', 'help', 'send', 'volumeUp']);

// An SVG path the agent writes for an icon of its own: commands and numbers only.
const SVG_PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s+-]+$/;

const ICON_SIZE = 24;

const Icon = ({ props }: A2UIComponentProps) => {
  const engine = useContext(A2UIEngineContext);
  const palette = usePalette();
  const { name } = props;
  // The app's own icon, by the name the agent gives.
  const AppIcon = typeof name === 'string' ? engine?.icons[name] : undefined;
  if (AppIcon) return <AppIcon color={palette.text} size={ICON_SIZE} />;
  const drawn =
    isRecord(name) && typeof name.svgPath === 'string' && SVG_PATH.test(name.svgPath)
      ? name.svgPath
      : undefined;
  // A name the catalog doesn't have shows a neutral icon rather than nothing, so the layout
  // around it holds.
  const d =
    drawn ?? (typeof name === 'string' ? A2UI_ICON_PATHS[name] : undefined) ?? A2UI_ICON_PATHS.help;
  const mirrored = I18nManager.isRTL && typeof name === 'string' && MIRRORED_ICONS.has(name);
  return (
    <Svg
      accessibilityElementsHidden
      height={ICON_SIZE}
      importantForAccessibility='no-hide-descendants'
      viewBox='0 0 24 24'
      width={ICON_SIZE}
    >
      <Path d={d} fill={palette.text} transform={mirrored ? 'matrix(-1 0 0 1 24 0)' : undefined} />
    </Svg>
  );
};

const Video = ({ props }: A2UIComponentProps) => {
  const palette = usePalette();
  const url = useMediaSource(props.url);
  const poster = useMediaSource(props.posterUrl);
  if (!url) return null;
  return <VideoView palette={palette} posterUrl={poster} url={url} />;
};

const AudioPlayer = ({ props }: A2UIComponentProps) => {
  const palette = usePalette();
  const url = useMediaSource(props.url);
  if (!url) return null;
  return (
    <AudioView description={textOf(props.description) || undefined} palette={palette} url={url} />
  );
};

const JUSTIFY: Record<string, ViewStyle['justifyContent']> = {
  center: 'center',
  end: 'flex-end',
  spaceAround: 'space-around',
  spaceBetween: 'space-between',
  spaceEvenly: 'space-evenly',
  start: 'flex-start',
  stretch: 'flex-start',
};

const ALIGN: Record<string, ViewStyle['alignItems']> = {
  center: 'center',
  end: 'flex-end',
  start: 'flex-start',
  stretch: 'stretch',
};

const Flex = ({ direction, props }: A2UIComponentProps & { direction: 'column' | 'row' }) => (
  <A2UIAxisContext.Provider value={direction}>
    <View
      style={[
        styles.flex,
        {
          alignItems: ALIGN[textOf(props.align)] ?? (direction === 'row' ? 'center' : 'stretch'),
          flexDirection: direction,
          justifyContent: JUSTIFY[textOf(props.justify)] ?? 'flex-start',
        },
      ]}
    >
      <A2UIChildren nodes={props.children} />
    </View>
  </A2UIAxisContext.Provider>
);

const Row = (props: A2UIComponentProps) => <Flex {...props} direction='row' />;
const Column = (props: A2UIComponentProps) => <Flex {...props} direction='column' />;

const List = ({ props }: A2UIComponentProps) => {
  const horizontal = textOf(props.direction) === 'horizontal';
  const align = ALIGN[textOf(props.align)] ?? 'stretch';
  if (!horizontal) {
    return (
      <View style={[styles.flex, { alignItems: align }]}>
        <A2UIChildren nodes={props.children} />
      </View>
    );
  }
  return (
    <A2UIAxisContext.Provider value='row'>
      <ScrollView
        contentContainerStyle={[styles.flex, styles.row, { alignItems: align }]}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <A2UIChildren nodes={props.children} />
      </ScrollView>
    </A2UIAxisContext.Provider>
  );
};

const Card = ({ props }: A2UIComponentProps) => {
  const theme = useA2UITheme();
  const palette = usePalette();
  return (
    <View style={[styles.card, { backgroundColor: palette.subtleSurface }, theme.card]}>
      <A2UIChild node={props.child} />
    </View>
  );
};

const Tabs = ({ props }: A2UIComponentProps) => {
  const theme = useA2UITheme();
  const palette = usePalette();
  const tabs = Array.isArray(props.tabs) ? props.tabs.filter(isRecord) : [];
  const [selected, setSelected] = useState(0);
  const current = tabs[Math.min(selected, tabs.length - 1)];
  return (
    <View style={styles.flex}>
      <ScrollView
        accessibilityRole='tablist'
        contentContainerStyle={styles.tabs}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {tabs.map((tab, index) => {
          const isSelected = tab === current;
          return (
            <Pressable
              accessibilityRole='tab'
              accessibilityState={{ selected: isSelected }}
              key={index}
              onPress={() => setSelected(index)}
              style={[
                styles.capsule,
                { backgroundColor: isSelected ? tint(palette.accent, 0.15) : 'transparent' },
                theme.tab,
              ]}
            >
              <NativeText
                style={[
                  styles.capsuleText,
                  { color: isSelected ? palette.accent : palette.secondaryText },
                  theme.tabText,
                ]}
              >
                {textOf(tab.title)}
              </NativeText>
            </Pressable>
          );
        })}
      </ScrollView>
      {current ? <A2UIChild node={current.child} /> : null}
    </View>
  );
};

const Modal = ({ props }: A2UIComponentProps) => {
  const { t } = useAITranslation();
  const palette = usePalette();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole='button' onPress={() => setOpen(true)}>
        <View pointerEvents='none'>
          <A2UIChild node={props.trigger} />
        </View>
      </Pressable>
      <NativeModal
        animationType='slide'
        onRequestClose={() => setOpen(false)}
        presentationStyle='pageSheet'
        visible={open}
      >
        <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
          <Pressable
            accessibilityRole='button'
            hitSlop={12}
            onPress={() => setOpen(false)}
            style={styles.sheetClose}
          >
            <NativeText style={[styles.buttonText, { color: palette.accent }]}>
              {t('Close')}
            </NativeText>
          </Pressable>
          <ScrollView contentContainerStyle={styles.flex}>
            <A2UIChild node={props.content} />
          </ScrollView>
        </View>
      </NativeModal>
    </>
  );
};

const Divider = ({ props }: A2UIComponentProps) => {
  const theme = useA2UITheme();
  const palette = usePalette();
  const vertical = textOf(props.axis) === 'vertical';
  return (
    <View
      style={[
        vertical ? styles.dividerVertical : styles.divider,
        { backgroundColor: palette.border },
        theme.divider,
      ]}
    />
  );
};

// Whether the component `id` is a borderless Button.
const isBorderlessButton = (context: ComponentContext, id: unknown) => {
  if (typeof id !== 'string') return false;
  const component = context.surfaceComponents.get(id);
  return component?.type === 'Button' && component.properties.variant === 'borderless';
};

/**
 * Where a borderless Button is among the follow-ups of a Column: `first`, or `after` another
 * borderless Button, which a hairline then parts it from. A borderless Button anywhere else, such
 * as in a Row, is not a follow-up, and reads as a link.
 */
const followUpPlaceOf = (context: ComponentContext | undefined): 'first' | 'after' | undefined => {
  if (!context) return undefined;
  const { id } = context.componentModel;
  for (const parent of context.surfaceComponents.values) {
    const { children } = parent.properties;
    if (parent.type !== 'Column' || !Array.isArray(children)) continue;
    const index = children.indexOf(id);
    if (index < 0) continue;
    return index > 0 && isBorderlessButton(context, children[index - 1]) ? 'after' : 'first';
  }
  return undefined;
};

const Button = ({ node, props }: A2UIComponentProps) => {
  const theme = useA2UITheme();
  const palette = usePalette();
  const variant = textOf(props.variant);
  const errors = errorsOf(props);
  const disabled = props.isValid === false;
  const action = typeof props.action === 'function' ? (props.action as () => unknown) : undefined;
  const look: { container: ViewStyle; text: TextStyle } =
    variant === 'primary'
      ? { container: { backgroundColor: palette.accent }, text: { color: palette.onAccent } }
      : variant === 'borderless'
        ? { container: styles.borderless, text: { color: palette.accent } }
        : { container: { backgroundColor: palette.subtleSurface }, text: { color: palette.text } };
  const label = useMemo<TextStyle>(
    () => ({ ...styles.buttonText, ...look.text, ...theme.buttonText }),
    [look.text, theme.buttonText],
  );
  // A follow-up is a row of its own across the reply, parted from the one before by a hairline.
  const followUp = variant === 'borderless' ? followUpPlaceOf(node.context) : undefined;
  return (
    <View
      style={[
        styles.field,
        followUp && styles.followUp,
        followUp === 'after' && [styles.followUpAfter, { borderTopColor: palette.border }],
      ]}
    >
      <Pressable
        accessibilityRole='button'
        accessibilityState={{ disabled }}
        disabled={disabled || !action}
        onPress={() => void action?.()}
        style={({ pressed }) => [
          styles.button,
          look.container,
          followUp && styles.followUpButton,
          theme.button,
          { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
        ]}
      >
        <A2UILabelContext.Provider value={label}>
          <A2UIChild node={props.child} />
        </A2UILabelContext.Provider>
      </Pressable>
      <Problems errors={errors} />
    </View>
  );
};

const FieldLabel = ({ text }: { text: string }) => {
  const theme = useA2UITheme();
  const palette = usePalette();
  return text ? (
    <NativeText style={[styles.label, { color: palette.secondaryText }, theme.label]}>
      {text}
    </NativeText>
  ) : null;
};

const TextField = ({ props }: A2UIComponentProps) => {
  const theme = useA2UITheme();
  const palette = usePalette();
  const variant = textOf(props.variant);
  const setValue = setterOf(props, 'value');
  const errors = errorsOf(props);
  const label = textOf(props.label);
  return (
    <View style={styles.field}>
      <FieldLabel text={label} />
      <TextInput
        accessibilityLabel={label || undefined}
        editable={!!setValue}
        keyboardType={variant === 'number' ? 'decimal-pad' : 'default'}
        multiline={variant === 'longText'}
        onChangeText={(text) => setValue?.(text)}
        placeholder={textOf(props.placeholder) || undefined}
        placeholderTextColor={palette.secondaryText}
        secureTextEntry={variant === 'obscured'}
        style={[
          styles.input,
          variant === 'longText' && styles.longText,
          {
            backgroundColor: palette.surface,
            borderColor: errors.length ? palette.error : palette.border,
            color: palette.text,
          },
          theme.input,
        ]}
        value={textOf(props.value)}
      />
      <Problems errors={errors} />
    </View>
  );
};

const Mark = ({ checked, round }: { checked: boolean; round?: boolean }) => {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.mark,
        round && styles.markRound,
        {
          backgroundColor: checked ? palette.accent : palette.surface,
          borderColor: checked ? palette.accent : palette.border,
        },
      ]}
    >
      {checked ? <View style={[styles.markDot, { backgroundColor: palette.onAccent }]} /> : null}
    </View>
  );
};

const CheckBox = ({ props }: A2UIComponentProps) => {
  const palette = usePalette();
  const checked = props.value === true;
  const setValue = setterOf(props, 'value');
  const errors = errorsOf(props);
  return (
    <View style={styles.field}>
      <Pressable
        accessibilityRole='checkbox'
        accessibilityState={{ checked, disabled: !setValue }}
        disabled={!setValue}
        onPress={() => setValue?.(!checked)}
        style={styles.choice}
      >
        <Mark checked={checked} />
        <NativeText style={[styles.choiceText, { color: palette.text }]}>
          {textOf(props.label)}
        </NativeText>
      </Pressable>
      <Problems errors={errors} />
    </View>
  );
};

const ChoicePicker = ({ props }: A2UIComponentProps) => {
  const theme = useA2UITheme();
  const { t } = useAITranslation();
  const palette = usePalette();
  const [filter, setFilter] = useState('');
  const single = textOf(props.variant) !== 'multipleSelection';
  const chips = textOf(props.displayStyle) === 'chips';
  const chosen = stringsOf(props.value);
  const setValue = setterOf(props, 'value');
  const options = (Array.isArray(props.options) ? props.options.filter(isRecord) : [])
    .map((option) => ({ label: textOf(option.label), value: textOf(option.value) }))
    .filter(({ label }) => !filter || label.toLowerCase().includes(filter.toLowerCase()));
  const toggle = (value: string) => {
    if (!setValue) return;
    if (single) setValue(chosen.includes(value) ? [] : [value]);
    else
      setValue(
        chosen.includes(value) ? chosen.filter((item) => item !== value) : [...chosen, value],
      );
  };
  return (
    <View style={styles.field}>
      <FieldLabel text={textOf(props.label)} />
      {props.filterable === true ? (
        <TextInput
          onChangeText={setFilter}
          placeholder={t('Search')}
          placeholderTextColor={palette.secondaryText}
          style={[
            styles.input,
            { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text },
            theme.input,
          ]}
          value={filter}
        />
      ) : null}
      <View style={chips ? styles.chips : styles.flex}>
        {options.map(({ label, value }) => {
          const isChosen = chosen.includes(value);
          return chips ? (
            <Pressable
              accessibilityRole={single ? 'radio' : 'checkbox'}
              accessibilityState={{ checked: isChosen }}
              key={value}
              onPress={() => toggle(value)}
              style={[
                styles.capsule,
                styles.chip,
                {
                  backgroundColor: isChosen ? tint(palette.accent, 0.18) : palette.surface,
                  borderColor: isChosen ? palette.accent : palette.border,
                },
                theme.chip,
              ]}
            >
              <NativeText
                style={[
                  styles.capsuleText,
                  { color: isChosen ? palette.accent : palette.text },
                  theme.chipText,
                ]}
              >
                {label}
              </NativeText>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole={single ? 'radio' : 'checkbox'}
              accessibilityState={{ checked: isChosen }}
              key={value}
              onPress={() => toggle(value)}
              style={styles.choice}
            >
              <Mark checked={isChosen} round={single} />
              <NativeText style={[styles.choiceText, { color: palette.text }]}>{label}</NativeText>
            </Pressable>
          );
        })}
      </View>
      <Problems errors={errorsOf(props)} />
    </View>
  );
};

const Slider = ({ props }: A2UIComponentProps) => {
  const palette = usePalette();
  const min = typeof props.min === 'number' ? props.min : 0;
  const max = typeof props.max === 'number' && props.max > min ? props.max : min + 100;
  const steps = typeof props.steps === 'number' && props.steps > 0 ? props.steps : undefined;
  const value = Math.min(Math.max(typeof props.value === 'number' ? props.value : min, min), max);
  const setValue = setterOf(props, 'value');
  const width = useRef(0);
  const set = useRef(setValue);
  set.current = setValue;
  const valueAt = (x: number) => {
    const share = width.current > 0 ? Math.min(Math.max(x / width.current, 0), 1) : 0;
    const raw = min + share * (max - min);
    if (!steps) return raw;
    const step = (max - min) / steps;
    return min + Math.round((raw - min) / step) * step;
  };
  const valueAtRef = useRef(valueAt);
  valueAtRef.current = valueAt;
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: ({ nativeEvent }) =>
          set.current?.(valueAtRef.current(nativeEvent.locationX)),
        onPanResponderMove: ({ nativeEvent }) =>
          set.current?.(valueAtRef.current(nativeEvent.locationX)),
        onPanResponderTerminationRequest: () => false,
        onStartShouldSetPanResponder: () => true,
      }),
    [],
  );
  const share = `${((value - min) / (max - min)) * 100}%` as DimensionValue;
  const step = steps ? (max - min) / steps : (max - min) / 10;
  return (
    <View style={styles.field}>
      <FieldLabel text={textOf(props.label)} />
      <View
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        accessibilityRole='adjustable'
        accessibilityValue={{ max, min, now: value }}
        onAccessibilityAction={({ nativeEvent }) =>
          setValue?.(
            Math.min(
              Math.max(value + (nativeEvent.actionName === 'increment' ? step : -step), min),
              max,
            ),
          )
        }
        onLayout={({ nativeEvent }) => {
          width.current = nativeEvent.layout.width;
        }}
        style={styles.slider}
        {...responder.panHandlers}
      >
        <View style={[styles.track, { backgroundColor: palette.border }]}>
          <View style={[styles.trackFill, { backgroundColor: palette.accent, width: share }]} />
        </View>
        <View
          pointerEvents='none'
          style={[
            styles.thumb,
            { backgroundColor: palette.surface, borderColor: palette.accent, left: share },
          ]}
        />
      </View>
    </View>
  );
};

// A2UI's DateTimeInput: the date, the time or both, picked in a sheet.
const DateTimeInput = ({ props }: A2UIComponentProps) => {
  const theme = useA2UITheme();
  const palette = usePalette();
  const errors = errorsOf(props);
  const label = textOf(props.label);
  // Both are off unless the agent says, which would leave nothing to pick: then it is a date.
  const enableTime = props.enableTime === true;
  const enableDate = props.enableDate === true || !enableTime;
  return (
    <View style={styles.field}>
      <FieldLabel text={label} />
      <DateTimeInputView
        enableDate={enableDate}
        enableTime={enableTime}
        hasError={errors.length > 0}
        inputStyle={theme.input}
        label={label || undefined}
        max={typeof props.max === 'string' ? props.max : undefined}
        min={typeof props.min === 'string' ? props.min : undefined}
        onChange={setterOf(props, 'value')}
        palette={palette}
        value={textOf(props.value)}
      />
      <Problems errors={errors} />
    </View>
  );
};

/** The views of the basic catalog's components, by their A2UI type. */
export const A2UI_BASIC_COMPONENTS: A2UIComponents = {
  AudioPlayer,
  Button,
  Card,
  CheckBox,
  ChoicePicker,
  Column,
  DateTimeInput,
  Divider,
  Icon,
  Image: ImageComponent,
  List,
  Modal,
  Row,
  Slider,
  Tabs,
  Text,
  TextField,
  Video,
};

const styles = StyleSheet.create({
  borderless: { paddingHorizontal: 0 },
  followUp: { alignSelf: 'stretch' },
  followUpAfter: { borderTopWidth: StyleSheet.hairlineWidth },
  followUpButton: { alignItems: 'flex-start', alignSelf: 'stretch' },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: primitives.spacingMd,
    paddingVertical: 10,
  },
  buttonText: { fontSize: primitives.typographyFontSizeMd, fontWeight: '600' },
  capsule: {
    borderRadius: 9999,
    paddingHorizontal: primitives.spacingSm,
    paddingVertical: primitives.spacingXs,
  },
  capsuleText: { fontSize: primitives.typographyFontSizeSm, fontWeight: '600' },
  caption: { fontSize: primitives.typographyFontSizeXs },
  card: { borderRadius: primitives.radiusLg, padding: primitives.spacingSm },
  chip: { borderWidth: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: primitives.spacingXs },
  choice: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: primitives.spacingXs,
    paddingVertical: 6,
  },
  choiceText: { flexShrink: 1, fontSize: primitives.typographyFontSizeMd },
  divider: { alignSelf: 'stretch', height: StyleSheet.hairlineWidth },
  dividerVertical: { alignSelf: 'stretch', width: StyleSheet.hairlineWidth },
  field: { gap: primitives.spacingXxs },
  flex: { gap: primitives.spacingXs },
  image: { borderRadius: primitives.radiusMd },
  input: {
    borderRadius: primitives.radiusMd,
    borderWidth: 1,
    fontSize: primitives.typographyFontSizeMd,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  label: { fontSize: primitives.typographyFontSizeSm },
  longText: { minHeight: 80, textAlignVertical: 'top' },
  mark: {
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  markDot: { borderRadius: 4, height: 8, width: 8 },
  markRound: { borderRadius: 10 },
  problems: { fontSize: primitives.typographyFontSizeXs },
  row: { flexDirection: 'row' },
  sheet: { flex: 1, padding: primitives.spacingMd },
  sheetClose: { alignSelf: 'flex-end', paddingVertical: primitives.spacingXs },
  slider: { height: 32, justifyContent: 'center' },
  tabs: { gap: primitives.spacingXs, paddingBottom: primitives.spacingXs },
  thumb: {
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    marginLeft: -11,
    position: 'absolute',
    width: 22,
  },
  track: { borderRadius: 2, height: 4, overflow: 'hidden' },
  trackFill: { height: 4 },
});
