import { useAppStore } from '@/state';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type UsePushReturn = {
  fcmToken: string | null;
  permissionGranted: boolean;
};

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('Manejando notificación (sin I/O):', notification.request.content.title);
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      channelId: 'default',
      sound: 'notification.wav',
    };
  },
});

export function usePushNotificationsFCM(): UsePushReturn {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const ensureAndroidChannel = useCallback(async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        description: 'General notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'notification.wav', // El sonido esta en android/app/src/main/res/raw/notification.wav
      });
    }
  }, []);

  useEffect(() => {
    (async () => {
      // console.log('Iniciando configuración de notificaciones...');
      await ensureAndroidChannel();

      if (!Device.isDevice) {
        console.error('No es un dispositivo físico, saltando obtención de token');
        return;
      }

      // console.log('Verificando permisos...');
      // Android 13+ necesita permiso en tiempo de ejecución; esto lo gestiona expo-notifications
      const { status: existing } = await Notifications.getPermissionsAsync();
      // console.log('Estado de permisos existente:', existing);
      let status = existing;
      if (existing !== 'granted') {
        // console.log('Solicitando permisos...');
        const req = await Notifications.requestPermissionsAsync();
        status = req.status;
        // console.log('Estado de permisos después de solicitud:', status);
      }
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) {
        console.log('Permisos no concedidos, no se puede obtener token');
        return;
      }

      // console.log('Obteniendo token FCM...');
      try {
        // IMPORTANTE: para FCM usa el token de dispositivo nativo (no ExpoPushToken)
        const tokenResult = await Notifications.getDevicePushTokenAsync();
        const nativeToken = tokenResult.data;
        // console.log('Token FCM obtenido:', nativeToken);
        setFcmToken(nativeToken);
        try {
          useAppStore.setState({ fcmToken: nativeToken });
          console.info('Token FCM guardado en el store:', nativeToken);
        } catch (e) {
          console.warn('No se pudo guardar fcmToken en el store:', e);
        }
      } catch (error) {
        console.error('Error obteniendo token FCM:', error);
      }
    })();

    // Listeners de eventos (foreground / interacción)
    const sub1 = Notifications.addNotificationReceivedListener(() => { });
    const sub2 = Notifications.addNotificationResponseReceivedListener(() => { });
    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [ensureAndroidChannel]);

  return { fcmToken, permissionGranted };
}
