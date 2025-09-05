import ClientIcon from '@/assets/icons/ClientIcon';
import InvoicesIcon from '@/assets/icons/InvoicesIcon';
import { useAuth } from '@/context/auth';
import { SelectedInvoice, useAppStore } from '@/state';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const InvoiceItem = memo(({ item, formatDate, formatCurrency }: { item: SelectedInvoice, formatDate: (date: string) => string, formatCurrency: (amount: number) => string }) => (
  <View key={item.numAtCard} className="flex-row items-start gap-4 bg-gray-100 p-4 rounded-xl mb-3">
    <View className="bg-yellow-300 p-2 rounded-xl">
      <InvoicesIcon />
    </View>
    <View className="flex-1">
      <View className='flex-row justify-between items-center mb-1'>
        <View>
          <Text className="font-[Poppins-SemiBold] text-base tracking-[-0.3px]">Total: L.{formatCurrency(item.docTotal)}</Text>
          <Text className="font-[Poppins-Regular] text-red-600 tracking-[-0.3px]">Abono: L.{formatCurrency(item.paidAmount)}</Text>
          <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">Factura Nº: {item.numAtCard}</Text>
          <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">Fecha: {formatDate(item.docDate)}</Text>
        </View>
      </View>
    </View>
  </View>
));

const Cobro = () => {
  const [loading, setLoading] = useState(false);
  const { Name, Code } = useLocalSearchParams();
  const { selectedInvoices, paymentForm, fetchUrl, clearPaymentForm } = useAppStore();
  const route = useRouter();
  const totalAbonado = selectedInvoices.reduce((sum, item) => sum + item.paidAmount, 0);
  const paymentAmount = paymentForm.amount && paymentForm.amount !== '' && paymentForm.amount !== null ? Number(paymentForm.amount) : 0;
  const disableCobroBtn = !paymentForm.method || paymentAmount < totalAbonado || loading;
  const { user } = useAuth();

  const buildBody = (lat: string, long: string) => {
    const toHondurasISO = (): string => {
      try {
        const parts = Object.fromEntries(
          new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Tegucigalpa',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
            .formatToParts(new Date())
            .map(p => [p.type, p.value])
        ) as Record<string, string>;
        return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}-06:00`;
      } catch {
        // Fallback sin Intl
        const now = new Date();
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        const hondMs = utcMs - 6 * 60 * 60 * 1000;
        const hond = new Date(hondMs);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${hond.getUTCFullYear()}-${pad(hond.getUTCMonth() + 1)}-${pad(hond.getUTCDate())}T${pad(hond.getUTCHours())}:${pad(hond.getUTCMinutes())}:${pad(hond.getUTCSeconds())}-06:00`;
      }
    };

    const base = {
      CardCode: Code,
      U_SlpCode: user?.salesPersonCode?.toString() || '',
      u_Latitud: lat,
      u_Longitud: long,
      DocDate: toHondurasISO(),
      CheckAccount: '',
      PaymentChecks: [],
      PaymentInvoices: selectedInvoices.map(inv => ({
        DocEntry: inv.docEntry,
        SumApplied: inv.paidAmount,
        BalanceDue: inv.balanceDue
      })),
      paymentCreditCards: []
    };
    switch (paymentForm.method) {
      case 'Transferencia':
        return {
          ...base,
          TransferAccount: paymentForm.method === 'Transferencia' ? paymentForm.bank || '' : '',
          TransferReference: paymentForm.method === 'Transferencia' ? paymentForm.reference || '' : '',
          TransferDate: paymentForm.method === 'Transferencia' ? paymentForm.date : '',
          TransferSum: paymentForm.method === 'Transferencia' ? Number(paymentForm.amount) || 0 : '',
        };
      case 'Efectivo':
        return {
          ...base,
          CashAccount: paymentForm.bank,
          CashSum: Number(paymentForm.amount),
          TransferAccount: '',
          TransferReference: '',
          CheckAccount: '',
        };
      case 'Cheque':
        return {
          ...base,
          TransferReference: '',
          TransferAccount: '',
          CheckAccount: paymentForm.bank,
          PaymentChecks: [
            {
              dueDate: paymentForm.date,
              checkNumber: paymentForm.reference,
              CountryCode: "HN",
              bankCode: paymentForm.bank,
              checkSum: paymentForm.amount
            }
          ]
        };
      case 'Tarjeta':
        return {
          ...base,
          TransferReference: '',
          TransferAccount: '',
          paymentCreditCards: [
            {
              creditCard: paymentForm.bank,
              voucherNum: paymentForm.reference,
              firstPaymentDue: paymentForm.date,
              creditSum: Number(paymentForm.amount) || 0
            }
          ]
        };
      default:
        return base;
    }
  };

  const handleCobro = async () => {
    setLoading(true);
    // Solicitar permisos y obtener ubicación
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Debes activar la ubicación para realizar el cobro.');
      setLoading(false);
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    if (!location || !location.coords) {
      alert('No se pudo obtener la ubicación.');
      setLoading(false);
      return;
    }
    const lat = location.coords.latitude.toString();
    const long = location.coords.longitude.toString();
    const body = buildBody(lat, long);
    try {
      const response = await axios.post(`${fetchUrl}/api/Payments/IncomingPayment`, body, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });
      clearPaymentForm();
      selectedInvoices.length = 0;
      route.push({
        pathname: '/modal/successCobro',
        params: {
          docEntry: response.data.docEntry,
          item: JSON.stringify(response.data),
        }
      });
      console.log('Parametro enviado: ', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error al realizar cobro:', error);
    }
    console.log('Cuerpo del Post', body);
    setLoading(false);
  };
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

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4">
        <View className="mb-6">
          <Text className="text-xl font-[Poppins-Bold] mb-4 tracking-[-0.3px]">Cliente</Text>
          <View className="flex-row items-center gap-4">
            <View className="bg-yellow-300 w-[50px] h-[50px] items-center justify-center rounded-full">
              <ClientIcon size={28} color="#000" />
            </View>
            <View>
              <Text className="font-[Poppins-Bold] text-lg tracking-[-0.3px]">{Name}</Text>
              <Text className="font-[Poppins-Regular] text-gray-500 tracking-[-0.3px]">Código: {Code}</Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <View className='flex-row justify-between items-center'>
            <Text className="text-xl font-[Poppins-Bold] tracking-[-0.3px]">Información de pago</Text>
            <TouchableOpacity onPress={() => route.push({
              pathname: '/modal/payment',
              params: {
                totalAbonado: totalAbonado
              }
            })}
              className="p-2"
            >
              <Ionicons name="arrow-forward" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity onPress={() => { }} className="flex-row justify-between items-center py-3 border-b border-gray-200">
              <Text className="font-[Poppins-Regular] text-lg tracking-[-0.3px]">Efectivo:</Text>
              <Text className="font-[Poppins-SemiBold] text-lg text-gray-600 tracking-[-0.3px]">
                L. {formatCurrency(paymentForm.method === 'Efectivo' ? Number(paymentForm.amount) || 0 : 0)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { }} className="flex-row justify-between items-center py-3 border-b border-gray-200">
              <Text className="font-[Poppins-Regular] text-lg tracking-[-0.3px]">Transferencia:</Text>
              <Text className="font-[Poppins-SemiBold] text-lg text-gray-600 tracking-[-0.3px]">
                L. {formatCurrency(paymentForm.method === 'Transferencia' ? Number(paymentForm.amount) || 0 : 0)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { }} className="flex-row justify-between items-center py-3 border-b border-gray-200">
              <Text className="font-[Poppins-Regular] text-lg tracking-[-0.3px]">Cheque(s):</Text>
              <Text className="font-[Poppins-SemiBold] text-lg text-gray-600 tracking-[-0.3px]">
                L. {formatCurrency(paymentForm.method === 'Cheque' ? Number(paymentForm.amount) || 0 : 0)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { }} className="flex-row justify-between items-center py-3">
              <Text className="font-[Poppins-Regular] text-lg tracking-[-0.3px]">Tarjeta:</Text>
              <Text className="font-[Poppins-SemiBold] text-lg text-gray-600 tracking-[-0.3px]">
                L. {formatCurrency(paymentForm.method === 'Tarjeta' ? Number(paymentForm.amount) || 0 : 0)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-xl font-[Poppins-Bold] mb-4 tracking-[-0.3px]">Facturas abonadas</Text>
        {selectedInvoices.map((item: SelectedInvoice) => (
          <InvoiceItem
            key={item.numAtCard}
            item={item}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
        ))}
      </ScrollView>

      <View className="p-4 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-[Poppins-Bold] tracking-[-0.3px]">Total</Text>
          <Text className="text-xl font-[Poppins-Bold] tracking-[-0.3px]">
            L. {
              formatCurrency(
                paymentForm.amount && paymentForm.amount !== '' && paymentForm.amount !== null
                  ? Number(paymentForm.amount)
                  : totalAbonado
              )
            }
          </Text>
        </View>
        <TouchableOpacity
          className={`py-4 rounded-full h-[55px] items-center justify-center ${disableCobroBtn ? 'bg-gray-300' : 'bg-yellow-300'}`}
          onPress={handleCobro}
          disabled={disableCobroBtn}
        >
          {loading ? (
            <View className="h-[55px] py-1 w-full items-center justify-center">
              <ActivityIndicator color={disableCobroBtn ? '#6B7280' : '#000'} />
            </View>
          ) : (
            <Text className={`font-[Poppins-SemiBold] text-lg tracking-[-0.3px] ${disableCobroBtn ? 'text-gray-500' : 'text-black'}`}>
              Realizar cobro
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Cobro;