import ClientIcon from '@/assets/icons/ClientIcon';
import { useAppStore } from '@/state';
import { Consignment } from '@/types/ConsignmentTypes';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const ConsignmentDetails = () => {
  const { docEntry } = useLocalSearchParams();
  const [consignment, setConsignment] = useState<Consignment | null>(null);
  const { fetchUrl } = useAppStore();

  useEffect(() => {
    const fetchConsignment = async () => {
      const response = await axios.get(`${fetchUrl}/api/Documentos/${docEntry}`);
      const data = response.data as Consignment;
      setConsignment(data);
    };

    fetchConsignment();
  }, [docEntry]);

  const shareAsPDF = async () => {
    if (!consignment) return;

    const htmlContent = generatePDFHtml(consignment);
    const filePath = `${FileSystem.cacheDirectory}consignment.pdf`;

    // Write the HTML content to a file
    await FileSystem.writeAsStringAsync(filePath, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Consignación',
      });
    } else {
      alert('La función de compartir no está disponible en este dispositivo.');
    }
  };

  return (
    <ScrollView className='px-4 bg-white flex-1'>
      {/* Encabezado de información del cliente */}
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

      {/* Detalles de consignación */}
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

          <TouchableOpacity
            className='bg-primary py-3 h-[50px] rounded-full items-center justify-center flex-row'
            onPress={shareAsPDF}
          >
            <Text className='text-white text-lg tracking-[-0.3px]' style={{ fontFamily: 'Poppins-SemiBold' }}>Compartir como PDF</Text>
          </TouchableOpacity>

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
  );
};

// Function to generate HTML content for the PDF
const generatePDFHtml = (consignment: Consignment) => {
  return `
    <html>
      <head>
        <style>
          body { font-family: 'Poppins', sans-serif; }
          .header { text-align: center; margin-bottom: 20px; }
          .details { margin: 20px 0; }
          .details div { margin-bottom: 10px; }
          .products { margin-top: 20px; }
          .product { display: flex; justify-content: space-between; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Detalles de Consignación</h1>
          <p>${consignment.cardName} (${consignment.cardCode})</p>
        </div>
        <div class="details">
          <div>RTN: ${consignment.federalTaxID}</div>
          <div>Documento: ${consignment.docEntry}</div>
          <div>Fecha: ${new Date(consignment.docDate).toLocaleDateString()}</div>
          <div>Total: Lps. ${consignment.docTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="products">
          <h2>Productos</h2>
          ${consignment.lines.map((line: { itemDescription: string; quantity: number; priceAfterVAT: number; }) => `
            <div class="product">
              <span>${line.itemDescription}</span>
              <span>Cantidad: ${line.quantity}</span>
              <span>Precio: Lps. ${(line.priceAfterVAT * line.quantity).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `;
};

export default ConsignmentDetails;