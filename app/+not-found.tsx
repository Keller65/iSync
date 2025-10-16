import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className='flex-1 bg-white items-center justify-center gap-6 p-10'>
        <Text className='text-xl font-[Poppins-Regular] text-center'>La rura solicitada actualmente esta en desarrollo</Text>
      </View>
    </>
  );
}
