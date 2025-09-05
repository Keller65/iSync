import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface UpdateBannerProps {
  visible: boolean;
  onReload: () => void;
  message?: string;
}

const UpdateBanner: FC<UpdateBannerProps> = ({
  visible,
  onReload,
  message = "Actualización disponible"
}) => {
  if (!visible) return null;

  return (
    <View className="bg-[#09f] flex-row items-center justify-between p-3">
      <View className="flex-row items-center gap-2">
        <Ionicons name="sparkles" size={16} color="#fff" />
        <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px]">{message}</Text>
      </View>
      <TouchableOpacity
        className="bg-blue-500 px-4 py-1.5 rounded-full items-center justify-center"
        onPress={onReload}
      >
        <Text className="text-white font-[Poppins-SemiBold] text-[12px] tracking-[-0.3px]">Actualizar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UpdateBanner;
