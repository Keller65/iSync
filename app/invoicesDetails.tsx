import ReceiptIcon from '@/assets/icons/InvoicesIcon';
import { PaymentData } from '@/types/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const InvoicesDetails = () => {
  const { item } = useLocalSearchParams<{ item?: string | string[] }>();

  const invoiceDetails = useMemo<PaymentData | null>(() => {
    const raw = Array.isArray(item) ? item[0] : item;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PaymentData;
    } catch (e) {
      console.error('No se pudo parsear el parámetro item:', e);
      return null;
    }
  }, [item]);

  const formatMoney = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? Number(value) : value ?? 0;
    const safe = isNaN(Number(num)) ? 0 : Number(num);
    return safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!invoiceDetails) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className='font-[Poppins-SemiBold] tracking-[-0.3px]'>No se encontró el recibo.</Text>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={{ paddingHorizontal: 16, position: 'relative', backgroundColor: 'white' }} showsVerticalScrollIndicator={false}>
      <View className='flex-row justify-between items-center w-full'>
        <Text className="text-xl font-[Poppins-SemiBold] tracking-[-0.3px] mt-4 mb-2">Cliente</Text>

        <TouchableOpacity
          onPress={() => {
            router.push({ pathname: '/previewInvoice', params: { item: Array.isArray(item) ? item[0] : item } });
          }}
          className="z-50"
        >
          <Feather name="printer" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-4 mb-4 items-center">
        <View className="bg-yellow-300 rounded-full items-center justify-center h-[50px] w-[50px]">
          <MaterialCommunityIcons name="account-circle" size={30} color="#000" />
        </View>
        <View>
          <Text className="font-[Poppins-SemiBold] tracking-[-0.3px] leading-5">{invoiceDetails.cardName}</Text>
          <Text className="font-[Poppins-Medium] tracking-[-0.3px] leading-5">{invoiceDetails.cardCode}</Text>
        </View>
      </View>

      <Text className="text-xl font-[Poppins-SemiBold] mb-2 tracking-[-0.3px]">Facturas Abonadas</Text>
      {invoiceDetails.invoices.map((inv) => (
        <View
          key={inv.numAtCard ?? inv.invoiceDocNum}
          className="flex-row items-start gap-4 bg-gray-100 p-4 rounded-xl mb-3"
        >
          <View className="bg-yellow-300 p-2 rounded-xl">
            <ReceiptIcon />
          </View>

          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-1">
              <View>
                <Text className="font-[Poppins-SemiBold] text-base tracking-[-0.3px]">
                  Factura Nº: {inv.numAtCard ?? inv.invoiceDocNum}
                </Text>
                <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">
                  Total: L. {formatMoney(inv.docTotal)}
                </Text>
                <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">
                  Saldo Anterior: L. {formatMoney(inv.saldoAnterior)}
                </Text>
                <Text className="font-[Poppins-Regular] text-red-500 text-xs tracking-[-0.3px]">
                  Abono: L. {formatMoney(inv.appliedAmount ?? 0)}
                </Text>
                <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">
                  Saldo Pendiente: L. {formatMoney(inv.pendiente)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ))}

      <Text className="text-xl font-[Poppins-SemiBold] mt-4 mb-2">Información de Pago</Text>
      <View className="bg-white rounded-2xl h-fit overflow-hidden border border-gray-200 shadow-sm">
        <View className="bg-yellow-300 p-2">
          <Text className="text-xl font-[Poppins-Bold] text-gray-800 text-center">Detalles del Pago</Text>
        </View>

        <View className="p-4">
          <View className="flex-row justify-between items-center mb-2 p-3 bg-gray-100 rounded-lg">
            <Text className="text-base font-[Poppins-Regular] text-gray-700">Medio de Pago</Text>
            <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.paymentMeans}</Text>
          </View>

          {invoiceDetails.paymentMeans === "Tarjeta" && invoiceDetails.payment?.[0] && (
            <View className="flex-row justify-between items-center mb-2 p-3 bg-gray-100 rounded-lg">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-[Poppins-Regular] text-gray-700">Referencia</Text>
              </View>
              <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.payment?.[0]?.cardVoucherNum || 'N/D'}</Text>
            </View>
          )}

          {invoiceDetails.paymentMeans === "Cheque" && invoiceDetails.payment?.[0] && (
            <View className="items-center gap-2 mb-2">
              <View className='w-full gap-2 h-fit flex-row'>
                <View className="flex-1 items-start gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Banco</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment?.[0]?.bankCode || 'N/D'}</Text>
                </View>

                <View className="flex-1 items-start gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Numero de Cheque</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment?.[0]?.checkNumber || 'N/D'}</Text>
                </View>
              </View>

              <View className="flex-1 w-full items-start gap-2 p-3 rounded-lg bg-gray-100">
                <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Fecha del Cheque</Text>
                <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment?.[0]?.dueDate || 'N/D'}</Text>
              </View>
            </View>
          )}

          {invoiceDetails.paymentMeans === "Transferencia" && invoiceDetails.payment?.[0] && (
            <View className="items-center gap-2 mb-2">
              <View className="flex-1 w-full items-start justify-center gap-2 p-3 rounded-lg bg-gray-100">
                <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Fecha de la Transferencia</Text>
                <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment?.[0]?.transferDate || 'N/D'}</Text>
              </View>

              <View className="flex-1 w-full items-start justify-center gap-2 p-3 rounded-lg bg-gray-100">
                <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Referencia</Text>
                <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment?.[0]?.transferReference || 'N/D'}</Text>
              </View>

              <View className="flex-1 w-full items-start justify-center p-3 rounded-lg bg-gray-100">
                <Text className="text-sm font-[Poppins-Regular] text-gray-700">Cuenta</Text>
                <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.payment?.[0]?.transferAccountName || "No disponible"}</Text>
              </View>
            </View>
          )}

          <View className="flex-row justify-between items-center mb-2 p-3 bg-gray-100 rounded-lg">
            <Text className="text-base font-[Poppins-Regular] text-gray-700">Total</Text>
            <Text className="text-base font-[Poppins-SemiBold] text-gray-800">L. {formatMoney(invoiceDetails.total)}</Text>
          </View>

          <View className="flex-row justify-between items-center p-3 bg-gray-100 rounded-lg">
            <Text className="text-base font-[Poppins-Regular] text-gray-700">Fecha</Text>
            <Text className="text-base font-[Poppins-SemiBold] text-gray-800">
              {new Date(invoiceDetails.docDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between border-b border-b-gray-300 border-dashed mt-10 mb-4">
        <Text className="font-[Poppins-SemiBold] text-xl tracking-[-0.4px]">Total</Text>
        <Text className="font-[Poppins-SemiBold] text-xl tracking-[-0.4px]">L. {formatMoney(invoiceDetails.total)}</Text>
      </View>
    </ScrollView>
  );
};

export default InvoicesDetails;