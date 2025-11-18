import React from 'react';
import { Platform, View } from 'react-native';
import type { ChartSpec } from '../types';
import {
  Area,
  Bar,
  CartesianChart,
  Line,
  Pie,
  PolarChart,
  Scatter,
  // useChartTransformState,
} from 'victory-native';
import { LinearGradient, matchFont, vec } from '@shopify/react-native-skia';
import { PieLegend } from './PieLegend';

const font = matchFont({
  fontFamily: Platform.select({
    ios: 'Helvetica',
    android: 'sans-serif',
    default: 'serif',
  }),
  fontSize: 12,
  fontWeight: 'normal',
  fontStyle: 'normal',
});

export type VictoryChartProps = {
  spec: ChartSpec;
  width: number;
  height: number;
};

const DEFAULT_HEIGHT = 260;
const DEFAULT_WIDTH = 225;

export const VictoryChart = (props: VictoryChartProps) => {
  const { spec, height = DEFAULT_HEIGHT, width = DEFAULT_WIDTH } = props;

  // const { state: transformState } = useChartTransformState({
  //   scaleX: 1.5,
  //   scaleY: 1.0,
  // });

  if (spec.type === 'pie') {
    if (!spec?.data.length) return null;
    return (
      <>
        <View style={{ height, width: 200 }}>
          <PolarChart
            labelKey={'dimension'}
            valueKey={'value'}
            colorKey={'color'}
            data={spec.data}
          >
            <Pie.Chart />
          </PolarChart>
        </View>
        <PieLegend items={spec.data} />
      </>
    );
  }

  // Group by color into series
  const seriesNames = Array.from(
    new Set(spec.data.map((d) => d.color ?? 'series')),
  );
  const yKeys = seriesNames.map((_name, idx) => `y${idx}` as const);

  // Normalize data into one row per x, with columns y0,y1,... for each series
  const rowsMap = new Map<string | number, Record<string, any>>();
  for (const s of seriesNames) {
    const keyIndex = seriesNames.indexOf(s);
    const yKey = yKeys[keyIndex];
    if (yKey) {
      for (const pt of spec.data.filter((d) => (d.color ?? 'series') === s)) {
        const xKey = spec.isTemporalDim
          ? new Date(pt.dimension).getTime()
          : pt.dimension;
        const row = rowsMap.get(xKey) ?? { x: pt.dimension };
        row[yKey] = pt.value;
        rowsMap.set(xKey, row);
      }
    }
  }

  const table = Array.from(rowsMap.values());

  const visibleBars = table.length;

  const estimatedBarWidth = (width - 30 - visibleBars * 2) / visibleBars;

  const maxTickCharCount = spec.isTemporalDim
    ? 3
    : Math.max(
        ...table.map((entry) =>
          typeof entry.x === 'string' ? entry.x.length : String(entry.x).length,
        ),
      );

  const hasLongLabels =
    (visibleBars > 4 ? maxTickCharCount > 1 : maxTickCharCount > 5) &&
    !spec.isNumericDim;

  return (
    <View style={{ height, width, marginTop: 12 }}>
      <CartesianChart
        data={table}
        xKey={'x'}
        yKeys={yKeys}
        domainPadding={{
          left: estimatedBarWidth * 0.8,
          right: estimatedBarWidth * 0.8,
          top: 20,
        }}
        xAxis={{
          font,
          formatXLabel: (label: number | string) => {
            const parsedLabel =
              (typeof label === 'number' ? String(label) : label) ?? '';
            if (hasLongLabels && parsedLabel.length > 4) {
              return `${parsedLabel.slice(0, 3)}...`;
            }
            return parsedLabel;
          },
          labelRotate: hasLongLabels ? 90 : 0,
          tickCount: visibleBars,
          labelOffset: hasLongLabels ? 0 : 2,
        }}
        yAxis={[{ font }]}
        padding={{ bottom: hasLongLabels ? 2 * maxTickCharCount + 12 : 0 }}
        // transformState={transformState}
        // transformConfig={{
        //   pinch: { enabled: false },
        //   pan: { enabled: true, dimensions: 'x', activateAfterLongPress: 10 },
        // }}
      >
        {({ points, chartBounds }) => (
          <>
            {/* One primitive per series */}
            {yKeys.map((yk) => {
              const pts = (points as Record<string, any[]>)[yk]!;
              switch (spec.type) {
                case 'bar':
                  return (
                    <Bar
                      key={yk}
                      chartBounds={chartBounds}
                      points={pts}
                      innerPadding={0.33}
                      roundedCorners={{
                        topLeft: estimatedBarWidth * 0.2,
                        topRight: estimatedBarWidth * 0.2,
                      }}
                    >
                      <LinearGradient
                        start={vec(0, 0)}
                        end={vec(0, 400)}
                        colors={['#a78bfa', '#a78bfa50']}
                      />
                    </Bar>
                  );
                case 'area':
                  return (
                    <Area
                      key={yk}
                      y0={chartBounds.bottom}
                      points={pts}
                      color={'red'}
                    >
                      <LinearGradient
                        start={vec(0, 0)}
                        end={vec(0, 400)}
                        colors={['#a78bfa', '#a78bfa50']}
                      />
                    </Area>
                  );
                case 'point':
                  return (
                    <Scatter
                      key={yk}
                      points={pts}
                      radius={3}
                      color={'#a78bfa'}
                    />
                  );
                case 'line':
                default:
                  return (
                    <Line
                      key={yk}
                      points={pts}
                      strokeWidth={2}
                      color={'#a78bfa'}
                      connectMissingData={true}
                    />
                  );
              }
            })}
          </>
        )}
      </CartesianChart>
    </View>
  );
};
