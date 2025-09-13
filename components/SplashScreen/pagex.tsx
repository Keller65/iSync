import { Text, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SplashScreenComponent = () => {
  return (
    <SafeAreaView className='bg-primary flex-1 justify-center items-center'>
      <Image
        source={require('@/assets/images/icon.png')}
        style={{ width: 180, height: 180, resizeMode: 'contain' }}
      />

      <Text className='text-white font-[Poppins-SemiBold] text-3xl tracking-[-0.3px]'>iSync ERP</Text>
    </SafeAreaView>
  )
}

export default SplashScreenComponent