import { View } from 'react-native';
import { useAppStore } from '@/state';
import BottomSheetCart from '../BottomSheetCart/page';

const NavigateOrder = () => {
  const { products } = useAppStore();

  return (
    <View className="absolute bottom-4 right-8 gap-3 items-end z-10">
      {products.length > 0 && (
        <BottomSheetCart />
      )}
    </View>
  )
}

export default NavigateOrder