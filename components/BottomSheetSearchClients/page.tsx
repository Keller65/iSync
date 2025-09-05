import ClientIcon from '@/assets/icons/ClientIcon';
import { useAppStore } from '@/state';
import { Customer } from '@/types/types';
import { BottomSheetBackdrop, BottomSheetFlashList, BottomSheetModal } from '@gorhom/bottom-sheet';
import axios from 'axios';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from '@/context/auth';
import api from '@/lib/api';

export interface Client {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  priceListNum: number;
}

export type BottomSheetSearchClientsHandle = {
  present: () => void;
  close: () => void;
};

interface Props {
  onSelect?: (client: Client) => void;
}

const BottomSheetSearchClients = forwardRef<BottomSheetSearchClientsHandle, Props>(({ onSelect }, ref) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const modalRef = useRef<BottomSheetModal>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();

  const fetchClients = async () => {
    try {
      setError(null);
      setLoading(true);
      fetchControllerRef.current?.abort();
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      const { data } = await api.get(
        `/api/Customers/by-sales-emp?slpCode=${user?.salesPersonCode}&page=1&pageSize=1000`,
        {
          baseURL: fetchUrl,
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          }

        }
      );

      const items = data && Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      setClients(items);
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.message === 'canceled') {
        return;
      }
      setError('Error al cargar clientes');
      console.error(err);
    } finally {
      setLoading(false);
      fetchControllerRef.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    present: () => {
      modalRef.current?.present();
      fetchClients();
    },
    close: () => {
      fetchControllerRef.current?.abort();
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      modalRef.current?.close();
    },
  }), []);

  const filteredClients = clients.filter(client =>
    client.cardName.toLowerCase().includes(searchText.toLowerCase())
  );

  const setSelectedCustomerLocation = useAppStore((s) => s.setSelectedCustomerLocation);
  const clearSelectedCustomerLocation = useAppStore((s) => s.clearSelectedCustomerLocation);

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={['90%']}
      backgroundStyle={{ borderRadius: 30 }}
      enableDynamicSizing={false}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          pressBehavior="close"
        />
      )}
    >
      <View className="flex-1 px-4">

        <View className='mb-2'>
          <View className="bg-gray-200 rounded-2xl px-4 text-base font-[Poppins-Regular] text-black flex-row items-center gap-2">
            <Feather name="search" size={20} color="#9ca3af" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar por nombre, código o RTN"
              className="w-[86%] font-[Poppins-Medium] tracking-[-0.3px]"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <BottomSheetFlashList
          data={filteredClients}
          keyExtractor={(item) => item.cardCode}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row flex-1 items-center gap-3 my-2"
              onPress={() => {
                modalRef.current?.close();
                if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
                settleTimerRef.current = setTimeout(() => {
                  setSelectedCustomerLocation(item as unknown as Customer);
                  onSelect?.(item);
                  settleTimerRef.current = null;
                }, 120);
              }}
            >
              <View className="bg-[#fcde41] w-[50px] h-[50px] items-center justify-center rounded-full">
                <ClientIcon size={24} color="#000" />
              </View>

              <View className="flex-1 justify-center">
                <Text className="font-[Poppins-SemiBold] text-lg text-black tracking-[-0.3px]">
                  {item.cardName}
                </Text>

                <View className="flex-row gap-2">
                  <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">
                    Código: <Text className="font-[Poppins-Regular]">{item.cardCode}</Text>
                  </Text>
                  <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">
                    RTN: {' '}
                    <Text className="font-[Poppins-Regular] tracking-[-0.3px]">
                      {item.federalTaxID
                        ? item.federalTaxID.replace(/^(\d{4})(\d{4})(\d{6})$/, '$1-$2-$3')
                        : ''}
                    </Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          nestedScrollEnabled={true}
          estimatedItemSize={64}
        />
      </View>
    </BottomSheetModal>
  );
});

export default BottomSheetSearchClients;
