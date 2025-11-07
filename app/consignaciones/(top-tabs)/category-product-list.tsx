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
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ProductItem = memo(({ item, onPress }: { item: ProductDiscount, onPress: (item: ProductDiscount) => void }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className="mb-4 gap-4 p-2 flex-row items-center"
    >
      <View
        className={`rounded-2xl bg-white justify-center relative overflow-hidden border border-gray-200 `}
      >
        {item.hasDiscount && (
          <View className='absolute top-2 left-2 z-10'>
            <PercentIcon />
          </View>
        )}
        <Image
          source={{ uri: "https://pub-51a1583fe6c247528ea6255ea10c9541.r2.dev/BlurImage.png" }}
          style={{ height: 120, width: 140, objectFit: "contain" }}
          onError={() => console.log("Error loading image for item:", item.itemCode)}
        />
      </View>

      <View className='flex-1 justify-center h-full'>
        <Text className="font-[Poppins-SemiBold] text-md tracking-[-0.3px]" numberOfLines={2} ellipsizeMode="tail">
          {item.itemName.toLowerCase()}
        </Text>
        <Text className="font-[Poppins-Regular] text-md text-black">
          L. {item.price.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text className="text-[10px] text-gray-400">{item.barCode}</Text>
        <Text className="text-[10px] text-gray-400">Stock: {item.inStock}</Text>
      </View>
    </TouchableOpacity>
  );
});

ProductItem.displayName = 'ProductItem';

