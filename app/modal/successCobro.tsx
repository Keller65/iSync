import { useNavigation } from '@react-navigation/native';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { BackHandler, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const audioSource = require('@/assets/sound/success.mp3');

const successCobro = () => {
  const animation = useRef<LottieView>(null);
  const router = useRouter();

  const player = useAudioPlayer(audioSource);
  const { item } = useLocalSearchParams();
  const navigation = useNavigation();
  const handledPopRef = useRef(false);

  useEffect(() => {
    animation.current?.play();

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      player.play()
    }, 350);

    // Interceptar el botón físico de atrás (Android) y fuerza a ir al root
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/');
      return true; // Consumir el evento
    });

    // Interceptar botón atrás del header (iOS/Android) que hagan POP
    const navSub = navigation.addListener('beforeRemove', (e: any) => {
      // Solo cuando es una acción de retroceso (POP)
      if (e?.data?.action?.type !== 'POP') return;
      if (handledPopRef.current) return;
      e.preventDefault();
      handledPopRef.current = true;
      router.replace('/');
      // Liberar el flag después de un tick para permitir futuras navegaciones legítimas
      setTimeout(() => { handledPopRef.current = false; }, 300);
    });

    return () => {
      backSub.remove();
      navSub && navSub();
    }
  }, []);

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

      <Text style={{ fontSize: 28, color: '#1a753c', marginTop: 20, textAlign: 'center', fontFamily: 'Poppins-SemiBold', letterSpacing: -0.3 }}>
        ¡Cobro realizado con éxito!
      </Text>
      <Text style={{ fontSize: 14, color: '#333', marginTop: 10, marginBottom: 40, textAlign: 'center', fontFamily: 'Poppins-Regular', letterSpacing: -0.3 }}>
        el cobro se ha completado correctamente.
      </Text>

      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/invoicesDetails',
          params: {
            item: item
          }
        })}
        className='rounded-full'
        style={{ backgroundColor: '#28a745', width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}
      >
        <Text style={{ fontFamily: 'Poppins-Medium', color: '#fff', fontSize: 18, letterSpacing: -0.3 }}>
          Ver Cobro
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default successCobro;