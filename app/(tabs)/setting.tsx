import { useLicense } from '@/auth/useLicense';
import { SettingItem, SettingsSection } from '@/components/SettingItem';
import { useAuth } from '@/context/auth';
import { usePushNotificationsFCM } from '@/hooks/usePushNotificationsFCM';
import api from '@/lib/api';
import { useAppStore } from '@/state';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, View } from 'react-native';

const SettingsScreen = () => {
  const { logout, user } = useAuth();
  // Apariencia
  const [darkMode, setDarkMode] = useState(false);
  // Seguridad
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  // Sincronización
  const [syncTime, setSyncTime] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  // Notificaciones
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  // Estado general
  const [loading, setLoading] = useState(false);
  // Estado para actualizaciones OTA reales
  const [updating, setUpdating] = useState(false);
  const [exportingLogs, setExportingLogs] = useState(false);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [macAddress, setMacAddress] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { uuid } = useLicense();
  const { fetchUrl } = useAppStore();
  const API_BASE_URL = fetchUrl;

  const { fcmToken } = usePushNotificationsFCM();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bioEnabled, lastSync, dark, push, sound] = await Promise.all([
          AsyncStorage.getItem('settings:biometricEnabled').then(v => v ?? AsyncStorage.getItem('biometricEnabled')),
          AsyncStorage.getItem('lastSyncTime'),
          AsyncStorage.getItem('settings:darkMode'),
          AsyncStorage.getItem('settings:pushEnabled'),
          AsyncStorage.getItem('settings:soundEnabled'),
        ]);
        if (bioEnabled) setBiometricEnabled(bioEnabled === 'true');
        if (lastSync) setSyncTime(lastSync);
        if (dark) setDarkMode(dark === 'true');
        if (push) setPushEnabled(push === 'true');
        if (sound) setSoundEnabled(sound === 'true');
      } catch (e) {
        console.warn('Error cargando settings', e);
      }
      checkLocationServicesStatus();
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchMacAddress = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setMacAddress(await Network.getIpAddressAsync());
      } catch (e) {
        console.warn('Error obteniendo la dirección MAC', e);
        setMacAddress('Error');
      }
    };
    fetchMacAddress();
  }, []);

  const checkLocationServicesStatus = async () => {
    let enabled = await Location.hasServicesEnabledAsync();
    setLocationServicesEnabled(enabled);
    if (!enabled) {
      Alert.alert(
        'Ubicación Desactivada',
        'Por favor, activa los servicios de ubicación de tu dispositivo para usar todas las funciones.'
      );
    }
  };

  const handleClearData = async () => {
    Alert.alert('Confirmar', '¿Deseas borrar toda la data local (cerrarás sesión)?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, borrar',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await AsyncStorage.clear();
          setLoading(false);
          Alert.alert('Éxito', 'Datos eliminados. Reinicia la app para aplicar totalmente.');
        },
      },
    ]);
  };

  const handleClearCacheSelective = async () => {
    Alert.alert('Confirmar', 'Se limpiará la caché (sin afectar preferencias ni sesión). ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpiar', style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            const keys = await AsyncStorage.getAllKeys();
            const preservePrefixes = ['settings:', 'user', 'auth:', 'biometric'];
            const toDelete = keys.filter(k => !preservePrefixes.some(p => k.startsWith(p)));
            if (toDelete.length) await AsyncStorage.multiRemove(toDelete);
            Alert.alert('Listo', 'Caché limpia.');
          } catch (e) {
            Alert.alert('Error', 'No se pudo limpiar la caché.');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Confirmar', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await logout();
          setLoading(false);
        },
      },
    ]);
  };

  const fetchPaymentAccounts = useCallback(async () => {
    if (syncLoading) return;
    setSyncLoading(true);

    try {
      const urls = [
        '/api/BankAccounts/PayCheque',
        '/api/BankAccounts/PayEfectivo',
        '/api/BankAccounts/PayTranferencia',
        '/api/BankAccounts/PayCreditCards',
        '/sap/items/categories'
      ];

      const results = await Promise.allSettled(
        urls.map(url =>
          api.get(url, {
            baseURL: API_BASE_URL,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user?.token}`
            },
            cache: {
              ttl: Infinity,    // cache infinito
              override: true,   // siempre actualizar desde servidor
            },
          })
        )
      );

      const chequeRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const efectivoRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const transfRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const creditCardRes = results[3].status === 'fulfilled' ? results[3].value : null;

      if (!chequeRes || !efectivoRes || !transfRes || !creditCardRes) {
        throw new Error('No se pudieron obtener los datos de una o más cuentas.');
      }

      const nowStr = new Date().toLocaleString();
      setSyncTime(nowStr);
      await AsyncStorage.setItem('lastSyncTime', nowStr);

      console.log('Información de pago sincronizada (forzada)');
      Alert.alert('Sincronización completa', 'Los datos se han actualizado.');

    } catch (err) {
      console.error('Error al cargar datos de cuentas:', err);
      Alert.alert('Error', 'No se pudieron sincronizar los datos. Intenta nuevamente.');
    } finally {
      setSyncLoading(false);
    }
  }, [API_BASE_URL, user?.token, syncLoading]);

  // Apariencia
  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await AsyncStorage.setItem('settings:darkMode', String(next));
  };

  // Seguridad / Biometría
  const toggleBiometric = async () => {
    const next = !biometricEnabled;
    if (next) {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
          Alert.alert('No disponible', 'Tu dispositivo no soporta biometría.');
          return;
        }
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) {
          Alert.alert('Configura primero', 'No hay biometría registrada en el sistema.');
          return;
        }
        const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirmar activación', disableDeviceFallback: true });
        if (!res.success) return;
        setBiometricEnabled(true);
        await AsyncStorage.setItem('settings:biometricEnabled', 'true');
      } catch (e) {
        Alert.alert('Error', 'No se pudo activar.');
      }
    } else {
      setBiometricEnabled(false);
      await AsyncStorage.setItem('settings:biometricEnabled', 'false');
    }
  };

  // Notificaciones
  const requestPushPermission = async () => {
    try {
      const settings = await Notifications.getPermissionsAsync();
      let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
      if (!granted) {
        const ask = await Notifications.requestPermissionsAsync();
        granted = ask.granted || ask.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
      }
      if (granted) {
        setPushEnabled(true);
        await AsyncStorage.setItem('settings:pushEnabled', 'true');
      } else {
        Alert.alert('Permiso denegado', 'No se habilitarán notificaciones.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo solicitar permiso.');
    }
  };

  const togglePush = async () => {
    if (!pushEnabled) {
      await requestPushPermission();
    } else {
      setPushEnabled(false);
      await AsyncStorage.setItem('settings:pushEnabled', 'false');
    }
  };

  const handleTogglePush = async () => {
    await requestPushPermission();
    togglePush();
  };

  const toggleSound = async () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    await AsyncStorage.setItem('settings:soundEnabled', String(next));
  };

  // Actualizaciones OTA reales
  const handleCheckUpdate = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert('Actualización lista', 'Se descargó una nueva versión.', [
          { text: 'Reiniciar ahora', onPress: () => Updates.reloadAsync() },
          { text: 'Luego', style: 'cancel' }
        ]);
      } else {
        Alert.alert('Al día', 'No hay actualizaciones disponibles.');
      }
    } catch (e: any) {
      if (e?.message?.includes('disabled')) {
        Alert.alert('Deshabilitado', 'OTA updates no están habilitadas en esta build.');
      } else {
        Alert.alert('Error', 'No se pudo verificar actualizaciones.');
      }
    } finally {
      setUpdating(false);
    }
  };

  // Exportar logs
  const handleExportLogs = async () => {
    setExportingLogs(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys.slice(0, 50));
      const appVersion = (Constants as any).executionEnvironment ? (Constants as any).expoConfig?.version : undefined;
      const legacyVersion = (Constants as any).manifest?.version;
      const resolvedVersion = appVersion || legacyVersion || 'N/A';
      const content = [
        '=== LOGS SIMPLES ===',
        `Fecha: ${new Date().toISOString()}`,
        `Usuario: ${user?.fullName || 'N/A'}`,
        `Versión: ${resolvedVersion}`,
        '--- AsyncStorage (parcial) ---',
        ...pairs.map(([k, v]) => `${k}: ${v?.slice(0, 120)}`)
      ].join('\n');
      const fileUri = FileSystem.cacheDirectory + 'app_logs.txt';
      await FileSystem.writeAsStringAsync(fileUri, content);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: 'Compartir logs' });
      } else {
        Alert.alert('No soportado', 'La función de compartir no está disponible.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar.');
    } finally {
      setExportingLogs(false);
    }
  };

  const handleCopyDeviceInfo = () => {
    const appVersion = (Constants as any).expoConfig?.version || (Constants as any).manifest?.version || 'N/D';
    const info = `Device: ${Device.deviceName}\nOS: ${Device.osName} ${Device.osVersion}\nVersión App: ${appVersion}`;
    Alert.alert('Información del dispositivo', info);
  };


  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <SettingsSection title="Sistema">
        <SettingItem
          kind="info"
          title={`Versión ${(Constants as any).expoConfig?.version || (Constants as any).manifest?.version || 'N/D'}`}
          subtitle={`${Device.deviceName || 'Dispositivo'} • ${Device.osName} ${Device.osVersion || ''}`}
          iconLeft={<Feather name="cpu" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
        />
        <SettingItem
          kind="info"
          title="Ubicación"
          subtitle={locationServicesEnabled ? 'Activa' : 'Desactivada'}
          iconLeft={<Feather name="map-pin" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
        />
        <SettingItem
          kind="info"
          title="Dirección IP"
          subtitle={macAddress || 'Cargando...'}
          iconLeft={<Feather name="wifi" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
        />
      </SettingsSection>

      <SettingsSection title="Seguridad">
        <SettingItem
          kind="toggle"
          title="Autenticación biométrica"
          subtitle="Requerir biometría para iniciar sesión"
          value={biometricEnabled}
          onChange={toggleBiometric}
          iconLeft={<Feather name="shield" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
        />
      </SettingsSection>

      <SettingsSection title="Sincronización">
        <SettingItem
          kind="action"
          title="Sincronizar información"
          subtitle={syncLoading ? 'Sincronizando...' : syncTime ? `Última: ${syncTime}` : 'Nunca sincronizado'}
          onPress={fetchPaymentAccounts}
          iconLeft={<Feather name="refresh-cw" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
          rightContent={syncLoading ? <ActivityIndicator size="small" /> : undefined}
          disabled={syncLoading}
        />
      </SettingsSection>

      <SettingsSection title="Notificaciones">
        <SettingItem
          kind="toggle"
          title="Notificaciones push"
          subtitle="Permitir avisos importantes"
          value={pushEnabled}
          onChange={handleTogglePush}
          iconLeft={<Feather name="bell" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
        />
        <SettingItem
          kind="toggle"
          title="Sonido"
          subtitle="Reproducir sonido en notificaciones"
          value={soundEnabled}
          onChange={toggleSound}
          iconLeft={<Feather name="volume-2" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
          disabled={!pushEnabled}
        />
        <SettingItem
          kind="action"
          title="Push Token"
          subtitle={pushEnabled ? fcmToken || 'No disponible' : 'Desactivado'}
          iconLeft={<Feather name="key" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
          onPress={() => {
            if (fcmToken) {
              Clipboard.setStringAsync(fcmToken);
              Alert.alert('Copiado', 'El Push Token ha sido copiado al portapapeles.');
            } else {
              Alert.alert('Error', 'No hay token disponible para copiar.');
            }
          }}
        />
      </SettingsSection>

      <SettingsSection title="Soporte">
        <SettingItem
          kind="action"
          title="Buscar actualizaciones"
          subtitle={updating ? 'Verificando...' : 'Aplicar última versión OTA'}
          onPress={handleCheckUpdate}
          iconLeft={<Feather name="cloud" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
          rightContent={updating ? <ActivityIndicator size="small" /> : undefined}
          disabled={updating}
        />
        <SettingItem
          kind="action"
          title="Exportar logs"
          subtitle="Compartir información técnica"
          onPress={handleExportLogs}
          iconLeft={<Feather name="share-2" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
          rightContent={exportingLogs ? <ActivityIndicator size="small" /> : undefined}
          disabled={exportingLogs}
        />
        <SettingItem
          kind="action"
          title="Copiar info del dispositivo"
          subtitle="Para soporte técnico"
          onPress={handleCopyDeviceInfo}
          iconLeft={<Feather name="copy" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
        />
      </SettingsSection>

      <SettingsSection title="Licencia">
        <SettingItem
          kind="action"
          title="UUID del Dispositivo"
          subtitle={uuid || 'Cargando...'}
          iconLeft={<Feather name="key" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
          onPress={() => {
            if (uuid) {
              Clipboard.setStringAsync(uuid);
              Alert.alert('Copiado', 'El UUID ha sido copiado al portapapeles.');
            } else {
              Alert.alert('Error', 'No hay UUID disponible para copiar.');
            }
          }}
        />
      </SettingsSection>

      <SettingsSection title="Datos y sesión">
        <SettingItem
          kind="action"
          title="Limpiar caché"
          subtitle="Elimina datos temporales"
          onPress={handleClearCacheSelective}
          iconLeft={<Feather name="database" size={18} color="#4B5563" style={{ marginRight: 12 }} />}
        />
        <SettingItem
          kind="action"
          title="Borrar data local"
          subtitle="Incluye sesión y preferencias"
          onPress={handleClearData}
          iconLeft={<Feather name="trash-2" size={18} color="#dc2626" style={{ marginRight: 12 }} />}
          danger
        />
        <SettingItem
          kind="action"
          title="Cerrar sesión"
          subtitle={loading ? 'Cerrando...' : user?.fullName}
          onPress={handleLogout}
          iconLeft={<Feather name="log-out" size={18} color="#dc2626" style={{ marginRight: 12 }} />}
          danger
          disabled={loading}
          rightContent={loading ? <ActivityIndicator size="small" /> : undefined}
        />
      </SettingsSection>

      <View className="mt-4">
        <Text className="text-center text-gray-400 text-[11px] font-[Poppins-Regular] tracking-[-0.3px]">
          © {new Date().getFullYear()} Grupo Alfa & Omega S. de R. L. de C. V. - Todos los derechos reservados
        </Text>
        <Text className="text-center text-gray-300 text-[10px] mt-1">{Platform.OS.toUpperCase()} Build</Text>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;