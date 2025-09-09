import ConnectivityBanner from '@/components/ConnectivityBanner';
import { useAuth } from '@/context/auth';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Platform, Text, View } from 'react-native';

import ProtectedLayout from '../ProtectedLayout';

import CatalogIcon from '@/assets/icons/CatalogIcon';
import ClientIcon from '@/assets/icons/ClientIcon';
import HomeIcon from '@/assets/icons/HomeIcon';
import InvoicesIcon from '@/assets/icons/InvoicesIcon';
import LocationIcon from '@/assets/icons/Locations';
import OrderIcon from '@/assets/icons/OrdeIcon';
import SettingsIcon from '@/assets/icons/SettingsIcon';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import ProductScreen from './catalog';
import ExploreScreen from './explore';
import IndexScreen from './index';
import InvoicesScreen from './invoices';
import LocationScreen from './locations';
import SettingsScreen from './setting';

const Drawer = createDrawerNavigator();

export default function Layout() {
  const ActiveColor = '#1A3D59';
  const InActiveColor = '#c9c9c9';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ProtectedLayout>
          <ConnectivityBanner />
          <Drawer.Navigator
            screenOptions={{
              headerShown: true,
              drawerActiveTintColor: ActiveColor,
              drawerInactiveTintColor: InActiveColor,
              drawerStyle: Platform.select({
                ios: { backgroundColor: '#fff' },
                android: {},
              }),
              headerStyle: {
                shadowColor: 'transparent',
                elevation: 0,
                borderBottomWidth: 0,
              },
              headerTitleStyle: {
                fontFamily: 'Poppins-SemiBold',
                letterSpacing: -0.6,
                color: "#000",
              },
              drawerLabelStyle: {
                fontFamily: 'Poppins-Medium',
                fontSize: 16,
                letterSpacing: -0.6,
              },
            }}
            drawerContent={(props) => <CustomDrawerContent {...props} ActiveColor={ActiveColor} InActiveColor={InActiveColor} />}
          >
            <Drawer.Screen
              name="index"
              component={IndexScreen}
              options={{
                title: 'Dashboard',
                drawerIcon: ({ focused }) => (
                  <HomeIcon size={26} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
            <Drawer.Screen
              name="explore"
              component={ExploreScreen}
              options={{
                title: 'Pedidos',
                drawerIcon: ({ focused }) => (
                  <OrderIcon size={26} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
            <Drawer.Screen
              name="invoices"
              component={InvoicesScreen}
              options={{
                title: 'Cobros',
                drawerIcon: ({ focused }) => (
                  <InvoicesIcon size={26} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
            <Drawer.Screen
              name="catalog"
              component={ProductScreen}
              options={{
                title: 'Catalogo',
                headerTitle: '',
                headerStyle: { backgroundColor: '#f9fafb', elevation: 0, borderBottomWidth: 0 },
                drawerIcon: ({ focused }) => (
                  <CatalogIcon size={24} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
            <Drawer.Screen
              name="location"
              component={LocationScreen}
              options={{
                title: 'Ubicaciones',
                drawerIcon: ({ focused }) => (
                  <LocationIcon size={24} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
            <Drawer.Screen
              name="settings"
              component={SettingsScreen}
              options={{
                title: 'Ajustes',
                drawerIcon: ({ focused }) => (
                  <SettingsIcon size={26} color={focused ? ActiveColor : InActiveColor} />
                ),
              }}
            />
          </Drawer.Navigator>
        </ProtectedLayout>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

function CustomDrawerContent(props: any) {
  const { user } = useAuth();

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View className="bg-primary w-[50px] h-[50px] items-center justify-center rounded-full">
          <ClientIcon size={30} color="#fff" />
        </View>

        <View>
          <Text className="font-[Poppins-SemiBold] text-lg">
            {user?.fullName ?? 'Usuario'}
          </Text>
          <Text className="font-[Poppins-Regular] text-sm text-neutral-500">
            Codigo: {user?.employeeCode ?? 'codigo no disponible'}
          </Text>
        </View>
      </View>

      {/* Lista de rutas */}
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}
