import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

const BottomSheetNotifications = ({ open }: { open: boolean }) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [open]);

  return (
    <BottomSheetModal
      index={0}
      snapPoints={['90%']}
      ref={bottomSheetRef}
      enablePanDownToClose={true}
      enableDismissOnClose={true}
      enableDynamicSizing={false}
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
          <Text className="text-lg font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-400">No tienes notificaciones</Text>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default BottomSheetNotifications;