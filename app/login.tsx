import { useAppStore } from '@/state';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import Animated, { useAnimatedKeyboard, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from "../context/auth";
import "../global.css";

export default function Login() {
  const { user, setUser } = useAuth();
  const [salesPersonCode, setSalesPersonCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const router = useRouter();
  const { fetchUrl } = useAppStore()
  const FETCH_URL = fetchUrl + "/auth/employee";
  const keyboard = useAnimatedKeyboard();

  const isFormValid = salesPersonCode !== "" && password !== "";

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      console.log('Coordenadas:', location.coords);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (user) return;

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const savedBiometricUser = await AsyncStorage.getItem('biometricUser');
        if (savedBiometricUser) {
          const biometricAuth = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Inicia sesión con tu huella o Face ID',
            fallbackLabel: 'Ingresar manualmente',
            biometricsSecurityLevel: 'strong',
            cancelLabel: 'Ingresar manualmente',
          });

          if (biometricAuth.success) {
            const parsedUser = JSON.parse(savedBiometricUser);
            setUser(parsedUser);
            await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
          }
        }
      }
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          console.log('Permiso de notificaciones denegado');
          return;
        }
      }
      console.log('Permiso de notificaciones concedido');
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const savedBiometricUser = await AsyncStorage.getItem('biometricUser');
      setBiometricAvailable(!!savedBiometricUser);
    })();
  }, []);

  const handleLogin = async () => {
    if (loading || !isFormValid) return;
    setLoading(true);

    try {
      const deviceToken = "";

      const response = await axios.post(FETCH_URL, {
        employeeCode: Number(salesPersonCode),
        password: password,
        token: deviceToken,
        salesPersonCode: Number(salesPersonCode)
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data;

      const userData = {
        employeeCode: data.salesPersonCode,
        salesPersonCode: data.salesPersonCode,
        fullName: data.fullName,
        token: data.token
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      Alert.alert(
        'Autenticación rápida',
        '¿Deseas activar el inicio con huella o Face ID para futuros ingresos?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí',
            onPress: async () => {
              await AsyncStorage.setItem('biometricUser', JSON.stringify(userData));
              console.log('Biometría activada');
            }
          }
        ]
      );

    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Credenciales incorrectas. Verifica tu código y contraseña.');
      } else if (error.response?.status >= 500) {
        Alert.alert('Error', 'Error del servidor. Intenta más tarde.');
      } else if (error.request) {
        Alert.alert('Error', 'No se pudo conectar al servidor. Revisa tu conexión.');
      } else {
        Alert.alert('Error', 'Ocurrió un error inesperado al iniciar sesión.');
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Inicia sesión con tu huella o Face ID',
        fallbackLabel: 'Ingresar manualmente',
        biometricsSecurityLevel: 'strong',
        cancelLabel: 'Ingresar manualmente',
      });

      if (biometricAuth.success) {
        const savedBiometricUser = await AsyncStorage.getItem('biometricUser');
        if (savedBiometricUser) {
          const parsedUser = JSON.parse(savedBiometricUser);
          setUser(parsedUser);
          await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
        }
      }
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
    }
  };

  const animatedBlockStyles = useAnimatedStyle(() => {
    // Desplaza ligeramente el bloque hacia arriba cuando el teclado está abierto.
    const isOpen = keyboard.height.value > 0;
    return {
      transform: [{ translateY: withTiming(isOpen ? -100 : 0, { duration: 120 }) }]
    };
  });

  if (user) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView className="flex-1 p-5 relative justify-center bg-white">
      <Animated.View
        className="self-stretch items-stretch"
        style={animatedBlockStyles}
      >
        <Image
          source={require('../assets/images/iSync-ERP.png')}
          height={160}
          width={160}
          className="h-[160px] w-[160px] self-center mb-[60px]"
          style={{ resizeMode: 'contain' }}
        />

        <View className="gap-6">
          <View>
            <Text className="font-[Poppins-Medium] text-[15px] tracking-[-0.3px] text-primary">Código de Vendedor</Text>
            <TextInput
              className="h-14 bg-[#e5e7eb] text-primary px-6 rounded-2xl font-[Poppins-Medium]"
              placeholder="Ingrese su Código de Vendedor"
              value={salesPersonCode}
              onChangeText={setSalesPersonCode}
              keyboardType="numeric"
              editable={!loading}
              placeholderTextColor="#fff"
            />
          </View>

          <View>
            <Text className="font-[Poppins-Medium] text-[15px] tracking-[-0.3px] text-primary">Contraseña</Text>
            <TextInput
              className="h-14 bg-[#e5e7eb] text-primary px-6 rounded-2xl font-[Poppins-Medium]"
              placeholder="Ingrese su Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              keyboardType="numeric"
              editable={!loading}
              placeholderTextColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity
          className={`mt-4 ${isFormValid && !loading ? 'bg-primary' : 'bg-gray-200'} px-4 h-14 rounded-full items-center justify-center`}
          onPress={handleLogin}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <View className="flex-row gap-2 items-center justify-center">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-black text-center font-[Poppins-SemiBold] leading-3">Iniciando Sesión...</Text>
            </View>
          ) : (
            <Text className="text-white text-center font-[Poppins-SemiBold] leading-3">Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        {biometricAvailable && (
          <View className="w-full items-center justify-center mt-16">
            <TouchableOpacity
              className="mt-4 w-[50px] h-[50px] bg-primary rounded-full items-center justify-center"
              onPress={handleBiometricLogin}
            >
              <Ionicons name="finger-print-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      <View className="flex-1 items-center justify-center absolute bottom-4 right-0 left-0">
        <TouchableOpacity
          onPress={() => router.push('/settings')}
        >
          <Text className="font-[Poppins-SemiBold] text-sm tracking-[-0.3px] text-primary">Configuraciones</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}