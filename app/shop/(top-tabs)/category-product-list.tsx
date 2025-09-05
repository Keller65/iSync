import MinusIcon from '@/assets/icons/MinusIcon';
import PercentIcon from '@/assets/icons/PercentIcon';
import PlusIcon from '@/assets/icons/PlusIcon';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state/index';
import { ProductDiscount } from '@/types/types';
import { BottomSheetBackdrop, BottomSheetFooter, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import axios from 'axios';
// import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';

const PAGE_SIZE = 20;

const ProductItem = memo(({ item, onPress }: { item: ProductDiscount, onPress: (item: ProductDiscount) => void }) => {
  return (
    <TouchableOpacity onPress={() => onPress(item)} className="mb-4 bg-white w-[190px] gap-3 p-2">
      <View className="rounded-2xl bg-white items-center justify-center h-[180px] relative overflow-hidden border border-gray-200">
        {item.hasDiscount && (
          <View className='absolute top-2 left-2 z-10'>
            <PercentIcon />
          </View>
        )}
        <Image
          source={{ uri: `https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/${item.itemCode}.jpg` }}
          style={{ height: 180, width: 180, objectFit: "contain", borderRadius: 16 }}
          // contentFit="contain"
          onError={() => console.log("Error loading image for item:", item.itemCode)}
          // transition={500}
        />
      </View>

      <View>
        <Text className="font-medium text-sm text-black">
          L. {item.price.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text className="font-medium text-sm leading-4" numberOfLines={2} ellipsizeMode="tail">
          {item.itemName.toLowerCase()}
        </Text>
        <Text className="text-[10px] text-gray-400">{item.barCode}</Text>
        <Text className="text-[10px] text-gray-400">Stock: {item.inStock}</Text>
      </View>
    </TouchableOpacity>
  );
});

const CategoryProductScreen = memo(() => {
  const { user } = useAuth();
  const route = useRoute();
  const { groupCode, priceListNum } = route.params as { groupCode?: string, priceListNum?: string };

  const addProduct = useAppStore(state => state.addProduct);
  const updateQuantity = useAppStore(state => state.updateQuantity);
  const productsInCart = useAppStore(state => state.products);
  const debouncedSearchText = useAppStore(state => state.debouncedSearchText);
  const { products, fetchUrl } = useAppStore()

  const pagesCacheRef = useRef<Map<number, ProductDiscount[]>>(new Map());
  const [items, setItems] = useState<ProductDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ProductDiscount | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [editablePrice, setEditablePrice] = useState<number>(0);
  const [isPriceValid, setIsPriceValid] = useState<boolean>(true);
  const [editablePriceText, setEditablePriceText] = useState<string>('0.00');
  const [editableTiers, setEditableTiers] = useState<ProductDiscount['tiers']>([]);
  const [applyTierDiscounts, setApplyTierDiscounts] = useState(false);
  const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState(false);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const FETCH_URL = fetchUrl + "/sap/items/";
  const FETCH_URL_DISCOUNT = fetchUrl + "/sap/items/discounted";
  const snapPoints = useMemo(() => ['85%', '100%'], []);
  const [footerHeight, setFooterHeight] = useState(0);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setSelectedItem(null);
      setIsPriceManuallyEdited(false);
    }
  }, []);

  const fetchProducts = useCallback(async ({ forceRefresh = false, loadMore = false } = {}) => {
    if (!user?.token) {
      setLoading(false);
      setError('No se ha iniciado sesión o el token no está disponible.');
      return;
    }
    const currentPage = loadMore ? page : 1;
    if (!forceRefresh && !loadMore && pagesCacheRef.current.has(currentPage)) {
      setItems(Array.from(pagesCacheRef.current.values()).flat());
      setLoading(false);
      return;
    }
    loadMore ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip'
      };
      let url: string;

      if (groupCode === '0000') {
        url = `${FETCH_URL_DISCOUNT}?page=${currentPage}&pageSize=${PAGE_SIZE}`;
      } else {
        url = `${FETCH_URL}active?page=${currentPage}&pageSize=${PAGE_SIZE}`;
        if (priceListNum) url += `&priceList=${priceListNum}`;
        if (groupCode) url += `&groupCode=${groupCode}`;
      }

      const itemsResponse = await axios.get(url, { headers });
      const newItems = itemsResponse.data.items;
      
      console.log(itemsResponse.headers['content-encoding']);
      
      if (forceRefresh) pagesCacheRef.current = new Map();
      pagesCacheRef.current.set(currentPage, newItems);

      setItems(prevItems => loadMore ? [...prevItems, ...newItems] : Array.from(pagesCacheRef.current.values()).flat());
      setPage(currentPage);
      setTotalItems(itemsResponse.data.total);
    } catch (err: any) {
      setError(err?.message || 'Error inesperado');
      if (!loadMore) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [user?.token, groupCode, priceListNum, page]);

  useEffect(() => {
    pagesCacheRef.current = new Map();
    setItems([]);
    setPage(1);
    setLoading(true);
    fetchProducts();
  }, [groupCode, priceListNum]);

  useEffect(() => {
    if (!selectedItem) {
      setTotal(0);
      setUnitPrice(0);
      setEditablePrice(0);
      setEditablePriceText('0.00');
      setIsPriceValid(true);
      setEditableTiers([]);
      setIsPriceManuallyEdited(false);
      return;
    }
    setEditableTiers(selectedItem.tiers ? [...selectedItem.tiers] : []);
    setIsPriceValid(true);
    setIsPriceManuallyEdited(false);

    setUnitPrice(selectedItem.price);
    setEditablePrice(selectedItem.price);
    setEditablePriceText(selectedItem.price.toFixed(2));

  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem || isPriceManuallyEdited) return;

    let newUnitPrice;
    if (applyTierDiscounts) {
      const applicableTier = (editableTiers || [])
        .filter(t => quantity >= t.qty)
        .sort((a, b) => b.qty - a.qty)[0];
      newUnitPrice = applicableTier ? applicableTier.price : selectedItem.price;
    } else {
      newUnitPrice = selectedItem.price;
    }

    setUnitPrice(newUnitPrice);
    setEditablePrice(newUnitPrice);
    setEditablePriceText(newUnitPrice.toFixed(2));
  }, [quantity, editableTiers, selectedItem, applyTierDiscounts, isPriceManuallyEdited]);

  useEffect(() => {
    if (selectedItem && editablePrice > 0 && quantity > 0) {
      setTotal(editablePrice * quantity);

      const originalApplicableTier = selectedItem.tiers
        ?.filter(t => quantity >= t.qty)
        .sort((a, b) => b.qty - a.qty)[0];

      const minimumAllowedPrice = (applyTierDiscounts && originalApplicableTier)
        ? originalApplicableTier.price
        : selectedItem.price;

      setIsPriceValid(editablePrice >= minimumAllowedPrice);
    } else {
      setTotal(0);
      setIsPriceValid(false);
    }
  }, [editablePrice, quantity, selectedItem, applyTierDiscounts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    pagesCacheRef.current = new Map();
    setPage(1);
    fetchProducts({ forceRefresh: true });
  }, [fetchProducts]);

  const loadMoreItems = useCallback(() => {
    if (!loadingMore && items.length < totalItems) setPage(prev => prev + 1);
    if (!loadingMore && items.length >= totalItems && items.length % PAGE_SIZE === 0) setPage(prev => prev + 1);
  }, [loadingMore, items.length, totalItems]);

  useEffect(() => {
    if (page > 1) fetchProducts({ loadMore: true });
  }, [page, fetchProducts]);

  const handleProductPress = useCallback((item: ProductDiscount) => {
    setSelectedItem(item);
    setQuantity(1);
    setIsPriceManuallyEdited(false);
    bottomSheetModalRef.current?.present();
  }, []);

  const handleAddToCart = useCallback(() => {
    const finalPriceForCart = editablePrice;

    if (!selectedItem || quantity <= 0 || !isPriceValid || finalPriceForCart <= 0) {
      Alert.alert('Error', 'Por favor, asegúrate de que la cantidad sea mayor a 0 y el precio sea válido.');
      return;
    }

    const itemInCart = productsInCart.find(p => p.itemCode === selectedItem.itemCode);
    const productData = { ...selectedItem, quantity, unitPrice: finalPriceForCart, tiers: editableTiers, originalPrice: selectedItem.price };

    if (itemInCart) {
      Alert.alert('Producto ya en carrito', `${selectedItem.itemName} ya está en tu carrito. ¿Actualizar cantidad y precio?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar', onPress: () => {
            updateQuantity(selectedItem.itemCode, quantity, finalPriceForCart);
            bottomSheetModalRef.current?.dismiss();
          }
        },
      ]);
    } else {
      addProduct(productData);
      console.log("Producto Agregado al carrito", productData)
      bottomSheetModalRef.current?.dismiss();
    }
  }, [addProduct, productsInCart, quantity, selectedItem, editablePrice, isPriceValid, updateQuantity, editableTiers]);

  const filteredItems = useMemo(() => {
    const text = debouncedSearchText?.toLowerCase() || '';
    return items.filter(item =>
      item.barCode?.toLowerCase().includes(text) ||
      item.itemName?.toLowerCase().includes(text) ||
      item.groupName?.toLowerCase().includes(text)
    );
  }, [items, debouncedSearchText]);

  const renderItem = useCallback(({ item }: { item: ProductDiscount }) => (
    <ProductItem item={item} onPress={handleProductPress} />
  ), [handleProductPress]);

  const renderFooter = useCallback((props: any) => (
    selectedItem ? (
      <BottomSheetFooter {...props}>
        <View
          className='w-full px-4 pt-4 pb-2 bg-white border-t border-gray-200'
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        >
          <View className="w-full flex-row justify-between items-end">
            <Text className="font-[Poppins-Bold] text-black tracking-[-0.3px]">Total</Text>
            <Text className="text-2xl font-[Poppins-Bold] tracking-[-0.3px]">
              L. {new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(total)}
            </Text>
          </View>
          <TouchableOpacity
            className={`mt-4 rounded-full py-3 items-center justify-center h-[50px] ${!isPriceValid || quantity <= 0 ? 'bg-gray-300' : 'bg-yellow-300'}`}
            onPress={handleAddToCart}
            disabled={!isPriceValid || quantity <= 0}
          >
            <Text className="text-black font-[Poppins-Bold] tracking-[-0.3px]">Agregar al carrito</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ) : null
  ), [selectedItem, quantity, total, isPriceValid, handleAddToCart]);

  const handleQuantityChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    if (cleanedText === '') {
      setQuantity(0);
    } else {
      const newQuantity = parseInt(cleanedText, 10);
      setQuantity(Math.max(0, isNaN(newQuantity) ? 0 : newQuantity));
    }
  };

  const handlePriceChange = (text: string) => {
    setIsPriceManuallyEdited(true);
    const cleanedText = text.replace(/[^0-9.]/g, '');
    const parts = cleanedText.split('.');
    if (parts.length > 2) {
      setEditablePriceText(parts.slice(0, 2).join('.'));
    } else {
      setEditablePriceText(cleanedText);
    }
    const parsedValue = parseFloat(cleanedText);
    if (!isNaN(parsedValue)) {
      setEditablePrice(parsedValue);
    } else {
      setEditablePrice(0);
    }
  };

  const handlePriceBlur = () => {
    let finalValue = parseFloat(editablePriceText);
    if (isNaN(finalValue)) {
      finalValue = unitPrice;
    } else {
      finalValue = parseFloat(finalValue.toFixed(2));
    }
    setEditablePrice(finalValue);
    setEditablePriceText(finalValue.toFixed(2));

    const originalApplicableTier = selectedItem?.tiers?.filter(t => quantity >= t.qty).sort((a, b) => b.qty - a.qty)[0];
    const minimumAllowedPrice = (applyTierDiscounts && originalApplicableTier) ? originalApplicableTier.price : selectedItem?.price || 0;
    setIsPriceValid(finalValue >= minimumAllowedPrice);
  };

  if (loading && !loadingMore) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-4 text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">Cargando productos...</Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text className="text-blue-500 font-[Poppins-SemiBold] tracking-[-0.3px]">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white relative">
      <FlashList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.itemCode}
        estimatedItemSize={200}
        numColumns={2}
        onEndReached={loadMoreItems}
        onEndReachedThreshold={0.2}
        ListFooterComponent={loadingMore ? <View className="py-4"><ActivityIndicator size="small" color="#000" /></View> : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]} tintColor="#3b82f6" />}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20 }}
        drawDistance={500}
        overrideItemLayout={(layout) => { layout.size = 100; }}
      />

      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={(props) => (<BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} pressBehavior="close" />)}
        footerComponent={renderFooter}
      >
        <BottomSheetScrollView
          className='flex-1'
          contentContainerStyle={{ paddingBottom: footerHeight + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {selectedItem && (
            <View>
              <View className="w-full h-[230px] items-center justify-center bg-white overflow-hidden">
                <Image
                  source={{ uri: `https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/${selectedItem.itemCode}.jpg` }}
                  style={{ height: 230, width: 230, aspectRatio: 1, objectFit: "contain" }}
                  // contentFit="contain"
                  // transition={500}
                />
              </View>

              <View className='px-[16px]'>
                <Text className="text-[18px] font-[Poppins-Bold] tracking-[-0.3px] text-gray-900">{selectedItem.itemName}</Text>

                <View className="flex-1 flex-row w-full h-fit justify-between gap-2 mt-1">
                  <View className='bg-gray-200 py-2 px-3 w-fit rounded-full'>
                    <Text className="font-[Poppins-Regular] text-[12px] leading-3 tracking-[-0.3px] text-gray-700">{selectedItem.barCode}</Text>
                  </View>

                  <View className='bg-gray-200 py-2 px-3 w-fit rounded-full'>
                    <Text className="font-[Poppins-Regular] text-[12px] leading-3 tracking-[-0.3px] text-gray-700">{selectedItem.salesUnit} x {selectedItem.salesItemsPerUnit}</Text>
                  </View>
                </View>

                <View className='flex-row items-start justify-between'>
                  <View className="bg-white py-4 rounded-lg">
                    <Text className="font-[Poppins-SemiBold] text-base tracking-[-0.3px] text-gray-800 leading-3">Precio de Venta:</Text>
                    <View className="flex-row items-center">
                      <Text className="font-[Poppins-Bold] text-lg tracking-[-0.3px] text-black mr-2">L.</Text>
                      <TextInput
                        className={`p-2 text-lg font-[Poppins-Bold] text-black w-[100px] ${!isPriceValid ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        value={editablePriceText}
                        onChangeText={handlePriceChange}
                        onBlur={handlePriceBlur}
                        keyboardType="numeric"
                      />
                    </View>
                    <Text className="text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">Precio base original: L.{selectedItem.price.toLocaleString()}</Text>
                  </View>

                  <View className="flex-row items-center">
                    <TouchableOpacity className="bg-gray-200 rounded-full p-2" onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                      <MinusIcon size={20} />
                    </TouchableOpacity>
                    <TextInput
                      value={quantity.toString()}
                      onChangeText={handleQuantityChange}
                      keyboardType="numeric"
                      className="mx-4 text-center text-lg text-black w-12"
                    />
                    <TouchableOpacity className="bg-gray-200 rounded-full p-2" onPress={() => setQuantity(q => q + 1)}>
                      <PlusIcon size={20} />
                    </TouchableOpacity>
                  </View>
                </View>

                {!isPriceValid && <Text className="text-red-600 text-xs font-[Poppins-Regular] tracking-[-0.3px]">El precio no puede ser menor al mínimo permitido.</Text>}

                {editableTiers && editableTiers.length > 0 && (
                  <View className={`bg-gray-100 py-2 px-3 rounded-2xl ${!applyTierDiscounts && 'opacity-50'}`}>
                    <TouchableOpacity
                      onPress={() => {
                        setApplyTierDiscounts(prev => {
                          const newValue = !prev;
                          if (newValue) {
                            setIsPriceManuallyEdited(false);
                          }
                          return newValue;
                        });
                      }}
                      className='flex-row justify-between items-center mb-3'
                    >
                      <Text className="font-[Poppins-Bold] text-base tracking-[-0.3px] text-gray-800">Precios por Cantidad:</Text>
                      <Text className='font-[Poppins-SemiBold] text-blue-500'>{applyTierDiscounts ? 'Desactivar' : 'Activar'}</Text>
                    </TouchableOpacity>
                    {editableTiers.map((tier, index) => {
                      return (
                        <View key={index} className="mb-2">
                          <View className='flex-row items-center justify-between'>
                            <View className='items-start'>
                              <Text className="font-[Poppins-SemiBold] text-sm tracking-[-0.3px] text-gray-700">Desde {tier.qty} unidades:</Text>
                              {tier.percent > 0 && <Text className="text-green-600 text-xs">({tier.percent}% desc)</Text>}
                            </View>
                            <View className="flex-row items-center">
                              <Text className="font-[Poppins-Bold] text-base text-black mr-1">L.</Text>
                              <Text className="font-[Poppins-Bold] text-base text-black">{tier.price.toFixed(2)}</Text>
                            </View>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                )}

                <View className="flex-1 mt-2">
                  <View className="">
                    <Text className="font-[Poppins-SemiBold] text-base tracking-[-0.3px] text-gray-800 mb-1">Inventario</Text>

                    <View className='flex-row gap-2 items-center justify-between'>
                      <View className='bg-gray-100 px-3 py-1 rounded-lg flex-1'>
                        <Text className="font-[Poppins-Bold] text-sm text-gray-600 tracking-[-0.3px]">Disponible</Text>
                        <Text className="font-[Poppins-Regular] text-xl text-gray-900 tracking-[-0.3px]">{selectedItem.inStock.toLocaleString()}</Text>
                      </View>

                      <View className='bg-gray-100 px-3 py-1 rounded-lg flex-1'>
                        <Text className="font-[Poppins-Bold] text-sm text-gray-600 tracking-[-0.3px]">En Pedido</Text>
                        <Text className="font-[Poppins-Regular] text-xl text-gray-900 tracking-[-0.3px]">{selectedItem.ordered.toLocaleString()}</Text>
                      </View>

                      <View className='bg-gray-100 px-3 py-1 rounded-lg'>
                        <Text className="font-[Poppins-Bold] text-sm text-gray-600 tracking-[-0.3px]">Comprometido</Text>
                        <Text className="font-[Poppins-Regular] text-xl text-gray-900 tracking-[-0.3px]">{selectedItem.committed.toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
});

export default CategoryProductScreen;