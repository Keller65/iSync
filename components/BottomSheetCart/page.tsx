import CartIcon from '@/assets/icons/CartIcon';
import TrashIcon from '@/assets/icons/TrashIcon';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state/index';
import Feather from '@expo/vector-icons/Feather';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetFlatList, BottomSheetFooter, BottomSheetFooterProps, BottomSheetModal, } from '@gorhom/bottom-sheet';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import '../../global.css';

interface CartItemType {
  imageUrl: string | null;
  itemCode: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  tiers: {
    qty: number;
    price: number;
    percent: number;
    expiry: string;
  }[];
  taxType: string;
}

interface CartItemProps {
  item: CartItemType;
  onUpdateQty: (code: string, qty: number) => void;
  onRemove: (code: string, name: string) => void;
}

const snapPoints: string[] = ['60%', '85%'];

const areEqual = (prev: CartItemProps, next: CartItemProps) =>
  prev.item.itemCode === next.item.itemCode &&
  prev.item.quantity === next.item.quantity;

const CartItem = memo(({ item, onRemove }: CartItemProps) => {
  const removeRequested = useRef(false);

  const effectivePrice = useMemo(() => {
    return item.unitPrice;
  }, [item.unitPrice]);

  const subtotal = useMemo(() => effectivePrice * item.quantity, [effectivePrice, item.quantity]);

  const handleRemove = useCallback(() => {
    if (removeRequested.current) return;
    removeRequested.current = true;
    onRemove(item.itemCode, item.itemName);
  }, [item, onRemove]);

  return (
    <View className="mb-3 border-b pb-3 border-gray-200 px-4">
      <View className="flex-row gap-4 items-center">
        <View className="size-[120px] bg-white border overflow-hidden border-gray-200 rounded-lg items-center justify-center">
          <Image
            source={{ uri: `https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/${item.itemCode}.jpg` }}
            style={{ height: 120, width: 120, objectFit: "contain" }}
            contentFit="contain"
            transition={500}
          />
        </View>

        <View className="flex-1">
          <Text className="font-[Poppins-SemiBold] tracking-[-0.3px]" numberOfLines={2}>
            {item.itemName.toLowerCase()}
          </Text>

          <Text className="text-sm font-[Poppins-Regular] text-gray-600 mt-1">
            Cantidad: {item.quantity}
          </Text>

          <Text className="text-sm font-[Poppins-Regular] text-gray-600">
            Precio: L. {effectivePrice.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text className="text-sm font-[Poppins-SemiBold]">
            Total: L. {subtotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleRemove}
          className="p-2 rounded-full bg-red-100 self-start"
        >
          <TrashIcon size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );
}, areEqual);

const EmptyCart: React.FC<{ onClose: () => void; onAddProducts: () => void }> = () => (
  <View className="flex-1 items-center justify-center pb-20 px-4">
    <View className="bg-gray-100 p-6 rounded-full mb-4">
      <CartIcon size={32} color="#999" />
    </View>
    <Text className="text-gray-500 text-lg font-medium mb-2 text-center">
      Tu carrito está vacío
    </Text>
    <Text className="text-gray-400 text-center mb-6">
      Añade productos para continuar con tu compra
    </Text>
  </View>
);

const MemoizedCommentInput = memo(({ comments, onCommentsChange }: { comments: string, onCommentsChange: (text: string) => void }) => {
  const [inputText, setInputText] = useState(comments);

  useEffect(() => {
    setInputText(comments);
  }, [comments]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onCommentsChange(inputText);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [inputText, onCommentsChange]);

  return (
    <View className='px-2'>
      <TextInput
        placeholder='Enviar comentarios'
        value={inputText}
        onChangeText={setInputText}
        className="border border-gray-300 rounded-3xl px-5 mb-4 mx-2"
        multiline={true}
        numberOfLines={4}
        textAlignVertical="top"
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
});


export default function BottomSheetCart() {
  const router = useRouter();
  const products = useAppStore((s) => s.products);
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeProduct = useAppStore((s) => s.removeProduct);
  const clearCart = useAppStore((s) => s.clearCart);
  const customerSelected = useAppStore((s) => s.selectedCustomer);
  const setLastOrderDocEntry = useAppStore((s) => s.setLastOrderDocEntry);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { user } = useAuth();
  const token = user?.token || '';
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { fetchUrl } = useAppStore();
  const FETCH_URL_CREATE_ORDER = fetchUrl + "/sap/orders";

  // Pulse trail animation for the floating cart button
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.linear }),
      -1,
      false
    );
  }, [pulse]);

  const PulsingCircle = ({ index }: { index: number }) => {
    const style = useAnimatedStyle(() => {
      const progress = (pulse.value + index * 0.25) % 1;
      const scale = interpolate(progress, [0, 1], [1, 1.8]);
      const opacity = interpolate(progress, [0, 1], [0.5, 0]);
      return {
        transform: [{ scale }],
        opacity,
      };
    });

    return (
      <Animated.View
        // Positioned behind the button, matching its size
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            height: 50,
            width: 50,
            borderRadius: 9999,
            backgroundColor: '#FDE047', // tailwind yellow-300
          },
          style,
        ]}
      />
    );
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSubmitOrder = useCallback(async () => {
    if (!customerSelected || products.length === 0) {
      Alert.alert('Error', 'Faltan datos para enviar el pedido.');
      return;
    }

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Tegucigalpa',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const [{ value: year }, , { value: month }, , { value: day }] = formatter.formatToParts(now);
    const hondurasDate = `${year}-${month}-${day}`;

    const lines = products.map(p => {
      const price = p.unitPrice;

      return {
        itemCode: p.itemCode,
        quantity: p.quantity,
        priceList: p.originalPrice, // es el precio real de la lista
        priceAfterVAT: price, // precio de descuento si existe
        taxCode: p.taxType,
      };
    });

    const payload = {
      cardCode: customerSelected.cardCode,
      docDate: hondurasDate,
      docDueDate: hondurasDate,
      comments: comments || '',
      lines,
    };

    console.log(payload)

    try {
      setIsLoading(true);
      const res = await axios.post(FETCH_URL_CREATE_ORDER, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      closeCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log("Pedido enviado", payload);
      router.push({
        pathname: '/modal/success',
        params: {
          OrderDetails: res.data.docEntry
        }
      });
      clearCart();
      setComments('');
      if (res.data.docEntry) {
        setLastOrderDocEntry(res.data.docEntry);
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          Alert.alert('Error', 'No se encontró la ruta del servidor (Error 404). Por favor, verifica la dirección de la API.');
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Error', `No se pudo enviar el pedido. Código: ${err.response?.status || 'Desconocido'}. Mensaje: ${err.response?.data?.message || 'Intenta nuevamente.'}`);
        }
      } else {
        Alert.alert('Error', 'No se pudo enviar el pedido. Intenta nuevamente.');
      }
      router.push({
        pathname: '/modal/error',
        params: {
          errorCode: '401',
          errorMessage: 'Sesión expirada',
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [products, customerSelected, token, comments, setLastOrderDocEntry, clearCart]);

  const total = useMemo(() => {
    return products.reduce((sum, item) => {
      // Usamos item.unitPrice directamente para el cálculo del total
      const price = item.unitPrice;
      return sum + item.quantity * price;
    }, 0);
  }, [products]);

  const openCart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetRef.current?.present();
  }, []);

  const closeCart = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) closeCart();
  }, [closeCart]);

  const handleUpdateQuantity = useCallback((itemCode: string, newQty: number) => {
    updateQuantity(itemCode, Math.max(1, newQty));
  }, [updateQuantity]);

  const handleRemoveItem = useCallback((itemCode: string, itemName: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${itemName}" del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            removeProduct(itemCode);
          },
        },
      ]
    );
  }, [removeProduct]);

  const renderItem = useCallback(({ item }: { item: CartItemType }) => (
    <CartItem
      item={item}
      onUpdateQty={handleUpdateQuantity}
      onRemove={handleRemoveItem}
    />
  ), [handleUpdateQuantity, handleRemoveItem]);

  const renderFooter = useCallback((props: BottomSheetFooterProps) => (
    <BottomSheetFooter {...props} bottomInset={0}>
      <View className="bg-white border-t border-gray-200 px-4 py-4">
        <View className="flex-row justify-between items-center">
          <Text className='text-base text-gray-700 font-[Poppins-Medium] tracking-[-0.3px]'>Cliente</Text>
          <Text className='font-[Poppins-Bold] text-black tracking-[-0.3px]'>{customerSelected?.cardName}</Text>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base text-gray-700 font-[Poppins-Medium] tracking-[-0.3px]">Total</Text>
          <Text className="text-xl font-[Poppins-Bold] text-black tracking-[-0.3px]">
            L. {total.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}
          </Text>
        </View>

        <View className='flex-row w-full gap-2 justify-between'>
          <TouchableOpacity
            className="flex-row flex-1 items-center justify-center h-[50px] bg-yellow-300 rounded-full"
            onPress={handleSubmitOrder}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="black" size="small" />
                <Text className="text-black font-[Poppins-SemiBold] tracking-[-0.3px] ml-2">Realizando Pedido...</Text>
              </>
            ) : (
              <>
                <CartIcon color="black" />
                <Text className="text-black font-[Poppins-SemiBold] tracking-[-0.3px] ml-2">Realizar Pedido</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/shop',
              params: (closeCart(), {})
            })}
            className='bg-yellow-300 items-center justify-center rounded-full h-[50px] w-[50px]'
          >
            <Feather name="edit" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetFooter>
  ), [total, customerSelected?.cardName, handleSubmitOrder, isLoading, router]);

  return (
    <View style={{ flex: 1, zIndex: 100 }}>
      {products.length !== 0 && (
        <View style={{ position: 'relative', height: 50, width: 50, alignItems: 'center', justifyContent: 'center' }}>
          {/* Pulsing trail behind the button */}
          <PulsingCircle index={0} />
          <PulsingCircle index={1} />

          <TouchableOpacity
            className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-yellow-300 shadow-lg shadow-[#09f]/30"
            onPress={openCart}
          >
            <CartIcon color="black" />
            <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{products.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        footerComponent={renderFooter}
        backgroundStyle={{ borderRadius: 30 }}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
      >
        <View className='px-4'>
          <Text className="text-lg text-start font-[Poppins-Bold] tracking-[-0.3px]">Resumen del Pedido</Text>
        </View>
        <MemoizedCommentInput comments={comments} onCommentsChange={setComments} />

        {products.length === 0 ? (
          <EmptyCart onClose={closeCart} onAddProducts={() => router.push('/client')} />
        ) : (
          <BottomSheetFlatList<CartItemType>
            data={products}
            keyExtractor={(item) => item.itemCode}
            renderItem={renderItem}
            getItemLayout={(_, index) => ({ length: 150, offset: 150 * index, index })}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={10}
            contentContainerStyle={{ paddingBottom: 130 }}
            ListHeaderComponent={<View className="pt-2" />}
          />
        )}
      </BottomSheetModal>
    </View>
  );
}