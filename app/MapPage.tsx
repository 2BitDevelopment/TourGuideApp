import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Image, LayoutChangeEvent, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DatabaseApi, { POI } from '../services/DatabaseApi';

type Marker = {
  id: number;
  x: number; // percentage 0..1 across map area
  y: number; // percentage 0..1 down map area
  title: string;
  image?: any;
  blurb?: string;
  history?: string;
  isPOI?: boolean; // Flag for database POIs
  poiData?: POI; // Store original POI data
};

// Fallback image for POIs without loaded images
const fallbackImg = require('../assets/images/react-logo.png');

const MapPage = () => {
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });

  // Bottom sheet selection (only opens when a POI is tapped)
  const [sheetId, setSheetId] = useState<number | null>(null);

  // Pan and zoom state
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(2)).current; // Start with 2x zoom
  const lastPan = useRef({ x: 0, y: 0 });
  const lastScale = useRef(2);


  

  
  // Database POIs state
  const [dbPOIs, setDbPOIs] = useState<POI[]>([]);
  const [loadingPOIs, setLoadingPOIs] = useState<boolean>(false);
  const [poiImages, setPOIImages] = useState<Map<string, string>>(new Map());



  const onMapLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMapSize({ width, height });
  };



  // Pan responder for handling pan and zoom gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      // Only start pan responder if not tapping on a marker
      return evt.nativeEvent.touches.length <= 2;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Start pan if moved more than 10 pixels or if pinching
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10 || evt.nativeEvent.touches.length === 2;
    },
    onPanResponderGrant: () => {
      // Store the current pan and scale values
      pan.setOffset({
        x: lastPan.current.x,
        y: lastPan.current.y,
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: (evt, gestureState) => {
      // Handle pinch-to-zoom if there are multiple touches
      if (evt.nativeEvent.touches.length === 2) {
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) + 
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        
        // Simple pinch-to-zoom implementation
        const normalizedDistance = distance / 200; // Normalize distance
        const newScale = Math.max(0.5, Math.min(4, lastScale.current * normalizedDistance / 2));
        scale.setValue(newScale);
      } else {
        // Single touch - pan
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(evt, gestureState);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();
      
      // Clean up listeners to prevent memory leaks
      pan.removeAllListeners();
      scale.removeAllListeners();
      
      // Update stored values
      pan.addListener((value) => {
        lastPan.current = value;
      });
      
      scale.addListener((value) => {
        lastScale.current = value.value;
      });

      // Tap handling removed - no user position to update
    },
  });

  // Reset zoom function
  const resetZoom = () => {
    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: 0, y: 0 },
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(scale, {
        toValue: 2,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
    
    lastPan.current = { x: 0, y: 0 };
    lastScale.current = 2;
  };

  // Zoom in function
  const zoomIn = () => {
    const newScale = Math.min(4, lastScale.current * 1.5);
    Animated.timing(scale, {
      toValue: newScale,
      duration: 200,
      useNativeDriver: false,
    }).start();
    lastScale.current = newScale;
  };

  // Zoom out function
  const zoomOut = () => {
    const newScale = Math.max(0.5, lastScale.current / 1.5);
    Animated.timing(scale, {
      toValue: newScale,
      duration: 200,
      useNativeDriver: false,
    }).start();
    lastScale.current = newScale;
  };

  // Convert latitude/longitude to x/y percentage coordinates for the map
  const convertLocationToMapCoords = (lat: number, lon: number) => {
    // Map bounds for St. George's Cathedral area (adjust these based on your actual map)
    const northWest = { lat: 0, lon: 0 };
    const southEast = { lat: 100, lon: 100 };

    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const x = clamp((lon - northWest.lon) / (southEast.lon - northWest.lon));
    const y = clamp((lat - northWest.lat) / (southEast.lat - northWest.lat));

    return { x, y };
  };

  // Load POIs from database
  const loadPOIsFromDatabase = async () => {
    if (loadingPOIs) return;
    
    setLoadingPOIs(true);
    try {
      console.log('Loading POIs from database...');
      const pois = await DatabaseApi.getAllPOIs();
      console.log(`Loaded ${pois.length} POIs from database`);
      
      setDbPOIs(pois);
      
      // Load images for each POI
      //TODO
      // for (const poi of pois) {
      //   if (poi.imageID) {
      //     try {
      //       const imageUrl = await DatabaseApi.loadImage(poi.imageID);
      //       if (imageUrl) {
      //         setPOIImages(prev => new Map(prev.set(poi.id, imageUrl)));
      //       }
      //     } catch (error) {
      //       console.error(`Failed to load image for POI ${poi.id}:`, error);
      //     }
      //   }
      // }
      
    } catch (error) {
      console.error('Failed to load POIs:', error);
      Alert.alert(
        'Error Loading POIs', 
        'Failed to load points of interest from the database. Please check your connection and try again.'
      );
    } finally {
      setLoadingPOIs(false);
    }
  };

  // Convert database POIs to map markers
  const databaseMarkers = useMemo(() => {
    return dbPOIs.map((poi, index) => {
      const coords = convertLocationToMapCoords(poi.location.latitude, poi.location.longitude);
      return {
        id: parseInt(poi.id) || (1000 + index), // Use POI id if numeric, otherwise generate one
        x: coords.x,
        y: coords.y,
        title: poi.title,
        blurb: poi.text || poi.description,
        history: poi.description,
        image: poiImages.get(poi.id) ? { uri: poiImages.get(poi.id) } : fallbackImg,
        isPOI: true, // Flag to distinguish from seed markers
        poiData: poi // Store original POI data
      };
    });
  }, [dbPOIs, poiImages]);

  // Use only database markers
  const allMarkers = useMemo(() => {
    return databaseMarkers;
  }, [databaseMarkers]);

  // Selected marker for bottom sheet
  const selectedMarker = useMemo(() => allMarkers.find(m => m.id === sheetId) ?? null, [sheetId, allMarkers]);



  // Load POIs from database on component mount
  useEffect(() => {
    loadPOIsFromDatabase();
  }, []);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      pan.removeAllListeners();
      scale.removeAllListeners();
    };
  }, []);



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>St. George's{"\n"}Cathedral</Text>
      </View>

      {/* Map with pan and zoom functionality */}
      <View
        style={styles.mapArea}
        onLayout={onMapLayout}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={[
            styles.mapContent,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { scale: scale },
              ],
            },
          ]}
        >
          {/* Floorplan background */}
          <Image
            source={require('../assets/images/cathedral-floor.svg')}
            style={styles.floor}
            resizeMode="contain"
          />

          {allMarkers.map(m => (
            <TouchableOpacity
              key={m.id}
              accessibilityRole="button"
              style={[styles.pin, {
                left: `${m.x * 100}%`,
                top: `${m.y * 100}%`,
                backgroundColor: '#991b1b'
              }]}
              onPress={() => {
                setSheetId(m.id);
              }}
            >
              <Text style={styles.pinText}>{m.id}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      {/* Database controls */}
      <View style={styles.editControls} pointerEvents="box-none">
        <TouchableOpacity 
          style={[styles.editButton, loadingPOIs ? styles.editOn : undefined]} 
          onPress={loadPOIsFromDatabase}
          disabled={loadingPOIs}
        >
          <Text style={styles.editText}>{loadingPOIs ? 'Loading...' : `POIs (${dbPOIs.length})`}</Text>
        </TouchableOpacity>
      </View>

      {/* Zoom controls */}
      <View 
        style={[
          styles.zoomControls, 
          selectedMarker && { bottom: '65%' } // Move up when bottom sheet is open
        ]} 
        pointerEvents="box-none"
      >
        <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={resetZoom}>
          <Text style={styles.resetButtonText}>⌂</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sheet only when a POI is selected */}
      {selectedMarker && (
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetIndex}>{selectedMarker.id}</Text>
              <Text style={styles.sheetTitle}>{selectedMarker.title}</Text>
            </View>
            <Image source={selectedMarker.image ?? fallbackImg} style={styles.sheetImage} resizeMode="cover" />
            <Text style={styles.sheetBody}>{selectedMarker.blurb}</Text>
            <Text style={styles.sectionTitle}>Historical Significance</Text>
            <Text style={styles.sheetBody}>{selectedMarker.history}</Text>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={[styles.pillButton, styles.pillGhost]} onPress={() => setSheetId(null)}>
              <Text style={[styles.pillText, styles.pillGhostText]}>‹ Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pillButton, styles.pillPrimary]}>
              <Text style={[styles.pillText, styles.pillPrimaryText]}>Audio Guide ▌▌</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pillButton, styles.pillGhost]}
              onPress={() => {
                const idx = allMarkers.findIndex(m => m.id === selectedMarker.id);
                const next = allMarkers[(idx + 1) % allMarkers.length];
                setSheetId(next.id);
              }}
            >
              <Text style={[styles.pillText, styles.pillGhostText]}>Next ›</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { alignItems: 'center', paddingTop: 16, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  brand: { color: '#b61f24', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  mapArea: { flex: 1, backgroundColor: '#f3f4f6', position: 'relative', overflow: 'hidden' },
  mapContent: { flex: 1, width: '100%', height: '100%' },
  floor: { ...StyleSheet.absoluteFillObject },
  editControls: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  editButton: { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  editOn: { backgroundColor: '#b61f24' },
  editText: { color: 'white', fontWeight: '700' },
  zoomControls: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'column', gap: 8 },
  zoomButton: { backgroundColor: 'rgba(0,0,0,0.7)', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
  zoomButtonText: { color: 'white', fontSize: 20, fontWeight: '700' },
  resetButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  pin: { position: 'absolute', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', transform: [{ translateX: -14 }, { translateY: -14 }] },
  pinText: { color: 'white', fontWeight: '700', fontSize: 12 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '40%', backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
  sheetHandle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', marginBottom: 8 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sheetIndex: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#b61f24', color: 'white', textAlign: 'center', textAlignVertical: 'center', fontWeight: '700', marginRight: 8 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  sheetImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  sheetBody: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#b61f24', marginBottom: 6 },
  sheetFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  pillButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999 },
  pillText: { fontSize: 14, fontWeight: '700' },
  pillGhost: { backgroundColor: '#f3f4f6' },
  pillGhostText: { color: '#111827' },
  pillPrimary: { backgroundColor: '#b61f24' },
  pillPrimaryText: { color: 'white' },
});

export default MapPage;