import { useAuth } from '@/context/auth'
import api from '@/lib/api'
import { useAppStore } from '@/state/index'
import { Picker } from '@react-native-picker/picker'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native'

const Settings = () => {
  const {
    appHost,
    appPort,
    setAppHost,
    setAppPort,
    fetchUrl,
    orderConfig,
    setCodigoConcepto,
    setAlmacenSalida
  } = useAppStore();
  const [protocol, setProtocol] = useState('http')
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('')
  const [codigoConcepto, setCodigoConceptoLocal] = useState('')
  const [almacenSalida, setAlmacenSalidaLocal] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasInvalidUrl, setHasInvalidUrl] = useState(false)
  const { user } = useAuth();

  useEffect(() => {
    setHasInvalidUrl(false)
    try {
      // Evitar parsear valores inválidos como 'http://' o 'https://'
      if (appHost && appHost !== 'http://' && appHost !== 'https://') {
        const hostToParse = appHost.startsWith('http') ? appHost : `http://${appHost}`
        const url = new URL(hostToParse)
        if (url.hostname) {
          setProtocol(url.protocol.replace(':', '') || 'http')
          setIp(url.hostname)
        } else {
          setIp('')
          setHasInvalidUrl(true)
        }
      } else if (appHost) {
        setIp('')
        setHasInvalidUrl(true)
      }
      if (appPort) setPort(appPort)
    } catch {
      setIp('')
      setHasInvalidUrl(true)
    }

    // Cargar configuración de pedidos desde el estado
    if (orderConfig.codigoConcepto) setCodigoConceptoLocal(orderConfig.codigoConcepto)
    if (orderConfig.almacenSalida) setAlmacenSalidaLocal(orderConfig.almacenSalida)
  }, [appHost, appPort, orderConfig])

  const fullUrl = `${protocol}://${ip}${port ? `:${port}` : ''}`
  const isUrlReady = !!ip && !!port && !hasInvalidUrl

  const handleSave = async () => {
    if (!protocol || !ip || !port) {
      alert('Por favor, rellena todos los campos antes de guardar la configuración.');
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Guardar configuración de conexión
    setAppHost(`${protocol}://${ip}`);
    setAppPort(port);

    // Guardar configuración de pedidos
    setCodigoConcepto(codigoConcepto);
    setAlmacenSalida(almacenSalida);

    console.log('Configuración guardada:', {
      url: fullUrl,
      orderConfig: { codigoConcepto: codigoConcepto, almacenSalida: almacenSalida }
    });
    ToastAndroid.show('Configuración guardada, es posible que necesites reiniciar la aplicación.', ToastAndroid.SHORT);
    setIsSaving(false);
  }

  const API_BASE_URL = `${fetchUrl !== null ? fetchUrl : fullUrl}`;

  const fetchPaymentAccounts = useCallback(async () => {
    try {
      const urls = [
        `${API_BASE_URL}/api/Catalog/products/categories`
      ];
      
      const results = await Promise.allSettled(urls.map(url => api.get(url, {
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        cache: {
          ttl: Infinity,
          override: true
        },
      })));

      const categoriesRes = results[0].status === 'fulfilled' ? results[0].value : null;

      console.log('Información de catálogo sincronizada');

      if (!categoriesRes) {
        ToastAndroid.show('Error al Sincronizar los datos.', ToastAndroid.SHORT);
        throw new Error('No se pudieron obtener los datos del catálogo.');
      }

      ToastAndroid.show('Sincronización completada exitosamente.', ToastAndroid.SHORT);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Error al Sincronizar los datos:', err);
      ToastAndroid.show('Error al sincronizar. Verifica la conexión.', ToastAndroid.SHORT);
    }
  }, [API_BASE_URL, user?.token]);

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      await fetchPaymentAccounts();
    } finally {
      setIsSyncing(false);
    }
  }, [fetchPaymentAccounts, isSyncing]);

  return (
    <View className="p-4 space-y-5 bg-white rounded-2xl flex-1 gap-2">
      {(hasInvalidUrl || !ip || !port) && (
        <View className="border border-red-200 bg-red-50 rounded-xl px-4 py-3">
          <Text className="text-red-700 text-sm">
            Configura una URL válida antes de continuar. Ingresa IP y Puerto válidos para evitar errores.
          </Text>
        </View>
      )}
      {/* Selector + IP */}
      <View className="flex-row gap-3 items-center">
        <View className="w-[130px] h-[50px] justify-center border border-gray-300 rounded-xl overflow-hidden bg-white">
          <Picker
            style={{ color: '#000' }}
            selectedValue={protocol}
            onValueChange={(value) => setProtocol(value)}
            mode="dropdown"
            dropdownIconColor="#4B5563"
          >
            <Picker.Item label="http" value="http" />
            <Picker.Item label="https" value="https" />
          </Picker>
        </View>

        <TextInput
          value={ip}
          onChangeText={setIp}
          placeholder="Ej: 192.168.0.1"
          placeholderTextColor="#000"
          keyboardAppearance="light"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
        />
      </View>

      {/* Puerto */}
      <TextInput
        value={port}
        onChangeText={setPort}
        placeholder="Puerto (ej: 3000)"
        placeholderTextColor="#000"
        keyboardAppearance="light"
        keyboardType="numeric"
        className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
      />

      {/* Vista previa URL */}
      <View className="border border-dashed border-gray-300 rounded-xl px-4 py-2 bg-gray-50">
        <Text className="text-gray-600 text-sm">{fullUrl || 'Vista previa de conexión'}</Text>
      </View>


      {/* Configuración de Consignaciones - Título */}
      <View className="pt-4">
        <Text className="text-lg font-[Poppins-SemiBold] text-gray-800 tracking-[-0.3px]">Configuración de Consignaciones</Text>
      </View>

      <View className='flex-row gap-2'>
        {/* Código Concepto */}
        <TextInput
          value={codigoConcepto}
          onChangeText={setCodigoConceptoLocal}
          placeholder="Código Concepto (ej: 3)"
          placeholderTextColor="#000"
          keyboardAppearance="light"
          keyboardType="numeric"
          className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white flex-1"
        />

        {/* Almacén Salida */}
        <TextInput
          value={almacenSalida}
          onChangeText={setAlmacenSalidaLocal}
          placeholder="Almacén Salida (ej: 1)"
          placeholderTextColor="#000"
          keyboardAppearance="light"
          keyboardType="numeric"
          className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white flex-1"
        />
      </View>

      {/* Vista previa Configuración de Pedidos */}
      <View className="border border-dashed border-blue-300 rounded-xl px-4 py-2 bg-blue-50">
        <Text className="text-blue-600 text-sm font-medium mb-1">Configuración de Pedidos:</Text>
        <Text className="text-blue-600 text-sm">
          Código Concepto: {codigoConcepto || 'Sin configurar'} | Almacén Salida: {almacenSalida || 'Sin configurar'}
        </Text>
      </View>

      {/* Botón de Guardar */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={isSaving || !isUrlReady}
        className={`mt-4 rounded-full py-3 items-center justify-center h-[50px] ${isSaving || !isUrlReady ? 'bg-gray-200' : 'bg-primary'
          }`}
      >
        {isSaving ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#6b7280" />
            <Text className='text-gray-500 tracking-[-0.3px] font-[Poppins-SemiBold] text-base'>Guardando configuración...</Text>
          </View>
        ) : (
          <Text className="text-white tracking-[-0.3px] font-[Poppins-SemiBold] text-base">Guardar configuración</Text>
        )}
      </TouchableOpacity>

      {fetchUrl && (
        <TouchableOpacity
          className={`rounded-full py-3 items-center justify-center h-[50px] ${(isSyncing || !isUrlReady) ? 'bg-gray-200' : 'bg-primary'}`}
          onPress={handleSync}
          disabled={isSyncing || !isUrlReady}
        >
          {isSyncing ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#6b7280" />
              <Text className='text-gray-500 tracking-[-0.3px] font-[Poppins-SemiBold] text-base'>Sincronizando Datos...</Text>
            </View>
          ) : (
            <Text className='text-white tracking-[-0.3px] font-[Poppins-SemiBold] text-base'>Sincronizar Datos</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

export default Settings
