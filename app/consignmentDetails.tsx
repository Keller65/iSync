import ClientIcon from '@/assets/icons/ClientIcon';
import { useAppStore } from '@/state';
import { Consignment } from '@/types/ConsignmentTypes';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Text, View, ScrollView } from 'react-native';
import axios from 'axios';

const ConsignmentDetails = () => {
  const { docEntry } = useLocalSearchParams();
  const [consignment, setConsignment] = useState<Consignment | null>(null);
  const { fetchUrl } = useAppStore();

  useEffect(() => {
    const fetchConsignment = async () => {
      const response = await axios.get(`${fetchUrl}/api/Documentos/${docEntry}`);
      const data = response.data as Consignment;
      setConsignment(data);
    };

    fetchConsignment();
  }, [docEntry]);

  return (
    <ScrollView className='px-4 bg-white flex-1'>
      {/* Encabezado de información del cliente */}
      {consignment && (
        <View className='flex-row items-center justify-between py-4 border-b border-gray-300'>
          <View className='flex-row items-start'>
            <View className='bg-primary p-2 rounded-full h-[50px] w-[50px] items-center justify-center'>
              <ClientIcon size={30} color='white' />
            </View>
            <View className='ml-4 flex-1'>
              <Text className='text-lg tracking-[-0.3px]' style={{ fontFamily: 'Poppins-SemiBold' }}>{consignment.cardName}</Text>
              <Text className='text-sm text-gray-600 tracking-[-0.3px]' style={{ fontFamily: 'Poppins-Regular' }}>RTN: {consignment.federalTaxID}</Text>
              <Text className='text-sm text-gray-600 tracking-[-0.3px]' style={{ fontFamily: 'Poppins-Regular' }}>Documento: {docEntry}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Detalles de consignación */}
      {consignment && (
        <View className='mt-4'>
          <Text className='text-xl mb-2 tracking-[-0.3px]' style={{ fontFamily: 'Poppins-SemiBold' }}>Detalles de la Consignación</Text>

          <View className='flex-row gap-4 mb-4'>
            <View className='flex-1 bg-gray-100 px-4 py-2 rounded-2xl flex-col items-start'>
              <Text className='tracking-[-0.3px] text-gray-400 text-md' style={{ fontFamily: 'Poppins-SemiBold' }}>Fecha</Text>
              <Text className='tracking-[-0.3px] text-lg' style={{ fontFamily: 'Poppins-Regular' }}>{new Date(consignment.docDate).toLocaleDateString()}</Text>
            </View>

            <View className='flex-1 bg-gray-100 px-4 py-2 rounded-2xl flex-col items-start'>
              <Text className='tracking-[-0.3px] text-gray-400 text-md' style={{ fontFamily: 'Poppins-SemiBold' }}>Total</Text>
              <Text className='tracking-[-0.3px] text-lg' style={{ fontFamily: 'Poppins-Regular' }}>
                Lps. {consignment.docTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <Text className='tracking-[-0.3px]' style={{ fontFamily: 'Poppins-SemiBold' }}>Productos</Text>
          {consignment.lines.map((line, index) => (
            <View key={index} className='py-2 gap-4 border-b border-gray-200 flex-row items-center'>
              <Image
                source={{ uri: 'https://pub-f524aa67d2854c378ac58dd12adeca33.r2.dev/BlurImage.png' }}
                resizeMode='contain'
                height={100} width={140}
                className='border-2 border-gray-200 rounded-xl'
              />
              <View className='flex-1'>
                <Text className='tracking-[-0.3px]' style={{ fontFamily: 'Poppins-SemiBold' }}>{line.itemDescription}</Text>
                <Text className='tracking-[-0.3px] text-sm text-gray-500' style={{ fontFamily: 'Poppins-Regular' }}>Código: {line.itemCode}</Text>
                <Text className='tracking-[-0.3px] text-sm text-gray-500' style={{ fontFamily: 'Poppins-Regular' }}>Cantidad: {line.quantity}</Text>
                <Text className='tracking-[-0.3px] text-sm text-gray-500' style={{ fontFamily: 'Poppins-Regular' }}>
                  Precio: {line.priceAfterVAT.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default ConsignmentDetails;