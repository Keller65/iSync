import LottieView from 'lottie-react-native';
import { FC, useRef } from 'react';
import { Text, View } from 'react-native';

interface VentasData {
  title: string;
  Ventas: number;
  currency: string;
  Cobros: number;
  delta: number;
  deltaType: 'up' | 'down';
  deltaLabel: string;
  mesVentas: string;
  mesCobros: string;
}

interface KpiApiResponse {
  ventas: VentasData;
}

interface KPICardApiProps {
  data: KpiApiResponse | null;
  userName: string | undefined;
  loading: boolean;
}

const KPICardApi: FC<KPICardApiProps> = ({ data, userName, loading }) => {
  if (loading) {
    return (
      <View className="bg-white p-3 rounded-2xl w-full gap-3 border border-gray-100 relative">
        <View className="h-6 w-3/4 bg-gray-100 rounded-full" />
        <View className="h-6 w-1/2 bg-gray-100 rounded-full" />
        <View className="h-4 w-full bg-gray-100 rounded-full" />
        <View className="h-4 w-5/6 bg-gray-100 rounded-full" />
      </View>
    );
  }

  if (!data || !data.ventas) {
    return null;
  }

  const { ventas } = data;
  const isDeltaUp = ventas.deltaType === 'up';
  const deltaColor = isDeltaUp ? 'text-green-500' : 'text-[#ff7b72]';
  const arrowDirection = isDeltaUp ? '▲' : '▼';
  const animation = useRef<LottieView>(null);

  return (
    <View className="bg-white p-3 rounded-2xl w-full gap-3 border border-gray-100 relative">
      <View className='absolute top-2 right-3'>
        {arrowDirection === "▼" ?
          <LottieView
            autoPlay
            loop={true}
            speed={0.88}
            ref={animation}
            style={{
              width: 22,
              height: 22,
              backgroundColor: 'transparent',
            }}
            source={require('@/assets/animation/ScrollDownArrowRed.json')}
          /> :
          <View className='rotate-180'>
            <LottieView
              autoPlay
              loop={true}
              speed={0.88}
              ref={animation}
              style={{
                width: 22,
                height: 22,
                backgroundColor: 'transparent',
              }}
              source={require('@/assets/animation/ScrollDownArrowGreen.json')}
            />
          </View>
        }
      </View>

      <View className="flex-row justify-between items-center">
        <View className='flex flex-col'>
          <Text className={`text-sm font-[Poppins-SemiBold] tracking-[-0.3px] ${deltaColor}`}>{ventas.Ventas.toLocaleString()} {ventas.currency}</Text>
          <Text className="text-xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-800">{userName}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-end">
        <View>
          <Text className="text-xs text-gray-500 font-[Poppins-SemiBold] tracking-[-0.3px]">{ventas.mesVentas} - {ventas.mesCobros}</Text>
          <Text className="text-xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-800">
            {ventas.Ventas.toLocaleString()} {ventas.currency}
          </Text>
        </View>

        <View className="items-end">
          <Text className={`text-base font-[Poppins-SemiBold] tracking-[-0.3px] ${deltaColor}`}>
            {ventas.delta}%
          </Text>
          <Text className={`text-xl font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-500 ${deltaColor}`}>
            {ventas.Cobros.toLocaleString()} {ventas.currency}
          </Text>
        </View>
      </View>

    </View>
  );
};

export default KPICardApi;