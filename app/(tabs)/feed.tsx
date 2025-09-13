import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';

type StoredNotification = {
  id: number | string;
  title: string;
  message: string;
  time: string;
  icon?: string;
  color?: string;
};

const NotificationItem = React.memo(
  ({
    notification,
    index = 0,
  }: {
    notification: StoredNotification;
    index?: number;
  }) => {
    const translateX = useSharedValue(400); // inicia desde la derecha
    const opacity = useSharedValue(0);
    const scaleY = useSharedValue(0);

    // Animación de entrada con escalonado
    useEffect(() => {
      const delay = index * 50;
      translateX.value = withDelay(
        delay,
        withSpring(0, { damping: 20, stiffness: 150 })
      );
      opacity.value = withDelay(delay, withTiming(1, { duration: 220 }));
      scaleY.value = withDelay(
        delay,
        withSpring(1, { damping: 18, stiffness: 140 })
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }, { scaleY: scaleY.value }],
      opacity: opacity.value,
      marginBottom: opacity.value === 0 ? 0 : 16,
    }));

    return (
      <View className="relative w-full">
        <Animated.View
          style={animatedStyle}
          className="flex-row items-center bg-white rounded-3xl p-4 border border-gray-200 w-full overflow-hidden"
        >
          <View
            className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${notification.color || "bg-primary"
              }`}
          >
            <Ionicons name={notification.icon as any} size={28} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-[Poppins-SemiBold] text-primary tracking-[-0.3px]">
              {notification.title}
            </Text>
            <Text className="text-sm text-gray-700 tracking-[-0.3px]">
              {notification.message}
            </Text>
            <Text className="text-xs text-gray-400 tracking-[-0.3px]">{notification.time}</Text>
          </View>
        </Animated.View>
      </View>
    );
  }
);

const Feed = () => {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      const sub = Notifications.addNotificationReceivedListener(() => {
        loadNotifications();
      });
      return () => {
        sub.remove();
      };
    }, [loadNotifications])
  );

  return (
    <ScrollView
      className="flex-1 bg-white"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View className="px-4">
        <View className="w-full">
          {loading ? (
            <Text className="text-gray-400">Cargando notificaciones...</Text>
          ) : notifications.length === 0 ? (
            <Text className="text-gray-400">No hay notificaciones</Text>
          ) : (
            notifications.map((n, index) => (
              <NotificationItem
                key={String(n.id)}
                notification={n}
                index={index}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default Feed;