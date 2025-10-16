import { Asset } from 'expo-asset';
import { Link } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, LayoutChangeEvent, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { POIImage } from '../components/POIImage';
import { useImageLoading } from '../hooks/useImageLoading';
import DatabaseApi, { POI } from '../services/DatabaseApi';

type Marker = {
  id: number;
  x: number; // percentage 0..1 across map area
  y: number; // percentage 0..1 down map area
  title: string;
  image?: any;
  imageID?: string; // Firebase storage image ID
  blurb?: string;
  history?: string;
  isPOI?: boolean; // Flag for database POIs
  poiData?: POI; // Store original POI data
};

// Fallback image for POIs without loaded images
const fallbackImg = require('../assets/images/react-logo.png');
const floorplanAsset = Asset.fromModule(require('../assets/images/cathedral-floor.svg'));

const MapPage = () => {
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });
  const screenHeight = Dimensions.get('window').height;

  // Bottom sheet selection (only opens when a POI is tapped)
  const [sheetId, setSheetId] = useState<number | null>(null);
  
  // Bottom sheet animation state
  const sheetTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  // Pan and zoom state
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current; // Start with 1x zoom (more zoomed out)
  const lastPan = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);

  // Database POIs state
  const [dbPOIs, setDbPOIs] = useState<POI[]>([]);
  const [loadingPOIs, setLoadingPOIs] = useState<boolean>(false);
  const [floorplanUri, setFloorplanUri] = useState<string | null>(
    floorplanAsset.localUri ?? floorplanAsset.uri ?? null
  );

  // Image loading hook
  const { imageUrls, preloadPOIImages, isLoading: isLoadingImages } = useImageLoading();

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
    },
  });

  // Sheet pan responder for drag-to-dismiss
  const sheetPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only work when swiping down
      return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onPanResponderMove: (evt, gestureState) => {
     
      if (gestureState.dy > 0) {
        sheetTranslateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      const threshold = screenHeight * 0.3; // 30% of screen height threshold
      
      if (gestureState.dy > threshold || gestureState.vy > 0.5) {
        // Dismiss sheet if dragged down enough or fast enough
        hideSheet();
      } else {
        // Snap back to original position
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    },
  });

  // Sheet animation 
  const showSheet = () => {
    setIsSheetVisible(true);
    Animated.timing(sheetTranslateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideSheet = () => {
    Animated.timing(sheetTranslateY, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsSheetVisible(false);
      setSheetId(null);
    });
  };

  // Reset zoom function
  const resetZoom = () => {
    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: 0, y: 0 },
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    lastPan.current = { x: 0, y: 0 };
    lastScale.current = 1;
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
      console.log('Loading POIs with images from database...');
      const pois = await DatabaseApi.getAllPOIsWithImages();
      console.log(`Loaded ${pois.length} POIs with images from database`);

      setDbPOIs(pois);

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
      const imageUrl = imageUrls.get(poi.imageID);
      return {
        id: parseInt(poi.id) || (1000 + index), // Use POI id if numeric, otherwise generate one
        x: coords.x,
        y: coords.y,
        title: poi.title,
        blurb: poi.text || poi.description,
        history: poi.description,
        image: imageUrl ? { uri: imageUrl } : fallbackImg,
        imageID: poi.imageID, // Store imageID for POIImage component
        isPOI: true, // Flag to distinguish from seed markers
        poiData: poi // Store original POI data
      };
    });
  }, [dbPOIs, imageUrls]);

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

  useEffect(() => {
    let isMounted = true;

    const ensureFloorplanReady = async () => {
      try {
        if (!floorplanAsset.localUri) {
          await floorplanAsset.downloadAsync();
        }

        if (isMounted) {
          setFloorplanUri(floorplanAsset.localUri ?? floorplanAsset.uri ?? null);
        }
      } catch (error) {
        console.error('Failed to load floorplan SVG asset:', error);
      }
    };

    if (!floorplanAsset.localUri) {
      ensureFloorplanReady();
    }

    return () => {
      isMounted = false;
    };
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
        <TouchableOpacity style={styles.backButton} onPress={() => {}}>
          <Link href="/" style={styles.backButtonLink}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Link>
        </TouchableOpacity>
        <Text style={styles.brand}>St. George's{"\n"}Cathedral</Text>
        <View style={styles.headerSpacer} />
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
          {floorplanUri ? (
            <SvgUri
              uri={floorplanUri}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              style={styles.floor}
              pointerEvents="none"
            />
          ) : (
            <View style={[styles.floor, styles.floorFallback]} pointerEvents="none" />
          )}

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
                showSheet();
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
          style={[styles.editButton, loadingPOIs || isLoadingImages ? styles.editOn : undefined]}
          onPress={loadPOIsFromDatabase}
          disabled={loadingPOIs || isLoadingImages}
        >
          <Text style={styles.editText}>
            {loadingPOIs ? 'Loading POIs...' : isLoadingImages ? 'Loading Images...' : `POIs (${dbPOIs.length})`}
          </Text>
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
      {isSheetVisible && selectedMarker && (
        <Animated.View 
          style={[
            styles.sheet,
            {
              transform: [{ translateY: sheetTranslateY }]
            }
          ]}
          {...sheetPanResponder.panHandlers}
        >
          <View style={styles.sheetHandle} />
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetIndex}>
                <Text style={styles.pinText}>{selectedMarker.id}</Text>
              </View>
              <Text style={styles.sheetTitle}>{selectedMarker.title}</Text>
            </View>
            
            <POIImage 
              imageID={selectedMarker.imageID} 
              style={styles.sheetImage} 
              fallbackSource={fallbackImg}
              resizeMode="cover"
              containerStyle={styles.imageContainer}
            />
            
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>About This Location</Text>
              <Text style={styles.sheetBody}>
                {selectedMarker.blurb || 'Discover the rich history and significance of this sacred space within St. George\'s Cathedral.'}
              </Text>
            </View>
            
            {selectedMarker.history && selectedMarker.history !== selectedMarker.blurb && (
              <View style={styles.contentSection}>
                <Text style={styles.sectionTitle}>Historical Significance</Text>
                <Text style={styles.sheetBody}>{selectedMarker.history}</Text>
              </View>
            )}
            
            <View style={styles.churchFooter}>
              <Text style={styles.footerText}>St. George's Cathedral</Text>
              <Text style={styles.footerSubtext}>The People's Cathedral</Text>
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={[styles.pillButton, styles.pillGhost]} onPress={hideSheet}>
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
                // Keep sheet open, just change content
              }}
            >
              <Text style={[styles.pillText, styles.pillGhostText]}>Next ›</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF8F7', // Warm, church-appropriate background
  },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 44, // Account for status bar
    paddingBottom: 16, 
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#FFDAD6',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  backButtonLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#8F000D',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  headerSpacer: {
    minWidth: 60,
    minHeight: 44,
  },
  brand: { 
    color: '#8F000D', 
    fontSize: 20, 
    fontWeight: '800', 
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay-Bold',
    letterSpacing: 0.5,
    flex: 1,
  },
  mapArea: { 
    flex: 1, 
    backgroundColor: '#FFF8F7', 
    position: 'relative', 
    overflow: 'hidden' 
  },
  mapContent: { 
    flex: 1, 
    width: '100%', 
    height: '100%' 
  },
  floor: { 
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9, // Slightly transparent for better contrast
  },
  floorFallback: {
    backgroundColor: '#f3f4f6',
  },
  editControls: { 
    position: 'absolute', 
    top: 16, 
    right: 16, 
    flexDirection: 'row', 
    gap: 8 
  },
  editButton: { 
    backgroundColor: 'rgba(143, 0, 13, 0.9)', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 20,
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  editOn: { 
    backgroundColor: '#8F000D' 
  },
  editText: { 
    color: 'white', 
    fontWeight: '600',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  zoomControls: { 
    position: 'absolute', 
    bottom: 24, 
    right: 16, 
    flexDirection: 'column', 
    gap: 12 
  },
  zoomButton: { 
    backgroundColor: 'rgba(143, 0, 13, 0.9)', 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#8F000D',
    shadowOpacity: 0.3, 
    shadowRadius: 6, 
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  zoomButtonText: { 
    color: 'white', 
    fontSize: 22, 
    fontWeight: '700' 
  },
  resetButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  pin: { 
    position: 'absolute', 
    width: 36, // Larger for better touch targets
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    transform: [{ translateX: -18 }, { translateY: -18 }],
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    // Better touch feedback
    minWidth: 44,
    minHeight: 44,
  },
  pinText: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 13,
    fontFamily: 'Inter-Bold',
  },
  sheet: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0, 
    top: '35%', 
    backgroundColor: 'white', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 20, 
    shadowColor: '#8F000D', 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    // Ensure smooth animations
    zIndex: 1000,
  },
  sheetHandle: { 
    alignSelf: 'center', 
    width: 50, 
    height: 5, 
    borderRadius: 3, 
    backgroundColor: '#8F000D', 
    marginBottom: 16,
    opacity: 0.6,
  },
  sheetHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  sheetIndex: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#8F000D', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12,
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sheetTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#111827', 
    marginBottom: 0,
    fontFamily: 'PlayfairDisplay-Bold',
    flex: 1,
  },
  sheetImage: { 
    width: '100%', 
    height: 220, 
    borderRadius: 16, 
    marginBottom: 20,
  },
  imageContainer: {
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  contentSection: {
    marginBottom: 20,
  },
  sheetBody: { 
    fontSize: 16, 
    color: '#374151', 
    lineHeight: 24, 
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#8F000D', 
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  churchFooter: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#FFDAD6',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8F000D',
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  sheetFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFDAD6',
  },
  pillButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 25,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pillText: { 
    fontSize: 14, 
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  pillGhost: { 
    backgroundColor: '#FFF8F7',
    borderWidth: 1,
    borderColor: '#FFDAD6',
  },
  pillGhostText: { 
    color: '#8F000D' 
  },
  pillPrimary: { 
    backgroundColor: '#8F000D',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pillPrimaryText: { 
    color: 'white',
    fontWeight: '700',
  },
});

export default MapPage;
