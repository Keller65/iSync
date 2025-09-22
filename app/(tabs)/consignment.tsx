import PlusIcon from '@/assets/icons/PlusIcon';
import BottomSheetConsignment from '@/components/BottomSheetConsignment/page';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import { ConsignmentType } from '@/types/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList } from '@shopify/flash-list';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const Consignment = () => {
  const { products, fetchUrl } = useAppStore();
  const { user } = useAuth();
  const router = useRouter();
  const [consignments, setConsignments] = useState<ConsignmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 20;
  const [page, setPage] = useState(1);
  const isFetchingRef = useRef(false);

  const fetchConsignments = useCallback(async (pageNumber: number = 1, append: boolean = false) => {
    if (isFetchingRef.current || !user?.token) return;

    isFetchingRef.current = true;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await axios.get(
        `${fetchUrl}/api/Consignaciones/Open/slpCode?slpCode=${user?.salesPersonCode}&page=${pageNumber}&pageSize=${pageSize}`,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );

      const newData = response.data as ConsignmentType[];
      console.log('Fetched page:', pageNumber, 'Items:', newData.length);

      if (append) {
        setConsignments(prev => [...prev, ...newData]);
      } else {
        setConsignments(newData);
      }

      // Determinar si hay más páginas
      const hasMoreItems = newData.length === pageSize;
      setHasMore(hasMoreItems);
      setPage(pageNumber);

    } catch (err: any) {
      console.error('Error fetching consignments:', err);
      setError(err?.message || 'Error al cargar las consignaciones');
      if (!append) {
        setConsignments([]);
      }
    } finally {
      isFetchingRef.current = false;
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [user, fetchUrl, pageSize]);

  // Cargar primera página al montar el componente
  useEffect(() => {
    fetchConsignments(1, false);
  }, [fetchConsignments]);

  const handleEndReached = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;
    fetchConsignments(page + 1, true);
  }, [loadingMore, loading, hasMore, page, fetchConsignments]);

  const handleRefresh = useCallback(() => {
    setConsignments([]);
    setPage(1);
    setHasMore(true);
    fetchConsignments(1, false);
  }, [fetchConsignments]);

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <ActivityIndicator size="small" color="#000" />
      );
    }

    return null;
  }, [loadingMore, hasMore, consignments.length]);

  const renderItem = useCallback(({ item }: { item: ConsignmentType }) => (
    <TouchableOpacity
      onPress={() => router.push({
        pathname: '/consignmentDetails',
        params: { docEntry: item.docEntry.toString() }
      })}
      className="p-4 bg-gray-100 my-1 rounded-2xl gap-4"
    >
      <View className="flex-row items-center gap-2 mb-1">
        <View className="p-2 h-[40px] w-[40px] bg-primary rounded-full items-center justify-center">
          <Ionicons name="document" size={20} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-[Poppins-SemiBold] tracking-[-0.3px]">{item.cardName}</Text>
          <Text className="text-base font-[Poppins-Regular] tracking-[-0.3px]">Consignación N°: {item.docNum.toLocaleString()}</Text>
        </View>
      </View>

      <View className="flex-row justify-between flex-1 gap-4">
        <View className="flex-1 h-[60px] bg-gray-200 rounded-xl py-2 px-4">
          <Text className="text-black font-[Poppins-Regular] tracking-[-0.3px] text-sm">Fecha</Text>
          <Text className="text-black font-[Poppins-SemiBold] tracking-[-0.3px] text-lg">{new Date(item.docDate).toLocaleDateString()}</Text>
        </View>

        <View className="flex-1 h-[60px] bg-gray-200 rounded-xl py-2 px-4">
          <Text className="text-black font-[Poppins-Regular] tracking-[-0.3px] text-sm">Importe total</Text>
          <Text className="text-black font-[Poppins-SemiBold] tracking-[-0.3px] text-lg">
            Lps. {item.docTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  if (loading && !loadingMore) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-4 text-gray-600">Cargando consignaciones...</Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          <Text className="text-white">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="px-4 bg-white flex-1 relative gap-2">
      <View className="absolute bottom-4 right-6 gap-3 items-end z-10">
        {products.length > 0 ? (
          <BottomSheetConsignment />
        ) : (
          <TouchableOpacity
            className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-primary"
            onPress={() => router.push('/consignmentClient')}
          >
            <PlusIcon color="white" />
          </TouchableOpacity>
        )}
      </View>

      <FlashList
        data={consignments}
        estimatedItemSize={80} // Ajusta según la altura estimada de cada item
        renderItem={renderItem}
        className='flex-1 gap-2'
        keyExtractor={(item: ConsignmentType) => item.docEntry.toString()}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshing={loading && !loadingMore}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 80 }} // Espacio para el botón flotante
      />
    </View>
  );
};

export default Consignment;