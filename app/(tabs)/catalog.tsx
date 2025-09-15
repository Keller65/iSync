import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import { ProductDiscount } from '@/types/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import axios from 'axios';
import Checkbox from 'expo-checkbox';
import * as FileSystem from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, FadeOutUp } from 'react-native-reanimated';
import '../../global.css';

// Tipos para categorías y agrupación
type Category = {
  code: string | number;
  name: string;
};

type GroupedProducts = {
  [key: string]: {
    name: string;
    products: ProductDiscount[];
  };
};

// HTML de producto
function generateProductHtml(product: ProductDiscount) {
  return `
    <div style="text-align:center;padding:16px;margin-bottom:12px;">
      <img src="https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/${product.itemCode ?? '100000'}.jpg"
           alt="Producto" 
           style="width:150px;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px;">
      <div style="font-size:16px;font-weight:600;font-family:'Poppins-Medium',Arial,sans-serif;color:#333;">${product.itemName}</div>
      ${product.barCode ? `<div style="font-size:14px;color:#666;font-family:'Poppins-Regular',Arial,sans-serif;margin-top:4px;">${product.barCode}</div>` : ''}
      <div style="font-size:14px;font-family:'Poppins-Regular',Arial,sans-serif;color:#555;margin-top:4px;">${product.salesUnit} x ${product.salesItemsPerUnit}</div>
    </div>
  `;
}

// HTML de categoría
function generateCategoryHtml(categoryName: string, productsHtml: string) {
  return `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:20px;font-weight:700;font-family:'Poppins-Bold',Arial,sans-serif;color:#222;margin-bottom:16px;border-bottom:1px solid #ddd;padding-bottom:8px;">${categoryName}</h2>
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;">
        ${productsHtml}
      </div>
    </div>
  `;
}

// Agrupar productos por categoría
function groupProductsByCategory(products: ProductDiscount[], categories: Category[]): GroupedProducts {
  const grouped: GroupedProducts = {};

  categories.forEach((category) => {
    grouped[String(category.code)] = {
      name: category.name,
      products: [],
    };
  });

  products.forEach((product) => {
    if (product.groupCode !== undefined && grouped[String(product.groupCode)]) {
      grouped[String(product.groupCode)].products.push(product);
    } else {
      console.warn(`Producto sin categoría asignada: ${product.itemName}`);
    }
  });

  return grouped;
}

