import ClientIcon from '@/assets/icons/ClientIcon';
import { useAppStore } from '@/state';
import { Consignment } from '@/types/ConsignmentTypes';
import { Customer } from '@/types/types';
import { Feather } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const ConsignmentDetails = () => {
  const { docEntry } = useLocalSearchParams();
  const [consignment, setConsignment] = useState<Consignment | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { fetchUrl } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    const fetchConsignment = async () => {
      const response = await axios.get(`${fetchUrl}/api/Documentos/${docEntry}`);
      const data = response.data as Consignment;
      setConsignment(data);
    };

    fetchConsignment();
  }, [docEntry]);

  const shareAsPDF = async () => {
    if (!consignment) {
      alert('No hay datos de consignación disponibles para generar el PDF.');
      console.error('El objeto consignment está vacío o es nulo.');
      return;
    }

    try {
      setIsGeneratingPDF(true); // Mostrar indicador de actividad
      const htmlContent = generatePDFHtml(consignment);

      // Generar el PDF a partir del HTML
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Consignación',
        });
      } else {
        alert('La función de compartir no está disponible en este dispositivo.');
      }
    } catch (error) {
      console.error('Error al generar o compartir el PDF:', error);
      alert('Ocurrió un error al intentar generar el PDF.');
    } finally {
      setIsGeneratingPDF(false); // Ocultar indicador de actividad
    }
  };

  const generatePDFHtml = (consignment: Consignment) => {
    return `
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
        body {
          font-family: 'Poppins', Arial, sans-serif;
          background: #fff;
          color: #222;
          margin: 0;
          padding: 32px 0;
        }
        .container {
          width: 90%;
          margin: auto;
          background: #fff;
          border-radius: 16px;  
          padding: 32px 24px;
        }
        .header {
          text-align: left;
          margin-bottom: 24px;
          border-bottom: 1px solid #eee;
          padding-bottom: 16px;
        }
        .title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .subtitle {
          font-size: 1rem;
          color: #888;
          margin: 0;
        }
        .details {
          margin: 24px 0 0 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 24px;
          font-size: 0.98rem;
        }
        .details div {
          color: #444;
          background: #f6f7f9;
          border-radius: 8px;
          padding: 10px 14px;
          font-weight: 500;
        }
        .products {
          margin-top: 32px;
        }
        .products-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 12px;
          letter-spacing: -0.3px;
        }
        .product-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .product {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f6f7f9;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.97rem;
        }
        .product-desc {
          flex: 2;
          font-weight: 500;
          color: #222;
          margin-right: 8px;
        }
        .product-meta {
          flex: 1;
          text-align: right;
          color: #666;
          font-size: 0.95rem;
        }
        .product-meta span {
          display: block;
        }
        </style>
      </head>
      <body>
        <div class="container">
        <div class="header">
          <div class="title">Consignación</div>
          <div class="subtitle">${consignment.cardName} (${consignment.cardCode})</div>
        </div>
        <div class="details">
          <div>RTN:<br><strong>${consignment.federalTaxID}</strong></div>
          <div>Documento:<br><strong>${consignment.docEntry}</strong></div>
          <div>Fecha:<br><strong>${new Date(consignment.docDate).toLocaleDateString()}</strong></div>
          <div>Total:<br><strong>Lps. ${consignment.docTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
        </div>
        <div class="products">
          <div class="products-title">Productos</div>
          <div class="product-list">
          ${consignment.lines.map((line) => `
            <div class="product">
            <div class="product-desc">${line.itemDescription}</div>
            <div class="product-meta">
              <span>Cant: ${line.quantity}</span>
              <span>Lps. ${(line.priceAfterVAT * line.quantity).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            </div>
          `).join('')}
          </div>
        </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <View className='flex-1 bg-white relative'>
      <ScrollView className='px-4 bg-white flex-1'>
        {consignment && (
          <View className='flex-col items-center justify-between py-4 border-b border-gray-300'>
            <View className='flex-row items-start'>
              <View className='bg-primary p-2 rounded-full h-[50px] w-[50px] items-center justify-center'>
                <ClientIcon size={30} color='white' />
              </View>
              <View className='ml-4 flex-1'>
                <Text className='text-lg tracking-[-0.3px]' style={{ fontFamily: 'Poppins-SemiBold' }}>{consignment.cardName}</Text>
                <Text className='text-gray-500 tracking-[-0.3px]' style={{ fontFamily: 'Poppins-Regular' }}>{consignment.cardCode}</Text>
              </View>
            </View>
            <View className='w-full mt-4 flex-row justify-between gap-2'>
              <Text className='text-sm text-gray-600 tracking-[-0.3px]' style={{ fontFamily: 'Poppins-Regular' }}>RTN: {consignment.federalTaxID}</Text>
              <Text className='text-sm text-gray-600 tracking-[-0.3px]' style={{ fontFamily: 'Poppins-Regular' }}>Documento: {docEntry}</Text>
            </View>
          </View>
        )}

        {consignment && (
          <View className='mt-4'>
            <Text className='text-xl mb-2 tracking-[-0.3px]' style={{ fontFamily: 'Poppins-SemiBold' }}>Detalles del Pedido</Text>

            <View className='flex-col gap-4 mb-4'>
              <View className='flex-row gap-4 flex-1'>
                <View className='flex-1 bg-gray-100 px-4 py-2 rounded-2xl flex-col items-start'>
                  <Text className='tracking-[-0.3px] text-gray-400 text-md' style={{ fontFamily: 'Poppins-Regular' }}>Estado</Text>
                  <View className='flex-row items-center'>
                    <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                    <Text className='tracking-[-0.3px] text-lg text-green-500 ml-2' style={{ fontFamily: 'Poppins-SemiBold' }}>Completado</Text>
                  </View>
                </View>

                <View className='flex-1 bg-gray-100 px-4 py-2 rounded-2xl flex-col items-start'>
                  <Text className='tracking-[-0.3px] text-gray-400 text-md' style={{ fontFamily: 'Poppins-Regular' }}>Fecha</Text>
                  <Text className='tracking-[-0.3px] text-lg' style={{ fontFamily: 'Poppins-SemiBold' }}>{new Date(consignment.docDate).toLocaleDateString()}</Text>
                </View>
              </View>

              <View className='flex-row gap-4 flex-1'>
                <View className='flex-1 bg-gray-100 px-4 py-2 rounded-2xl flex-col items-start'>
                  <Text className='tracking-[-0.3px] text-gray-400 text-md' style={{ fontFamily: 'Poppins-Regular' }}>Total del Pedido</Text>
                  <Text className='tracking-[-0.3px] text-lg' style={{ fontFamily: 'Poppins-SemiBold' }}>
                    Lps. {consignment.docTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>

                <View className='flex-1 bg-gray-100 px-4 py-2 rounded-2xl flex-col items-start'>
                  <Text className='tracking-[-0.3px] text-gray-400 text-md' style={{ fontFamily: 'Poppins-Regular' }}>Items</Text>
                  <Text className='tracking-[-0.3px] text-lg' style={{ fontFamily: 'Poppins-SemiBold' }}>{consignment.lines.length}</Text>
                </View>
              </View>
            </View>

            <View className='flex-1 flex-row gap-2'>
              <TouchableOpacity
                className='bg-primary py-3 h-[50px] rounded-full items-center justify-center flex-row flex-1'
                onPress={shareAsPDF}
              >
                {isGeneratingPDF ? (
                  <View className='flex-row gap-2'>
                    <ActivityIndicator size='small' color='#fff' />
                    <Text className='text-white font-[Poppins-SemiBold] tracking-[-0.3px] text-lg'>Generando PDF...</Text>
                  </View>
                ) : (
                  <Text className='text-white text-lg tracking-[-0.3px]' style={{ fontFamily: 'Poppins-SemiBold' }}>
                    Compartir PDF
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className='bg-primary py-3 h-[50px] w-[50px] rounded-full items-center justify-center flex-row'
                onPress={() => {
                  if (!consignment) return;
                  
                  // Configurar modo edición
                  const { setEditMode, preloadCartWithConsignmentItems, setSelectedCustomerConsignment } = useAppStore.getState();
                  setEditMode(true, docEntry.toString(), consignment);
                  
                  // Establecer el cliente de la consignación
                  const customerData: Customer = {
                    cardCode: consignment.cardCode,
                    cardName: consignment.cardName,
                    federalTaxID: consignment.federalTaxID,
                    priceListNum: "1", // valor por defecto si no está disponible
                  };
                  setSelectedCustomerConsignment(customerData);
                  
                  // Precargar productos al carrito
                  preloadCartWithConsignmentItems(consignment.lines);
                  
                  
                  // Navegar a la tienda con parámetro de edición
                  router.push({
                    pathname: '/consignaciones',
                    params: { editConsignmentId: docEntry }
                  });
                }}
              >
                <Feather name="edit" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <Text className='tracking-[-0.3px] mt-4' style={{ fontFamily: 'Poppins-SemiBold' }}>Productos</Text>
            {consignment.lines.map((line, index) => (
              <View key={index} className='py-2 gap-4 flex-row items-center'>
                <Image
                  source={{ uri: 'https://pub-f524aa67d2854c378ac58dd12adeca33.r2.dev/BlurImage.png' }}
                  resizeMode='contain'
                  height={100} width={100}
                  className='border-2 border-gray-200 rounded-xl'
                />
                <View className='flex-1'>
                  <Text className='tracking-[-0.3px]' style={{ fontFamily: 'Poppins-SemiBold' }}>{line.itemDescription}</Text>
                  <Text className='tracking-[-0.3px] text-sm text-gray-500' style={{ fontFamily: 'Poppins-Regular' }}>Cantidad: {line.quantity}</Text>
                  <Text className='tracking-[-0.3px] text-sm text-gray-500' style={{ fontFamily: 'Poppins-Regular' }}>
                    Precio Unitario: {line.priceAfterVAT.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>

                <View className=''>
                  <Text className='tracking-[-0.3px] text-sm text-gray-500' style={{ fontFamily: 'Poppins-Regular' }}>
                    Total
                  </Text>
                  <Text className='tracking-[-0.3px] text-lg text-black' style={{ fontFamily: 'Poppins-SemiBold' }}>
                    L. {(line.priceAfterVAT * line.quantity).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ConsignmentDetails;