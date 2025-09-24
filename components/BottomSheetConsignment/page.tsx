import CartIcon from '@/assets/icons/CartIcon';
import ConsignmentIcon from '@/assets/icons/ConsignmentIcon';
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
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

const snapPoints: string[] = ['70%', '95%'];

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
            source={{ uri: "https://pub-f524aa67d2854c378ac58dd12adeca33.r2.dev/BlurImage.png" }}
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
        placeholderTextColor="#999"
      />
    </View>
  );
});

export default function BottomSheetConsignment() {
  const router = useRouter();
  const products = useAppStore((s) => s.products);
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeProduct = useAppStore((s) => s.removeProduct);
  const clearCart = useAppStore((s) => s.clearCart);
  const customerSelected = useAppStore((s) => s.selectedCustomerConsignment);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { deviceUUID } = useAppStore();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState('');
  const { fetchUrl } = useAppStore();

  const handleSubmitOrder = useCallback(async () => {
    if (!customerSelected || products.length === 0) {
      Alert.alert('Error', 'Faltan datos para enviar el pedido.');
      return;
    }

    const partidas = products.map((product) => ({
      codigoProducto: product.barCode,
      cantidad: product.quantity,
      precioUnitario: product.unitPrice,
      observaciones: 'no hay',
    }));

    const data = {
      codigoCliente: customerSelected.cardCode,
      codigoConcepto: '3',
      almacenSalida: '1',
      fecha: new Date().toISOString(),
      referencia: 'API',
      partidas,
      userId: deviceUUID, // UUID proporcionado por useLicense
    };

    try {
      setIsLoading(true);
      const response = await axios.post(`${fetchUrl}/api/Consignaciones/async`, data, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Prefer: 'respond-async',
          Authorization: `Bearer ${user?.token}`,
          'User-Agent': 'iSync-ERP',
        },
      });

      console.log('✅ Respuesta exitosa:', response.data);
      console.log('data', data);
      clearCart();
      setComments('');
      bottomSheetRef.current?.dismiss();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/modal/success');
    } catch (error) {
      console.error('data', data);
      if (axios.isAxiosError(error)) {
        console.error('❌ Error en la solicitud:', error.response?.data || error.message);
        Alert.alert('Error', `No se pudo enviar el pedido. ${error.response?.data?.message || error.message}`);
      } else {
        console.error('❌ Error desconocido:', (error as Error).message);
        Alert.alert('Error', 'No se pudo enviar el pedido. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [customerSelected, products, fetchUrl, user?.token, clearCart, setComments, router]);

  const total = useMemo(() => {
    return products.reduce((sum, item) => {
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
      <View className="bg-white px-4 py-4">
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
            className="flex-row flex-1 items-center justify-center h-[50px] bg-primary rounded-full"
            onPress={handleSubmitOrder}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px] ml-2">Realizando Consignacion...</Text>
              </>
            ) : (
              <>
                <ConsignmentIcon color="white" />
                <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px] ml-2">Realizar Consignacion</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/consignaciones',
              params: (closeCart(), {})
            })}
            className='bg-primary items-center justify-center rounded-full h-[50px] w-[50px]'
          >
            <Feather name="edit" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetFooter>
  ), [total, customerSelected?.cardName, handleSubmitOrder, isLoading, router]);

  return (
    <View style={{ flex: 1, zIndex: 100 }}>
      {products.length > 0 && (
        <View style={{ position: 'relative', height: 50, width: 50, alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity
            className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-primary shadow-lg shadow-[#09f]/30"
            onPress={openCart}
          >
            <ConsignmentIcon color="white" />
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
        enableDynamicSizing={false}
        footerComponent={renderFooter}
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
        <View className='px-4 pb-2'>
          <Text className="text-lg text-start font-[Poppins-Bold] tracking-[-0.3px]">Resumen de Consignación</Text>
        </View>
        <MemoizedCommentInput comments={comments} onCommentsChange={setComments} />

        {products.length === 0 ? (
          <EmptyCart onClose={closeCart} onAddProducts={() => router.push('/consignaciones')} />
        ) : (
          <BottomSheetFlatList<CartItemType>
            data={products.map((product) => ({
              ...product,
              imageUrl: product.imageUrl ?? null,
            }))}
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