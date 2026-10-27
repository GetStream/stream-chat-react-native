import React from 'react';
import { AccessibilityInfo, Pressable } from 'react-native';

import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';

import { type DeepPartial, StreamTheme, type Theme, VoiceGlow, VoiceWave } from '../index';
import { rgbToHsv } from '../voice-visualization/palette';
import { GLOW_STYLE, WAVE_STYLE } from '../voice-visualization/styles';
import type { VoiceVisualizationProps } from '../voice-visualization/types';
import { useVoiceVisualization } from '../voice-visualization/useVoiceVisualization';
import { waveColors, wavePath } from '../voice-visualization/waveGeometry';

const themed =
  (style?: DeepPartial<Theme>) =>
  ({ children }: { children: React.ReactNode }) => (
    <StreamTheme style={style}>{children}</StreamTheme>
  );

const layout = (width: number, height: number) => ({
  nativeEvent: { layout: { height, width, x: 0, y: 0 } },
});

const renderVisualization = (
  props: Partial<VoiceVisualizationProps> = {},
  style?: DeepPartial<Theme>,
  visualStyle = GLOW_STYLE,
) =>
  renderHook(
    (hookProps: VoiceVisualizationProps) => useVoiceVisualization(hookProps, visualStyle),
    { initialProps: { state: 'idle', ...props }, wrapper: themed(style) },
  );

const hueOf = (color: [number, number, number]) => rgbToHsv(color).hue;

describe('VoiceGlow and VoiceWave', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['VoiceGlow', VoiceGlow],
    ['VoiceWave', VoiceWave],
  ])('%s names itself and its state, as on iOS and Android', (_, Component) => {
    const { rerender } = render(<Component state='idle' />, { wrapper: themed() });

    const root = screen.getByLabelText('Voice agent');
    expect(root.props.accessibilityRole).toBe('image');
    expect(root.props.accessibilityValue).toEqual({ text: 'Ready' });

    rerender(<Component state='speaking' />);
    expect(screen.getByLabelText('Voice agent').props.accessibilityValue).toEqual({
      text: 'Speaking',
    });
  });

  it('takes a label and value of its own', () => {
    render(
      <VoiceGlow
        accessibilityLabel='Assistant'
        accessibilityValue={{ text: 'Talking' }}
        state='speaking'
      />,
      { wrapper: themed() },
    );

    expect(screen.getByLabelText('Assistant').props.accessibilityValue).toEqual({
      text: 'Talking',
    });
  });

  it.each([
    ['VoiceGlow', VoiceGlow],
    ['VoiceWave', VoiceWave],
  ])('%s draws once it has a size', (_, Component) => {
    render(<Component state='thinking' />, { wrapper: themed() });
    expect(screen.queryByTestId('skia-canvas')).toBeNull();

    fireEvent(screen.getByLabelText('Voice agent'), 'layout', layout(300, 200));

    expect(screen.getByTestId('skia-canvas')).toBeTruthy();
    expect(screen.getByTestId('voice-visualization-hit-area')).toBeTruthy();
  });

  it('lets a press on the shape reach a parent', () => {
    const onPress = jest.fn();
    render(
      <Pressable onPress={onPress}>
        <VoiceGlow state='idle' />
      </Pressable>,
      { wrapper: themed() },
    );
    fireEvent(screen.getByLabelText('Voice agent'), 'layout', layout(300, 300));

    const hitArea = screen.getByTestId('voice-visualization-hit-area');
    fireEvent(hitArea, 'touchEnd', { nativeEvent: { locationX: 96, locationY: 96 } });
    fireEvent.press(hitArea);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('compiles the glow shader once for every glow', () => {
    // A fresh copy of the module, so a shader compiled by an earlier test doesn't hide a miss.
    jest.isolateModules(() => {
      const { Skia: freshSkia } = require('@shopify/react-native-skia');
      const { getGlowEffect } = require('../voice-visualization/glowShader');
      const make = jest.spyOn(freshSkia.RuntimeEffect, 'Make');

      const first = getGlowEffect();
      const second = getGlowEffect();

      expect(make).toHaveBeenCalledTimes(1);
      expect(second).toBe(first);
    });
  });

  it('keeps the touch area as a real view, so taps on the shape land', () => {
    render(<VoiceWave state='idle' />, { wrapper: themed() });
    fireEvent(screen.getByLabelText('Voice agent'), 'layout', layout(300, 200));

    expect(screen.getByTestId('voice-visualization-hit-area').props.collapsable).toBe(false);
  });

  it('reads translated state values', () => {
    render(<VoiceGlow state='thinking' stateLabels={{ thinking: 'Denkt nach' }} />, {
      wrapper: themed(),
    });

    expect(screen.getByLabelText('Voice agent').props.accessibilityValue).toEqual({
      text: 'Denkt nach',
    });
  });
});

