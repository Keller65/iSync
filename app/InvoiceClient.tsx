import ClientIcon from '@/assets/icons/ClientIcon';
import { useAuth } from '@/context/auth';
import api from '@/lib/api';
import { useAppStore } from '@/state/index';
import { Customer } from '@/types/types';
import Feather from '@expo/vector-icons/Feather';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const InvoicesClientScreen = memo(() => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const setSelectedCustomerInvoices = useAppStore(
    (state) => state.setSelectedCustomerInvoices
  );
  const { fetchUrl } = useAppStore();

  const FETCH_URL = fetchUrl + '/api/customers/';

  const fetchCustomers = useCallback(async () => {
    if (!user?.salesPersonCode || !user?.token) return;

    try {
      setLoading(true);

      const res = await api.get(`by-sales-emp?slpCode=${user.salesPersonCode}`, {
        baseURL: FETCH_URL,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        cache: {
          ttl: 1000 * 60 * 60 * 24,
        },
      });

      console.info(
        res.cached ? 'Clientes cargados desde cache' : 'Clientes cargados desde red'
      );

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
      try {
        setSelectedCustomerInvoices(customer);
        router.push({
          pathname: '/modal',
          params: {
            cardCode: customer.cardCode,
            cardName: customer.cardName,
          },
        });
      } catch (err) {
        console.error('Error al navegar:', err);
        Alert.alert(
          'Error de navegación',
          'No se pudo abrir la pantalla de pedido.'
        );
      }
    },
    [router, setSelectedCustomerInvoices]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCustomers();
  }, [fetchCustomers]);

  // 👇 este hook ya no está después de returns condicionales
  const renderCustomerItem = useCallback(
    ({ item }: { item: Customer }) => (
      <TouchableOpacity
        onPress={() => handleCustomerPress(item)}
        className="flex-row items-center gap-3 px-4 my-2"
      >
        <View className="bg-primary w-[50px] h-[50px] items-center justify-center rounded-full">
          <ClientIcon size={24} color="#fff" />
        </View>

        <View className="flex-1 justify-center">
          <Text className="font-[Poppins-SemiBold] text-lg text-black tracking-[-0.3px]">
            {item.cardName}
          </Text>

          <View className="flex-row gap-2">
            <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">
              Código:{' '}
              <Text className="font-[Poppins-Regular]">{item.cardCode}</Text>
            </Text>
            <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">
              RTN:{' '}
              <Text className="font-[Poppins-Regular] tracking-[-0.3px]">
                {item.federalTaxID
                  ? item.federalTaxID.replace(
                      /^\d{4}(\d{4})(\d{6})$/,
                      '$1-$2-$3'
                    )
                  : ''}
              </Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleCustomerPress]
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
          />
        </View>
      </View>

      <FlashList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.cardCode}
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

export default InvoicesClientScreen;