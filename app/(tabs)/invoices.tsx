import ClientIcon from '@/assets/icons/ClientIcon';
import PlusIcon from '@/assets/icons/PlusIcon';
import { useAuth } from '@/context/auth';
import api from '@/lib/api';
import { useAppStore } from '@/state';
import { PaymentData } from '@/types/types';
import { FontAwesome } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const PAGE_SIZE = 20;

const Invoices = () => {
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<PaymentData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const salesPersonCode = user?.salesPersonCode;

  const formatMoney = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? Number(value) : value ?? 0;
    const safe = isNaN(Number(num)) ? 0 : Number(num);
    return safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchInvoices = useCallback(async () => {
    if (!salesPersonCode || loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await api.get<PaymentData[]>(`/api/Payments/received/${salesPersonCode}?page=${page}&pageSize=${PAGE_SIZE}`, {
        baseURL: fetchUrl,
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Encoding': 'gzip'
        },
        cache: {
          ttl: Infinity,
        }
      });

      console.log(response.cached ? 'Datos cargados desde cache' : 'Datos cargados desde red');

      if (response.data.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setData(prev => [...prev, ...response.data]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [salesPersonCode, fetchUrl, page, loading, hasMore]);

  const handleRefresh = async () => {
    if (!salesPersonCode) return;

    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    try {
      const response = await api.get<PaymentData[]>(`/api/Payments/received/${salesPersonCode}?page=1&pageSize=${PAGE_SIZE}`, {
        baseURL: fetchUrl,
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Encoding': 'gzip'
        },
        cache: {
          ttl: 1000 * 60 * 60 * 24,
          override: true,
        }
      });

      console.log(response.cached ? 'Datos cargados desde cache' : 'Datos cargados desde red');

      setData(response.data);

      if (response.data.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setPage(2);
    } catch (error) {
      console.error('Error refreshing invoices:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const renderItem = ({ item }: { item: PaymentData }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/invoicesDetails',
          params: { item: JSON.stringify(item) },
        })
      }
      className="bg-white rounded-3xl mb-4 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <View className="bg-indigo-100 p-4">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-x-2">
            {/* Número documento */}
            <View className="bg-yellow-300 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-black font-[Poppins-SemiBold]">
                {item.docNum}
              </Text>
            </View>

            {/* Estado */}
            {item.cancelled === 'tYES' && (
              <View className="bg-rose-200 px-2 py-0.5 rounded-full flex-row items-center justify-center gap-x-1">
                <View className='bg-rose-700 h-[6px] w-[6px] rounded-full' />
                <Text className="text-xs text-rose-700 font-[Poppins-SemiBold]">
                  Cancelado
                </Text>
              </View>
            )}
          </View>

          {/* Fecha */}
          <Text className="text-xs text-indigo-700 font-[Poppins-Medium]">
            {new Date(item.docDate).toLocaleDateString()}
          </Text>
        </View>

        {/* Cliente */}
        <View className="flex-row items-center gap-3">
          <View className="w-[36px] h-[36px] bg-indigo-500 rounded-full items-center justify-center">
            <ClientIcon size={30} color="#fde047" />
          </View>
          <View>
            <Text className="text-lg font-[Poppins-Bold] text-gray-900 tracking-[-0.3px]">
              {item.cardName}
            </Text>
            <Text className="text-md text-gray-700 font-[Poppins-Regular] tracking-[-0.3px]">
              {item.cardCode}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={{ backgroundColor: item.cancelled === 'tYES' ? '#f87171' : '#4f46e5' }} className="px-4 py-2 flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <FontAwesome name="credit-card" size={18} color="#fff" />
          <Text className="text-md font-[Poppins-Medium] text-white">
            {item.paymentMeans}
          </Text>
        </View>
        <Text className="text-md font-[Poppins-Bold] text-white">
          L. {formatMoney(item.total)}
        </Text>
      </View>
    </TouchableOpacity>

  );

  const renderFooter = () =>
    loading ? (
      <View className="py-4">
        <ActivityIndicator size="small" color="#000" />
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-white px-4 relative">
      <View className="absolute bottom-8 right-8 gap-3 items-end z-10">
        <TouchableOpacity
          className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-yellow-300"
          onPress={() => router.push('/InvoiceClient')}
        >
          <PlusIcon color="black" />
        </TouchableOpacity>
      </View>

      <FlashList
        data={data}
        keyExtractor={(item) => item.docEntry.toString()}
        renderItem={renderItem}
        estimatedItemSize={120}
        onEndReached={fetchInvoices}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Invoices;