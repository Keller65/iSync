import LayoutIcon from '@/assets/icons/LayoutIcon';
import { useAppStore } from '@/state';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const BottomSheetLayout = () => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { selectedLayout, setSelectedLayout } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);

  const openBottomSheet = () => {
    bottomSheetRef.current?.present();
  };

  const handleSelectLayout = (layoutValue: number) => {
    setSelectedLayout(layoutValue); // Actualiza el valor directamente con 2, 4 o 6
  };

  const handleSaveSelection = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simula un retraso para guardar
    bottomSheetRef.current?.dismiss();
    setIsSaving(false);
  };

  return (
    <>
      <TouchableOpacity onPress={openBottomSheet}>
        <LayoutIcon size={28} color="#666" />
      </TouchableOpacity>

      <BottomSheetModal
        index={0}
        ref={bottomSheetRef}
        enablePanDownToClose={true}
        enableDismissOnClose={true}
        enableDynamicSizing={true}
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
        <BottomSheetView className="flex-1 px-4 gap-6 pb-4">
          <View className='flex-1 flex-row gap-3'>
            {[2, 4, 6].map((layout) => (
              <View className='flex-1 gap-2' key={layout}>
                <TouchableOpacity
                  onPress={() => handleSelectLayout(layout)}
                  className={`flex-1 gap-2 border-2 rounded-lg ${selectedLayout === layout ? 'border-primary' : 'border-transparent'}`}
                >
                  <View className='flex-1 h-[160px] bg-gray-200 p-3 gap-2 rounded-lg'>
                    {layout === 2 && (
                      Array.from({ length: 3 }).map((_, i) => (
                        <View key={i} className='gap-3 flex-row flex-1'>
                          <View className='flex-1 bg-primary/30 rounded-md' />
                          <View className='flex-1 bg-primary/30 rounded-md' />
                        </View>
                      ))
                    )}
                    {layout === 4 && (
                      Array.from({ length: 4 }).map((_, i) => (
                        <View key={i} className='flex-1 bg-primary/30 rounded-md' />
                      ))
                    )}
                    {layout === 6 && (
                      Array.from({ length: 6 }).map((_, i) => (
                        <View key={i} className='flex-1 bg-primary/30 rounded-md' />
                      ))
                    )}
                  </View>
                </TouchableOpacity>

                <Text className='text-center font-[Poppins-SemiBold] tracking-[-0.3px] text-md text-gray-600'>
                  {layout === 2 ? '2 x 2' : layout === 4 ? '4 Filas' : '6 Filas'}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            className={`rounded-full h-[50px] items-center justify-center ${selectedLayout === null || isSaving ? 'bg-gray-300' : 'bg-primary'}`}
            disabled={selectedLayout === null || isSaving}
            onPress={handleSaveSelection}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#444" />
            ) : (
              <Text className={`font-[Poppins-SemiBold] tracking-[-0.3px] text-md ${selectedLayout === null ? 'text-gray-500' : 'text-white'}`}>
                Seleccionar
              </Text>
            )}
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
};

export default BottomSheetLayout;