import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import slugify from 'slugify';
import CategoryProductScreen from './(top-tabs)/category-product-list';
import BottomSheetConsignment from '@/components/BottomSheetConsignment/page';
import axios from 'axios';

const Tab = createMaterialTopTabNavigator();

interface ProductCategory {
  code: string | number;
  name: string;
  slug: string;
}

export default function TopTabNavigatorLayout() {
  const { user } = useAuth();
  const { selectedCustomer } = useAppStore();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchUrl } = useAppStore();
  const productsInConsignment = useAppStore((s) => s.productsInConsignment);

  const priceListNum = selectedCustomer?.priceListNum?.toString() || '1';

  const headers = useMemo(() => ({
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip',
  }), [user?.token]); // Debería decir "gzip" si se comprimió

  const fetchCategories = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      setError('No se ha iniciado sesión o el token no está disponible.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      type ApiResponse = {
        categories: Array<{ code: number; name: string }>;
      };

      const response = await axios.get<ApiResponse>(
        '/api/Catalog/products/categories',
        {
          baseURL: fetchUrl,
          headers,
        }
      );

      console.log('categorias', response.data);

      if (!response.data || !Array.isArray(response.data.categories)) {
        throw new Error('La respuesta no contiene un arreglo válido de categorías.');
      }

      const formattedCategories: ProductCategory[] = response.data.categories
        .filter(category =>
          category && (typeof category.code === 'string' || typeof category.code === 'number') && category.name
        )
        .map(category => ({
          code: category.code,
          name: category.name,
          slug: slugify(category.name, { lower: true, strict: true }),
        }));

      setCategories(formattedCategories);

    } catch (err: any) {
      console.error('Error al obtener categorías:', err);
      if (err.response) {
        setError(`Error del servidor: ${err.response.status} - ${err.response.data?.message || 'Mensaje desconocido'}`);
      } else if (err.request) {
        setError('No se pudo conectar al servidor. Verifica tu conexión.');
      } else {
        setError(`Ocurrió un error inesperado: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [headers, user?.token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const tabScreens = useMemo(() => (
    categories.map((category) => (
      <Tab.Screen
        key={category.code}
        name={category.slug}
        component={CategoryProductScreen}
        options={{
          title: category.name.charAt(0).toUpperCase() + category.name.slice(1).toLowerCase(),
        }}
        initialParams={{
          groupName: category.name,
          groupCode: category.code,
          priceListNum: priceListNum,
        }}
      />
    ))
  ), [categories, priceListNum]);

  if (!user?.token) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.errorText}>No has iniciado sesión o tu sesión ha expirado.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.fullScreenCenter}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.subText}>Por favor, intenta de nuevo más tarde.</Text>
        <Button title="Reintentar" onPress={fetchCategories} />
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.emptyText}>No se encontraron categorías de productos.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <Tab.Navigator
        initialRouteName={categories[0]?.slug || 'todas'}
        screenOptions={{
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: 'gray',
          tabBarIndicatorStyle: {
            backgroundColor: '#000',
            height: 2
          },
          tabBarStyle: {
            backgroundColor: 'white',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0
          },
          tabBarLabelStyle: {
            fontSize: 12,
            width: 230,
            fontFamily: 'Poppins-SemiBold',
            letterSpacing: -0.3,
          },
          tabBarPressColor: 'transparent',
          tabBarScrollEnabled: true,
        }}
      >
        {tabScreens}
      </Tab.Navigator>

      {productsInConsignment.length > 0 && (
        <View className="absolute bottom-4 right-8 gap-3 items-end z-50">
          <BottomSheetConsignment />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Poppins-SemiBold',
  },
  subText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
});