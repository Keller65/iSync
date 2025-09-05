import AntDesign from '@expo/vector-icons/AntDesign';
import * as Network from 'expo-network';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, runOnJS, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function ConnectivityBanner({
  pollMs = 5000,
  message = 'No tienes conexión',
  visibleWhen = 'offline',
  withIcon = true,
  entering = SlideInDown.springify().damping(18),
  exiting = SlideOutDown.duration(260),
  fade = false,
  swipeToDismiss = true,
  dismissThreshold = 40,
}: {
  pollMs?: number;
  message?: string;
  visibleWhen?: 'offline';
  withIcon?: boolean;
  entering?: any;
  exiting?: any;
  fade?: boolean;
  swipeToDismiss?: boolean;
  dismissThreshold?: number;
}) {
  const [isConnected, setIsConnected] = useState(true);
  const [show, setShow] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const firstRun = useRef(true);
  const translateY = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (!mounted) return;
        const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
        setIsConnected(connected);
      } catch {
        if (mounted) setIsConnected(false);
      }
    };
    check();
    const id = setInterval(check, pollMs);
    return () => { mounted = false; clearInterval(id); };
  }, [pollMs]);

  useEffect(() => {
    const offline = !isConnected;
    if (visibleWhen === 'offline') {
      if (offline && !isDismissed) {
        setShow(true);
      } else if (!offline) {
        setIsDismissed(false);
        if (!firstRun.current) setShow(false);
      }
    }
    firstRun.current = false;
  }, [isConnected, visibleWhen, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    translateY.value = withTiming(100, { duration: 180 }, (finished) => {
      if (finished) runOnJS(setShow)(false);
    });
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (!swipeToDismiss) return;
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd(() => {
      if (!swipeToDismiss) return;
      if (translateY.value > dismissThreshold) {
        runOnJS(handleDismiss)();
      } else {
        translateY.value = withTiming(0, { duration: 160 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!show) return null;

  const enterAnim = fade ? FadeIn.duration(180) : entering;
  const exitAnim = fade ? FadeOut.duration(180) : exiting;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={enterAnim}
        exiting={exitAnim}
        style={animatedStyle}
        className='items-center justify-center p-2 absolute bottom-14 z-10 left-0 right-0'
      >
        <View className="bg-white p-4 gap-2 my-2 border border-gray-100 shadow-md w-[230px] min-h-[50px] rounded-full items-center justify-center flex-row">
          {withIcon && <AntDesign name="cloudo" size={20} color="#4b5563" />}
          <Text className="text-gray-600 text-[12px] font-[Poppins-SemiBold] tracking-[-0.3px]">{message}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
