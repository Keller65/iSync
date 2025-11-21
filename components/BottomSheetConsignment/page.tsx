import CartIcon from '@/assets/icons/CartIcon';
import ConsignmentIcon from '@/assets/icons/ConsignmentIcon';
import TrashIcon from '@/assets/icons/TrashIcon';
import { useAuth } from '@/context/auth';
import '@/global.css';
import { useAppStore } from '@/state/index';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetFlatList, BottomSheetFooter, BottomSheetFooterProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import axios, { isAxiosError } from 'axios';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface CartItemType {
  imageUrl: string | null;
  itemCode: string;
  itemName: string;
  groupCode: string;
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
            source={{ uri: `https://pub-51a1583fe6c247528ea6255ea10c9541.r2.dev/${item.groupCode}.jpg` }}
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

CartItem.displayName = 'CartItem';

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

MemoizedCommentInput.displayName = 'MemoizedCommentInput';

export default function BottomSheetConsignment() {
  const router = useRouter();
  const products = useAppStore((s) => s.products);
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeProduct = useAppStore((s) => s.removeProduct);
  const clearCart = useAppStore((s) => s.clearCart);
  const customerSelected = useAppStore((s) => s.selectedCustomerConsignment);

  // Estados de edición
  const isEditingConsignment = useAppStore((s) => s.isEditingConsignment);
  const editingConsignmentId = useAppStore((s) => s.editingConsignmentId);
  const exitEditMode = useAppStore((s) => s.exitEditMode);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { deviceUUID } = useAppStore();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState('');
  const { fetchUrl, ventasConfig } = useAppStore();
  const setRawSearchText = useAppStore((state) => state.setRawSearchText);
  const setDebouncedSearchText = useAppStore((state) => state.setDebouncedSearchText);

  // Estados para el modal de RTN
  const [showRtnModal, setShowRtnModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [rtnNumber, setRtnNumber] = useState('');

  // Estados para el modal de selección de documento
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'factura' | 'cotizacion' | null>(null);

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
            backgroundColor: '#1A3D59',
          },
          style,
        ]}
      />
    );
  };

  const handleSubmitOrder = useCallback(async (withRtn: boolean = false, rtnData?: { clientName: string, rtnNumber: string }, documentType: 'factura' | 'cotizacion' = 'cotizacion', facturaTipo: 'facturasContado' | 'facturasCredito' = 'facturasContado') => {
    if (!customerSelected || products.length === 0) {
      Alert.alert('Error', 'Faltan datos para enviar el pedido.');
      return;
    }

    // Obtener configuración de ventas desde el estado global
    const config = documentType === 'cotizacion' ? ventasConfig.cotizacion : ventasConfig[facturaTipo];

    const partidas = products.map((product) => ({
      codigoProducto: product.barCode,
      cantidad: product.quantity,
      precioUnitario: product.unitPrice,
      observaciones: 'no hay',
    }));

    const data = {
      codigoCliente: customerSelected.cardCode,
      codigoConcepto: config.concepto || "N/D",
      almacenSalida: config.almacen || "N/D",
      fecha: new Date().toISOString(),
      referencia: 'API',
      partidas,
      userId: deviceUUID, // UUID proporcionado por useLicense
      documentType: documentType,
      ...(withRtn && rtnData && {
        CRAZONSOCIAL: rtnData.clientName,
        CRFC: rtnData.rtnNumber
      })
    };

    try {
      setIsLoading(true);

      let response;
      if (isEditingConsignment && editingConsignmentId) {
        // Actualizar Cotización existente con nueva estructura
        const updateData = {
          documentId: editingConsignmentId,
          lines: products.map((product) => ({
            itemCode: product.barCode,
            quantity: product.quantity,
            price: product.unitPrice,
            warehouseId: config.almacen,
            remarks: comments || 'no hay',
          })),
          userId: deviceUUID,
        };

        response = await axios.put(`${fetchUrl}/api/Consignaciones/Edit`, updateData, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${user?.token}`,
            'User-Agent': 'iSync-ERP',
          },
        });
        console.log('✅ Cotización actualizada exitosamente:', response.data);
        console.log('data enviada:', updateData);
      } else {
        // Crear nueva Cotización o Factura
        response = await axios.post(`${fetchUrl}/api/Consignaciones/async`, data, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Prefer: 'respond-async',
            Authorization: `Bearer ${user?.token}`,
            'User-Agent': 'iSync-ERP',
          },
        });
        console.log('✅ Documento creado exitosamente:', response.data);
      }

      console.log('data enviada:', data);
      clearCart();
      setComments('');

      // Limpiar el input de búsqueda
      setRawSearchText('');
      setDebouncedSearchText('');

      // Limpiar campos de RTN si se usaron
      if (withRtn) {
        setClientName('');
        setRtnNumber('');
      }

      // Salir del modo edición si estaba activo
      if (isEditingConsignment) {
        exitEditMode();
      }

      bottomSheetRef.current?.dismiss();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/modal/success');
    } catch (error) {
      console.error('data enviada:', data);
      if (isAxiosError(error)) {
        console.error('❌ Error en la solicitud:', error.response?.data || error.message);
        const errorMessage = isEditingConsignment
          ? 'No se pudo actualizar la Cotización.'
          : 'No se pudo crear el Documento.';
        Alert.alert('Error', `${errorMessage} ${error.response?.data?.message || error.message}`);
      } else {
        console.error('❌ Error desconocido:', (error as Error).message);
        Alert.alert('Error', 'No se pudo enviar el pedido. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [customerSelected, products, fetchUrl, user?.token, clearCart, setComments, router, deviceUUID, isEditingConsignment, editingConsignmentId, exitEditMode, comments, ventasConfig, setRawSearchText, setDebouncedSearchText]);

  const handleDocumentSelection = useCallback(() => {
    if (!customerSelected || products.length === 0) {
      Alert.alert('Error', 'Faltan datos para enviar el pedido.');
      return;
    }
    setShowDocumentModal(true);
  }, [customerSelected, products]);

  const handleSelectDocument = useCallback((documentType: 'factura' | 'cotizacion', facturaTipo?: 'contado' | 'credito') => {
    setSelectedDocumentType(documentType);
    setShowDocumentModal(false);

    if (documentType === 'factura') {
      const tipoFactura = facturaTipo === 'credito' ? 'facturasCredito' : 'facturasContado';

      // Para facturas, preguntamos por RTN
      Alert.alert(
        `Factura ${facturaTipo === 'credito' ? 'Crédito' : 'Contado'} con RTN`,
        `¿Desea su Factura ${facturaTipo === 'credito' ? 'Crédito' : 'Contado'} con RTN?`,
        [
          {
            text: 'No',
            onPress: () => handleSubmitOrder(false, undefined, 'factura', tipoFactura),
            style: 'cancel'
          },
          {
            text: 'Sí',
            onPress: () => setShowRtnModal(true)
          }
        ]
      );
    } else {
      // Para cotizaciones, también preguntamos por RTN
      Alert.alert(
        'Cotización con RTN',
        '¿Desea su Cotización con RTN?',
        [
          {
            text: 'No',
            onPress: () => handleSubmitOrder(false, undefined, 'cotizacion'),
            style: 'cancel'
          },
          {
            text: 'Sí',
            onPress: () => setShowRtnModal(true)
          }
        ]
      );
    }
  }, [handleSubmitOrder]);

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
            onPress={handleDocumentSelection}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px] ml-2">
                  {isEditingConsignment ? 'Actualizando Cotización...' : 'Creando Documento...'}
                </Text>
              </>
            ) : (
              <>
                <ConsignmentIcon color="white" />
                <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px] ml-2">
                  {isEditingConsignment ? 'Actualizar Cotización' : 'Crear Documento'}
                </Text>
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
  ), [total, customerSelected?.cardName, isLoading, isEditingConsignment, router, closeCart, handleDocumentSelection]);

  const CancelEdit = useCallback(() => {
    Alert.alert(
      'Cancelar edición',
      '¿Estás seguro de que quieres cancelar la edición de la Cotización? Se perderán los cambios no guardados.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí', onPress: () => { exitEditMode(); clearCart(); } }
      ]
    );
  }, [exitEditMode, clearCart]);

  const handleSubmitWithRtn = useCallback(() => {
    if (!clientName.trim() || !rtnNumber.trim()) {
      Alert.alert('Error', 'Por favor, complete todos los campos.');
      return;
    }
    setShowRtnModal(false);
    const docType = selectedDocumentType || 'cotizacion';
    handleSubmitOrder(true, { clientName: clientName.trim(), rtnNumber: rtnNumber.trim() }, docType);
  }, [clientName, rtnNumber, handleSubmitOrder, selectedDocumentType]);

  const handleCloseRtnModal = useCallback(() => {
    setShowRtnModal(false);
    setClientName('');
    setRtnNumber('');
    setSelectedDocumentType(null);
  }, []);

  const isRtnFormValid = clientName.trim().length > 0 && rtnNumber.trim().length > 0;

  return (
    <View style={{ flex: 1, zIndex: 100 }}>
      {products.length !== 0 && (
        <View style={{ position: 'relative', height: 50, width: 50, alignItems: 'center', justifyContent: 'center' }}>
          <PulsingCircle index={0} />
          <PulsingCircle index={1} />

          <TouchableOpacity
            className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-primary shadow-lg"
            onPress={openCart}
          >
            {isEditingConsignment ? (
              <MaterialIcons name="edit-document" size={24} color="white" />
            ) : (
              <ConsignmentIcon color="white" />
            )}
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
        <View className='flex-1'>
          {/* <View className='px-4 pb-2'>
            <Text className="text-lg text-start font-[Poppins-Bold] tracking-[-0.3px]">
              {isEditingConsignment ? 'Editar Cotización' : 'Resumen de Cotización'}
            </Text>
          </View> */}
          <MemoizedCommentInput comments={comments} onCommentsChange={setComments} />

          {isEditingConsignment && (
            <View className="px-4 bg-red-200 mb-4 p-2 flex-row justify-between items-center gap-4">
              <Text className="text-sm text-red-500 font-[Poppins-SemiBold]">Cancelar edición de Cotización</Text>

              <TouchableOpacity onPress={CancelEdit} className='bg-red-500 px-3 py-1 rounded-full items-center justify-center'>
                <Text className="text-sm text-white font-[Poppins-SemiBold]">Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

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
              contentContainerStyle={{ paddingBottom: 140 }}
            />
          )}
        </View>
      </BottomSheetModal>

      {/* Modal para RTN */}
      <Modal
        visible={showRtnModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseRtnModal}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl p-6 w-full">
            {/* Header con botón de cerrar */}
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-[Poppins-Bold] tracking-[-0.3px]">
                {selectedDocumentType === 'factura' ? 'Datos de Facturación' : 'Datos de Cotización'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseRtnModal}
                className="p-1"
              >
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Descripción */}
            <Text className="text-sm text-gray-600 mb-4 font-[Poppins-Regular]">
              Complete los datos para generar {selectedDocumentType === 'factura' ? 'la factura' : 'la cotización'} con RTN
            </Text>

            {/* Campo Nombre del Cliente */}
            <View className="mb-4">
              <Text className="text-sm font-[Poppins-Medium] text-gray-700 mb-2">
                Nombre del Cliente
              </Text>
              <TextInput
                value={clientName}
                onChangeText={setClientName}
                placeholder="Ingrese el nombre completo"
                placeholderTextColor="#999"
                className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Campo RTN */}
            <View className="mb-6">
              <Text className="text-sm font-[Poppins-Medium] text-gray-700 mb-2">
                RTN (Registro Tributario Nacional) sin guiones
              </Text>
              <TextInput
                value={rtnNumber}
                onChangeText={setRtnNumber}
                placeholder="Ingrese el RTN"
                placeholderTextColor="#999"
                className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                keyboardType="numeric"
                maxLength={14}
              />
            </View>

            {/* Botón de envío */}
            <TouchableOpacity
              onPress={handleSubmitWithRtn}
              disabled={!isRtnFormValid || isLoading || rtnNumber.trim().length !== 14}
              className={`rounded-full py-3 items-center justify-center ${isRtnFormValid && !isLoading && rtnNumber.trim().length === 14 ? 'bg-primary' : 'bg-gray-300'
                }`}
            >
              {isLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px] ml-2">
                    Enviando...
                  </Text>
                </View>
              ) : (
                <Text className={`font-[Poppins-SemiBold] tracking-[-0.3px] ${isRtnFormValid && rtnNumber.trim().length === 14 ? 'text-white' : 'text-gray-500'
                  }`}>
                  Enviar {selectedDocumentType === 'factura' ? 'Factura' : 'Cotización'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para selección de documento */}
      <Modal
        visible={showDocumentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDocumentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl p-6 w-full">
            {/* Header con botón de cerrar */}
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-[Poppins-Bold] tracking-[-0.3px]">
                Documento a crear
              </Text>
              <TouchableOpacity
                onPress={() => setShowDocumentModal(false)}
                className="p-1"
              >
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Descripción */}
            <Text className="text-sm text-gray-600 mb-6 font-[Poppins-Regular]">
              Seleccione el tipo de documento que desea crear
            </Text>

            {/* Botones de selección */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={() => handleSelectDocument('factura', 'contado')}
                className="bg-primary rounded-full py-4 items-center justify-center"
              >
                <Text className="text-white font-[Poppins-SemiBold] text-base tracking-[-0.3px]">
                  Factura Contado
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSelectDocument('factura', 'credito')}
                className="bg-primary rounded-full py-4 items-center justify-center"
              >
                <Text className="text-white font-[Poppins-SemiBold] text-base tracking-[-0.3px]">
                  Factura Credito
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSelectDocument('cotizacion')}
                className="bg-primary rounded-full py-4 items-center justify-center"
              >
                <Text className="text-white font-[Poppins-SemiBold] text-base tracking-[-0.3px]">
                  Cotización
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}