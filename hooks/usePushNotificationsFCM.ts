import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type UsePushReturn = {
  fcmToken: string | null;
  permissionGranted: boolean;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    channelId: 'default',
    sound: 'notification.wav',
  }),
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
      await ensureAndroidChannel();

      if (!Device.isDevice) return;

      // Android 13+ necesita permiso en tiempo de ejecución; esto lo gestiona expo-notifications
      const { status: existing } = await Notifications.getPermissionsAsync();
      let status = existing;
      if (existing !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        status = req.status;
      }
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) return;

      // IMPORTANTE: para FCM usa el token de dispositivo nativo (no ExpoPushToken)
      const nativeToken = (await Notifications.getDevicePushTokenAsync()).data;
      setFcmToken(nativeToken);
      console.log('FCM Token:', nativeToken);
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
