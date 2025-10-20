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
  const [dbPOIs, setDbPOIs] = useState<POI[]>([]);
  const [loadingPOIs, setLoadingPOIs] = useState<boolean>(false);
  const [floorplanUri, setFloorplanUri] = useState<string | null>(
    floorplanAsset.localUri ?? floorplanAsset.uri ?? null
  );
  const { imageUrls, preloadPOIImages, isLoading: isLoadingImages } = useImageLoading();

  const onMapLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMapSize({ width, height });
  };

  // Pan responder for handling pan and zoom gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      return evt.nativeEvent.touches.length <= 2;
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
        
        const normalizedDistance = distance / 200;
        const newScale = Math.max(0.5, Math.min(4, lastScale.current * normalizedDistance / 2));
        scale.setValue(newScale);
      } else {
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(evt, gestureState);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();
      pan.removeAllListeners();
      scale.removeAllListeners();
      pan.addListener((value) => {
        lastPan.current = value;
      });
      
      scale.addListener((value) => {
        lastScale.current = value.value;
      });
    },
  });

  /* 
  So this method is for the poi pop up slide up and down functionality
  it is a pan responder that is used to drag the sheet up and down.
  How it works:  Touch starts, onMoveShouldSetPanResponder checks if it's a downward swipe
                 User drags, onPanResponderMove moves the sheet down by gestureState.dy pixels
                 User releases, onPanResponderRelease decides if dragged enough (pixels > 0) goes away or if dragged (pixels < 0) snaps back
  */
  const handlePanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (isSheetVisible) {
       
        if (gestureState.dy > 0) {
          sheetTranslateY.setValue(gestureState.dy);
        }
      } else {
        if (gestureState.dy < 0 && selectedMarker) {
          const dragUp = Math.abs(gestureState.dy);
          const maxDrag = screenHeight * 0.2;
          const progress = Math.min(dragUp / maxDrag, 1);
          sheetTranslateY.setValue(screenHeight - (screenHeight * 0.65 * progress));
        }
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (isSheetVisible) {
        const threshold = screenHeight * 0.2;
        if (gestureState.dy > threshold || gestureState.vy > 0.3) {
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
        if (gestureState.dy < -30 && selectedMarker) {
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

  const zoomIn = () => {
    const newScale = Math.min(4, lastScale.current * 1.5);
    Animated.timing(scale, {
      toValue: newScale,
      duration: 200,
      useNativeDriver: false,
    }).start();
    lastScale.current = newScale;
  };

  const zoomOut = () => {
    const newScale = Math.max(0.5, lastScale.current / 1.5);
    Animated.timing(scale, {
      toValue: newScale,
      duration: 200,
      useNativeDriver: false,
    }).start();
    lastScale.current = newScale;
  };

  /*
  This method is for the precise pixel coordinates for each POI based on the cathedral floor plan
  it is a record of the x and y coordinates for each POI.
  How it works: first we get all the poi ID's, which is 1-14 and then we define the coordinates for each poi based on where it is situated on the map 
                since we have a static map and not a geographical accurate map    
                then the coordinates are used as percentages between 0 and 1 to determine how far from the top and left edge of the map they should be positioned             
  */
  const getPOIMapCoordinates = (poiId: number) => {
  
    const poiCoordinates: Record<number, { x: number, y: number }> = {
      1: { x: 0.3, y: 0.4 },    
      2: { x: 0.7, y: 0.6 },     
      3: { x: 0.5, y: 0.8 }, 
      4: { x: 0.2, y: 0.7 },     
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
      <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => {}}>
            <Link href="/" style={styles.backButtonLink}>
              <Text style={styles.backButtonText}>‹ Back</Text>
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
      <TouchableOpacity
        style={styles.mapArea}
        onLayout={onMapLayout}
        onPress={() => {
          setSheetId(null);
          setIsSheetVisible(false);
        }}
        activeOpacity={1}
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
                // Track POI click analytics
                Analytics.trackPOIClick(m.originalId || m.id, m.title);
                
                setSheetId(m.id);
                showSheet();
                
                // Track POI view analytics when sheet opens
                Analytics.trackPOIView(m.originalId || m.id, m.title);
              }}
            >
              <Text style={styles.pinText}>{m.id}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </TouchableOpacity>

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
          { bottom: '15%' },
          isSheetVisible && { bottom: '65%' }
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

      {/* Bottom banner - always visible */}
      <View style={styles.bottomBanner}>
        <View style={styles.bannerHandle} {...handlePanResponder.panHandlers} />
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

      {/* Bottom sheet only when a POI is selected */}
      {isSheetVisible && selectedMarker && (
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: sheetTranslateY }]
            }
          ]}
        >
          <View style={styles.sheetHandle} {...handlePanResponder.panHandlers} />
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
            <TouchableOpacity style={[styles.pillButton, styles.pillGhost]} onPress={hideSheet}>
              <Text style={[styles.pillText, styles.pillGhostText]}>‹ Close</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pillButton, styles.pillPrimary]}
              onPress={() => {
                if (selectedMarker) {
                  Analytics.trackPOIInteraction(
                    selectedMarker.originalId || selectedMarker.id, 
                    selectedMarker.title, 
                    'audio_guide_clicked'
                  );
                }
              }}
            >
              <Text style={[styles.pillText, styles.pillPrimaryText]}>Audio Guide ▌▌</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pillButton, styles.pillGhost]}
              onPress={() => {
                const idx = allMarkers.findIndex(m => m.id === selectedMarker?.id);
                const next = allMarkers[(idx + 1) % allMarkers.length];
                
                if (selectedMarker) {
                  Analytics.trackPOIInteraction(
                    selectedMarker.originalId || selectedMarker.id, 
                    selectedMarker.title, 
                    'next_poi_clicked'
                  );
                }
                
                setSheetId(next.id);
                // Track the new POI view
                Analytics.trackPOIView(next.originalId || next.id, next.title);
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
    backgroundColor: '#FFFFFF', 
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
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay-Bold',
    letterSpacing: 0.5,
    flex: 1,
  },
  mapArea: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    position: 'relative', 
    overflow: 'hidden',
    paddingBottom: 100, 
  },
  mapContent: { 
    flex: 1, 
    width: '100%', 
    height: '100%' 
  },
  floor: { 
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9, 
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
    backgroundColor: '#FFDAD6', 
    borderWidth: 1,
    borderColor: '#8F000D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: '#8F000D',
    fontSize: 20,
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
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8F000D',
    minHeight: 36,
  },
  swipeUpIcon: {
    color: '#8F000D',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  swipeUpText: {
    color: '#8F000D',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
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
