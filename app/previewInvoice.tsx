import { useAuth } from '@/context/auth';
import { PaymentData } from '@/types/types';
import Feather from '@expo/vector-icons/Feather';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

const IMAGE = Asset.fromModule(require('@/assets/images/LogoAlfayOmega.png'));

// Helpers
const formatMoney = (value: number | string | null | undefined) => {
  const num = typeof value === 'string' ? Number(value) : value ?? 0;
  const safe = isNaN(Number(num)) ? 0 : Number(num);
  return safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date: any) => {
  if (!date) return 'N/D';
  const d = new Date(date);
  return isNaN(d.getTime()) ? 'N/D' : d.toISOString().split('T')[0];
};

const getBase64Logo = async () => {
  await IMAGE.downloadAsync();
  return await FileSystem.readAsStringAsync(IMAGE.localUri!, {
    encoding: FileSystem.EncodingType.Base64,
  });
};

// Generar HTML
const generateInvoiceHTML = async (
  invoiceDetails: PaymentData | null,
  userFullName: string
) => {
  if (!invoiceDetails) return '';

  const base64Logo = await getBase64Logo();
  const folio = `${invoiceDetails?.docNum ?? ''}`;
  const dateStr = invoiceDetails?.docDate
    ? new Date(invoiceDetails.docDate).toLocaleString()
    : '';
  const pay = invoiceDetails?.payment?.[0] ?? {};

  let paymentExtra = '';
  if (invoiceDetails?.paymentMeans === 'Tarjeta') {
    paymentExtra = `<div class="row"><span>Referencia</span><span>${pay.cardVoucherNum ?? 'N/D'}</span></div>`;
  } else if (invoiceDetails?.paymentMeans === 'Cheque') {
    paymentExtra = `
      <div class="row"><span>Banco</span><span>${pay.bankCode ?? 'N/D'}</span></div>
      <div class="row"><span>N° Cheque</span><span>${pay.checkNumber ?? 'N/D'}</span></div>
      <div class="row"><span>Fecha Cheque</span><span>${pay.dueDate ?? 'N/D'}</span></div>
    `;
  } else if (invoiceDetails?.paymentMeans === 'Transferencia') {
    paymentExtra = `
      <div class="row"><span>Fecha</span><span>${pay.transferDate ?? 'N/D'}</span></div>
      <div class="row"><span>Referencia</span><span>${pay.transferReference ?? 'N/D'}</span></div>
      <div class="row"><span>Cuenta</span><span>${pay.transferAccountName ?? 'N/D'}</span></div>
    `;
  }

  const facturasHTML = invoiceDetails?.invoices
    ?.map((inv) => {
      return `
        <div class="table-row">
          <span class="col-date">${formatDate(inv.invoiceDate)}</span>
          <span class="col-invoice">${inv.numAtCard ?? 'N/D'}</span>
          <span class="col-balance">L. ${formatMoney(inv.saldoAnterior)}</span>
          <span class="col-payment">L. ${formatMoney(inv.appliedAmount)}</span>
        </div>`;
    })
    .join('');

  const totalPendiente = invoiceDetails?.invoices?.reduce(
    (acc, inv) => acc + (Number(inv.pendiente) || 0),
    0
  );

  return `
    <html><head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@600&display=swap" rel="stylesheet">
    <style>
      * { font-family: 'Inter', sans-serif; }
      body { margin:0; padding:8px; font-size:10px; }
      .ticket { width:100%; max-width:400px; margin:0 auto; }
      img { max-width:80%; margin:12px auto; display:block; }
      .center { text-align:center; }
      .bold { font-weight:500; }
      .title-bold { font-weight:600; }
      .row { display:flex; justify-content:space-between; gap:8px; }
      .section-title { font-weight:600; margin:8px 0 4px; font-size:12px; }
      .divider { height:1px; background:#000; opacity:0.2; margin:8px 0; }
      .table-header, .table-row { display:flex; justify-content:space-between; }
      .table-header { font-weight:600; border-bottom:1px dashed #000; padding-bottom:3px; margin-bottom:5px; }
      .col-date, .col-invoice, .col-balance, .col-payment { width:25%; }
      .col-balance, .col-payment { text-align:right; }
      .foot { margin-top:24px; text-align:center; font-size:11px; }
    </style></head><body>
    <div class="ticket">
      <div class="center">
        <img src="data:image/png;base64,${base64Logo}" />
        <div class="title-bold" style="font-size:18px; margin-bottom:34px;">Grupo Alfa & Omega</div>
      </div>
      <div>
        <div class="row"><span class="bold">Recibo</span><span>${folio}</span></div>
        <div class="row"><span class="bold">Cliente</span><span>${invoiceDetails?.cardCode} - ${invoiceDetails?.cardName}</span></div>
        <div class="row"><span class="bold">Vendedor</span><span>${userFullName}</span></div>
        <div class="row"><span class="bold">Fecha</span><span>${dateStr}</span></div>
      </div>
      <div class="divider"></div>
      <div class="center section-title">Recibo de Cobros</div>
      <div class="divider"></div>
      <div class="section-title">Facturas</div>
      <div class="table-header">
          <span class="col-date">FECHA</span>
          <span class="col-invoice">FACTURA</span>
          <span class="col-balance">SALDO ANT.</span>
          <span class="col-payment">ABONO</span>
        </div>
      ${facturasHTML}
      <div class="divider"></div>
      <div class="section-title">Pago</div>
      <div class="row"><span>Método</span><span>${invoiceDetails?.paymentMeans}</span></div>
      ${paymentExtra}
      <div class="row bold"><span>Total pagado</span><span>L. ${formatMoney(invoiceDetails?.total)}</span></div>
      <div class="divider"></div>
      <div class="row bold"><span>Saldo pendiente</span><span>L. ${formatMoney(totalPendiente)}</span></div>
      <div class="divider"></div>
      <div class="foot">¡Gracias por su pago!<br/>Dudas o reclamos llamar al 9458-7168</div>
    </div>
    </body></html>`;
};

