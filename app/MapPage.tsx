import { Asset } from 'expo-asset';
import { Link } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, LayoutChangeEvent, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { POIImage } from '../components/POIImage';
import { useImageLoading } from '../hooks/useImageLoading';
import DatabaseApi, { POI } from '../services/DatabaseApi';
import { Analytics } from '../util/Analytics';

type Marker = {
  id: number;
  x: number;
  y: number;
  title: string;
  image?: any;
  imageID?: string;
  blurb?: string;
  history?: string;
  isPOI?: boolean;
  poiData?: POI;
};

const fallbackImg = require('../assets/images/react-logo.png');
const floorplanAsset = Asset.fromModule(require('../assets/images/cathedral-floor.svg'));

const MapPage = () => {
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });
  const screenHeight = Dimensions.get('window').height;
  const [sheetId, setSheetId] = useState<number | null>(1);
  const sheetTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastPan = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);
  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const [dbPOIs, setDbPOIs] = useState<POI[]>([]);
  const [loadingPOIs, setLoadingPOIs] = useState<boolean>(false);
  const [floorplanUri, setFloorplanUri] = useState<string | null>(
    floorplanAsset.localUri ?? floorplanAsset.uri ?? null
  );
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const { imageUrls, preloadPOIImages, isLoading: isLoadingImages } = useImageLoading();
  const sheetScrollY = useRef(0);

  const onMapLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMapSize({ width, height });
  };

  // Handles map pan and zoom gestures, single finger pan and two-finger pinch for zoom
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      return evt.nativeEvent.touches.length <= 2;
    },
    onStartShouldSetPanResponderCapture: (evt) => {
      return evt.nativeEvent.touches.length === 2;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10 || evt.nativeEvent.touches.length === 2;
    },
    onPanResponderGrant: () => {
      pan.setOffset({
        x: lastPan.current.x,
        y: lastPan.current.y,
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: (evt, gestureState) => {
      if (evt.nativeEvent.touches.length === 2) {
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) + 
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        
        // Initialize distance and scale on first pinch
        if (initialDistance.current === 0) {
          initialDistance.current = distance;
          initialScale.current = lastScale.current;
        }
        
        // Calculate scale based on distance change
        const scaleRatio = distance / initialDistance.current;
        const newScale = Math.max(0.5, Math.min(4, initialScale.current * scaleRatio));
        scale.setValue(newScale);
      } else {
        // Reset pinch tracking when not pinching
        initialDistance.current = 0;
        initialScale.current = 1;
        
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(evt, gestureState);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();
      pan.removeAllListeners();
      scale.removeAllListeners();
      
      // Update stored values
      pan.addListener((value) => {
        lastPan.current = value;
      });
      
      scale.addListener((value) => {
        lastScale.current = value.value;
      });

      // Reset pinch tracking
      initialDistance.current = 0;
      initialScale.current = 1;
    },
  });

  // Handles the bottom banner/sheet dragging - swipe up to open, swipe down to collapse
  const handlePanResponder = PanResponder.create({
    onStartShouldSetPanResponderCapture: (evt, gestureState) => {
      // When sheet is visible, aggressively capture vertical gestures to avoid browser pull to refresh
      return isSheetVisible;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 2;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (isSheetVisible) {
       
        // Only allow dragging the sheet if its internal scroll is at the very top
        if (gestureState.dy > 0 && sheetScrollY.current <= 0) {
          // Prevent browser default scrolling/pull-to-refresh on web
          // @ts-ignore
          if (evt && typeof evt.preventDefault === 'function') evt.preventDefault();
          sheetTranslateY.setValue(gestureState.dy);
        }
      } else {
        if (gestureState.dy < 0 && selectedMarker) {
          const dragUp = Math.abs(gestureState.dy);
          const maxDrag = screenHeight * 0.12; // reach open state with a shorter swipe
          const progress = Math.min(dragUp / maxDrag, 1);
          // Open to ~60% of screen height to leave a large gap at top
          sheetTranslateY.setValue(screenHeight - (screenHeight * 0.6 * progress));
        }
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (isSheetVisible) {
        const threshold = screenHeight * 0.1; // easier to close
        if (gestureState.dy > threshold || gestureState.vy > 0.15) {
          hideSheet();
        } else {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 6,
          }).start();
        }
      } else {
        if (gestureState.dy < -10 && selectedMarker) { // shorter swipe to open
          showSheet();
        } else {
          sheetTranslateY.setValue(screenHeight);
        }
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
    });
  };


  // Returns percentage coordinates for poi's (0-1 range, scales with map size)
  const getPOIMapCoordinates = (poiId: number) => {
    const poiCoordinates: Record<number, { x: number, y: number }> = {
      1: { x: 0.15, y: 0.25 },   // Entrance area
      2: { x: 0.35, y: 0.20 },   // Nave left side
      3: { x: 0.55, y: 0.15 },   // Nave center
      4: { x: 0.75, y: 0.25 },   // Nave right side
      5: { x: 0.85, y: 0.40 },   // Side chapel
      6: { x: 0.80, y: 0.60 },   // Altar area
      7: { x: 0.65, y: 0.70 },   // Choir area
      8: { x: 0.45, y: 0.75 },   // Center back
      9: { x: 0.25, y: 0.70 },   // Left side back
      10: { x: 0.10, y: 0.55 },  // Left side chapel
      11: { x: 0.20, y: 0.40 },  // Left nave
      12: { x: 0.40, y: 0.35 }, // Left center
      13: { x: 0.60, y: 0.45 }, // Center area
      14: { x: 0.70, y: 0.30 }, // Right center
      15: { x: 0.50, y: 0.60 }, // Center altar
      16: { x: 0.30, y: 0.55 }, // Left altar area
      17: { x: 0.90, y: 0.80 }, // Far right corner
      18: { x: 0.05, y: 0.30 }, // Far left entrance
      19: { x: 0.95, y: 0.35 }, // Far right side
      20: { x: 0.12, y: 0.65 }, // Left side middle
      21: { x: 0.88, y: 0.75 }, // Right side back
      22: { x: 0.18, y: 0.15 }, // Left front
      23: { x: 0.82, y: 0.20 }, // Right front
      24: { x: 0.48, y: 0.25 }, // Center front
      25: { x: 0.58, y: 0.80 }, // Center back
      26: { x: 0.38, y: 0.50 }, // Left center
      27: { x: 0.68, y: 0.50 }, // Right center
    };
    
    const coords = poiCoordinates[poiId] || { x: 0.5, y: 0.5 };
    return coords;
  };


  

  const loadPOIsFromDatabase = async () => {
    if (loadingPOIs) return;
    
    setLoadingPOIs(true);
    try {
      const pois = await DatabaseApi.getAllPOIsWithImages();
      
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
    const sortedPOIs = [...dbPOIs].sort((a, b) => a.id - b.id);
    
    return sortedPOIs.map((poi, index) => {
      const coords = getPOIMapCoordinates(poi.id); 
      const imageUrl = imageUrls.get(poi.imageID);
      
      return {
        id: index + 1, 
        originalId: poi.id, 
        x: coords.x,
        y: coords.y,
        title: poi.title,
        blurb: poi.text || poi.description,
        history: poi.description,
        image: imageUrl ? { uri: imageUrl } : fallbackImg,
        imageID: poi.imageID,
        isPOI: true,
        poiData: poi
      };
    });
  }, [dbPOIs, imageUrls]);

  const allMarkers = useMemo(() => {
    return databaseMarkers;
  }, [databaseMarkers]);

  const selectedMarker = useMemo(() => allMarkers.find(m => m.id === sheetId) ?? null, [sheetId, allMarkers]);

  useEffect(() => {
    loadPOIsFromDatabase();
    // Track map page view
    Analytics.trackMapView();
    Analytics.trackPageView('MapPage');
  }, []);

  useEffect(() => {
    if (dbPOIs.length > 0) {
      preloadPOIImages(dbPOIs);
    }
  }, [dbPOIs, preloadPOIImages]);

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

  useEffect(() => {
    return () => {
      pan.removeAllListeners();
      scale.removeAllListeners();
    };
  }, []);



  return (
    <View style={styles.container}>
      <View style={styles.header} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <TouchableOpacity style={styles.backButton} onPress={() => {}}>
            <Link href="/" style={styles.backButtonLink}>
              <Text style={styles.backButtonText}>{'‹ Home'}</Text>
            </Link>
          </TouchableOpacity>
        <Text style={styles.brand}>St. George's{"\n"}Cathedral</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Link href={'/help' as any} style={styles.helpButtonLink}>
              <Text style={styles.helpButtonText}>?</Text>
            </Link>
          </TouchableOpacity>
      </View>

      {/* Map with pan and zoom functionality */}
      <View
        style={[styles.mapArea, { touchAction: 'none' } as any]}
        onLayout={onMapLayout}
        // @ts-expect-error onWheel is web-only; prevents page zoom on trackpad pinch
        onWheel={(e) => {
          // prevent browser zoom/scroll on trackpad pinch
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
        }}
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
          {...panResponder.panHandlers}
        >
          
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
                backgroundColor: '#8F000D'
              }]}
              onPress={() => {
                // Track POI click analytics
                Analytics.trackPOIClick(m.originalId || m.id, m.title);
                
                setSheetId(m.id);
                // Do not auto open the sheet, it opens only on swipe up
              }}
            >
              <Text style={styles.pinText}>{m.id}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      {/* Database controls removed */}

      
      <View style={styles.bottomBanner}>
      <View 
          style={styles.bannerTopBar}
          {...handlePanResponder.panHandlers}
          hitSlop={{ top: 14, bottom: 14, left: 24, right: 24 }}
        >
          <View style={{ width: 48 }} />
          <View style={styles.bannerHandle} />
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.bannerContent}>
          {selectedMarker && (
            <>
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => {
                  const idx = allMarkers.findIndex(m => m.id === selectedMarker.id);
                  const prev = allMarkers[(idx - 1 + allMarkers.length) % allMarkers.length];
                  setSheetId(prev.id);
                }}
              >
                <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
              
              <View style={styles.bannerCenter}>
                <View style={styles.bannerIndex}>
                  <Text style={styles.bannerIndexText}>{selectedMarker.id}</Text>
                </View>
                <Text style={styles.bannerTitle}>{selectedMarker.title}</Text>
      </View>

              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => {
                  const idx = allMarkers.findIndex(m => m.id === selectedMarker.id);
                  const next = allMarkers[(idx + 1) % allMarkers.length];
                  setSheetId(next.id);
                }}
              >
                <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
            </>
          )}
        </View>
        
        {selectedMarker && (
          <View style={styles.bannerFooter}>
            <View style={styles.swipeUpButton}>
              <Text style={styles.swipeUpIcon}>^</Text>
              <Text style={styles.swipeUpText}>Swipe up for more information</Text>
            </View>
          </View>
        )}
      </View>

      
      {isSheetVisible && selectedMarker && (
        <Animated.View
          style={[
            styles.sheet,
            { top: 0 },
            { transform: [{ translateY: sheetTranslateY }] }
          ]}
        >
          <View 
            style={styles.sheetTopBar}
            {...handlePanResponder.panHandlers}
            hitSlop={{ top: 14, bottom: 14, left: 24, right: 24 }}
          >
            <TouchableOpacity
              style={styles.sheetBackButton}
              onPress={hideSheet}
              accessibilityRole="button"
            >
              <Text style={styles.sheetBackText}>‹ Back</Text>
            </TouchableOpacity>
            <View style={styles.sheetTopHandle} />
            <View style={{ width: 80 }} />
          </View>
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ paddingBottom: 16 }} 
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => { sheetScrollY.current = e.nativeEvent.contentOffset.y; }}
            overScrollMode={'never'}
          >
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
                onError={(error) => console.error('POI Image Error:', error)}
              />
            
            <View style={styles.contentSection}>
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
            <TouchableOpacity
              style={styles.navPill}
              onPress={() => {
                const idx = allMarkers.findIndex(m => m.id === selectedMarker?.id);
                const prev = allMarkers[(idx - 1 + allMarkers.length) % allMarkers.length];
                setSheetId(prev.id);
                Analytics.trackPOIView(prev.originalId || prev.id, prev.title);
              }}
            >
              <Text style={[styles.pillText, styles.pillGhostText]}>‹ Previous</Text>
            </TouchableOpacity>

            <View style={styles.audioBackdrop}>
              <View style={styles.audioDock}>
              <TouchableOpacity
                style={styles.audioCircle}
                onPress={() => {
                  if (selectedMarker) {
                    Analytics.trackPOIInteraction(
                      selectedMarker.originalId || selectedMarker.id,
                      selectedMarker.title,
                      'audio_guide_clicked'
                    );
                  }
                }}
                accessibilityRole="button"
              >
                <Text style={styles.audioIcon}>II</Text>
            </TouchableOpacity>
              <Text style={styles.audioLabel}>Audio Guide</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.navPill}
              onPress={() => {
                const idx = allMarkers.findIndex(m => m.id === selectedMarker?.id);
                const next = allMarkers[(idx + 1) % allMarkers.length];
                setSheetId(next.id);
                Analytics.trackPOIView(next.originalId || next.id, next.title);
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
    backgroundColor: '#FFFFFF', 
    overflow: 'hidden',
  },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20, 
    paddingBottom: 12, 
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
  // Standard navigation button style
  standardNavButton: {
    minWidth: 80,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8F000D',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  standardNavButtonText: {
    color: '#8F000D',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  backButton: {
    minWidth: 80,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8F000D',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#8F000D',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8F000D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  helpButtonLink: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    lineHeight: 44,
    marginHorizontal: 10,
  },
  brand: { 
    color: '#8F000D', 
    fontSize: 20, 
    fontWeight: '800', 
    textAlign: 'left',
    fontFamily: 'PlayfairDisplay-Bold',
    letterSpacing: 0.5,
    flex: 1,
    paddingLeft: 40,
  },
  mapArea: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    position: 'relative', 
    overflow: 'hidden',
    paddingBottom: 100, 
    width: '100%',
    height: '100%',
  },
  mapContent: { 
    flex: 1, 
    width: '100%', 
    height: '100%',
  },
  floor: { 
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9, 
  },
  floorFallback: {
    backgroundColor: '#f3f4f6',
  },
  
  pin: { 
    position: 'absolute', 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    transform: [{ translateX: -12 }, { translateY: -12 }],
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    top: 0, 
    backgroundColor: 'white', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 20, 
    shadowColor: '#8F000D', 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    zIndex: 1000,
    // Contain scroll to avoid parent/body overscroll, web only prop supported by rn-web
    overscrollBehavior: 'contain',
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
  sheetTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTopHandle: {
    width: 80,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8F000D',
    marginTop: 6,
    marginBottom: 8,
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
    fontSize: 22, 
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  contentSection: {
    marginBottom: 20,
  },
  sheetBody: { 
    fontSize: 14, 
    color: '#374151', 
    lineHeight: 24, 
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  sectionTitle: { 
    fontSize: 16, 
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
  sheetBackButton: {
    alignSelf: 'flex-start',
    minWidth: 80,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8F000D',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  sheetBackText: {
    color: '#8F000D',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  navPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8F000D',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 96,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioBackdrop: {
    backgroundColor: '#FFDAD6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    alignSelf: 'center',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioDock: {
    alignItems: 'center',
  },
  audioCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8F000D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  audioIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  audioLabel: {
    marginTop: 6,
    color: '#8F000D',
    fontFamily: 'Inter-Medium',
    fontSize: 12,
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
    textAlign: 'center',
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
  bottomBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  bannerHandle: {
    alignSelf: 'center',
    width: 80, 
    height: 8, 
    borderRadius: 4,
    backgroundColor: '#8F000D',
    marginTop: 6,
    marginBottom: 8,
  },
  bannerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 12,
  },
  bannerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  bannerIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8F000D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerIndexText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    fontFamily: 'Inter-Bold',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF', 
    borderWidth: 1,
    borderColor: '#8F000D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonText: {
    color: '#8F000D',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  bannerFooter: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  swipeUpButton: {
    backgroundColor: '#FFDAD6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  swipeUpIcon: {
    color: '#8F000D',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  swipeUpText: {
    color: '#8F000D',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  bannerDefaultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8F000D',
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  bannerDefaultSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default MapPage;
