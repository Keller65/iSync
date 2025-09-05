import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import "../../global.css";

export default function BottomSheetWelcome() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { user } = useAuth();
  const { userClickAcceptWelcome, setUserClickAcceptWelcome } = useAppStore();

  useEffect(() => {
    if (!userClickAcceptWelcome) {
      bottomSheetRef.current?.present();
    }
  }, [userClickAcceptWelcome]);

  const handleStart = () => {
    setUserClickAcceptWelcome(true);
    bottomSheetRef.current?.dismiss();
  };

  if (userClickAcceptWelcome) return null;

  return (
    <View className="flex-1 justify-center items-center bg-white p-6" pointerEvents="box-none">
      <BottomSheetModal
        ref={bottomSheetRef}
        backgroundStyle={{ borderRadius: 30 }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetView className="flex-1 px-6 pb-6">
          <View className="flex-1 justify-between">
            <View>
              <Text className="text-black text-2xl font-semibold font-[Poppins-SemiBold] tracking-[-0.3px] text-center">¡Bienvenido {user?.fullName}!</Text>
              <Text className="text-base text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] mt-4 leading-5">
                Aqui podras realizar todas las gestiones de ventas de manera rápida y sencilla.
              </Text>

              {/* Sección: Envío y Gestión de Pedidos */}
              <View className="flex-row items-start mt-6">
                <FontAwesome6 name="cart-flatbed" size={22} color="#333" className="mr-4 mt-1" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-black font-[Poppins-SemiBold]">Envío y Gestión de Pedidos</Text>
                  <Text className="text-base text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] leading-5 mt-1">
                    Tramita y organiza todas tus órdenes de manera eficiente, desde la creación hasta la entrega.
                  </Text>
                </View>
              </View>

              {/* Sección: Impresión de Facturas */}
              <View className="flex-row items-start mt-4">
                <FontAwesome6 name="print" size={24} color="#333" className="mr-4 mt-1" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-black font-[Poppins-SemiBold]">Impresión Instantánea de Facturas</Text>
                  <Text className="text-base text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] leading-5 mt-1">
                    Genera e imprime tus facturas al instante, manteniendo un registro claro y profesional.
                  </Text>
                </View>
              </View>

              {/* Sección: Datos de Ventas */}
              <View className="flex-row items-start mt-4">
                <MaterialCommunityIcons name="chart-line-variant" size={26} color="#333" className="mr-4 mt-1" />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-black font-[Poppins-SemiBold]">Análisis de Datos de Ventas</Text>
                  <Text className="text-base text-gray-500 font-[Poppins-Regular] tracking-[-0.3px] leading-5 mt-1">
                    Accede a estadísticas detalladas para un control total del rendimiento y crecimiento de tu negocio.
                  </Text>
                </View>
              </View>

            </View>

            <TouchableOpacity className='bg-yellow-300 w-full h-[50px] rounded-full items-center justify-center mt-6 z-50' onPress={handleStart}>
              <Text className="text-black text-base font-[Poppins-SemiBold]">Empezar</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}