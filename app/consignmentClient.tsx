import ClientIcon from '@/assets/icons/ClientIcon';
import { useAuth } from '@/context/auth';
import axios from 'axios';
import { useAppStore } from '@/state/index';
import { Customer } from '@/types/types';
import Feather from '@expo/vector-icons/Feather';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, Text, TextInput, TouchableOpacity, View, } from 'react-native';

const InvoicesClientScreen = memo(() => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const setSelectedCustomerConsignment = useAppStore(
    (state) => state.setSelectedCustomerConsignment
  );
  const selectedCustomerConsignment = useAppStore((state) => state.selectedCustomerConsignment);
  const productsInConsignment = useAppStore((state) => state.productsInConsignment);
  const products = useAppStore((state) => state.products); // También revisar productos normales
  const { fetchUrl } = useAppStore();

  const rawSearchText = useAppStore((state) => state.rawSearchText);
  const setRawSearchText = useAppStore((state) => state.setRawSearchText);
  const setDebouncedSearchText = useAppStore((state) => state.setDebouncedSearchText);

  const FETCH_URL = fetchUrl + '/api/customers/';

  // Limpiar el input de búsqueda de productos cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      if (rawSearchText && rawSearchText.trim().length > 0) {
        console.log('Limpiando input de búsqueda al enfocar pantalla de clientes:', rawSearchText);
        setRawSearchText('');
        setDebouncedSearchText('');
      }
    }, [rawSearchText, setRawSearchText, setDebouncedSearchText])
  );

  const fetchCustomers = useCallback(async () => {
    if (!user?.salesPersonCode || !user?.token) return;

    try {
      setLoading(true);

      const res = await axios.get(`by-sales-emp?slpCode=${user.salesPersonCode}`, {
        baseURL: FETCH_URL,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        }
      });

      const newCustomers = res.data || [];
      setCustomers(newCustomers);
    } catch (err: any) {
      console.error('Error al cargar clientes:', err);
      setError(
        err.response?.data?.message || err.message || 'Error desconocido.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.salesPersonCode, user?.token, FETCH_URL]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const lowerSearch = search.toLowerCase();

    setFilteredCustomers(
      customers.filter(
        (c) =>
          c.cardName.toLowerCase().includes(lowerSearch) ||
          c.cardCode.toLowerCase().includes(lowerSearch) ||
          (c.federalTaxID &&
            c.federalTaxID.toLowerCase().includes(lowerSearch))
      )
    );
  }, [search, customers]);

  const handleCustomerPress = useCallback(
    async (customer: Customer) => {
      // Si hay productos (consignación o regulares) y es un cliente diferente, mostrar alerta
      const totalProducts = productsInConsignment.length + products.length;
      if (selectedCustomerConsignment && totalProducts >= 1 && selectedCustomerConsignment.cardCode !== customer.cardCode) {
        Alert.alert(
          'Consignación en progreso',
          `Tienes ${totalProducts} producto(s) en consignación para ${selectedCustomerConsignment.cardName}. ¿Qué deseas hacer?`,
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Continuar con consignación actual',
              onPress: () => {
                router.push({
                  pathname: '/consignaciones',
                  params: {
                    cardCode: selectedCustomerConsignment.cardCode,
                    cardName: selectedCustomerConsignment.cardName,
                  },
                });
              }
            }
          ]
        );
        return;
      }

      try {
        // Guardar el cliente seleccionado en el estado de Zustand
        setSelectedCustomerConsignment(customer);

        // Navegar a la pantalla de consignaciones con los parámetros del cliente
        router.push({
          pathname: '/consignaciones',
          params: {
            cardCode: customer.cardCode,
            cardName: customer.cardName,
          },
        });
      } catch (err) {
        console.error('Error al navegar:', err);
        Alert.alert(
          'Error de navegación',
          'No se pudo abrir la pantalla de consignación.'
        );
      }
    },
    [router, setSelectedCustomerConsignment, selectedCustomerConsignment, productsInConsignment]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCustomers();
  }, [fetchCustomers]);

  // Verificar si los clientes deben estar deshabilitados
  const isClientsDisabled = useMemo(() => {
    const hasConsignmentProducts = productsInConsignment.length >= 1;
    const hasRegularProducts = products.length >= 1;
    const hasProducts = hasConsignmentProducts || hasRegularProducts;

    console.log('isClientsDisabled calculation:', {
      selectedCustomerConsignment: !!selectedCustomerConsignment,
      hasConsignmentProducts,
      hasRegularProducts,
      hasProducts,
      result: selectedCustomerConsignment && hasProducts
    });

    return selectedCustomerConsignment && hasProducts;
  }, [selectedCustomerConsignment, productsInConsignment, products]);

  const renderCustomerItem = useCallback(
    ({ item }: { item: Customer }) => {
      const isCurrentSelected = selectedCustomerConsignment?.cardCode === item.cardCode;
      const isDisabled = isClientsDisabled && !isCurrentSelected;

      return (
        <TouchableOpacity
          onPress={() => !isDisabled && handleCustomerPress(item)}
          disabled={isDisabled || false}
          className={`flex-row items-center gap-3 px-4 my-2 ${isDisabled ? 'opacity-50' : 'opacity-100'}`}
        >
          <View className={`w-[50px] h-[50px] items-center justify-center rounded-full ${isDisabled ? 'bg-gray-200' : 'bg-primary'
            }`}>
            <ClientIcon size={24} color={isDisabled ? "#6b7280" : "#fff"} />
          </View>

          <View className="flex-1 justify-center">
            <Text className={`font-[Poppins-SemiBold] text-lg tracking-[-0.3px] ${isDisabled ? 'text-gray-500' : 'text-black'
              }`}>
              {item.cardName}
            </Text>

            <View className="flex-row gap-2">
              <Text className={`font-[Poppins-SemiBold] tracking-[-0.3px] ${isDisabled ? 'text-gray-500' : 'text-gray-600'
                }`}>
                Código:{' '}
                <Text className="font-[Poppins-Regular]">{item.cardCode}</Text>
              </Text>
              <Text className={`font-[Poppins-SemiBold] tracking-[-0.3px] ${isDisabled ? 'text-gray-500' : 'text-gray-600'
                }`}>
                RTN:{' '}
                <Text className="font-[Poppins-Regular] tracking-[-0.3px]">
                  {item.federalTaxID
                    ? item.federalTaxID.replace(
                      /^(\d{4})(\d{4})(\d{6})$/,
                      '$1-$2-$3'
                    )
                    : ''}
                </Text>
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handleCustomerPress, selectedCustomerConsignment, isClientsDisabled]
  );

  if (!user?.token) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-center text-red-500 text-base">
          No has iniciado sesión o tu sesión ha expirado.
        </Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-3 text-gray-700 text-base">Cargando clientes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-red-500 text-base text-center mb-2">{error}</Text>
        <Text className="text-gray-500 text-sm text-center">
          Inicia sesión nuevamente.
        </Text>
      </View>
    );
  }

  if (customers.length === 0 && !loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-gray-500 text-base text-center">
          No se encontraron clientes asociados a tu cuenta.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Banner informativo cuando hay cliente y productos en consignación */}
      {isClientsDisabled && (
        <View className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3 mx-4 my-2 rounded-r-lg">
          <View className="flex-row items-center">
            <Feather name="info" size={16} color="#f59e0b" />
            <Text className="ml-2 text-amber-800 font-[Poppins-SemiBold] text-sm">
              Consignación en progreso
            </Text>
          </View>
          <Text className="text-amber-700 font-[Poppins-Regular] text-xs mt-1">
            Ya tienes {productsInConsignment.length + products.length} productos en consignación para {selectedCustomerConsignment?.cardName}.
            Completa o cancela la consignación actual para seleccionar otro cliente.
          </Text>
        </View>
      )}

      <View className="px-4">
        <View className="bg-gray-200 rounded-2xl px-4 mb-2 text-base font-[Poppins-Regular] text-black flex-row items-center gap-2">
          <Feather name="search" size={20} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre, código o RTN"
            className="w-[86%] font-[Poppins-Medium] tracking-[-0.3px]"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={'#9ca3af'}
          />
        </View>
      </View>

      <FlashList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.cardCode}
        extraData={{
          productsCount: productsInConsignment.length + products.length,
          selectedCustomerId: selectedCustomerConsignment?.cardCode,
          isClientsDisabled
        }}
        estimatedItemSize={80}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000']}
            tintColor="#000"
          />
        }
        ListEmptyComponent={
          <View className="justify-center items-center py-10">
            <Text className="text-gray-500 text-base text-center">
              No se encontraron clientes con ese criterio.
            </Text>
          </View>
        }
      />
    </View>
  );
});

InvoicesClientScreen.displayName = 'ConsignmentClientScreen';

export default InvoicesClientScreen;