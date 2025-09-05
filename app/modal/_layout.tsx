import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: "Poppins-SemiBold",
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: true, headerTitle: 'Facturas Pendientes' }} />
      <Stack.Screen name="success" options={{ headerShown: false, }} />
      <Stack.Screen name="successCobro" options={{ headerShown: false }} />
      <Stack.Screen name="error" options={{ headerShown: false, }} />
      <Stack.Screen name="payment" options={{ headerShown: true, headerTitle: 'Informacion de pago' }} />
      <Stack.Screen name="cobro" options={{ headerShown: true, headerTitle: 'Cobro' }} />
    </Stack>
  );
}