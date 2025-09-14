import { useAuth } from '@/context/auth';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const BottomSheetSession = () => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const route = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    bottomSheetRef.current?.present();
  }, []);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enablePanDownToClose={false}
      enableDynamicSizing={true}
      backgroundStyle={{ borderRadius: 16 }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          pressBehavior="none"
        />
      )}
    >
      <BottomSheetView className="flex-1 px-6 pb-6">
        <View className="flex-1 justify-center items-center">
          <Text className="text-2xl text-primary font-[Poppins-SemiBold] tracking-[-0.3px] text-center mb-6">
            Sesión expirada
          </Text>
          <Text className="text-base text-neutral-600 font-[Poppins-Regular] tracking-[-0.3px] text-center mb-6">
            Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar usando la aplicación.
          </Text>
          <View className="w-full">
            <TouchableOpacity
              className="bg-primary h-[50px] items-center justify-center py-3 rounded-full"
              onPress={() => {
                logout();
                route.replace('/login');
              }}
            >
              <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px] text-base">
                Iniciar sesión nuevamente
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default BottomSheetSession;