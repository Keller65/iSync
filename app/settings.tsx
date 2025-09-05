import { useAuth } from '@/context/auth'
import { useAppStore } from '@/state/index'
import { Picker } from '@react-native-picker/picker'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, ToastAndroid } from 'react-native'
import api from '@/lib/api'

const Settings = () => {
  const { appHost, appPort, setAppHost, setAppPort, fetchUrl } = useAppStore();
  const [protocol, setProtocol] = useState('http')
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('')
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
    } catch (e) {
      setIp('')
      setHasInvalidUrl(true)
    }
  }, [appHost, appPort])

  const fullUrl = `${protocol}://${ip}${port ? `:${port}` : ''}`
  const isUrlReady = !!ip && !!port && !hasInvalidUrl

  const handleSave = async () => {
    if (!protocol || !ip || !port) {
      alert('Por favor, rellena todos los campos antes de guardar la configuración.');
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setAppHost(`${protocol}://${ip}`);
    setAppPort(port);

    console.log('Configuración guardada:', fullUrl);
    ToastAndroid.show('Configuración guardada, es posible que necesites reiniciar la aplicación.', ToastAndroid.SHORT);
    setIsSaving(false);
  }

  const API_BASE_URL = `${fetchUrl !== null ? fetchUrl : fullUrl}`;

  const fetchPaymentAccounts = useCallback(async () => {
    try {
      const urls = [
        `${API_BASE_URL}/api/BankAccounts/PayCheque`,
        `${API_BASE_URL}/api/BankAccounts/PayEfectivo`,
        `${API_BASE_URL}/api/BankAccounts/PayTranferencia`,
        `${API_BASE_URL}/api/BankAccounts/PayCreditCards`,
        `${API_BASE_URL}/sap/items/categories`
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

      const chequeRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const efectivoRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const transfRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const creditCardRes = results[3].status === 'fulfilled' ? results[3].value : null;

      console.log('Informacion de pago sincronizada');

      if (!chequeRes || !efectivoRes || !transfRes || !creditCardRes) {
        ToastAndroid.show('Error al Sincronizar los datos.', ToastAndroid.SHORT);
        throw new Error('No se pudieron obtener los datos de una o más cuentas.');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Error al Sincronizar los datos:', err);
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
          keyboardAppearance="light"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
        />
      </View>

      {/* Puerto */}
      <TextInput
        value={port}
        onChangeText={setPort}
        placeholder="Puerto (ej: 3000)"
        keyboardAppearance="light"
        keyboardType="numeric"
        className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
      />

      {/* Vista previa */}
      <View className="border border-dashed border-gray-300 rounded-xl px-4 py-2 bg-gray-50">
        <Text className="text-gray-600 text-sm">{fullUrl || 'Vista previa'}</Text>
      </View>

      {/* Botón de Guardar */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={isSaving || !isUrlReady}
        className={`mt-4 rounded-full py-3 items-center justify-center h-[50px] ${isSaving || !isUrlReady ? 'bg-gray-300' : 'bg-yellow-300'
          }`}
      >
        {isSaving ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#6b7280" />
            <Text className='text-gray-500 tracking-[-0.3px] font-[Poppins-SemiBold] text-base'>Guardando configuración...</Text>
          </View>
        ) : (
          <Text className="text-black tracking-[-0.3px] font-[Poppins-SemiBold] text-base">Guardar configuración</Text>
        )}
      </TouchableOpacity>

      {fetchUrl && (
        <TouchableOpacity
          className={`rounded-full py-3 items-center justify-center h-[50px] ${(isSyncing || !isUrlReady) ? 'bg-gray-300' : 'bg-yellow-300'}`}
          onPress={handleSync}
          disabled={isSyncing || !isUrlReady}
        >
          {isSyncing ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#6b7280" />
              <Text className='text-gray-500 tracking-[-0.3px] font-[Poppins-SemiBold] text-base'>Sincronizando Datos...</Text>
            </View>
          ) : (
            <Text className='text-black tracking-[-0.3px] font-[Poppins-SemiBold] text-base'>Sincronizar Datos</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

export default Settings