// Portada PDF
function generateCoverPage() {
  return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;background-color:#fff;height:100%;width:100%;font-weight:600;">
      <p style="font-size:40px;font-family:'Poppins',Arial,sans-serif;color:#000;margin-bottom:24px;text-align:center;">Catálogo de Productos</p>
      <img src="https://pub-377e394d2d944d18a81d9e364842d49d.r2.dev/iSync-ERP-blue.png" alt="Portada del catálogo" style="width:350px;height:auto;border-radius:12px;display:block;margin:0 auto;">
    </div>
  `;
}

const ProductScreen = () => {
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductDiscount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);

  // 🔹 Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${fetchUrl}/api/Catalog/products/categories`);
        setCategories(response.data?.categories ?? []); // ✅ fix
      } catch (error) {
        console.error('❌ Error al cargar las categorías', error);
        setCategories([]); // fallback vacío
      }
    };

    fetchCategories();
  }, [fetchUrl]);

  useEffect(() => {
    // Inicializar 'all' cuando se cargan las categorías
    if (categories.length > 0 && selectedCategories.length === 1 && selectedCategories[0] === 'all') {
      setSelectedCategories(['all', ...categories.map(c => String(c.code))]);
    }
  }, [categories]);

  // Generar PDF
  const handleGeneratePdf = async (htmlContent: string) => {
    try {
      const currentDate = new Date();
      const formattedDate = `${currentDate.toLocaleDateString().replace(/\//g, '-')}_${currentDate.toLocaleTimeString().replace(/:/g, '-')}`;
      const fileName = `Catalogo iSync ERP - ${formattedDate}.pdf`;

      const { uri } = await Print.printToFileAsync({
        html: `
          <html>
            <head>
              <meta charset="utf-8" />
              <style>
                body { font-family: Arial, sans-serif; padding: 16px; }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `,
      });

      const newUri = `${uri.substring(0, uri.lastIndexOf('/') + 1)}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: newUri });

      console.log('✅ PDF generado en:', newUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
    }
  };

  // Selección de categorías
  const handleCategorySelection = (categoryCode: string) => {
    setSelectedCategories(prev => {
      // Caso 1: Se selecciona "Todas las categorías"
      if (categoryCode === 'all') {
        return prev.includes('all') ? [] : ['all', ...categories.map(c => String(c.code))];
      }

      // Caso 2: Se selecciona una categoría individual
      const isSelected = prev.includes(categoryCode);
      let updatedCategories;
      if (isSelected) {
        // Eliminar la categoría y el 'all' si estaba
        updatedCategories = prev.filter(c => c !== categoryCode && c !== 'all');
      } else {
        // Añadir la categoría
        updatedCategories = [...prev, categoryCode];
      }

      // Comprobar si todas las categorías individuales están seleccionadas
      const allCategoriesSelected = categories.every(category => updatedCategories.includes(String(category.code)));
      if (allCategoriesSelected) {
        return ['all', ...updatedCategories];
      }

      return updatedCategories;
    });
  };

  const filteredCategories = categories.filter((category) =>
    selectedCategories.includes('all') || selectedCategories.includes(String(category.code))
  );

  // Generar catálogo
  const handleGenerateCatalog = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<{ products: ProductDiscount[] }>(
        `/api/Catalog/products/all?groupCode=2&priceList=1`,
        {
          baseURL: fetchUrl,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      const data = response.data?.products ?? []; 

      const isAllSelected = selectedCategories.includes('all');
      let products;
      if (!isAllSelected) {
        products = data.filter(product => selectedCategories.includes(String(product.groupCode)));
      } else {
        products = data;
      }
      
      setProducts(products);

      const groupedProducts = groupProductsByCategory(products, filteredCategories);

      const pdfContent = `
        ${generateCoverPage()}
        ${Object.keys(groupedProducts)
          .map((categoryCode) => {
            const category = groupedProducts[categoryCode];
            const productsHtml = category.products
              .map((product) =>
                generateProductHtml({
                  ...product,
                  itemCode: product?.itemCode !== undefined ? String(product.itemCode) : 'SIN-CÓDIGO',
                  itemName: product?.itemName ?? 'Sin nombre',
                })
              )
              .join('');
            return generateCategoryHtml(category.name, productsHtml);
          })
          .join('')}
      `;

      await handleGeneratePdf(pdfContent);

      bottomSheetRef.current?.close();
    } catch (error) {
      console.error('❌ Error al cargar los productos', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="bg-gray-50 flex-1">
      {/* Header Animation */}
      <View className="items-center bg-gray-50 h-16">
        <Animated.View
          entering={FadeOutUp.duration(400).delay(500)}
          exiting={FadeOutUp.duration(400)}
          key="precios"
          className="absolute"
        >
          <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.6px] text-gray-900">
            Facil, y Rapido
          </Text>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.duration(400).delay(800)}
          exiting={FadeOutDown.duration(400)}
          key="catalogo"
        >
          <Text className="text-2xl font-[Poppins-SemiBold] tracking-[-0.6px] text-gray-900">
            Generar Catálogo
          </Text>
        </Animated.View>
      </View>

      <View className="flex-1 bg-white rounded-t-[30px] p-4 z-1">
        <Text className="text-md text-gray-400 font-[Poppins-SemiBold] tracking-[-0.4px] mb-2">
          Exportar Catálogo
        </Text>
        <View className="w-full flex flex-row gap-4 items-center mb-10">
          <View className="h-[120px] w-[120px] bg-gray-100 rounded-3xl items-center justify-center">
            <ExpoImage
              source={require('@/assets/images/catalog.png')}
              style={{ height: '90%', width: '90%' }}
            />
          </View>

          <View className="flex-1 flex-col py-6 h-[120px] justify-between">
            <Text className="text-xl leading-6 text-black font-[Poppins-SemiBold] tracking-[-0.6px] mb-2">
              Catálogo de Productos
            </Text>

            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.present()}
              className="bg-primary py-2 px-4 rounded-full w-[110px] h-fit items-center justify-center"
            >
              <Text className="text-sm text-white font-[Poppins-SemiBold] tracking-[-0.4px]">
                Exportar PDF
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {products.length > 0 && (
          <ScrollView className="mb-4">
            <Text className="text-md text-gray-400 font-[Poppins-SemiBold] tracking-[-0.4px] mb-2">
              Productos Cargados
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {products.map((product) => (
                <View key={String(product.itemCode)} className="w-[48%] bg-gray-100 p-3 mb-4 rounded-xl items-center">
                  <ExpoImage
                    source={`https://pub-266f56f2e24d4d3b8e8abdb612029f2f.r2.dev/${product.itemCode}.jpg`}
                    style={{ width: 100, height: 100, borderRadius: 8 }}
                  />
                  <Text className="mt-2 text-center text-sm font-[Poppins-Medium] tracking-[-0.3px]">
                    {product.itemName}
                  </Text>
                  <Text className="mt-1 text-center text-xs text-gray-500">
                    {product.salesUnit}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <BottomSheetModal
        ref={bottomSheetRef}
        backgroundStyle={{ borderRadius: 30 }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetView className="flex-1 px-4 pb-6">
          <Text className="text-lg font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-900 mt-2 mb-3 text-center">
            ¿Deseas exportar el catálogo de productos en PDF?
          </Text>
          <Text className="text-sm text-gray-500 mb-5 text-center font-[Poppins-Regular] tracking-[-0.3px]">
            Se generará un archivo PDF con la lista de productos, incluyendo nombre, código, e imagen.
          </Text>

          <Text className="text-md font-[Poppins-SemiBold] tracking-[-0.3px] text-gray-900 mt-4 mb-2">
            Selecciona las categorías para el catálogo:
          </Text>

          <View
            className="h-fit w-fit px-3"
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
            onTouchEnd={() => handleCategorySelection('all')}
          >
            <Checkbox
              style={{ borderRadius: 6, borderColor: '#000' }}
              value={selectedCategories.includes('all')}
              onValueChange={() => handleCategorySelection('all')}
              color={selectedCategories.includes('all') ? '#1A3D59' : undefined}
            />
            <Text className="ml-2 leading-5 text-black tracking-[-0.3px] font-[Poppins-Regular] text-sm">
              Todas las categorías
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            style={{ maxHeight: 230, marginBottom: 16, flex: 1 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
          >
            {categories.map((category) => (
              <View
                className="h-fit w-[46%] px-3"
                key={String(category.code)}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                onTouchEnd={() => handleCategorySelection(String(category.code))}
              >
                <Checkbox
                  style={{ borderRadius: 6, borderColor: '#000' }}
                  value={selectedCategories.includes(String(category.code))}
                  onValueChange={() => handleCategorySelection(String(category.code))}
                  color={selectedCategories.includes(String(category.code)) ? '#1A3D59' : undefined}
                />
                <Text className="ml-2 text-black tracking-[-0.3px] font-[Poppins-Regular] text-sm">
                  {category.name}
                </Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            className="bg-primary py-3 h-[50px] flex-1 px-4 rounded-full items-center justify-center"
            onPress={handleGenerateCatalog}
            disabled={isLoading}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white text-md font-[Poppins-SemiBold] ml-2">
                  Generando Catálogo...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-3">
                <FontAwesome name="file-text" size={20} color="white" />
                <Text className="text-white text-md font-[Poppins-SemiBold]">
                  Generar Catálogo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-400 text-center mt-5 font-[Poppins-Regular] tracking-[-0.3px]">
            Este proceso puede tardar unos segundos dependiendo de la cantidad de productos y calidad de conexión a internet.
          </Text>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
};

export default ProductScreen;