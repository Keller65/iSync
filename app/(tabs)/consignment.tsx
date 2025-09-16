import PlusIcon from '@/assets/icons/PlusIcon';
import BottomSheetConsignment from '@/components/BottomSheetConsignment/page';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Button, Text, TouchableOpacity, View } from 'react-native';

const Consignment = () => {
  const { fetchUrl, productsInConsignment } = useAppStore();
  const { user } = useAuth();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const handlePost = async () => {
    const data = {
      codigoCliente: '10203',
      codigoConcepto: '3',
      almacenSalida: '1',
      fecha: new Date().toISOString(),
      referencia: 'API',
      partidas: [
        {
          codigoProducto: '0151276150828',
          cantidad: 2,
          precioUnitario: 590,
          observaciones: 'no hay',
        },
      ],
    };

    try {
      const response = await axios.post(`${fetchUrl}/api/Consignaciones/async`, data, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Prefer: 'respond-async',
          Authorization: `Bearer ${user?.token}`,
          'User-Agent': 'iSync-ERP',
        },
      });

      console.log('✅ Respuesta exitosa:', response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Error en la solicitud:', error.response?.data || error.message);
      } else {
        console.error('❌ Error desconocido:', (error as Error).message);
      }
    }
  };

  useEffect(() => {
    if (!user?.token) return;

    const ws = new WebSocket(`ws://200.115.191.23:6161/ws?token=${user.token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🔗 Conectado al WebSocket');
    };

    ws.onmessage = (event) => {
      console.log('📩 Mensaje recibido:', event.data);
      setMessages(prev => [...prev, event.data]);
    };

    ws.onerror = (err) => {
      console.error('⚠️ Error de WebSocket:', err);
    };

    ws.onclose = (event) => {
      console.log('❌ Conexión cerrada', event.code, event.reason);
    };

    return () => {
      ws.close();
    };
  }, [user?.token]);

  return (
    <View className="px-4 bg-white flex-1 relative gap-2">
      <Text className="text-lg font-semibold mb-4">Consignment</Text>

      <Button title="Enviar POST con Axios" onPress={handlePost} />

      <Text>
        Mensajes recibidos:
        {messages.length === 0 ? (
          <Text> No hay mensajes recibidos.</Text>
        ) : (
          messages.map((msg, index) => <Text key={index}>{msg}</Text>)
        )}
      </Text>

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
    </View>
  );
};

export default Consignment;