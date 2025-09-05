import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export type GoalDonutProps = {
  title?: string;
  current: number;
  target: number;
  progressPct?: number;
  currency?: string;
  centerLabelPrimary?: string;
  centerLabelSecondary?: string;
  lastUpdated?: string;
  loading?: boolean; // Asegurarse de que loading esté definido en las props
};

export default function GoalDonut({
  title = 'Meta mensual',
  current,
  target,
  progressPct,
  currency,
  centerLabelPrimary,
  centerLabelSecondary,
  lastUpdated,
  loading = false, // Valor predeterminado para evitar undefined
}: GoalDonutProps) {
  const scale = useRef(new Animated.Value(0.94)).current;
  const [displayPercent, setDisplayPercent] = useState(0);

  if (loading) {
    return (
      <View className="bg-white rounded-2xl px-4 py-3 border border-gray-100 w-full items-center justify-center">
        <ActivityIndicator size="large" color="#6b7280" />
      </View>
    );
  }

  const rawProgress = (() => {
    if (progressPct != null) return progressPct;
    if (!target) return 0;
    return (current / target) * 100;
  })();
  const boundedProgress = Math.max(0, Math.min(100, rawProgress));

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 90 }).start();
  }, [scale]);

  useEffect(() => {
    const duration = 800;
    const frames = Math.max(1, Math.floor(duration / 16));
    const inc = boundedProgress / frames;
    let i = 0;
    let acc = 0;
    const id = setInterval(() => {
      i += 1;
      acc += inc;
      if (i >= frames) {
        setDisplayPercent(Math.round(boundedProgress));
        clearInterval(id);
      } else {
        setDisplayPercent(Math.round(acc));
      }
    }, 16);
    return () => clearInterval(id);
  }, [boundedProgress]);

  const outerRadius = 70;
  const strokeWidth = 20;
  const size = outerRadius * 2;
  const r = outerRadius - strokeWidth / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - displayPercent / 100);

  const trackColor = '#f2f2f2';
  const progressColor = (() => {
    if (displayPercent < 25) return '#ff7b72';
    if (displayPercent < 50) return '#ffc94d';
    if (displayPercent < 75) return '#00a6ff';
    return '#00e053';
  })();

  function formatCompact(value: number | undefined, currency?: string) {
    if (value == null || isNaN(value)) return '--';
    const units = [
      { v: 1e9, s: 'B' },
      { v: 1e6, s: 'M' },
      { v: 1e3, s: 'k' }
    ];
    for (const u of units) {
      if (value >= u.v) return `${currency ? currency + ' ' : ''}${(value / u.v).toFixed(1)}${u.s}`;
    }
    return `${currency ? currency + ' ' : ''}${Math.round(value).toLocaleString()}`;
  }

  const centerPrimary = centerLabelPrimary ?? `${displayPercent}%`;
  const centerSecondary = centerLabelSecondary ?? `${formatCompact(current, currency)} de ${formatCompact(target, currency)}`;

  const lastUpdatedText = (() => {
    if (!lastUpdated) return null;
    try {
      const d = new Date(lastUpdated);
      return `Actualizado: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch {
      return null;
    }
  })();

  return (
    <View className="bg-white rounded-2xl px-4 py-3 border border-gray-100 w-full">
      <Text className="text-gray-500 text-xs font-[Poppins-SemiBold] tracking-[-0.3px]">{title}</Text>
      <Text className="text-gray-900 text-[14px] mb-2 font-[Poppins-SemiBold] tracking-[-0.3px]">{target.toLocaleString()}</Text>

      <View className="items-center">
        <Animated.View style={{ transform: [{ scale }] }}>
          <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size}>
              {/* Track */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={trackColor}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={progressColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <Text className="text-gray-900 font-[Poppins-SemiBold] tracking-[-0.3px] text-xl">{centerPrimary}</Text>
              <Text className="text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] text-[10px]">{centerSecondary}</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {lastUpdatedText && (
        <Text className="text-[10px] text-gray-400 mt-4 font-[Poppins-Regular] tracking-[-0.3px]">{lastUpdatedText}</Text>
      )}
    </View>
  );
}
