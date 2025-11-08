import ClientIcon from '@/assets/icons/ClientIcon';
import { useAppStore } from '@/state';
import { Consignment } from '@/types/ConsignmentTypes';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const ConsignmentDetails = () => {
  const { docEntry } = useLocalSearchParams();
  const [consignment, setConsignment] = useState<Consignment | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { fetchUrl } = useAppStore();

  useEffect(() => {
    const fetchConsignment = async () => {
      const response = await axios.get(`${fetchUrl}/api/Documentos/${docEntry}`);
      const data = response.data as Consignment;
      setConsignment(data);
    };

    fetchConsignment();
  }, [docEntry, fetchUrl]);

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
          font-family: 'Arial', sans-serif;
          background: #fff;
          color: #333;
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
        }
        .container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #374151, #1f2937);
          color: #fff;
          padding: 12px;
          text-align: center;
          font-weight: bold;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        .company-info {
          padding: 25px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .company-name {
          font-size: 22px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
          color: #1e293b;
        }
        .company-details {
          text-align: center;
          font-size: 10px;
          line-height: 1.5;
          color: #64748b;
        }
        .document-info {
          display: flex;
          padding: 20px 25px;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
        }
        .doc-left {
          flex: 1;
          font-size: 11px;
          color: #374151;
        }
        .doc-right {
          flex: 1;
          text-align: right;
          font-size: 11px;
          color: #374151;
        }
        .client-info {
          padding: 20px 25px;
          border-bottom: 1px solid #e2e8f0;
        }
        .client-label {
          font-weight: bold;
          margin-bottom: 8px;
          color: #1e293b;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
        }
        .table th {
          background: linear-gradient(135deg, #374151, #1f2937);
          color: #fff;
          padding: 12px 8px;
          text-align: center;
          font-weight: bold;
          font-size: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        .table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 10px;
          text-align: center;
          color: #374151;
        }
        .table td.desc {
          text-align: left;
        }
        .table td.amount {
          text-align: right;
          font-weight: 500;
        }
        .table tbody tr:hover {
          background: #f8fafc;
        }
        .totals {
          margin-top: 0;
          padding: 25px;
          background: #f8fafc;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
          color: #374151;
        }
        .total-row.final {
          font-weight: bold;
          font-size: 14px;
          border-bottom: 2px solid #374151;
          padding: 10px 0;
          margin-top: 8px;
          color: #1e293b;
        }
        .footer {
          padding: 20px 25px;
          text-align: center;
          font-size: 9px;
          background: linear-gradient(135deg, #374151, #1f2937);
          color: #fff;
          line-height: 1.4;
        }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ORIGINAL • CLIENTE • 1ERA. COPIA • OBLIGADO TRIBUTARIO EMISOR • 2DA. COPIA • CONTABILIDAD
          </div>
          
          <div class="company-info">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <img src="https://pub-51a1583fe6c247528ea6255ea10c9541.r2.dev/logo.jpg" alt="Logo" style="height: 60px; width: auto; margin-right: 15px;" />
              <div class="company-name" style="margin-bottom: 0;">iSync ERP</div>
            </div>
            <div class="company-details">
              ELECTRO LLANTAS S. DE R.L.<br>
              RTN: 08011962810019<br>
              COL. GODOY, BLVD PASEO AL SUR FRENTE A DIVISION DE SEGURIDAD PORTUARIA CASA 1237<br>
              DISTRITO CENTRAL, FRANCISCO MORAZÁN, HONDURAS, C.A.<br>
              Tel: 9520-2613 • Cel: 9582-3410
            </div>
          </div>

          <div class="document-info">
            <div class="doc-left">
              <strong>CLIENTE:</strong><br>
              ${consignment.cardName}<br>
              RTN: ${consignment.federalTaxID}<br>
              CÓDIGO: ${consignment.cardCode}
            </div>
            <div class="doc-right">
              <strong>FACTURA</strong><br>
              No.004-001-01-${String(consignment.docEntry).padStart(8, '0')}<br>
              <strong>FECHA:</strong> ${new Date(consignment.docDate).toLocaleDateString('es-HN')}<br>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th width="12%">CÓDIGO</th>
                <th width="43%">DESCRIPCIÓN</th>
                <th width="15%">PRECIO UNITARIO</th>
                <th width="10%">CANT.</th>
                <th width="20%">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${consignment.lines.map((line) => `
                <tr>
                  <td>${line.itemCode || 'N/A'}</td>
                  <td class="desc">${line.itemDescription}</td>
                  <td class="amount">L. ${line.priceAfterVAT.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${line.quantity}</td>
                  <td class="amount">L. ${(line.priceAfterVAT * line.quantity).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
              ${Array.from({ length: Math.max(0, 8 - consignment.lines.length) }, () => `
                <tr>
                  <td>&nbsp;</td>
                  <td class="desc">&nbsp;</td>
                  <td class="amount">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td class="amount">&nbsp;</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>SUB-TOTAL EXONERADO:</span>
              <span>L. 0.00</span>
            </div>
            <div class="total-row">
              <span>SUB-TOTAL EXENTO:</span>
              <span>L. 0.00</span>
            </div>
            <div class="total-row">
              <span>SUB-TOTAL GRAVADO 15%:</span>
              <span>L. ${(consignment.docTotal / 1.15).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="total-row">
              <span>DESCUENTO/BONIFICACIÓN:</span>
              <span>L. 0.00</span>
            </div>
            <div class="total-row">
              <span>SUB-TOTAL:</span>
              <span>L. ${(consignment.docTotal / 1.15).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="total-row">
              <span>IMPUESTO SOBRE VENTAS (15%):</span>
              <span>L. ${(consignment.docTotal - (consignment.docTotal / 1.15)).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="total-row final">
              <span>TOTAL A PAGAR:</span>
              <span>L. ${consignment.docTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
            <Text className='text-xl mb-2 tracking-[-0.3px]' style={{ fontFamily: 'Poppins-SemiBold' }}>Detalles</Text>

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
                  <Text className='tracking-[-0.3px] text-gray-400 text-md' style={{ fontFamily: 'Poppins-Regular' }}>Total</Text>
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
            </View>

            <Text className='tracking-[-0.3px] mt-4' style={{ fontFamily: 'Poppins-SemiBold' }}>Productos</Text>
            {consignment.lines.map((line, index) => (
              <View key={index} className='py-2 gap-4 flex-row items-center'>
                <Image
                  source={{ uri: `https://pub-f524aa67d2854c378ac58dd12adeca33.r2.dev/${line.groupCode}.png` }}
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