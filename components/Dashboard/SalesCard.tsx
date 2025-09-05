import { SalesDataType } from '@/types/DasboardType';
import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

const SalesCard: FC<{ data: SalesDataType | null; loading?: boolean }> = ({ data, loading }) => {
  const color = '#6b7280';
  const size = 20;

  const formatMoney = (value: number | undefined) => {
    return (value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <View className='gap-4'>
        <View className='flex-row gap-4'>
          <View className='flex-1 h-[80px] justify-center border border-gray-100 gap-2 px-3 py-2 rounded-2xl bg-gray-100'>
            <ActivityIndicator size="small" color={color} />
          </View>
          <View className='flex-1 h-[80px] justify-center border border-gray-100 gap-2 px-3 py-2 rounded-2xl bg-gray-100'>
            <ActivityIndicator size="small" color={color} />
          </View>
        </View>

        <View className='flex-row gap-4'>
          <View className='flex-1 h-[80px] justify-center border border-gray-100 gap-2 px-3 py-2 rounded-2xl bg-gray-100'>
            <ActivityIndicator size="small" color={color} />
          </View>
          <View className='flex-1 h-[80px] justify-center border border-gray-100 gap-2 px-3 py-2 rounded-2xl bg-gray-100'>
            <ActivityIndicator size="small" color={color} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className='gap-4'>
      <View className='flex-row gap-4'>
        <View className='flex-1 h-[80px] justify-center border border-gray-100 gap-2 px-3 py-2 rounded-2xl'>
          <View className='flex-row items-end gap-2'>
            <Ionicons name="card-outline" size={size} color={color} />
            <Text style={{ color: color }} className='font-[Poppins-SemiBold] text-sm tracking-[-0.3px]'>Tarjeta</Text>
          </View>

          <Text className='font-[Poppins-SemiBold] tracking-[-0.3px] text-xl'>{formatMoney(data?.card)}</Text>
        </View>

        <View className='flex-1 h-[80px] justify-center border border-gray-100 gap-2 px-3 py-2 rounded-2xl'>
          <View className='flex-row items-end gap-2'>
            <Ionicons name="cash-outline" size={size} color={color} />
            <Text style={{ color: color }} className='font-[Poppins-SemiBold] text-sm tracking-[-0.3px]'>Efectivo</Text>
          </View>

          <Text className='font-[Poppins-SemiBold] tracking-[-0.3px] text-xl'>{formatMoney(data?.cash)}</Text>
        </View>
      </View>

      <View className='flex-row gap-4'>
        <View className='flex-1 h-[80px] justify-center border border-gray-100 gap-2 px-3 py-2 rounded-2xl'>
          <View className='flex-row items-end gap-2'>
            <Ionicons name="business-outline" size={size} color={color} />
            <Text style={{ color: color }} className='font-[Poppins-SemiBold] text-sm tracking-[-0.3px]'>Transferencia</Text>
          </View>

          <Text className='font-[Poppins-SemiBold] tracking-[-0.3px] text-xl'>{formatMoney(data?.transfer)}</Text>
        </View>

        <View className='flex-1 h-[80px] justify-center border border-gray-100 gap-2 px-3 py-2 rounded-2xl'>
          <View className='flex-row items-end gap-2'>
            <Ionicons name="document-text-outline" size={size} color={color} />
            <Text style={{ color: color }} className='font-[Poppins-SemiBold] text-sm tracking-[-0.3px]'>Cheques</Text>
          </View>

          <Text className='font-[Poppins-SemiBold] tracking-[-0.3px] text-xl'>{formatMoney(data?.checksDeposited)}</Text>
        </View>
      </View>
    </View>
  );
}

export default SalesCard;