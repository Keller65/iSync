import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const audioSource = require('@/assets/sound/success.mp3');

const Success = () => {
  const animation = useRef<LottieView>(null);
  const router = useRouter();
  const player = useAudioPlayer(audioSource);
  const { OrderDetails, message, buttonMessage } = useLocalSearchParams();

  useEffect(() => {
    animation.current?.play();

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      player.play()
    }, 350);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!message) {
          router.replace('/explore');
        }
        return true;
      };

      const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        backHandlerSubscription.remove();
      };
    }, [router, message])
  );

  return (
    <SafeAreaView style={{ backgroundColor: '#e0ffe7', flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
      <LottieView
        autoPlay
        loop={false}
        ref={animation}
        style={{
          width: 180,
          height: 180,
          backgroundColor: 'transparent',
        }}
        source={require('@/assets/animation/Check.json')}
      />

      <Text style={{ fontSize: 28, fontFamily: 'Poppins-SemiBold', color: '#1a753c', marginTop: 20, textAlign: 'center' }}>
        {message ?? '¡Pedido realizado con exito!'}
      </Text>
      <Text style={{ fontSize: 16, color: '#333', marginTop: 10, marginBottom: 40, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>
        {message ? 'Acción realizada con éxito.' : 'Tu pedido se ha enviado correctamente.'}
      </Text>

      {message ?
        <TouchableOpacity
          onPress={() => router.back()}
          className='rounded-full'
          style={{ backgroundColor: '#28a745', width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}
        >
          <Text style={{ fontFamily: 'Poppins-Medium', color: '#fff', fontSize: 18 }}>
            {buttonMessage}
          </Text>
        </TouchableOpacity> :
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/order',
            params: {
              OrderDetails: OrderDetails
            }
          })}
          className='rounded-full'
          style={{ backgroundColor: '#28a745', width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}
        >
          <Text style={{ fontFamily: 'Poppins-Medium', color: '#fff', fontSize: 18 }}>
            Ver Pedido
          </Text>
        </TouchableOpacity>
      }
    </SafeAreaView>
  );
};

export default Success;