export default function PreviewInvoice() {
  const { item } = useLocalSearchParams<{ item?: string | string[] }>();
  const { user } = useAuth();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<{ url?: string } | null>(null);

  const invoiceDetails = useMemo<PaymentData | null>(() => {
    const raw = Array.isArray(item) ? item[0] : item;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PaymentData;
    } catch {
      return null;
    }
  }, [item]);

  // Generar HTML al cargar
  useEffect(() => {
    if (invoiceDetails) {
      (async () => {
        const generatedHtml = await generateInvoiceHTML(invoiceDetails, user?.fullName ?? '');
        setHtml(generatedHtml);
        setLoading(false);
      })();
    }
  }, [invoiceDetails, user]);

  const print = async () => {
    if (!html) return;
    setGenerating(true);
    try {
      await Print.printAsync({
        html,
        printerUrl: selectedPrinter?.url, // iOS only
      });
    } catch (error) {
      console.error('Error al imprimir:', error);
    } finally {
      setGenerating(false);
    }
  };

  const share = async () => {
    if (!html) return;
    try {
      const { uri } = await Print.printToFileAsync({
        html,
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir recibo',
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  if (!invoiceDetails) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="font-[Poppins-Regular] tracking-[-0.3px]">
          No se encontró la información.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {loading || !html ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="black" size="large" />
          <Text className="mt-2 font-[Poppins-Regular] tracking-[-0.3px]">
            Generando vista previa...
          </Text>
        </View>
      ) : (
        <View className="px-10 py-4 flex-1">
          <View className="flex-1 bg-white border border-gray-100 shadow-md p-4">
            <WebView originWhitelist={['*']} source={{ html }} style={{ flex: 1 }} />
          </View>
        </View>
      )}
      <View className="flex-row w-full gap-3 p-4 border-t border-gray-200 bg-white">
        <TouchableOpacity
          onPress={print}
          disabled={generating || loading}
          className={`flex-1 flex-row items-center justify-center rounded-full px-4 py-3 ${generating || loading ? 'bg-gray-300' : 'bg-yellow-300'
            }`}
        >
          <Feather name="printer" size={18} color="#000" />
          <Text className="ml-2 font-[Poppins-SemiBold]">
            {generating ? 'Procesando...' : 'Imprimir'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={share}
          disabled={loading}
          className={`flex-1 flex-row items-center justify-center rounded-full px-4 py-3 ${loading ? 'bg-gray-300' : 'bg-yellow-300'}`}
        >
          <Feather name="share-2" size={18} color="#000" />
          <Text className="ml-2 font-[Poppins-SemiBold]">
            Compartir
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
