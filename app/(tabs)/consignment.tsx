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