const CategoryProductScreen = memo(() => {
  const { user } = useAuth();
  const route = useRoute();
  const { groupCode, priceListNum } = route.params as { groupCode?: string, priceListNum?: string };

  const addProduct = useAppStore(state => state.addProduct);
  const updateQuantity = useAppStore(state => state.updateQuantity);
  const products = useAppStore(state => state.products);
  const debouncedSearchText = useAppStore(state => state.debouncedSearchText);
  const { fetchUrl } = useAppStore();

  const pagesCacheRef = useRef<Map<number, ProductDiscount[]>>(new Map());
  const [items, setItems] = useState<ProductDiscount[]>([]);
  const [allItems, setAllItems] = useState<ProductDiscount[]>([]); // Para filtrado local
  const [filteredItems, setFilteredItems] = useState<ProductDiscount[]>([]);

  // Debug log para verificar cambios en debouncedSearchText
  useEffect(() => {
    console.log("[CategoryProduct] debouncedSearchText changed:", debouncedSearchText);
  }, [debouncedSearchText]);

  // Filtrado local de productos
  useEffect(() => {
    if (!debouncedSearchText || debouncedSearchText.trim() === '') {
      console.log("[CategoryProduct] No search text, showing all items");
      setFilteredItems(allItems);
      return;
    }

    const searchLower = debouncedSearchText.toLowerCase().trim();
    console.log("[CategoryProduct] Filtering with search term:", searchLower);
    
    const filtered = allItems.filter(item => 
      item.itemName.toLowerCase().includes(searchLower) ||
      item.itemCode.toLowerCase().includes(searchLower) ||
      item.barCode?.toLowerCase().includes(searchLower)
    );
    
    console.log("[CategoryProduct] Filtered results:", filtered.length, "from", allItems.length);
    setFilteredItems(filtered);
  }, [debouncedSearchText, allItems]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
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
  const [loadingMore, setLoadingMore] = useState(false);
  const FETCH_URL = fetchUrl + "/api/Catalog/products/all";
  const [footerHeight] = useState(0);

  const PAGE_SIZE = 20;
  const [page, setPage] = useState<number>(1);
  const isFetchingRef = useRef(false);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setSelectedItem(null);
      setIsPriceManuallyEdited(false);
    }
  }, []);

  // Función especializada para búsqueda que carga todos los productos
  const fetchAllProductsForSearch = useCallback(async () => {
    if (!user?.token || !debouncedSearchText?.trim()) return;
    
    console.log("[CategoryProduct] Fetching all products for search:", debouncedSearchText);
    setLoading(true);
    setError(null);
    
    try {
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip'
      };

      let allSearchResults: ProductDiscount[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const url = `${FETCH_URL}?${[
          groupCode && `groupCode=${encodeURIComponent(groupCode)}`,
          priceListNum && `priceList=${encodeURIComponent(priceListNum)}`,
          `page=${currentPage}`,
          `pageSize=100`,
          `search=${encodeURIComponent(debouncedSearchText)}`
        ].filter(Boolean).join('&')}`;

        console.log(`[CategoryProduct] Searching page ${currentPage}:`, url);
        const response = await axios.get(url, { headers });
        const payload = response.data;

        let newItems: ProductDiscount[] = [];
        if (Array.isArray(payload)) {
          newItems = payload;
        } else if (payload?.items) {
          newItems = payload.items;
        } else if (payload?.data) {
          newItems = payload.data;
        }

        allSearchResults = [...allSearchResults, ...newItems];
        console.log(`[CategoryProduct] Page ${currentPage}: found ${newItems.length} items, total: ${allSearchResults.length}`);
        
        // Si la página devolvió menos de 100 items, no hay más páginas
        hasMorePages = newItems.length === 100;
        currentPage++;
        
        // Límite de seguridad para evitar bucles infinitos
        if (currentPage > 50) {
          console.warn("[CategoryProduct] Reached page limit for search");
          break;
        }
      }

      console.log(`[CategoryProduct] Search completed: ${allSearchResults.length} total results`);
      setItems(allSearchResults);
      setAllItems(allSearchResults);
      setHasMore(false); // No hay más páginas en modo búsqueda
      
    } catch (err: any) {
      console.error("[CategoryProduct] Search error:", err);
      setError(err?.message || 'Error en la búsqueda');
      setItems([]);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.token, debouncedSearchText, groupCode, priceListNum, FETCH_URL]);

  const fetchProducts = useCallback(async (requestedPage: number = 1, append: boolean = false) => {
    if (isFetchingRef.current) return;
    if (!user?.token) {
      setLoading(false);
      setLoadingMore(false);
      setError('No se ha iniciado sesión o el token no está disponible.');
      return;
    }

    isFetchingRef.current = true;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip'
      };

      let url = `${FETCH_URL}`;
      const params: string[] = [];

      if (groupCode) params.push(`groupCode=${encodeURIComponent(groupCode)}`);
      if (priceListNum) params.push(`priceList=${encodeURIComponent(priceListNum)}`);
      params.push(`page=${requestedPage}`);
      params.push(`pageSize=${PAGE_SIZE}`);

      // Comentamos la búsqueda del servidor para hacer búsqueda local
      // if (debouncedSearchText) {
      //   params.push(`search=${encodeURIComponent(debouncedSearchText)}`);
      //   console.log("[CategoryProduct] Adding search param:", debouncedSearchText);
      // } else {
        console.log("[CategoryProduct] Using local search, debouncedSearchText:", debouncedSearchText);
      // }

      if (params.length) url += `?${params.join('&')}`;

      console.log("[CategoryProduct] Final URL:", url);
      const itemsResponse = await axios.get(url, { headers });
      const payload = itemsResponse.data;

      let newItems: ProductDiscount[] = [];

      if (Array.isArray(payload)) {
        newItems = payload;
      } else if (payload?.items) {
        newItems = payload.items;
      } else if (payload?.data) {
        newItems = payload.data;
      } else {
        newItems = [];
      }

      console.log("[CategoryProduct] New items:", newItems.length, "Page:", requestedPage);

      if (append) {
        setItems(prev => [...prev, ...newItems]);
        setAllItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
        setAllItems(newItems);
      }

      // Lógica simplificada para determinar si hay más páginas
      const hasMoreItems = newItems.length === PAGE_SIZE;
      setHasMore(hasMoreItems);

      setPage(requestedPage);

    } catch (err: any) {
      console.error("[CategoryProduct] Fetch error:", err);
      setError(err?.message || 'Error inesperado');
      if (!append) {
        setItems([]);
        setAllItems([]);
        setFilteredItems([]);
      }
      setHasMore(false);
    } finally {
      isFetchingRef.current = false;
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [user?.token, groupCode, priceListNum, PAGE_SIZE]);

  useEffect(() => {
    console.log("[CategoryProduct] Category/PriceList effect triggered:", {
      groupCode,
      priceListNum,
      hasSearch: !!debouncedSearchText?.trim()
    });
    
    // Si hay búsqueda activa, no cargar productos normalmente
    if (debouncedSearchText && debouncedSearchText.trim() !== '') {
      console.log("[CategoryProduct] Skipping normal fetch due to active search");
      return;
    }
    
    const timer = setTimeout(() => {
      setItems([]);
      setAllItems([]);
      setPage(1);
      setHasMore(true);
      fetchProducts(1, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [groupCode, priceListNum, debouncedSearchText, fetchProducts]);

  // UseEffect específico para búsqueda
  useEffect(() => {
    if (!debouncedSearchText || debouncedSearchText.trim() === '') {
      // Si no hay búsqueda, no hacer nada aquí (la carga normal se maneja en el useEffect anterior)
      return;
    }

    console.log("[CategoryProduct] Search effect triggered:", debouncedSearchText);
    
    const timer = setTimeout(() => {
      fetchAllProductsForSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [debouncedSearchText, fetchAllProductsForSearch]);

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
    pagesCacheRef.current = new Map();
    setPage(1);
    setHasMore(true);
    setAllItems([]);
    setFilteredItems([]);
    
    // Si hay búsqueda activa, usar función de búsqueda
    if (debouncedSearchText && debouncedSearchText.trim() !== '') {
      fetchAllProductsForSearch();
    } else {
      fetchProducts(1, false);
    }
  }, [debouncedSearchText, fetchAllProductsForSearch, fetchProducts]);

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

    const itemInCart = products.find(p => p.itemCode === selectedItem.itemCode);
    const productData = { ...selectedItem, quantity, unitPrice: finalPriceForCart, tiers: editableTiers, total: finalPriceForCart * quantity };

    if (itemInCart) {
      Alert.alert('Producto ya en carrito', `${selectedItem.itemName} ya está en el carrito. ¿Actualizar cantidad y precio?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar', onPress: () => {
            updateQuantity(selectedItem.itemCode, quantity, finalPriceForCart);
            bottomSheetModalRef.current?.dismiss();
          }
        },
      ]);
    } else {
      addProduct({ ...productData });
      console.log("Producto agregado al carrito", productData);
      bottomSheetModalRef.current?.dismiss();
    }
  }, [addProduct, products, quantity, selectedItem, editablePrice, isPriceValid, updateQuantity, editableTiers]);

  const handleEndReached = useCallback(() => {
    // No cargar más páginas si estamos en modo búsqueda
    if (debouncedSearchText && debouncedSearchText.trim() !== '') {
      console.log("[CategoryProduct] In search mode, not loading more pages");
      return;
    }
    
    if (loadingMore || loading || !hasMore) return;

    const nextPage = page + 1;
    console.log("[CategoryProduct] Loading more, page:", nextPage);
    fetchProducts(nextPage, true);
  }, [debouncedSearchText, loadingMore, loading, hasMore, page, fetchProducts]);

  const renderItem = useCallback(({ item }: { item: ProductDiscount }) => (
    <ProductItem item={item} onPress={handleProductPress} />
  ), [handleProductPress]);

  const renderFooter = useCallback((props: any) => (
    selectedItem ? (
      <BottomSheetFooter {...props}>
        <View
          className='w-full px-4 pt-4 pb-2 bg-white'
          // onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        >
          <View className="w-full flex-row justify-between items-end">
            <Text className="font-[Poppins-Bold] text-black tracking-[-0.3px]">Total</Text>
            <Text className="text-2xl font-[Poppins-Bold] tracking-[-0.3px]">
              L. {new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(total)}
            </Text>
          </View>
          <TouchableOpacity
            className={`mt-4 rounded-full py-3 items-center justify-center h-[50px] ${!isPriceValid || quantity <= 0 ? 'bg-gray-300' : 'bg-primary'}`}
            onPress={handleAddToCart}
            disabled={!isPriceValid || quantity <= 0}
          >
            <Text className="text-white font-[Poppins-Bold] tracking-[-0.3px]">Agregar al carrito</Text>
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
      {(!loading && filteredItems.length === 0 && !error) ? (
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="text-gray-600">
            {debouncedSearchText ? 'No se encontraron productos para tu búsqueda' : 'No se encontraron productos'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.itemCode}
          estimatedItemSize={100}
          numColumns={1}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#000" />
              </View>
            ) : !hasMore && filteredItems.length > 0 ? (
              <View className="py-4 items-center">
                <Text className="text-gray-500 text-sm">No hay más productos</Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingHorizontal: 8 }}
          drawDistance={500}
          refreshing={loading && !loadingMore}
          onRefresh={onRefresh}
        />
      )}

      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior="close"
          />
        )}
        footerComponent={renderFooter}
        enableDynamicSizing={false}
        snapPoints={['85%', '100%']}
      >
        <BottomSheetScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: footerHeight + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {selectedItem && (
            <View>
              <View className="w-full h-[230px] items-center justify-center bg-white overflow-hidden">
                <Image
                  source={{ uri: "https://pub-51a1583fe6c247528ea6255ea10c9541.r2.dev/BlurImage.png" }}
                  style={{ height: 230, width: 230, aspectRatio: 1, objectFit: "contain" }}
                />
              </View>

              <View className="px-[16px]">
                <Text className="text-[18px] font-[Poppins-Bold] tracking-[-0.3px] text-gray-900">
                  {selectedItem.itemName}
                </Text>

                <View className="flex-1 flex-row w-full h-fit justify-between gap-2 mt-1">
                  <View className="bg-gray-200 py-2 px-3 w-fit rounded-full">
                    <Text className="font-[Poppins-Regular] text-[12px] leading-3 tracking-[-0.3px] text-gray-700">
                      {selectedItem.barCode}
                    </Text>
                  </View>

                  <View className="bg-gray-200 py-2 px-3 w-fit rounded-full">
                    <Text className="font-[Poppins-Regular] text-[12px] leading-3 tracking-[-0.3px] text-gray-700">
                      {selectedItem.salesUnit} x {selectedItem.salesItemsPerUnit}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start justify-between">
                  <View className="bg-white py-4 rounded-lg">
                    <View className='items-start justify-between flex-row'>
                      <View>
                        <Text className="font-[Poppins-SemiBold] text-base tracking-[-0.3px] text-gray-800 leading-3">
                          Precio de Venta:
                        </Text>

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
                      </View>

                      <View className="flex-row items-center">
                        <TouchableOpacity
                          className="bg-gray-200 rounded-full p-2"
                          onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                        >
                          <MinusIcon size={20} />
                        </TouchableOpacity>
                        <TextInput
                          value={quantity.toString()}
                          onChangeText={handleQuantityChange}
                          keyboardType="numeric"
                          className="mx-4 text-center text-lg text-black w-12"
                        />
                        <TouchableOpacity
                          className="bg-gray-200 rounded-full p-2"
                          onPress={() => setQuantity((q) => q + 1)}
                        >
                          <PlusIcon size={20} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className='flex-row items-center justify-between mt-1 w-full'>
                      <Text className="text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">
                        Precio base original: L.{selectedItem.price.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>

                      <View className="bg-gray-200 py-1 px-3 rounded-full w-[60px] items-center justify-center">
                        <Text className="font-[Poppins-Regular] text-[12px] tracking-[-0.3px] text-gray-700">
                          {selectedItem.taxType}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {!isPriceValid && (
                  <Text className="text-red-600 text-xs font-[Poppins-Regular] tracking-[-0.3px]">
                    El precio no puede ser menor al mínimo permitido.
                  </Text>
                )}

                {editableTiers && editableTiers.length > 0 && (
                  <View
                    className={`bg-gray-100 py-2 px-3 rounded-2xl ${!applyTierDiscounts && 'opacity-50'}`}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setApplyTierDiscounts((prev) => {
                          const newValue = !prev;
                          if (newValue) {
                            setIsPriceManuallyEdited(false);
                          }
                          return newValue;
                        });
                      }}
                      className="flex-row justify-between items-center mb-3"
                    >
                      <Text className="font-[Poppins-Bold] text-base tracking-[-0.3px] text-gray-800">
                        Precios por Cantidad:
                      </Text>
                      <Text className="font-[Poppins-SemiBold] text-blue-500">
                        {applyTierDiscounts ? 'Desactivar' : 'Activar'}
                      </Text>
                    </TouchableOpacity>
                    {editableTiers.map((tier, index) => {
                      return (
                        <View key={index} className="mb-2">
                          <View className="flex-row items-center justify-between">
                            <View className="items-start">
                              <Text className="font-[Poppins-SemiBold] text-sm tracking-[-0.3px] text-gray-700">
                                Desde {tier.qty} unidades:
                              </Text>
                              {tier.percent > 0 && (
                                <Text className="text-green-600 text-xs">({tier.percent}% desc)</Text>
                              )}
                            </View>
                            <View className="flex-row items-center">
                              <Text className="font-[Poppins-Bold] text-base text-black mr-1">L.</Text>
                              <Text className="font-[Poppins-Bold] text-base text-black">
                                {tier.price.toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
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
    </View >
  );
});

CategoryProductScreen.displayName = 'CategoryProductScreen';

export default CategoryProductScreen;