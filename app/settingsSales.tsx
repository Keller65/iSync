import { useAppStore } from '@/state/index';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';

const SettingsSales = () => {
  const {
    ventasConfig, setCotizacionConcepto, setCotizacionAlmacen,
    setFacturasCreditoConcepto, setFacturasCreditoAlmacen,
    setFacturasContadoConcepto, setFacturasContadoAlmacen
  } = useAppStore();

  // Estados locales para la sección Ventas
  const [cotizacionConcepto, setCotizacionConceptoLocal] = useState('')
  const [cotizacionAlmacen, setCotizacionAlmacenLocal] = useState('')
  const [facturasContadoConcepto, setFacturasContadoConceptoLocal] = useState('')
  const [facturasContadoAlmacen, setFacturasContadoAlmacenLocal] = useState('')
  const [facturasCreditoConcepto, setFacturasCreditoConceptoLocal] = useState('')
  const [facturasCreditoAlmacen, setFacturasCreditoAlmacenLocal] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Cargar configuración de ventas desde el estado
  useEffect(() => {
    if (ventasConfig) {
      setCotizacionConceptoLocal(ventasConfig.cotizacion.concepto || '')
      setCotizacionAlmacenLocal(ventasConfig.cotizacion.almacen || '')
      setFacturasCreditoConceptoLocal(ventasConfig.facturasCredito.concepto || '')
      setFacturasCreditoAlmacenLocal(ventasConfig.facturasCredito.almacen || '')
      setFacturasContadoConceptoLocal(ventasConfig.facturasContado.concepto || '')
      setFacturasContadoAlmacenLocal(ventasConfig.facturasContado.almacen || '')
    }
  }, [ventasConfig])

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Guardar configuración de ventas
    setCotizacionConcepto(cotizacionConcepto);
    setCotizacionAlmacen(cotizacionAlmacen);
    setFacturasCreditoConcepto(facturasCreditoConcepto);
    setFacturasCreditoAlmacen(facturasCreditoAlmacen);
    setFacturasContadoConcepto(facturasContadoConcepto);
    setFacturasContadoAlmacen(facturasContadoAlmacen);

    console.log('Configuración de Ventas guardada:', {
      ventasConfig: {
        cotizacion: { concepto: cotizacionConcepto, almacen: cotizacionAlmacen },
        facturasCredito: { concepto: facturasCreditoConcepto, almacen: facturasCreditoAlmacen },
        facturasContado: { concepto: facturasContadoConcepto, almacen: facturasContadoAlmacen }
      }
    });

    ToastAndroid.show('Configuración de Ventas guardada exitosamente.', ToastAndroid.SHORT);
    setIsSaving(false);
  }, [cotizacionConcepto, cotizacionAlmacen, facturasCreditoConcepto, facturasCreditoAlmacen, facturasContadoConcepto, facturasContadoAlmacen, setCotizacionConcepto, setCotizacionAlmacen, setFacturasCreditoConcepto, setFacturasCreditoAlmacen, setFacturasContadoConcepto, setFacturasContadoAlmacen]);

  return (
    <View className="p-4 space-y-5 bg-white rounded-2xl flex-1 gap-2">
      {/* Cotización */}
      <View>
        <Text className="text-sm font-[Poppins-Medium] text-gray-700 tracking-[-0.3px] mb-2">Cotización</Text>
        <View className='flex-row gap-2'>
          <View className='flex-1'>
            <Text className="text-xs font-[Poppins-Medium] text-gray-600 mb-1">Concepto</Text>
            <TextInput
              value={cotizacionConcepto}
              onChangeText={setCotizacionConceptoLocal}
              placeholder="Concepto"
              placeholderTextColor="#000"
              keyboardAppearance="light"
              keyboardType="numeric"
              className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
            />
          </View>
          <View className='flex-1'>
            <Text className="text-xs font-[Poppins-Medium] text-gray-600 mb-1">Almacén</Text>
            <TextInput
              value={cotizacionAlmacen}
              onChangeText={setCotizacionAlmacenLocal}
              placeholder="Almacén"
              placeholderTextColor="#000"
              keyboardAppearance="light"
              keyboardType="numeric"
              className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
            />
          </View>
        </View>
      </View>

      {/* Facturas Crédito */}
      <View>
        <Text className="text-sm font-[Poppins-Medium] text-gray-700 tracking-[-0.3px] mb-2">Facturas Crédito</Text>
        <View className='flex-row gap-2'>
          <View className='flex-1'>
            <Text className="text-xs font-[Poppins-Medium] text-gray-600 mb-1">Concepto</Text>
            <TextInput
              value={facturasCreditoConcepto}
              onChangeText={setFacturasCreditoConceptoLocal}
              placeholder="Concepto"
              placeholderTextColor="#000"
              keyboardAppearance="light"
              keyboardType="numeric"
              className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
            />
          </View>
          <View className='flex-1'>
            <Text className="text-xs font-[Poppins-Medium] text-gray-600 mb-1">Almacén</Text>
            <TextInput
              value={facturasCreditoAlmacen}
              onChangeText={setFacturasCreditoAlmacenLocal}
              placeholder="Almacén"
              placeholderTextColor="#000"
              keyboardAppearance="light"
              keyboardType="numeric"
              className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
            />
          </View>
        </View>
      </View>

      {/* Facturas Contado */}
      <View>
        <Text className="text-sm font-[Poppins-Medium] text-gray-700 tracking-[-0.3px] mb-2">Facturas Contado</Text>
        <View className='flex-row gap-2'>
          <View className='flex-1'>
            <Text className="text-xs font-[Poppins-Medium] text-gray-600 mb-1">Concepto</Text>
            <TextInput
              value={facturasContadoConcepto}
              onChangeText={setFacturasContadoConceptoLocal}
              placeholder="Concepto"
              placeholderTextColor="#000"
              keyboardAppearance="light"
              keyboardType="numeric"
              className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
            />
          </View>
          <View className='flex-1'>
            <Text className="text-xs font-[Poppins-Medium] text-gray-600 mb-1">Almacén</Text>
            <TextInput
              value={facturasContadoAlmacen}
              onChangeText={setFacturasContadoAlmacenLocal}
              placeholder="Almacén"
              placeholderTextColor="#000"
              keyboardAppearance="light"
              keyboardType="numeric"
              className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
            />
          </View>
        </View>
      </View>

      {/* Vista previa Configuración de Ventas */}
      <View className="border border-dashed border-green-300 rounded-xl px-4 py-2 bg-green-50">
        <Text className="text-green-600 text-sm font-medium mb-1">Configuración de Ventas:</Text>
        <Text className="text-green-600 text-xs">
          Cotización: {cotizacionConcepto || 'Sin configurar'} | {cotizacionAlmacen || 'Sin configurar'}
        </Text>
        <Text className="text-green-600 text-xs">
          F. Crédito: {facturasCreditoConcepto || 'Sin configurar'} | {facturasCreditoAlmacen || 'Sin configurar'}
        </Text>
        <Text className="text-green-600 text-xs">
          F. Contado: {facturasContadoConcepto || 'Sin configurar'} | {facturasContadoAlmacen || 'Sin configurar'}
        </Text>
      </View>

      {/* Botón de Guardar */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={isSaving}
        className={`mt-4 rounded-full py-3 items-center justify-center h-[50px] ${isSaving ? 'bg-gray-200' : 'bg-primary'}`}
      >
        {isSaving ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#6b7280" />
            <Text className='text-gray-500 tracking-[-0.3px] font-[Poppins-SemiBold] text-base'>Guardando configuración...</Text>
          </View>
        ) : (
          <Text className="text-white tracking-[-0.3px] font-[Poppins-SemiBold] text-base">Guardar Configuración</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

export default SettingsSales