describe('voice visualization motion', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses its own colors first', () => {
    const { result } = renderVisualization({ colors: ['#ff0000', 'nope', '#00ff00'] });

    expect(result.current.driver.value.colors[0].hue).toBe(hueOf([1, 0, 0]));
    expect(result.current.driver.value.colors[1].hue).toBe(hueOf([0, 1, 0]));
    expect(result.current.driver.value.count).toBe(2);
  });

  it('falls back to the theme, then to the default accent', () => {
    const fromTheme = renderVisualization(
      { colors: [] },
      {
        voiceVisualization: { colors: ['#00ff00'] },
      },
    );
    expect(fromTheme.result.current.driver.value.colors[0].hue).toBe(hueOf([0, 1, 0]));

    const fallback = renderVisualization(
      { colors: ['nope'] },
      {
        voiceVisualization: { colors: ['also-nope'] },
      },
    );
    expect(fallback.result.current.driver.value.colors[0].hue).toBe(hueOf([0, 95 / 255, 1]));
  });

  it('draws for a dark backdrop', () => {
    const light = renderVisualization({}, { voiceVisualization: { backdropColor: '#ffffff' } });
    const dark = renderVisualization({}, { voiceVisualization: { backdropColor: '#101010' } });

    expect(light.result.current.dark.value).toBe(0);
    expect(dark.result.current.dark.value).toBe(1);
  });

  it('takes the wave’s smooth level response and the glow’s steady one', () => {
    const glow = renderVisualization({}, undefined, GLOW_STYLE);
    const wave = renderVisualization({}, undefined, WAVE_STYLE);

    expect(glow.result.current.driver.value.levelResponse).toBe(GLOW_STYLE.levelResponse);
    expect(wave.result.current.driver.value.levelResponse).toBe(WAVE_STYLE.levelResponse);
  });

  it('bounces on a tap, unless motion is reduced', async () => {
    const motion = renderVisualization();
    act(() => motion.result.current.tap(0.1, 0.1));
    expect(motion.result.current.driver.value.tapAge).toBe(0);
    expect(motion.result.current.driver.value.tapX).toBe(0.1);

    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(true);
    const reduced = renderVisualization();
    await act(async () => {
      await Promise.resolve();
    });
    act(() => reduced.result.current.tap(0.1, 0.1));
    expect(reduced.result.current.driver.value.tapAge).toBeGreaterThan(0);
  });

  it('draws the wave as one stroke with its ends faded out', () => {
    const { result } = renderVisualization({ state: 'speaking' }, undefined, WAVE_STYLE);
    const d = result.current.driver.value;

    const path = wavePath(d, 300, 200) as unknown as { commands: Array<[string, number, number]> };
    expect(path.commands).toHaveLength(161);
    expect(path.commands[0][0]).toBe('M');
    expect(path.commands[0][1]).toBeCloseTo(150 - 0.42 * 200, 4);
    expect(path.commands[160][1]).toBeCloseTo(150 + 0.42 * 200, 4);

    const stops = waveColors(d, 0);
    expect(stops).toHaveLength(13);
    expect(stops[0][3]).toBe(0);
    expect(stops[12][3]).toBe(0);
    expect(stops[6][3]).toBeCloseTo(1, 4);
  });
});
