import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

type StoredNotification = {
  id: number | string;
  title: string;
  message: string;
  time: string;
  icon?: string;
  color?: string;
};

const Feed = () => {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
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
  };

  // Cuando la pantalla gana foco, recargamos las notificaciones
  useFocusEffect(
    useCallback(() => {
      loadNotifications();

      // Suscribimos para recargar cuando llega una notificación en foreground
      const sub = Notifications.addNotificationReceivedListener(() => {
        loadNotifications();
      });

      return () => {
        sub.remove();
      };
    }, [])
  );

  return (
    <View className="flex-1 bg-white px-4 pt-8">
      <Text className="text-primary text-2xl font-[Poppins-SemiBold] mb-6">Notificaciones</Text>
      <View className="gap-4">
        {loading ? (
          <Text className="text-gray-400">Cargando notificaciones...</Text>
        ) : notifications.length === 0 ? (
          <Text className="text-gray-400">No hay notificaciones</Text>
        ) : (
          notifications.map((n) => (
            <View key={String(n.id)} className="flex-row items-center bg-white rounded-3xl p-4 border border-gray-200">
              <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${n.color || 'bg-primary'}`}>
                <Ionicons name={n.icon as any} size={28} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-[Poppins-SemiBold] text-primary mb-1">{n.title}</Text>
                <Text className="text-sm text-gray-700 mb-1">{n.message}</Text>
                <Text className="text-xs text-gray-400">{n.time}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default Feed;