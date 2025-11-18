import { AuthProvider } from '@/context/auth';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useAppStore } from '@/state/index';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { TextInput, TouchableOpacity, View } from 'react-native';

import Constants from 'expo-constants';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  const rawSearchText = useAppStore(state => state.rawSearchText);
  const setRawSearchText = useAppStore(state => state.setRawSearchText);
  const setDebouncedSearchText = useAppStore(state => state.setDebouncedSearchText);

  useEffect(() => {
    const handler = setTimeout(() => {
      console.log("[Layout] Setting debounced search text:", rawSearchText);
      setDebouncedSearchText(rawSearchText);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [rawSearchText, setDebouncedSearchText]);

  const clearSearch = () => {
    console.log("[Layout] Clearing search");
    setRawSearchText('');
    // Al limpiar, también actualiza el debouncedSearchText inmediatamente
    setDebouncedSearchText('');
  };

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().then(() => setAppReady(true));
    }
  }, [fontsLoaded, fontError]);

  if (!appReady) return null;

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: -Constants.statusBarHeight }} edges={['top', 'left', 'right', 'bottom']}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <BottomSheetModalProvider>
              <Stack
                screenOptions={{
                  headerShown: true,
                  headerStyle: { backgroundColor: '#fff' },
                  headerShadowVisible: false,
                  headerTitleStyle: {
                    fontFamily: "Poppins-SemiBold"
                  }
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="InvoiceClient" options={{ headerShown: true, headerTitle: 'Seleccionar Cliente' }} />
                <Stack.Screen name="consignmentClient" options={{ headerShown: true, headerTitle: 'Seleccionar Cliente' }} />
                <Stack.Screen name="consignmentDetails" options={{ headerShown: true, headerTitle: 'Detalles de la Cotización' }} />
                <Stack.Screen name="order" options={{ headerShown: true, headerTitle: 'Detalles del Pedido' }} />
                <Stack.Screen name="invoicesDetails" options={{ headerShown: true, headerTitle: 'Detalles de Cobros' }} />
                <Stack.Screen name="previewInvoice" options={{ headerShown: true, headerTitle: 'Vista previa de impresion' }} />
                <Stack.Screen name="settings" options={{ headerShown: true, headerTitle: 'Configuracion del Host' }} />
                <Stack.Screen name="modal" options={{ headerShown: false }} />
                <Stack.Screen name="settingsSales" options={{ headerShown: true, headerTitle: 'Configuracion de Ventas' }} />

                <Stack.Screen
                  name="consignaciones"
                  options={{
                    headerShown: true,
                    headerTitle: () => (
                      <View className='flex-row items-center gap-4'>
                        <View className='flex-row flex-1 items-center bg-[#f0f0f0] rounded-[16px] relative overflow-hidden'>
                          <TextInput
                            placeholder="Buscar Producto"
                            style={{
                              backgroundColor: '#f0f0f0',
                              paddingHorizontal: 18,
                              paddingVertical: 4,
                              borderRadius: 8,
                              width: '94%',
                              // flex: 1,
                              height: 36,
                              fontSize: 14,
                              fontFamily: 'Poppins-Regular',
                            }}
                            placeholderTextColor="#9ca3af"
                            value={rawSearchText}
                            onChangeText={setRawSearchText}
                            clearButtonMode="never"
                          />
                          {rawSearchText.length > 0 && (
                            <TouchableOpacity
                              className='absolute right-2 z-10'
                              onPress={clearSearch}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Ionicons name="close-circle" size={24} color="#888" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ),
                  }}
                />
              </Stack>
            </BottomSheetModalProvider>
          </AuthProvider>
          <StatusBar style="dark" />
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}