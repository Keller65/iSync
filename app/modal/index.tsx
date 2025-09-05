import AntDesign from '@expo/vector-icons/AntDesign';
import ClientIcon from '@/assets/icons/ClientIcon';
import InvoicesIcon from '@/assets/icons/InvoicesIcon';
import TrashIcon from '@/assets/icons/TrashIcon';
import { useAuth } from '@/context/auth';
import { SelectedInvoice, useAppStore } from '@/state';
import { Invoice } from '@/types/types';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';

const IndexScreen = () => {
  const params = useLocalSearchParams();
  const { cardCode, cardName } = params as { cardCode: string, cardName: string };
  const { fetchUrl, addInvoice, selectedInvoices, removeInvoice, clearInvoices, clearPaymentForm } = useAppStore();
  const { user } = useAuth();
  const FETCH_URL = `${fetchUrl}/sap/customers`;
  const [openInvoices, setOpenInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = ['10%', '50%'];
  const proceedingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // proceedingRef.current = false;
      return () => {
        if (!proceedingRef.current) {
          clearInvoices();
          clearPaymentForm();
        }
      };
    }, [clearInvoices, clearPaymentForm])
  );

  useFocusEffect(
    useCallback(() => {
      return () => bottomSheetModalRef.current?.close()
    }, [])
  );

  const fetchInvoices = async () => {
    if (!user?.token || !cardCode) return;
    setLoading(true);

    try {
      const res = await axios.get(`${FETCH_URL}/${cardCode}/open-invoices`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      });
      setOpenInvoices(res.data || []);
    } catch (e: unknown) {
      console.error('Error al solicitar recibos pendientes:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, [cardCode, user?.token]);

  const formatDate = useCallback((isoDate: string): string => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const formatCurrency = useCallback((amount: number): string => {
    return amount.toLocaleString('es-HN', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setAmount(invoice.balanceDue.toString());
    setError('');
    setModalVisible(true);
  };

  const handleAccept = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Ingrese un monto válido.');
      return;
    }
    if (numAmount > (selectedInvoice?.balanceDue || 0)) {
      setError('El monto no puede ser mayor al saldo pendiente.');
      return;
    }
    if (selectedInvoice) {
      addInvoice(selectedInvoice, numAmount);
      setModalVisible(false);
      // Refrescar la lista para mostrar el estado actualizado
      setRefreshing(true);
      await fetchInvoices();
      setRefreshing(false);
    }
  };

  const renderOpenInvoiceItem = ({ item }: { item: Invoice }) => {
    const isSelected = selectedInvoices.some(inv => inv.numAtCard === item.numAtCard);

    return (
      <Pressable
        onPress={() => handleSelectInvoice(item)}
        className={`p-4 mb-4 rounded-3xl ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}
      >
        <View className="flex-row gap-2 mb-2 border border-b-black/10 border-t-transparent border-x-transparent pb-3 items-center">
          <View className="bg-yellow-300 p-2 rounded-xl">
            <InvoicesIcon />
          </View>
          <Text className="text-base text-start font-[Poppins-SemiBold] tracking-[-0.3px] text-black">
            Nº {item.numAtCard}
          </Text>
        </View>
        <View className='w-full flex-row'>
          <View className="mb-2 flex-1 w-full px-4">
            <Text className="text-gray-600 text-sm font-[Poppins-Regular]">Total factura:</Text>
            <Text className="text-base font-[Poppins-SemiBold] text-black">
              L. {formatCurrency(item.docTotal)}
            </Text>
          </View>
          <View className="mb-2 flex-1 w-full px-4">
            <Text className="text-gray-600 text-sm font-[Poppins-Regular]">Saldo pendiente:</Text>
            <Text className="text-base font-[Poppins-SemiBold] text-red-600">
              L. {formatCurrency(item.balanceDue)}
            </Text>
          </View>
        </View>
        <View className="flex-row justify-between gap-2">
          <View className='flex-1 w-full bg-gray-200 py-2 px-4 rounded-xl'>
            <Text className="text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">Fecha emisión</Text>
            <Text className="text-sm text-black font-[Poppins-Medium] tracking-[-0.3px]">{formatDate(item.docDate)}</Text>
          </View>
          <View className='flex-1 w-full bg-gray-200 py-2 px-4 rounded-xl'>
            <Text className="text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">Fecha vencimiento</Text>
            <Text className="text-sm text-black font-[Poppins-Medium] tracking-[-0.3px]">{formatDate(item.docDueDate)}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const MemoizedBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} />, []);

  const renderSelectedInvoiceItem = ({ item }: { item: SelectedInvoice }) => (
    <View className="p-4 mb-4 rounded-3xl bg-gray-100 relative">
      <View className="flex-row gap-2 mb-2 border border-b-black/10 border-t-transparent border-x-transparent pb-3 items-center">
        <View className="bg-yellow-300 p-2 rounded-xl">
          <InvoicesIcon />
        </View>
        <Text className="text-base text-start font-[Poppins-SemiBold] tracking-[-0.3px] text-black">
          Nº {item.numAtCard}
        </Text>
      </View>
      <View className="w-full flex-row">
        <View className="mb-2 flex-1 w-full px-4">
          <Text className="text-gray-600 text-sm font-[Poppins-Regular]">Monto Abonado:</Text>
          <Text className="text-base font-[Poppins-SemiBold] text-black">
            L. {formatCurrency(item.paidAmount)}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeInvoice(item.numAtCard)} className="absolute top-4 right-4">
        <TrashIcon size={20} color="red" />
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    if (selectedInvoices.length > 0) {
      bottomSheetModalRef.current?.present();
    }
  }, [selectedInvoices]);

  return (
    <View className="flex-1 bg-white px-4 relative">
      <View className='gap-4 flex-row mb-3 py-2'>
        <View className="bg-[#fcde41] w-[50px] h-[50px] items-center justify-center rounded-full">
          <ClientIcon size={24} color="#000" />
        </View>
        <View className='flex justify-center'>
          <Text className='text-black font-[Poppins-Bold]'>{cardName}</Text>
          <Text className='text-black font-[Poppins-Medium]'>{cardCode}</Text>
        </View>
      </View>
      {loading && openInvoices.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="text-gray-500 mt-2 font-[Poppins-Medium] tracking-[-0.3px]">Cargando facturas...</Text>
        </View>
      ) : (
        <FlashList
          data={openInvoices}
          renderItem={renderOpenInvoiceItem}
          estimatedItemSize={140}
          keyExtractor={(item) => item.numAtCard}
          extraData={selectedInvoices}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className='flex-1 bg-white items-center justify-center'>
              <Text className="text-center font-[Poppins-Medium] tracking-[-0.3px] text-gray-500 mt-10">
                No hay facturas pendientes.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl w-full p-6 shadow-xl">
            <Text className="text-2xl tracking-[-0.3px] font-[Poppins-Bold] mb-2 text-center text-gray-800">
              Abonar a Factura
            </Text>
            <Text className="text-sm tracking-[-0.3px] text-gray-500 mb-6 text-center">
              Ingresa el monto que el cliente desea Pagar.
            </Text>
            {selectedInvoice && (
              <>
                <View className="border-b border-gray-200 pb-4 mb-4">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-base tracking-[-0.3px] font-[Poppins-Regular] text-gray-600">Total:</Text>
                    <Text className="text-base tracking-[-0.3px] font-[Poppins-SemiBold] text-gray-800">L. {formatCurrency(selectedInvoice.docTotal)}</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-base tracking-[-0.3px] font-[Poppins-Regular] text-gray-600">Pendiente:</Text>
                    <Text className="text-base tracking-[-0.3px] font-[Poppins-SemiBold] text-red-600">L. {formatCurrency(selectedInvoice.balanceDue)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs tracking-[-0.3px] font-[Poppins-Regular] text-gray-400">Factura: {selectedInvoice.numAtCard}</Text>
                    <Text className="text-xs tracking-[-0.3px] font-[Poppins-Regular] text-gray-400">Fecha: {formatDate(selectedInvoice.docDate)}</Text>
                  </View>
                </View>
                <TextInput
                  placeholder="Ingresa el monto a pagar"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(val) => {
                    setAmount(val);
                    setError('');
                  }}
                  className="border-2 border-gray-200 rounded-xl p-4 text-lg text-gray-800 tracking-[-0.3px] font-[Poppins-Regular] focus:border-blue-500 transition-all duration-200"
                />
                {error ? <Text className="text-red-500 text-sm mt-2 font-[Poppins-Regular] tracking-[-0.3px]">{error}</Text> : null}
                <View className="flex-row justify-end mt-6 gap-3">
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="py-3 px-6 rounded-full items-center justify-center"
                  >
                    <Text className="text-red-500 tracking-[-0.3px] font-[Poppins-SemiBold]">Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAccept}
                    className="bg-yellow-300 py-3 px-6 rounded-full items-center justify-center"
                  >
                    <Text className="text-black tracking-[-0.3px] font-[Poppins-SemiBold]">Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={MemoizedBackdrop}
        enablePanDownToClose={selectedInvoices.length > 0 ? false : true}
        style={{ shadowColor: 'black', boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)', borderRadius: 16, elevation: 5, shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 }}
      >
        <View className="flex-1 px-4 pb-4">
          <Text className="text-xl mb-2 font-[Poppins-SemiBold] tracking-[-0.3px]">Facturas Seleccionadas</Text>
          {selectedInvoices.length > 0 ? (
            <>
              <BottomSheetFlatList
                data={selectedInvoices}
                renderItem={renderSelectedInvoiceItem}
                keyExtractor={item => item.numAtCard}
                extraData={selectedInvoices}
              />
              <View className="mt-4">
                <TouchableOpacity
                  onPress={async () => {
                    await bottomSheetModalRef.current?.close();
                    proceedingRef.current = true;
                    router.push({
                      pathname: '/modal/cobro',
                      params: {
                        Name: cardName,
                        Code: cardCode,
                      }
                    });
                  }}
                  className="bg-yellow-300 h-[50px] items-center justify-center rounded-full flex-row gap-2"
                >
                  <Text className="text-black font-[Poppins-SemiBold] text-lg tracking-[-0.3px]">Continuar</Text>
                  <AntDesign name="arrowright" size={20} color="black" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500 font-[Poppins-Regular]">No hay facturas seleccionadas.</Text>
            </View>
          )}
        </View>
      </BottomSheetModal>
    </View>
  );
};

export default IndexScreen;