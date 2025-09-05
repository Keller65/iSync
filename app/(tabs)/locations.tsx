import PlusIcon from '@/assets/icons/PlusIcon';
import BottomSheetClientDetails from '@/components/BottomSheetClientDetails/page';
import BottomSheetSearchClients, { BottomSheetSearchClientsHandle } from '@/components/BottomSheetSearchClients/page';
import { useAppStore } from '@/state';
import * as Location from 'expo-location';
import { useEffect, useRef, useState, useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

const LocationsScreen = () => {
  const { updateCustomerLocation, setUpdateCustomerLocation, selectedCustomerLocation } = useAppStore();
  const clearSelectedCustomerLocation = useAppStore((s) => s.clearSelectedCustomerLocation);
  const bottomSheetRef = useRef<BottomSheetSearchClientsHandle>(null);
  const mapRef = useRef<MapView | null>(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lon: number; display_name: string } | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  // 👉 Obtener ubicación del dispositivo
  useEffect(() => {
    const getDeviceLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permiso de ubicación denegado');
          const fallback = { latitude: 15.469768, longitude: -88.025361 };
          setDeviceLocation(fallback);
          setRegion({ ...fallback, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setDeviceLocation({ latitude, longitude });
        setRegion({ latitude, longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
      } catch (error) {
        console.error('Error al obtener la ubicación del dispositivo:', error);
        const fallback = { latitude: 15.469768, longitude: -88.025361 };
        setDeviceLocation(fallback);
        setRegion({ ...fallback, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
      }
    };

    getDeviceLocation();
  }, []);

  // 👉 Obtener detalles de un lugar (lat/lng)
  const handleSelectPlace = (place: any) => {
    if (!place) return;
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const newRegion: Region = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setSelectedPlace({ lat, lon, display_name: place.display_name });
    setRegion(newRegion);
    if (mapRef.current && (mapRef.current as any).animateToRegion) {
      (mapRef.current as any).animateToRegion(newRegion, 500);
    }
    setSuggestions([]);
  };

  // 👉 Capturar toque en el mapa
  const handleMapPress = (event: MapPressEvent) => {
    if (updateCustomerLocation.updateLocation) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setSelectedPlace(null);
      setUpdateCustomerLocation({ latitude, longitude });
      console.log("Nueva ubicación seleccionada:", { latitude, longitude });
    }
  };

  // 👉 Animación de pulso (punto verde)
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePlaceSelect = async (place: any) => {
    try {
      if (!place.placeId) {
        console.warn('No se encontró un placeId en el lugar seleccionado.');
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.placeId}&key=AIzaSyAjUmggc5C_bvkHjsAT_o3Y_uOVwqIjwX4`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.result && data.result.geometry && data.result.geometry.location) {
        const { lat, lng } = data.result.geometry.location;
        handleSelectPlace({ lat, lon: lng, display_name: place.structuredFormat.mainText.text });
      } else {
        console.warn('No se encontraron coordenadas para el lugar seleccionado.');
      }
    } catch (error) {
      console.error('Error al obtener detalles del lugar:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Lógica que se ejecuta cuando la pantalla está en foco
      return () => {
        // Lógica que se ejecuta cuando se pierde el foco o se desmonta el componente
        console.log("Locations Screen unfocused or unmounted, resetting updateCustomerLocation.");
        clearSelectedCustomerLocation();
        if (selectedCustomerLocation) {
          selectedCustomerLocation.cardCode = '';
          selectedCustomerLocation.cardName = '';
          selectedCustomerLocation.federalTaxID = '';
          selectedCustomerLocation.priceListNum = '';
        }
        setUpdateCustomerLocation({
          updateLocation: false,
          latitude: null,
          longitude: null,
          addressName: null,
          rowNum: null,
        });
        setSelectedPlace(null);
        setSuggestions([]);
        setRegion(null);
      };
    }, [])
  );

  return (
    <View className="flex-1 bg-white relative">
      <View className="z-20">
        <View className="bg-white px-4 pb-4 gap-2">
          <View className="flex-row gap-2">
            <GooglePlacesTextInput
              debounceDelay={250}
              apiKey="AIzaSyAjUmggc5C_bvkHjsAT_o3Y_uOVwqIjwX4"
              onPlaceSelect={handlePlaceSelect}
              placeHolderText='Buscar ciudad, país...'
              showClearButton={false}
              value={query}
              style={{
                placeholder: {
                  color: '#9ca3af',
                },
                container: {
                  flex: 1,
                },
                suggestionsContainer: {
                  backgroundColor: '#fff',
                  padding: 0,
                },
                suggestionsList: {
                  maxHeight: 200,
                  borderRadius: 16,
                  overflow: 'hidden',
                },
                suggestionText: {
                  main: {
                    fontFamily: 'Poppins-Medium',
                    letterSpacing: -0.3,
                    color: '#222',
                    fontSize: 14,
                    marginBottom: -6,
                  },
                  secondary: {
                    fontFamily: 'Poppins-Medium',
                    letterSpacing: -0.3,
                    color: '#6b7280',
                    fontSize: 12,
                  },
                },
                input: {
                  backgroundColor: '#e5e7eb',
                  fontFamily: 'Poppins-Medium',
                  letterSpacing: -0.3,
                  borderWidth: 0,
                  borderRadius: 16,
                  height: 48,
                  lineHeight: 10,
                }
              }}
            />

            <TouchableOpacity
              className="h-[46px] w-[46px] items-center justify-center rounded-2xl bg-yellow-300"
              onPress={() => bottomSheetRef.current?.present()}
            >
              <PlusIcon color="black" />
            </TouchableOpacity>
          </View>

          {updateCustomerLocation.updateLocation && (
            <View className='flex-row items-center gap-2'>
              <View className='relative items-center justify-center'>
                <Animated.View
                  entering={FadeIn}
                  style={[
                    {
                      height: 16,
                      width: 16,
                      borderRadius: 10,
                      backgroundColor: '#86efac',
                      position: 'absolute',
                    },
                    animatedStyle,
                  ]}
                />
                <Animated.View
                  style={[
                    {
                      height: 10,
                      width: 10,
                      borderRadius: 5,
                      backgroundColor: '#4ade80',
                    },
                  ]}
                />
              </View>
              <Text className="text-green-500 text-xs font-[Poppins-SemiBold] tracking-[-0.3px]">
                Busca, o Tocá en el mapa para actualizar la ubicación
              </Text>
            </View>
          )}
        </View>

        {suggestions.length > 0 && (
          <View className="bg-white shadow-lg max-h-56">
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id?.toString() || item.osm_id?.toString() || item.lat}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="px-3 py-2 border-b border-gray-100"
                  onPress={() => handleSelectPlace(item)}
                >
                  <Text className="text-sm font-[Poppins-Medium] tracking-[-0.3px] text-gray-800">
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      <MapView
        ref={(r) => { mapRef.current = r; }}
        provider={PROVIDER_GOOGLE}
        initialRegion={region ?? undefined}
        region={region ?? undefined}
        style={styles.map}
        zoomControlEnabled={true}
        onPress={handleMapPress}
      >
        {/* Ubicación buscada → marcador verde */}
        {selectedPlace && !updateCustomerLocation.updateLocation && (
          <Marker
            coordinate={{ latitude: selectedPlace.lat, longitude: selectedPlace.lon }}
            title={selectedPlace.display_name}
            pinColor="green"
          />
        )}

        {/* Ubicación resaltada → marcador rojo */}
        {updateCustomerLocation &&
          typeof updateCustomerLocation.latitude === 'number' &&
          typeof updateCustomerLocation.longitude === 'number' && (
            <Marker
              coordinate={{ latitude: updateCustomerLocation.latitude, longitude: updateCustomerLocation.longitude }}
              title="Ubicación del Cliente"
              pinColor="red"
            />
          )}

        {/* Ubicación actual del dispositivo → marcador azul */}
        {deviceLocation && (
          <Marker
            coordinate={deviceLocation}
            title="Mi ubicación"
            description="Esta es tu ubicación actual"
            pinColor="blue"
            identifier="current-location"
          />
        )}
      </MapView>

      <BottomSheetClientDetails mapRef={mapRef} />
      <BottomSheetSearchClients ref={bottomSheetRef} />
    </View>
  );
};

export default LocationsScreen;

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
});
