import ClientIcon from '@/assets/icons/ClientIcon';
import LocationIcon from '@/assets/icons/Locations';
import { useAuth } from '@/context/auth';
import api from '@/lib/api';
import { useAppStore } from '@/state';
import { CustomerAddress } from '@/types/types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import MapView from 'react-native-maps';

interface BottomSheetClientDetailsProps {
  mapRef: RefObject<MapView | null>;
}

const BottomSheetClientDetails: React.FC<BottomSheetClientDetailsProps> = ({ mapRef }) => {
  const { selectedCustomerLocation, setUpdateCustomerLocation, updateCustomerLocation } = useAppStore();
  const clearSelectedCustomerLocation = useAppStore((s) => s.clearSelectedCustomerLocation);
  const { fetchUrl } = useAppStore();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[] | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  function clearSelected() {
    clearSelectedCustomerLocation();
    setUpdateCustomerLocation({
      latitude: undefined,
      longitude: undefined,
      updateLocation: false,
    });
  }

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  useEffect(() => {
    const fetchCustomerAddresses = async () => {
      if (selectedCustomerLocation?.cardCode) {
        try {
          const response = await api.get<CustomerAddress[]>(
            `/api/Customers/${selectedCustomerLocation.cardCode}/addresses`,
            {
              baseURL: fetchUrl,
              headers: {
                Authorization: `Bearer ${user?.token}`,
                'Content-Type': 'application/json',
              },
              cache: {
                ttl: 3600 * 24,
                override: true,
              }
            }
          );
          setCustomerAddresses(response.data);
        } catch (error) {
          console.error('Error fetching customer addresses:', error);
        }
      }
    };

    fetchCustomerAddresses();
  }, [selectedCustomerLocation?.cardCode]);

  useEffect(() => {
    // Limpiar estados cuando cambia el cliente seleccionado
    setCustomerAddresses(null);
    setUpdateCustomerLocation({
      updateLocation: false,
      addressName: undefined,
      rowNum: undefined,
    });
  }, [selectedCustomerLocation]);

  const handleUpdateLocation = (rowNum: number) => {
    if (customerAddresses && customerAddresses[rowNum]) {
      setUpdateCustomerLocation({
        ...updateCustomerLocation,
        updateLocation: true,
        addressName: customerAddresses[rowNum].addressName,
        rowNum: customerAddresses[rowNum].rowNum,
      });
    } else {
      setUpdateCustomerLocation({
        ...updateCustomerLocation,
        updateLocation: true,
      });
    }
    console.log('Location updated', {
      ...updateCustomerLocation,
      addressName: customerAddresses?.[0]?.addressName,
    });
    bottomSheetModalRef.current?.dismiss();
  };

  const updateCustomerGeoLocation = async () => {
    if (!selectedCustomerLocation?.cardCode || !updateCustomerLocation.addressName) {
      Alert.alert('Error', 'Faltan datos para actualizar la ubicación.');
      return;
    }

    if (!updateCustomerLocation.latitude || !updateCustomerLocation.longitude) {
      Alert.alert('Error', 'Latitud y longitud no están definidas.');
      return;
    }

    setIsLoading(true);

    const URL = `${fetchUrl}/api/Customers/${selectedCustomerLocation.cardCode}/addresses/${updateCustomerLocation.rowNum}/geo`;

    try {
      const response = await axios.patch(
        URL,
        {
          latitud: `${updateCustomerLocation.latitude}`,
          longitud: `${updateCustomerLocation.longitude}`
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      router.push({
        pathname: '/modal/success',
        params: {
          message: 'Ubicación actualizada correctamente.',
          buttonMessage: 'Listo'
        }
      });
      clearSelected();
      console.log('Respuesta del servidor:', response);
    } catch (error) {
      console.error('Error al actualizar la ubicación:', error);
      console.log('URL de la solicitud:', URL);
      Alert.alert('Error', 'No se pudo actualizar la ubicación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAddress = (address: CustomerAddress) => {
    if (address.u_Latitud && address.u_Longitud) {
      const latitude = parseFloat(address.u_Latitud);
      const longitude = parseFloat(address.u_Longitud);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        setUpdateCustomerLocation({
          latitude,
          longitude,
          updateLocation: false,
        });

        // Mover la cámara del mapa a la nueva ubicación
        if (mapRef.current && (mapRef.current as any).animateToRegion) {
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };
          (mapRef.current as any).animateToRegion(newRegion, 500);
        }

        bottomSheetModalRef.current?.dismiss();
      } else {
        Alert.alert('Error', 'La dirección seleccionada no tiene una ubicación válida.');
      }
    } else {
      Alert.alert('Error', 'La dirección seleccionada no tiene latitud o longitud.');
    }
  };

  // renders
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <View className=''>
      {selectedCustomerLocation && (
        <View className='p-4 gap-4 bg-white'>
          <View className="flex-row gap-4 items-center">
            <View className="bg-[#fcde41] w-[38px] h-[38px] items-center justify-center rounded-full">
              <ClientIcon size={24} color="#000" />
            </View>

            <View>
              <Text className="font-[Poppins-SemiBold] tracking-[-0.3px] text-md text-black leading-5 w-[85%]">
                {selectedCustomerLocation?.cardName ?? 'Sin nombre'}
              </Text>
              <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px] text-sm">
                Código: {selectedCustomerLocation?.cardCode ?? 'N/A'}
              </Text>
            </View>

            <View className="flex-row justify-end absolute top-0 right-0">
              <TouchableOpacity className="h-[34px] w-[34px] bg-red-100 rounded-full items-center justify-center" onPress={clearSelected}>
                <MaterialCommunityIcons name="delete-empty" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View className='flex-row gap-4'>
            <TouchableOpacity
              onPress={handlePresentModalPress}
              className='flex-1 bg-yellow-300 h-[50px] flex-row gap-2 items-center justify-center rounded-full'
            >
              <LocationIcon size={22} />
              <Text className='text-black text-center font-[Poppins-SemiBold] tracking-[0.3px]'>
                Ubicaciones
              </Text>
            </TouchableOpacity>

            {updateCustomerLocation.updateLocation && (
              <TouchableOpacity
                onPress={updateCustomerGeoLocation}
                className='flex-1 bg-yellow-300 h-[50px] flex-row gap-2 items-center justify-center rounded-full'
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <AntDesign name="cloudupload" size={24} color="black" />
                    <Text className='text-black text-center font-[Poppins-SemiBold] tracking-[0.3px]'>
                      Actualizar
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <BottomSheetModal
        ref={bottomSheetModalRef}
        // snapPoints={['50%']}
        backgroundStyle={{ borderRadius: 30 }}
        backdropComponent={renderBackdrop}
      // enableDynamicSizing={false}
      >
        <BottomSheetView className='px-4 pb-4'>
          {selectedCustomerLocation ? (
            <View className='gap-4 pb-4'>
              <View className="flex-row gap-4 items-center flex-1">
                <View className="bg-[#fcde41] w-[50px] h-[50px] items-center justify-center rounded-full">
                  <ClientIcon size={28} color="#000" />
                </View>

                <View className="flex-1">
                  <Text className="font-[Poppins-SemiBold] tracking-[-0.3px] text-md text-black leading-5">
                    {selectedCustomerLocation?.cardName ?? 'Sin nombre'}
                  </Text>
                  <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px] text-sm">
                    Código: {selectedCustomerLocation?.cardCode ?? 'N/A'}
                  </Text>
                </View>
              </View>

              <View className="mt-4">
                <Text className="font-[Poppins-SemiBold] text-lg text-black tracking-[-0.3px]">Ubicaciones:</Text>
                {customerAddresses ? (
                  customerAddresses.map((address, index) => (
                    <View
                      key={index}
                      className="mt-2 bg-gray-100 p-4 rounded-3xl relative"
                    >
                      <Text className="text-black font-[Poppins-SemiBold] tracking-[-0.3px] w-[90%]">{address.street}</Text>
                      <Text className="text-black font-[Poppins-Regular] tracking-[-0.3px]">{address.ciudadName} - {address.stateName}</Text>
                      <Text className="text-black font-[Poppins-Regular] tracking-[-0.3px]">{address.addressName}</Text>

                      <View className="flex-row gap-2 mt-4">
                        <TouchableOpacity
                          onPress={() => handleUpdateLocation(address.rowNum)}
                          className='flex-1 h-[40px] bg-yellow-300 items-center justify-center rounded-full'
                        >
                          <Text className="text-black font-[Poppins-SemiBold] tracking-[-0.3px]">Editar</Text>
                        </TouchableOpacity>

                        {address.u_Latitud && address.u_Longitud && (
                          <TouchableOpacity
                            onPress={() => handleSelectAddress(address)}
                            className='flex-1 h-[40px] bg-blue-300 items-center justify-center rounded-full'
                          >
                            <Text className="text-blue-900 font-[Poppins-SemiBold] tracking-[-0.3px]">Mostrar Ubicación</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">Cargando Ubicaciones...</Text>
                )}
              </View>
            </View>
          ) : (
            <Text>No hay cliente seleccionado</Text>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
};

export default BottomSheetClientDetails;
