import { View, Text, Button, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useAppStore } from '@/state';
import { useAuth } from '@/context/auth';
import PlusIcon from '@/assets/icons/PlusIcon';
import { useRouter } from 'expo-router';
import BottomSheetConsignment from '@/components/BottomSheetConsignment/page';

const Consignment = () => {
  const { fetchUrl } = useAppStore();
  const productsInConsignment = useAppStore((s) => s.productsInConsignment);
  const { user } = useAuth();
  const router = useRouter();

  const handlePost = async () => {
    const data = {
      codigoCliente: "10203",
      codigoConcepto: "3",
      almacenSalida: "1",
      fecha: "2025-09-15T17:22:26.121Z",
      referencia: "API",
      partidas: [
        {
          codigoProducto: "0151276150828",
          cantidad: 2,
          precioUnitario: 590,
          observaciones: "no hay",
        }
      ]
    };

    try {
      const response = await axios.post(`${fetchUrl}/api/Consignaciones/async`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'respond-async',
          'Authorization': `Bearer ${user?.token}`,
          'User-Agent': 'iSync-ERP',
        }
      });

      console.log('✅ Respuesta exitosa:', response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Error en la solicitud:', error.response ? error.response.data : error.message);
      } else {
        console.error('❌ Error en la solicitud:', (error as Error).message);
      }
    }
  };

  return (
    <View className='px-4 bg-white flex-1 relative'>
      <Text>Consignment</Text>
      <Button title="Enviar POST con Axios" onPress={handlePost} />

      <View className="absolute bottom-4 right-8 gap-3 items-end z-10">
        {productsInConsignment.length > 0 ? (
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

    </View >
  );
};

export default Consignment;