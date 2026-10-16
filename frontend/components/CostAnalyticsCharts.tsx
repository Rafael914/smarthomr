import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import styles from "../styles/pzemHistory";

export type CostChartDatum = {
  label: string;
  estimatedCost: number;
  usage: number;
};

type Props = {
  records: CostChartDatum[];
  ratePerKwh: number;
  formatValue: (value: number) => string;
};

const WIDTH = 680;
const HEIGHT = 244;
const LEFT = 66;
const RIGHT = 18;
const TOP = 18;
const BOTTOM = 42;
const PLOT_WIDTH = WIDTH - LEFT - RIGHT;
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM;

function chartLabel(label: string): string {
  return label.length > 8 ? label.slice(0, 8) : label;
}

export default function CostAnalyticsCharts({ records, ratePerKwh, formatValue }: Props) {
  const showingCost = ratePerKwh > 0;
  const timeline = [...records].reverse();
  const valueOf = (item: CostChartDatum) => showingCost ? item.estimatedCost : item.usage;
  const scaleMaximum = Math.max(...timeline.map(valueOf), 0.01) * 1.15;
  const stepX = timeline.length > 1 ? PLOT_WIDTH / (timeline.length - 1) : 0;
  const points = timeline.map((item, index) => ({
    x: timeline.length === 1 ? LEFT + PLOT_WIDTH / 2 : LEFT + index * stepX,
    y: TOP + PLOT_HEIGHT - (valueOf(item) / scaleMaximum) * PLOT_HEIGHT,
    item,
  }));
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaPath = points.length > 1
    ? `${linePath} L${points[points.length - 1].x},${TOP + PLOT_HEIGHT} L${points[0].x},${TOP + PLOT_HEIGHT} Z`
    : "";
  const labelIndexes = new Set(
    Array.from({ length: Math.min(6, timeline.length) }, (_, index) =>
      timeline.length < 2 ? 0 : Math.round((index * (timeline.length - 1)) / (Math.min(6, timeline.length) - 1)),
    ),
  );
  const barSlot = timeline.length ? PLOT_WIDTH / timeline.length : PLOT_WIDTH;
  const barWidth = Math.min(28, barSlot * 0.62);

  const chart = (kind: "line" | "bar") => (
    <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      {timeline.length > 0 && [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const y = TOP + PLOT_HEIGHT - fraction * PLOT_HEIGHT;
        return (
          <React.Fragment key={fraction}>
            <Line x1={LEFT} y1={y} x2={WIDTH - RIGHT} y2={y} stroke="#20354a" strokeWidth={1} />
            <SvgText x={LEFT - 8} y={y + 4} fill="#8192a6" fontSize={10} textAnchor="end">
              {formatValue(scaleMaximum * fraction)}
            </SvgText>
          </React.Fragment>
        );
      })}
      {timeline.length === 0 ? (
        <SvgText x={LEFT + PLOT_WIDTH / 2} y={TOP + PLOT_HEIGHT / 2} fill="#8192a6" fontSize={13} textAnchor="middle">
          No data yet
        </SvgText>
      ) : null}
      {kind === "line" && areaPath ? <Path d={areaPath} fill="#1c765f" opacity={0.22} /> : null}
      {kind === "line" && linePath ? <Path d={linePath} fill="none" stroke="#48ddb0" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" /> : null}
      {kind === "bar" ? points.map((point, index) => {
        const x = timeline.length === 1 ? point.x - barWidth / 2 : LEFT + index * barSlot + (barSlot - barWidth) / 2;
        const height = Math.max(2, TOP + PLOT_HEIGHT - point.y);
        return <Rect key={`${point.item.label}-${index}`} x={x} y={point.y} width={barWidth} height={height} rx={4} fill="#39c99b" opacity={0.9} />;
      }) : null}
      {kind === "line" ? points.map((point, index) => (
        <Circle key={`${point.item.label}-${index}`} cx={point.x} cy={point.y} r={3.5} fill="#a7f3d0" stroke="#0b1d30" strokeWidth={2} />
      )) : null}
      {points.map((point, index) => labelIndexes.has(index) ? (
        <SvgText key={`${point.item.label}-label-${index}`} x={point.x} y={HEIGHT - 12} fill="#91a1b4" fontSize={10} textAnchor="middle">
          {chartLabel(point.item.label)}
        </SvgText>
      ) : null)}
    </Svg>
  );

  return (
    <View style={styles.chartsSection}>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{showingCost ? "Cost trend" : "Energy use trend"}</Text>
        <Text style={styles.chartSubtitle}>{showingCost ? "Combined cost across all five relays" : "Combined energy use across all five relays"}</Text>
        {chart("line")}
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{showingCost ? "Cost by period" : "Usage by period"}</Text>
        <Text style={styles.chartSubtitle}>{showingCost ? "Combined relay cost for each reading interval" : "Combined relay use for each reading interval"}</Text>
        {chart("bar")}
      </View>
    </View>
  );
}
