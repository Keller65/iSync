import MinusIcon from '@/assets/icons/MinusIcon';
import PercentIcon from '@/assets/icons/PercentIcon';
import PlusIcon from '@/assets/icons/PlusIcon';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import { ProductDiscount } from '@/types/types';
import { BottomSheetBackdrop, BottomSheetFooter, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import axios from 'axios';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ProductItem = memo(function ProductItem({ item, onPress }: { item: ProductDiscount, onPress: (item: ProductDiscount) => void }) {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  const formattedPrice = useMemo(() =>
    item.price.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [item.price]
  );

  const itemNameLower = useMemo(() => item.itemName.toLowerCase(), [item.itemName]);

  return (
    <TouchableOpacity onPress={handlePress} className="mb-4 bg-white w-[190px] gap-3 p-2">
      <View className="rounded-2xl bg-white items-center justify-center h-[180px] relative overflow-hidden border border-gray-200">
        {item.hasDiscount && (
          <View className='absolute top-2 left-2 z-10'>
            <PercentIcon />
          </View>
        )}
        <Image
          source={{ uri: `https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/${item.itemCode}.jpg` }}
          style={{ height: 180, width: 180, objectFit: "contain", borderRadius: 16 }}
          onError={() => console.log("Error loading image for item:", item.itemCode)}
        />
      </View>

      <View>
        <Text className="font-medium text-sm text-black">
          L. {formattedPrice}
        </Text>
        <Text className="font-medium text-sm leading-4" numberOfLines={2} ellipsizeMode="tail">
          {itemNameLower}
        </Text>
        <Text className="text-[10px] text-gray-400">{item.barCode}</Text>
        <Text className="text-[10px] text-gray-400">Stock: {item.inStock}</Text>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return prevProps.item.itemCode === nextProps.item.itemCode &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.inStock === nextProps.item.inStock &&
    prevProps.item.hasDiscount === nextProps.item.hasDiscount;
});

interface GlobalSearchScreenProps {
  priceListNum: string;
}

export default function GlobalSearchScreen({ priceListNum }: GlobalSearchScreenProps) {
  const { user } = useAuth();
  const { fetchUrl, debouncedSearchText } = useAppStore();
  const addProduct = useAppStore(state => state.addProduct);
  const updateQuantity = useAppStore(state => state.updateQuantity);
  const productsInCart = useAppStore(state => state.products);

  const [searchResults, setSearchResults] = useState<ProductDiscount[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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
  const [refreshing, setRefreshing] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['85%', '100%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setSelectedItem(null);
      setIsPriceManuallyEdited(false);
    }
  }, []);

  // Función para buscar productos con paginación
  const searchProducts = useCallback(async (searchText: string, page: number = 1, append: boolean = false) => {
    if (!user?.token || !searchText.trim()) {
      return;
    }

    if (page === 1 && !append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip'
      };

      const searchUrl = `/api/Catalog/products/search?searchText=${encodeURIComponent(searchText)}&priceList=${priceListNum}&page=${page}&pageSize=20`;

      console.log('Searching products:', searchUrl);
      const response = await axios.get(searchUrl, { baseURL: fetchUrl, headers });

      const newProducts: ProductDiscount[] = response.data.items || response.data || [];
      console.log(`Page ${page} loaded:`, newProducts.length, 'products');

      if (append) {
        setSearchResults(prev => [...prev, ...newProducts]);
      } else {
        setSearchResults(newProducts);
      }

      // Determinar si hay más páginas
      setHasMore(newProducts.length === 20);
      setCurrentPage(page);

    } catch (err: any) {
      console.error('Error al buscar productos:', err);
      setError('Error al buscar productos');
      if (!append) {
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [user?.token, priceListNum, fetchUrl]);

  // Ejecutar búsqueda cuando cambie el texto de búsqueda
  useEffect(() => {
    if (debouncedSearchText.trim() && debouncedSearchText.length >= 2) {
      console.log('Search triggered for:', debouncedSearchText);
      setCurrentPage(1);
      setHasMore(true);
      searchProducts(debouncedSearchText, 1, false);
    } else {
      setSearchResults([]);
      setCurrentPage(1);
      setHasMore(true);
    }
  }, [debouncedSearchText, searchProducts]);

  // Los productos ya vienen filtrados del servidor, no necesitamos filtro local adicional
  const filteredItems = useMemo(() => {
    return searchResults;
  }, [searchResults]);

  const onRefresh = useCallback(() => {
    if (debouncedSearchText.trim() && debouncedSearchText.length >= 2) {
      setRefreshing(true);
      setCurrentPage(1);
      setHasMore(true);
      searchProducts(debouncedSearchText, 1, false);
    }
  }, [debouncedSearchText, searchProducts]);

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

    // Validar stock disponible
    const maxStock = selectedItem.inStock || 0;
    const itemInCart = productsInCart.find(p => p.itemCode === selectedItem.itemCode);
    const currentCartQuantity = itemInCart ? itemInCart.quantity : 0;
    const totalQuantity = itemInCart ? quantity : currentCartQuantity + quantity;

    if (totalQuantity > maxStock) {
      Alert.alert(
        'Stock insuficiente',
        `Solo hay ${maxStock} unidades disponibles en stock. ${itemInCart ? `Ya tienes ${currentCartQuantity} en el carrito.` : ''}`,
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

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

  const handleQuantityChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    if (cleanedText === '') {
      setQuantity(0);
    } else {
      const newQuantity = parseInt(cleanedText, 10);
      const maxStock = selectedItem?.inStock || 0;
      setQuantity(Math.max(0, Math.min(maxStock, isNaN(newQuantity) ? 0 : newQuantity)));
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

  const renderFooter = useCallback((props: any) => (
    selectedItem ? (
      <BottomSheetFooter {...props}>
        <View
          className='w-full px-4 pt-4 pb-2 bg-white'
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        >
          <View className="w-full flex-row justify-between items-end">
            <Text className="font-[Poppins-Bold] text-black tracking-[-0.3px]">Total</Text>
            <Text className="text-2xl font-[Poppins-Bold] tracking-[-0.3px]">
              L. {new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(total)}
            </Text>
          </View>
          <TouchableOpacity
            className={`mt-4 rounded-full py-3 items-center justify-center h-[50px] ${!isPriceValid || quantity <= 0 || (selectedItem?.inStock || 0) <= 0 ? 'bg-gray-300' : 'bg-primary'}`}
            onPress={handleAddToCart}
            disabled={!isPriceValid || quantity <= 0 || (selectedItem?.inStock || 0) <= 0}
          >
            <Text style={{ color: !isPriceValid || quantity <= 0 || (selectedItem?.inStock || 0) <= 0 ? '#6b7280' : 'white' }} className="font-[Poppins-Bold] tracking-[-0.3px]">Agregar al carrito</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ) : null
  ), [selectedItem, quantity, total, isPriceValid, handleAddToCart]);

  const handleEndReached = useCallback(() => {
    if (loadingMore || loading || !hasMore || !debouncedSearchText.trim()) return;

    const nextPage = currentPage + 1;
    console.log('Loading more products, page:', nextPage);
    searchProducts(debouncedSearchText, nextPage, true);
  }, [loadingMore, loading, hasMore, currentPage, debouncedSearchText, searchProducts]);

  const renderItem = useCallback(({ item }: { item: ProductDiscount }) => (
    <ProductItem item={item} onPress={handleProductPress} />
  ), [handleProductPress]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-4 text-gray-600 font-[Poppins-SemiBold] tracking-[-0.3px]">
          Buscando productos...
        </Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity onPress={() => {
          if (debouncedSearchText.trim() && debouncedSearchText.length >= 2) {
            searchProducts(debouncedSearchText, 1, false);
          }
        }}>
          <Text className="text-blue-500 font-[Poppins-SemiBold] tracking-[-0.3px]">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!debouncedSearchText.trim() || debouncedSearchText.length < 2) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-4">
        <Text className="text-gray-500 text-center font-[Poppins-Regular] text-lg mb-4">
          Escribe al menos 2 caracteres para buscar productos
        </Text>

        <View className="mt-4 px-4">
          <Text className="text-gray-400 text-center font-[Poppins-Regular] text-xs mb-1">
            💡 Puedes buscar por:
          </Text>
          <Text className="text-gray-400 text-center font-[Poppins-Regular] text-xs">
            • Nombre del producto • Código de barras • Código del artículo • Categoría
          </Text>
        </View>
      </View>
    );
  }

  if (filteredItems.length === 0 && !loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-4">
        <Text className="text-gray-500 text-center font-[Poppins-SemiBold] text-lg mb-2">
          No se encontraron productos
        </Text>
        <Text className="text-gray-400 text-center font-[Poppins-Regular]">
          Para: {debouncedSearchText}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white relative">
      {/* Header con información de resultados */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-sm font-[Poppins-SemiBold] text-gray-700">
          {filteredItems.length} productos encontrados
        </Text>
        <Text className="text-xs font-[Poppins-Regular] text-gray-500">
          Página {currentPage} • {hasMore ? 'Cargando más...' : 'Todos los resultados mostrados'}
        </Text>
      </View>

      <FlashList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.itemCode}
        estimatedItemSize={240}
        numColumns={2}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]} tintColor="#3b82f6" />}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text className="mt-2 text-gray-500 text-sm">Cargando más productos...</Text>
            </View>
          ) : !hasMore && filteredItems.length > 0 ? (
            <View className="py-4 items-center">
              <Text className="text-gray-500 text-sm">No hay más productos</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20 }}
        drawDistance={1000}
        estimatedListSize={{ height: 600, width: 400 }}
        getItemType={() => 'product'}
        overrideItemLayout={(layout) => { layout.size = 240; }}
      />

      {/* Bottom Sheet Modal */}
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
                      <MinusIcon size={20} color="#4b5563" />
                    </TouchableOpacity>
                    <TextInput
                      value={quantity.toString()}
                      onChangeText={handleQuantityChange}
                      keyboardType="numeric"
                      className="mx-4 text-center text-lg text-black w-12"
                    />
                    <TouchableOpacity
                      className={`rounded-full p-2 ${quantity >= (selectedItem?.inStock || 0) ? 'bg-gray-300' : 'bg-gray-200'}`}
                      onPress={() => setQuantity(q => Math.min(selectedItem?.inStock || 0, q + 1))}
                      disabled={quantity >= (selectedItem?.inStock || 0)}
                    >
                      <PlusIcon size={20} color={quantity >= (selectedItem?.inStock || 0) ? "#9ca3af" : "#4b5563"} />
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
                      <Text className='font-[Poppins-SemiBold] text-primary'>{applyTierDiscounts ? 'Desactivar' : 'Activar'}</Text>
                    </TouchableOpacity>
                    {editableTiers.map((tier, index) => {
                      return (
                        <View key={index} className="mb-2">
                          <View className='flex-row items-center justify-between'>
                            <View className='items-start'>
                              <Text className="font-[Poppins-SemiBold] text-sm tracking-[-0.3px] text-gray-700">Desde {tier.qty} unidades:</Text>
                              {tier.percent > 0 && <Text className="text-green-600 text-xs">({tier.percent}% desc)</Text>}
                              {tier.expiry && <Text className="text-green-600 text-xs">{tier.expiry}</Text>}
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

                <View className="flex-1 mt-2 gap-4">
                  <View>
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

                  <View>
                    <Text className="font-[Poppins-SemiBold] text-base tracking-[-0.3px] text-gray-800 mb-1">
                      Inventario por almacén
                    </Text>

                    <View className="gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                      {(selectedItem.ws ?? []).map((warehouse, idx) => (
                        <View
                          key={idx}
                          className="flex-1 flex-row items-center justify-between border-b border-gray-300"
                        >
                          <Text className="font-[Poppins-SemiBold] text-sm text-gray-600 tracking-[-0.3px]">
                            {warehouse.warehouseName}
                          </Text>
                          <Text className="font-[Poppins-SemiBold] text-sm text-gray-900 tracking-[-0.3px]">
                            {warehouse.inStock.toLocaleString()}
                          </Text>
                        </View>
                      ))}
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
}