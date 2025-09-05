import PlusIcon from '@/assets/icons/PlusIcon';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state/index';
import { OrderDataType } from '@/types/types';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheetCart from '@/components/BottomSheetCart/page';
import axios from 'axios';
import '../../global.css';

export default function PedidosScreen() {
  const router = useRouter();
  const products = useAppStore((s) => s.products);
  const { user } = useAuth();
  const token = user?.token || '';

  const [orderData, setOrderData] = useState<OrderDataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);
  const { fetchUrl } = useAppStore();

  const FETCH_URL = fetchUrl + "/api/Quotations/open";
  const PAGE_SIZE = 20;

  const fetchOrders = useCallback(async (pageToFetch: number, initialLoad = false) => {
    if ((!initialLoad && isLastPage) || isLoading) return;

    initialLoad ? setIsRefreshing(true) : setIsLoading(true);

    try {
      const res = await axios.get(`${FETCH_URL}/${user?.salesPersonCode}?page=${pageToFetch}&pageSize=${PAGE_SIZE}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const newOrders = res.data;
      if (initialLoad) {
        setOrderData(newOrders);
      } else {
        setOrderData(prev => [...prev, ...newOrders]);
      }

      setIsLastPage(newOrders.length < PAGE_SIZE);
      if (!initialLoad) setPage(pageToFetch + 1);
    } catch (err) {
      console.error('Error al obtener órdenes:', err);
      Alert.alert('Error', 'No se pudieron obtener las órdenes. Intenta nuevamente.');
    } finally {
      initialLoad ? setIsRefreshing(false) : setIsLoading(false);
    }
  }, [token, isLastPage, isLoading, user?.salesPersonCode]);

  const renderItem = useCallback(({ item }: { item: OrderDataType }) => (
    <View key={item.docEntry} className="w-full mb-4">
      <View className="bg-white rounded-3xl p-5 border border-gray-200">
        {/* Encabezado */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="truck-fast" size={22} color="#1f2937" />
            <Text className="text-sm text-gray-600">
              Pedido <Text className="font-[Poppins-Medium] text-gray-800">#{item.docEntry}</Text>
            </Text>
          </View>
          <Text className="text-xs text-orange-700 font-[Poppins-Medium] bg-orange-100 px-2 py-1 rounded-full">
            En Proceso
          </Text>
        </View>

        {/* Cliente */}
        <View className="flex-row items-center mb-3 gap-3">
          <View className="bg-gray-100 p-2 rounded-full">
            <MaterialCommunityIcons name="account-circle" size={24} color="#6B7280" />
          </View>
          <View>
            <Text className="text-xs text-gray-500">Cliente</Text>
            <Text className="text-base font-[Poppins-Medium] text-gray-900">{item.cardName}</Text>
          </View>
        </View>

        {/* Fecha */}
        <View className="flex-row items-center mb-3 gap-3">
          <View className="bg-gray-100 p-2 rounded-full">
            <MaterialCommunityIcons name="calendar-month" size={24} color="#6B7280" />
          </View>
          <View>
            <Text className="text-xs text-gray-500">Fecha</Text>
            <Text className="text-base font-[Poppins-Medium] text-gray-900">{item.docDate}</Text>
          </View>
        </View>

        {/* Total */}
        <View className="flex-row items-center mb-5 gap-3">
          <View className="bg-gray-100 p-2 rounded-full">
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#6B7280" />
          </View>
          <View>
            <Text className="text-xs text-gray-500">Total</Text>
            <Text className="text-lg font-[Poppins-SemiBold] text-gray-900">
              L. {item.docTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Botón */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/order',
              params: { OrderDetails: item.docEntry },
            })
          }
          className="w-full bg-yellow-300 py-3 rounded-full items-center justify-center h-[50px]"
        >
          <Text className="text-[15px] font-[Poppins-SemiBold] text-black tracking-[-0.3px]">Ver más detalles</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), []);

  const handleRefresh = useCallback(() => {
    setPage(1);
    setIsLastPage(false);
    fetchOrders(1, true);
  }, [fetchOrders]);

  const handleLoadMore = () => {
    if (!isRefreshing && !isLoading && !isLastPage) {
      fetchOrders(page);
    }
  };

  useEffect(() => {
    if (user?.salesPersonCode) {
      fetchOrders(1, true);
    }
  }, [user?.salesPersonCode]);

  return (
    <View className="flex-1 bg-white" style={{ paddingHorizontal: 10 }}>
      <View className="absolute bottom-4 right-8 gap-3 items-end z-10">
        {products.length > 0 ? (
          <BottomSheetCart />
        ) : (
          <TouchableOpacity
            className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-yellow-300 border border-white"
            onPress={() => router.push('/client')}
          >
            <PlusIcon color="black" />
          </TouchableOpacity>
        )}
      </View>

      {orderData.length > 0 ? (
        <FlashList
          data={orderData}
          keyExtractor={(item) => String(item.docEntry)}
          renderItem={renderItem}
          onEndReached={handleLoadMore}
          estimatedItemSize={250}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListFooterComponent={() =>
            isLoading ? <ActivityIndicator size="small" color="#000" className='mt-4' /> : null
          }
        />
      ) : (
        <View className="flex-1 justify-center items-center bg-white">
          {isRefreshing ? (
            <View className='flex-1 bg-white gap-2 items-center justify-center'>
              <ActivityIndicator size="small" color="#000" />
              <Text className="text-lg text-black font-[Poppins-Medium] tracking-[-0.3px]">Cargando Pedidos...</Text>
            </View>
          ) : (
            <Text className="text-lg text-gray-500 font-[Poppins-Medium] tracking-[-0.3px]">No hay pedidos cargados.</Text>
          )}
        </View>
      )}
    </View>
  );
}