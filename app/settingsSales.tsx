import { useAppStore } from '@/state/index';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';

const ACCESS_PIN = '3303';

const PinScreen = ({ onSuccess }: { onSuccess: () => void }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    setError(false);
    setPin(digits);
    if (digits.length === 4) {
      if (digits === ACCESS_PIN) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      className="flex-1 items-center justify-center bg-white gap-8 px-8"
      onPress={() => inputRef.current?.focus()}
    >
      <Text className="text-xl font-[Poppins-Bold] tracking-[-0.3px] text-gray-900">Código de acceso</Text>

      {/* Indicadores */}
      <View className="flex-row gap-4">
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${error ? 'border-red-500 bg-red-500' : pin.length > i ? 'border-black bg-black' : 'border-gray-400 bg-transparent'}`}
          />
        ))}
      </View>

      {error && (
        <Text className="text-red-500 text-sm font-[Poppins-Regular] -mt-4">Código incorrecto</Text>
      )}

      <TextInput
        ref={inputRef}
        value={pin}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        caretHidden
      />
    </TouchableOpacity>
  );
};

const SettingsSales = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  const {
    ventasConfig, setCotizacionConcepto, setCotizacionAlmacen,
    setFacturaConcepto, setFacturaAlmacen,
    setFacturasCreditoConcepto, setFacturasCreditoAlmacen,
    setFacturasContadoConcepto, setFacturasContadoAlmacen
  } = useAppStore();

  // Estados locales para la sección Ventas
  const [cotizacionConcepto, setCotizacionConceptoLocal] = useState('')
  const [cotizacionAlmacen, setCotizacionAlmacenLocal] = useState('')
  const [facturaConcepto, setFacturaConceptoLocal] = useState('')
  const [facturaAlmacen, setFacturaAlmacenLocal] = useState('')
  const [facturasContadoConcepto, setFacturasContadoConceptoLocal] = useState('')
  const [facturasContadoAlmacen, setFacturasContadoAlmacenLocal] = useState('')
  const [facturasCreditoConcepto, setFacturasCreditoConceptoLocal] = useState('')
  const [facturasCreditoAlmacen, setFacturasCreditoAlmacenLocal] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Cargar configuración de ventas desde el estado
  useEffect(() => {
    if (ventasConfig) {
      setCotizacionConceptoLocal(ventasConfig.cotizacion?.concepto || '')
      setCotizacionAlmacenLocal(ventasConfig.cotizacion?.almacen || '')
      setFacturaConceptoLocal(ventasConfig.factura?.concepto || '')
      setFacturaAlmacenLocal(ventasConfig.factura?.almacen || '')
      setFacturasCreditoConceptoLocal(ventasConfig.facturasCredito?.concepto || '')
      setFacturasCreditoAlmacenLocal(ventasConfig.facturasCredito?.almacen || '')
      setFacturasContadoConceptoLocal(ventasConfig.facturasContado?.concepto || '')
      setFacturasContadoAlmacenLocal(ventasConfig.facturasContado?.almacen || '')
    }
  }, [ventasConfig])

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Guardar configuración de ventas
    setCotizacionConcepto(cotizacionConcepto);
    setCotizacionAlmacen(cotizacionAlmacen);
    setFacturaConcepto(facturaConcepto);
    setFacturaAlmacen(facturaAlmacen);
    setFacturasCreditoConcepto(facturasCreditoConcepto);
    setFacturasCreditoAlmacen(facturasCreditoAlmacen);
    setFacturasContadoConcepto(facturasContadoConcepto);
    setFacturasContadoAlmacen(facturasContadoAlmacen);

    console.log('Configuración de Ventas guardada:', {
      ventasConfig: {
        cotizacion: { concepto: cotizacionConcepto, almacen: cotizacionAlmacen },
        factura: { concepto: facturaConcepto, almacen: facturaAlmacen },
        facturasCredito: { concepto: facturasCreditoConcepto, almacen: facturasCreditoAlmacen },
        facturasContado: { concepto: facturasContadoConcepto, almacen: facturasContadoAlmacen }
      }
    });

    ToastAndroid.show('Configuración de Ventas guardada exitosamente.', ToastAndroid.SHORT);
    setIsSaving(false);
  }, [cotizacionConcepto, cotizacionAlmacen, facturaConcepto, facturaAlmacen, facturasCreditoConcepto, facturasCreditoAlmacen, facturasContadoConcepto, facturasContadoAlmacen, setCotizacionConcepto, setCotizacionAlmacen, setFacturaConcepto, setFacturaAlmacen, setFacturasCreditoConcepto, setFacturasCreditoAlmacen, setFacturasContadoConcepto, setFacturasContadoAlmacen]);

  if (!isUnlocked) {
    return <PinScreen onSuccess={() => setIsUnlocked(true)} />;
  }

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

      {/* Factura */}
      <View>
        <Text className="text-sm font-[Poppins-Medium] text-gray-700 tracking-[-0.3px] mb-2">Factura</Text>
        <View className='flex-row gap-2'>
          <View className='flex-1'>
            <Text className="text-xs font-[Poppins-Medium] text-gray-600 mb-1">Concepto</Text>
            <TextInput
              value={facturaConcepto}
              onChangeText={setFacturaConceptoLocal}
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
              value={facturaAlmacen}
              onChangeText={setFacturaAlmacenLocal}
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
          Factura: {facturaConcepto || 'Sin configurar'} | {facturaAlmacen || 'Sin configurar'}
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