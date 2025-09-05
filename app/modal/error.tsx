import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useAuth } from '@/context/auth';

const audioSource = require('@/assets/sound/error.mp3');

const Error = () => {
  const animation = useRef<LottieView>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { logout } = useAuth();

  const errorCode = params.errorCode || '500';
  const errorMessage = params.errorMessage || 'Ocurrió un error inesperado';

  const player = useAudioPlayer(audioSource);

  useEffect(() => {
    animation.current?.play();

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      player.play();
    }, 350);
  }, []);

  const handleRetry = () => {
    logout()
    router.push('/login')
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#ffe0e0', flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
      <LottieView
        autoPlay
        loop={false}
        ref={animation}
        style={{
          width: 180,
          height: 180,
          backgroundColor: 'transparent',
        }}
        source={require('@/assets/animation/Error.json')}
      />

      <Text style={{ fontSize: 28, fontFamily: 'Poppins-Medium', color: '#cc0000', marginTop: 20, textAlign: 'center' }}>
        {errorCode === '401' ? 'Sesión expirada' : '¡Ha ocurrido un error!'}
      </Text>

      <Text style={{ fontSize: 16, color: '#666', marginTop: 10, marginBottom: 40, textAlign: 'center' }}>
        {errorMessage}
      </Text>

      <TouchableOpacity
        onPress={handleRetry}
        style={{ backgroundColor: '#cc0000', width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 99, marginBottom: 10 }}
      >
        <Text style={{ fontFamily: 'Poppins-Medium', color: '#fff', fontSize: 18 }}>
          {errorCode === '401' ? 'Iniciar sesión' : 'Intentar de nuevo'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleBack}
        style={{ width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 99 }}
      >
        <Text style={{ fontFamily: 'Poppins-Medium', color: '#cc0000', fontSize: 18 }}>
          Volver a Intentar
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Error;