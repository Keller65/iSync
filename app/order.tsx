import ClientIcon from '@/assets/icons/ClientIcon';
import { useAuth } from '@/context/auth';
import api from '@/lib/api';
import { useAppStore } from '@/state';
import { OrderDataType } from '@/types/types';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View, } from 'react-native';

const OrderDetails = () => {
  const route = useRoute();
  const { OrderDetails: docEntryParam } = route.params as { OrderDetails: string };
  const [orderData, setOrderData] = useState<OrderDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { fetchUrl } = useAppStore();

  const { user } = useAuth();

  // Helper para formatear valores monetarios con 2 decimales usando toLocaleString
  const formatMoney = useCallback((value?: number | null) => {
    return (value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchOrderDetails = async () => {
      console.log(docEntryParam);
      try {
        const response = await api.get(
          `/api/Quotations/${docEntryParam}`,
          {
            baseURL: fetchUrl,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user?.token}`,
            },
            cache: {
              ttl: 1000 * 60 * 60 * 24, // 24 horas
            },
          }
        );
        console.log(response.cached ? 'Pedido cargado desde CACHE' : 'Pedido cargado desde RED');
        if (isMounted) {
          setOrderData(response.data);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        if (isMounted) {
          Alert.alert('Error', 'No se pudieron cargar los detalles del pedido.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (docEntryParam) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [docEntryParam]);

  const totalItems = useMemo(() => {
    return orderData?.lines?.reduce((sum, line) => sum + (line.quantity ?? 0), 0) || 0;
  }, [orderData]);

  const handleShareAsPdf = useCallback(async () => {
    if (!orderData) {
      Alert.alert('Error', 'No hay datos del pedido para generar el PDF.');
      return;
    }

    setIsGeneratingPdf(true);

    const htmlContent = `
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
    * {
      font-family: 'Poppins', sans-serif;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: #fff;
      color: #111;
      font-size: 14px;
    }
    .factura-container {
      max-width: 800px;
      margin: auto;
      padding: 24px;
    }
    /* Encabezado */
    .encabezado {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .encabezado-izq p {
      margin-bottom: 4px;
    }
    .encabezado-izq strong {
      font-size: 16px;
    }
    .encabezado-der {
      text-align: right;
    }
    .encabezado-der .logo {
      font-weight: 700;
      font-size: 20px;
    }
    /* Barra oscura */
    .barra-info {
      background: #1f2937;
      color: #fff;
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .barra-info div {
      text-align: center;
    }
    .barra-info p {
      font-size: 12px;
      margin-bottom: 4px;
      color: #d1d5db;
    }
    .barra-info strong {
      font-size: 14px;
    }
    /* Tabla productos */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      text-align: left;
      background: #f9fafb;
      padding: 10px;
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    /* Totales */
    .totales {
      width: 100%;
      margin-top: 20px;
    }
    .totales td {
      border: none;
      padding: 6px 0;
    }
    .totales .fila-total td {
      font-weight: 700;
      font-size: 15px;
      border-top: 2px solid #111;
      padding-top: 8px;
    }
    /* Métodos de pago */
    .pago {
      margin-top: 20px;
      font-size: 13px;
    }
    .pago p {
      margin-bottom: 4px;
    }
    /* Footer */
    .pie {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #6b7280;
      align-items: center;
    }
    .pie-info {
      display: flex;
      gap: 10px;
    }
    .pie-info span {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  </style>
</head>
<body>
  <div class="factura-container">
    <!-- Encabezado -->
    <div class="encabezado">
      <div class="encabezado-izq">
        <p>Para:</p>
        <strong>${orderData.cardName ?? 'N/A'}</strong>
        <p>${orderData.address ?? 'Dirección no disponible'}</p>
      </div>
      <div class="encabezado-der">
        <div class="logo">Grupo Alfa & Omega</div>
        <p></p>
      </div>
    </div>

    <!-- Barra oscura -->
    <div class="barra-info">
      <div>
        <p>Total a Pagar</p>
        <strong>L. ${(orderData.docTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
      </div>
      <div>
        <p>Fecha</p>
        <strong>${new Date(orderData.docDate ?? '').toLocaleDateString()}</strong>
      </div>
      <div>
        <p>N° de Pedido</p>
        <strong>${orderData.docEntry ?? 'N/A'}</strong>
      </div>
    </div>

    <!-- Tabla productos -->
    <table>
      <thead>
        <tr>
          <th style="width:50%">Producto</th>
          <th style="width:15%" class="text-right">Precio UNT</th>
          <th style="width:10%" class="text-center">Cantidad</th>
          <th style="width:15%" class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${orderData.lines.map(item => `
          <tr>
            <td>${item.itemDescription ?? 'N/A'}</td>
            <td class="text-right">L. ${(item.priceAfterVAT ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td class="text-center">${item.quantity ?? 0}</td>
            <td class="text-right">L. ${((item.priceAfterVAT ?? 0) * (item.quantity ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totales -->
    <table class="totales">
      <tr>
        <td style="width:80%" class="text-right">Subtotal:</td>
        <td class="text-right">L. ${((orderData.docTotal ?? 0) - (orderData.vatSum ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td class="text-right">ISV:</td>
        <td class="text-right">L. ${(orderData.vatSum ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="fila-total">
        <td class="text-right">Total a Pagar:</td>
        <td class="text-right">L. ${(orderData.docTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>
    </table>

    <!-- Método de pago -->
    <div class="pago">
      <p><strong>Vendedor: </strong>${user?.fullName ?? 'Vendedor no disponible'}</p>
    </div>

    <!-- Footer -->
    <div class="pie">
      <div>© ${new Date().getFullYear()} Grupo Alfa & Omega</div>
      <div class="pie-info">
        <span>📍 Barrio el cacao 32 y 33 cll SE 3 AV SE San pedro sula, cortes, Honduras.</span>
        <span>📧 info@alfayomega-hn.com</span>
        <span>🌐 alfayomega-hn.com</span>
      </div>
    </div>
  </div>
</body>
</html>
`;


    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `Pedido #${orderData.docEntry ?? 'N/A'} - ${orderData.cardName ?? 'N/A'}`,
        });
      } else {
        Alert.alert('Compartir no disponible', 'Tu dispositivo no permite compartir archivos.');
      }
    } catch (error) {
      console.error('Error al generar o compartir el PDF:', error);
      Alert.alert('Error', 'No se pudo generar o compartir el PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [orderData, user]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-2 text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">Cargando detalles del pedido...</Text>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">No se encontraron detalles para este pedido.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <View className="p-5 bg-white rounded-b-[36px] shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-center mb-5">
          <View className="flex-row items-center gap-2">
            <View className="bg-[#fcde41] w-[40px] h-[40px] items-center justify-center rounded-full">
              <ClientIcon size={24} color="#000" />
            </View>

            <View>
              <Text className="ml-2 text-lg font-[Poppins-SemiBold] tracking-[-0.3px]">
                {orderData.cardName ?? 'N/A'}
              </Text>
              <Text className="ml-2 text-md font-[Poppins-SemiBold] text-gray-600 tracking-[-0.3px]">
                {orderData.cardCode ?? 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View className='flex-row gap-4 py-4'>
          <View className="flex-1">
            <Text className="text-sm text-gray-600 font-[Poppins-Regular]">
              RTN: {orderData.federalTaxID ?? 'No disponible'}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-sm text-gray-600 font-[Poppins-Regular]">
              Vendedor: {user?.fullName ?? 'No disponible'}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between mb-5">
          <View className="flex-1 p-3 bg-gray-50 rounded-lg mr-2">
            <Text className="text-xs text-gray-500">Estado</Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="checkmark-circle" size={18} color="orange" />
              <Text className="ml-1 text-sm font-[Poppins-SemiBold] text-orange-500">
                En Proceso
              </Text>
            </View>
          </View>
          <View className="flex-1 p-3 bg-gray-50 rounded-lg ml-2">
            <Text className="text-xs text-gray-500 font-[Poppins-Regular]">Fecha</Text>
            <Text className="text-sm font-[Poppins-SemiBold] mt-1">
              {new Date(orderData.docDate ?? '').toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View className="flex-row justify-between mb-5">
          <View className="flex-1 p-3 bg-gray-50 rounded-lg mr-2">
            <Text className="text-xs text-gray-500 font-[Poppins-Regular]">
              Total del Pedido
            </Text>
            <Text className="text-xl text-gray-900 mt-1 font-[Poppins-SemiBold]">
              L. {(orderData.docTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View className="flex-1 p-3 bg-gray-50 rounded-lg ml-2">
            <Text className="text-xs text-gray-500 font-[Poppins-Regular]">Items</Text>
            <Text className="text-xl font-[Poppins-SemiBold] text-gray-900 mt-1">
              {totalItems.toLocaleString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="w-full bg-yellow-300 h-[50px] rounded-full flex-row gap-3 p-2 items-center justify-center"
          onPress={handleShareAsPdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? (
            <>
              <ActivityIndicator color="black" />
              <Text className="text-black font-[Poppins-SemiBold] tracking-[-0.3px]">
                Generando PDF
              </Text>
            </>
          ) : (
            <>
              <Entypo name="share" size={24} color="black" />
              <Text className="text-black font-[Poppins-SemiBold] tracking-[-0.3px]">
                Compartir como PDF
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View className="my-5 ">
        <Text className="text-xl mb-4 font-[Poppins-SemiBold] tracking-[-0.3px]">Productos</Text>
        {orderData.lines && orderData.lines.length > 0 ? (
          orderData.lines.map((item, index) => (
            <View
              key={index}
              className="flex-row items-center bg-white p-3 rounded-lg mb-3 shadow-sm border border-gray-100"
            >
              <View className="bg-white rounded-xl overflow-hidden mr-3">
                <Image
                  source={{ uri: `https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/${item.itemCode}.jpg` }}
                  style={{ height: 60, width: 60, objectFit: "contain" }}
                  contentFit="contain"
                  transition={500}
                />
              </View>

              <View className="flex-1">
                <Text className="text-base font-semibold font-[Poppins-Regular] tracking-[-0.3px] leading-5">
                  {item.itemDescription ?? 'N/A'}
                </Text>
                <Text className="text-sm text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">
                  Cantidad: {(item.quantity ?? 0).toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-bold font-[Poppins-Regular] tracking-[-0.3px]">
                  L. {formatMoney((item.quantity ?? 0) * (item.priceAfterVAT ?? 0))}
                </Text>
                <Text className="text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">
                  Precio Unitario: L. {formatMoney(item.priceAfterVAT)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-gray-500 text-center mt-4">No hay productos en este pedido.</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default OrderDetails;