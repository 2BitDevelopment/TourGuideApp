import { Colours } from '@/constants/Colours';
import { useImageLoading } from '@/hooks/useImageLoading';
import { MaterialIcons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { Link } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, BackHandler, Dimensions, LayoutChangeEvent, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { CookieConsent } from '../components/CookieConsent';
import { ImageModal } from '../components/ImageModal';
import { OrientationLock } from '../components/OrientationLock';
import { POIImage } from '../components/POIImage';
import { useSessionTracking } from '../hooks/useSessionTracking';
import DatabaseApi, { POI } from '../services/DatabaseApi';
import { Analytics } from '../util/Analytics';


const fallbackImg = require('../assets/images/react-logo.png');
const floorplanAsset = Asset.fromModule(require('../assets/images/cathedral-floor.svg'));

const SVG_WIDTH = 573;
const SVG_HEIGHT = 748;

const MapPage = () => {
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });
  const screenHeight = Dimensions.get('window').height;
  const [sheetId, setSheetId] = useState<number | null>(1);
  const sheetTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

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
  
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>('');
  const [showCookieConsent, setShowCookieConsent] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Session tracking hook - returns updateActivity function
  const updateActivity = useSessionTracking('MapPage');

  const onMapLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMapSize({ width, height });
  };

  // Map pan and zoom gesture handling
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
      updateActivity();

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

        if (initialDistance.current === 0) {
          initialDistance.current = distance;
          initialScale.current = lastScale.current;
        }

        const scaleRatio = distance / initialDistance.current;
        const newScale = Math.max(0.5, Math.min(4, initialScale.current * scaleRatio));
        scale.setValue(newScale);
      } else {
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

      pan.addListener((value) => {
        lastPan.current = value;
      });

      scale.addListener((value) => {
        lastScale.current = value.value;
      });

      initialDistance.current = 0;
      initialScale.current = 1;
    },
  });

  // Sheet gesture handling for swipe up/down
  const handlePanResponder = PanResponder.create({
    onStartShouldSetPanResponderCapture: (evt, gestureState) => {
      return isSheetVisible && sheetScrollY.current <= 0;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return isSheetVisible && sheetScrollY.current <= 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (isSheetVisible) {

        if (gestureState.dy > 0 && sheetScrollY.current <= 0) {

          if (evt && typeof evt.preventDefault === 'function') evt.preventDefault();
          sheetTranslateY.setValue(gestureState.dy);
        }
      } else {
        if (gestureState.dy < 0 && selectedMarker) {
          const dragUp = Math.abs(gestureState.dy);
          const maxDrag = screenHeight * 0.12;
          const progress = Math.min(dragUp / maxDrag, 1);
          sheetTranslateY.setValue(screenHeight - (screenHeight * 0.6 * progress));
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
            tension: 10,
            friction: 18,
          }).start();
        }
      } else {
        if (gestureState.dy < -10 && selectedMarker) {
          showSheet();
        } else {
          sheetTranslateY.setValue(screenHeight);
        }
      }
    },
  });

  // Show POI detail sheet
  const showSheet = () => {

    if (selectedMarker) {
      updateActivity();
    }

    setIsSheetVisible(true);
    Animated.timing(sheetTranslateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Hide POI detail sheet
  const hideSheet = () => {
    Animated.timing(sheetTranslateY, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsSheetVisible(false);
    });
    synthRef.current.cancel();
    setSpeaking(false);
  };


  // Get POI coordinates from Firebase data
  const getPOIMapCoordinates = (poi: POI) => {
    let x = poi.location.latitude;
    let y = poi.location.longitude;
    
    if (typeof x === 'string') x = parseFloat(x);
    if (typeof y === 'string') y = parseFloat(y);
    
    if (isNaN(x) || isNaN(y)) {
      console.warn(`Invalid coordinates for POI ${poi.id}: x=${poi.location.latitude}, y=${poi.location.longitude}`);
      return { x: 0.5, y: 0.5 };
    }
    
    return { x, y };
  };


  // Load POI data from Firebase
  const loadPOIsFromDatabase = async () => {
    if (loadingPOIs) return;

    setLoadingPOIs(true);
    try {
      const pois = await DatabaseApi.getAllPOIs();
      
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

  // Convert database POIs to map markers with SVG coordinate transformation
  const databaseMarkers = useMemo(() => {
    const scale = Math.min(mapSize.width / SVG_WIDTH, mapSize.height / SVG_HEIGHT);
    const offsetX = (mapSize.width - SVG_WIDTH * scale) / 2;
    const offsetY = (mapSize.height - SVG_HEIGHT * scale) / 2;

    const sortedPOIs = [...dbPOIs].sort((a, b) => a.id - b.id);

    return sortedPOIs.map((poi, index) => {
      const coords = getPOIMapCoordinates(poi);
      const imageUrl = imageUrls.get(poi.imageID);

      const svgX = coords.x * SVG_WIDTH;
      const svgY = coords.y * SVG_HEIGHT;
      const screenX = offsetX + svgX * scale;
      const screenY = offsetY + svgY * scale;

      return {
        id: index + 1,
        originalId: poi.id,
        x: screenX / mapSize.width,
        y: screenY / mapSize.height,
        title: poi.title,
        blurb: poi.text || poi.description,
        history: poi.description,
        image: imageUrl ? { uri: imageUrl } : fallbackImg,
        imageID: poi.imageID,
        isPOI: true,
        poiData: poi
      };
    });
  }, [dbPOIs, imageUrls, mapSize]);

  const allMarkers = useMemo(() => {
    return databaseMarkers;
  }, [databaseMarkers]);

  const selectedMarker = useMemo(() => allMarkers.find(m => m.id === sheetId) ?? null, [sheetId, allMarkers]);

  useEffect(() => {
    loadPOIsFromDatabase();
  }, []);

  useEffect(() => {
    if (dbPOIs.length > 0) {
      preloadPOIImages(dbPOIs);
    }
  }, [dbPOIs, preloadPOIImages]);


  useEffect(() => {
    const checkDataLoaded = () => {
      if (dbPOIs.length > 0 && !isLoadingImages && !loadingPOIs) {
        const hasImages = dbPOIs.some(poi => imageUrls.has(poi.imageID));
        if (hasImages || dbPOIs.length > 0) {
          setIsDataLoaded(true);
        }
      }
    };

    checkDataLoaded();
  }, [dbPOIs, isLoadingImages, loadingPOIs, imageUrls]);

  // Handle Android back button to close sheet
  useEffect(() => {
    const backAction = () => {
      if (isSheetVisible) {
        setIsSheetVisible(false);
        return true; 
      }
      return false; 
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isSheetVisible]);

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

  // Loading screen component
  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingTitle}>St. George's Cathedral</Text>
      <Text style={styles.loadingSubtitle}>Loading your virtual tour...</Text>
      <ActivityIndicator 
        size="large" 
        color={Colours.primaryColour} 
        style={styles.loadingSpinner}
      />
      <Text style={styles.loadingText}>Preparing points of interest</Text>
    </View>
  );
  if (!isDataLoaded) {
    return <LoadingScreen />;
  }

  // Text-to-speech functionality for POI items
  const handleSpeak = () => {
    if (!selectedMarker) return;

    const synth = synthRef.current;
    const textToSpeak = `${selectedMarker.title}. ${selectedMarker.blurb ? selectedMarker.blurb : ''
      }. ${selectedMarker.history ? `Historical Significance: ${selectedMarker.history}` : ''
      }.`.trim();

    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }

    synth.cancel();

    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    utter.lang = 'en-GB';

    const voices = synth.getVoices();
    utter.voice =
      voices.find(v => v.name.includes('Google UK English Male')) ||
      voices.find(v => v.name.includes('Google UK English Female')) ||
      voices.find(v => v.lang === 'en-GB') ||
      voices[0];

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    utterRef.current = utter;
    synth.speak(utter);
  };

  // Structure of page

  return (
    <OrientationLock>
      <View style={styles.container} {...handlePanResponder.panHandlers}>
      <View style={styles.header} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <TouchableOpacity style={styles.backButton}
          onPress={() => {
            synthRef.current.cancel();
            setSpeaking(false);
          }}>

          <Link href="/" style={styles.backButtonLink}>
            <MaterialIcons name="keyboard-arrow-left" size={18} color={Colours.primaryColour} style={{ textAlignVertical: 'center' }} />
            <Text style={styles.backButtonText}>Home</Text>
          </Link>
        </TouchableOpacity>
        <Text style={styles.brand}>St. George's{"\n"}Cathedral</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Link href={'/help' as any} style={styles.helpButtonLink}>
            <Text style={styles.helpButtonText}>?</Text>
          </Link>
        </TouchableOpacity>
      </View>

      {/* Map */}
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
                backgroundColor: Colours.primaryColour
              }]}
              onPress={() => {
                updateActivity();
                Analytics.trackPOIClick(m.originalId || m.id, m.title);
                setSheetId(m.id);
              }}
            >
              <Text style={styles.pinText}>{m.id}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>



      <View style={styles.bottomBanner}>
        <View
          style={styles.bannerTopBar}
          hitSlop={{ top: 14, bottom: 14, left: 24, right: 24 }}
          {...PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
              return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
              updateActivity();
            },
            onPanResponderMove: (_, gestureState) => {
              // If swiping up negative dy, move the sheet
              if (gestureState.dy < -20) {
                setIsSheetVisible(true);
                Animated.spring(sheetTranslateY, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 80,
                  friction: 12,
                }).start();
                
                if (selectedMarker) {
                  updateActivity();
                }
              }
            },
            onPanResponderRelease: () => {
             
            },
          }).panHandlers}
        >
          
            <View style={{ width: 48 }} />
            <TouchableOpacity 
              style={styles.bannerHandle}
              activeOpacity={0.7}
            />
            <View style={{ width: 48 }} />
        </View>
        <View style={styles.bannerContent}>
          {selectedMarker && (
            <>
              {selectedMarker.id >= 2 && selectedMarker.id <= 26 ? (
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => {
                    updateActivity();
                    synthRef.current.cancel();
                    setSpeaking(false);
                    const idx = allMarkers.findIndex(m => m.id === selectedMarker.id);
                    const prev = allMarkers[(idx - 1 + allMarkers.length) % allMarkers.length];
                    setSheetId(prev.id);
                  }}
                >
                  <MaterialIcons name="chevron-left" size={28} color={Colours.primaryColour} style={{ textAlignVertical: 'center' }} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 44 }} />
              )}

                <TouchableOpacity 
                  style={styles.bannerCenter}
                  activeOpacity={0.7}
                  {...PanResponder.create({
                    onStartShouldSetPanResponder: () => true,
                    onMoveShouldSetPanResponder: (_, gestureState) => {
                      return Math.abs(gestureState.dy) > 5;
                    },
                    onPanResponderGrant: () => {
                      updateActivity();
                    },
                    onPanResponderMove: (_, gestureState) => {
                      // If swiping up ,negative dy, move the sheet
                      if (gestureState.dy < -20) {
                        setIsSheetVisible(true);
                        Animated.spring(sheetTranslateY, {
                          toValue: 0,
                          useNativeDriver: true,
                          tension: 80,
                          friction: 12,
                        }).start();
                        
                        if (selectedMarker) {
                          updateActivity();
                        }
                      }
                    },
                    onPanResponderRelease: () => {
                      
                    },
                  }).panHandlers}
                >
                  <View style={styles.bannerIndex}>
                    <Text style={styles.bannerIndexText}>{selectedMarker.id}</Text>
                  </View>
                  <Text style={styles.bannerTitle}>{selectedMarker.title}</Text>
                </TouchableOpacity>

              {selectedMarker.id === 26 ? (
                <TouchableOpacity 
                  style={styles.endTourButton}
                  onPress={() => {
                    updateActivity();
                    window.location.href = '/ThankYou';
                  }}
                >
                  <Text style={styles.endTourButtonText}>End Tour</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={() => {
                    updateActivity();
                    const idx = allMarkers.findIndex(m => m.id === selectedMarker.id);
                    const next = allMarkers[(idx + 1) % allMarkers.length];
                    setSheetId(next.id);
                  }}
                >
                  <MaterialIcons name="chevron-right" size={28} color={Colours.primaryColour} style={{ textAlignVertical: 'center' }} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {selectedMarker && (
          <View style={styles.bannerFooter}>
            <View 
              style={styles.swipeUpButton}
              {...PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (_, gestureState) => {
                  return Math.abs(gestureState.dy) > 5;
                },
                onPanResponderGrant: () => {
                  updateActivity();
                },
                onPanResponderMove: (_, gestureState) => {
                  // If swiping up ,negative dy, move the sheet
                  if (gestureState.dy < -20) {
                    setIsSheetVisible(true);
                    Animated.spring(sheetTranslateY, {
                      toValue: 0,
                      useNativeDriver: true,
                      tension: 10,
                      friction: 18,
                    }).start();
                    
                    if (selectedMarker) {
                      updateActivity();
                    }
                  }
                },
                onPanResponderRelease: () => {
               
                },
              }).panHandlers}
            >
              <MaterialIcons name="keyboard-double-arrow-up" size={20} color={Colours.primaryColour} style={{ textAlignVertical: 'center' }} />
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
            hitSlop={{ top: 14, bottom: 14, left: 24, right: 24 }}
          >
            <TouchableOpacity
              style={styles.sheetBackButton}
              onPress={() => {
                updateActivity();
                synthRef.current.cancel();
                setSpeaking(false);
                hideSheet();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.sheetBackText}>
                <MaterialIcons name="keyboard-arrow-left" size={18} color={Colours.primaryColour} style={{ textAlignVertical: 'center' }} />
                Back
              </Text>
            </TouchableOpacity>
            <View style={styles.sheetTopHandle} />
            <View style={{ width: 80 }} />

          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              sheetScrollY.current = e.nativeEvent.contentOffset.y;
              // Track activity on scroll to show user is actively engaged
              updateActivity();
            }}
            overScrollMode={'never'}
          >
            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetIndex}>
                <Text style={styles.pinText}>{selectedMarker.id}</Text>
              </View>
              <Text style={styles.sheetTitle}>{selectedMarker.title}</Text>
            </View>
            
            <TouchableOpacity
              onPress={() => {
                if (selectedMarker.imageID) {
                  const imageUrl = imageUrls.get(selectedMarker.imageID);
                  if (imageUrl) {
                    setSelectedImageUri(imageUrl);
                    setSelectedImageTitle(selectedMarker.title);
                    setImageModalVisible(true);
                    
                    // Track user activity
                    updateActivity();
                  }
                }
              }}
              style={styles.imageContainer}
            >
              <POIImage 
                imageID={selectedMarker.imageID} 
                style={styles.sheetImage} 
                fallbackSource={fallbackImg}
                resizeMode="cover"
                onError={(error: any) => console.error('POI Image Error:', error)}
              />
              
              {/* Add inspect overlay */}
              <View style={styles.inspectOverlay}>
                <Text style={styles.inspectText}>Tap to inspect</Text>
              </View>
            </TouchableOpacity>
            
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
            {selectedMarker?.id >= 2 && selectedMarker?.id <= 26 ? (
              <TouchableOpacity
                style={styles.navPillPrev}
                onPress={() => {
                  updateActivity();
                  synthRef.current.cancel();
                  setSpeaking(false);
                  const idx = allMarkers.findIndex(m => m.id === selectedMarker?.id);
                  const prev = allMarkers[(idx - 1 + allMarkers.length) % allMarkers.length];
                  setSheetId(prev.id);
                }}
              >
                <Text style={styles.sheetBackText}>
                  <MaterialIcons name="keyboard-arrow-left" size={18} color={Colours.primaryColour} style={{ textAlignVertical: 'center' }} />
                  Previous
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 96 }} />
            )}

            <View style={styles.audioBackdrop}>
              <View style={styles.audioDock}>
                <TouchableOpacity
                  style={styles.audioCircle}
                  onPress={() => {
                    updateActivity();
                    handleSpeak();
                  }}
                  accessibilityRole="button"
                >
                  {speaking ?
                    <MaterialIcons name="pause" size={24} color={Colours.white} />
                    : <MaterialIcons name="play-arrow" size={24} color={Colours.white} />
                  }
                </TouchableOpacity>
                <Text style={styles.audioLabel}>Audio Guide</Text>
              </View>
            </View>

            {selectedMarker?.id === 26 ? (
              <TouchableOpacity
                style={styles.endTourPill}
                onPress={() => {
                  updateActivity();
                  synthRef.current.cancel();
                  setSpeaking(false);
                  // Navigate to Thank You page
                  window.location.href = '/ThankYou';
                }}
              >
                <Text style={styles.endTourPillText}>End Tour</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.navPillNext}
                onPress={() => {
                  updateActivity();
                  synthRef.current.cancel();
                  setSpeaking(false);
                  const idx = allMarkers.findIndex(m => m.id === selectedMarker?.id);
                  const next = allMarkers[(idx + 1) % allMarkers.length];
                  setSheetId(next.id);
                }}
              >
                <Text style={[styles.endTourPillText, styles.pillGhostText]}>
                  Next
                  <MaterialIcons name="keyboard-arrow-right" size={18} color={Colours.primaryColour} style={{ textAlignVertical: 'center' }} />
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
      
      {/* Image Inspection Modal */}
      <ImageModal
        visible={imageModalVisible}
        imageUri={selectedImageUri}
        title={selectedImageTitle}
        onClose={() => setImageModalVisible(false)}
      />
      
      {/* Cookie Consent Banner */}
      {showCookieConsent && <CookieConsent />}
    </View>
    </OrientationLock>
  );
};


// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.white,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: Colours.surfaceColour,
    borderBottomWidth: 1,
    borderBottomColor: Colours.primaryColour,
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    minWidth: 80,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingEnd: 8,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colours.white,
    borderWidth: 1,
    borderColor: Colours.primaryColour,
    shadowColor: Colours.primaryColour,
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
    color: Colours.primaryColour,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colours.primaryColour,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colours.primaryColour,
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
    color: Colours.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    lineHeight: 44,
    marginHorizontal: 10,
  },
  brand: {
    color: Colours.primaryColour,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay-Bold',
    letterSpacing: 0.5,
    flex: 1,
  },
  mapArea: {
    flex: 1,
    backgroundColor: Colours.white,
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
    backgroundColor: Colours.surfaceColour,
  },
  pin: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colours.white,
  },
  pinText: {
    color: Colours.white,
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
    backgroundColor: Colours.surfaceColour,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 0,
    shadowColor: Colours.primaryColour,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    zIndex: 1000,
    overscrollBehavior: 'contain',
  },
  sheetBackgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colours.white,
    zIndex: 999, 
  },
  sheetHandle: { 
    alignSelf: 'center', 
    width: 50, 
    height: 5, 
    borderRadius: 3, 
    backgroundColor: Colours.primaryColour, 
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
    width: 30,
    height: 6,
    borderRadius: 4,
    backgroundColor: Colours.primaryColour,
    marginTop: -30,
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
    backgroundColor: Colours.primaryColour,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colours.black,
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
    position: 'relative',
    marginBottom: 20,
  },
  inspectOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: Colours.black,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  inspectText: {
    color: Colours.white,
    fontSize: 11,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colours.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colours.black,
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colours.black,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 40,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colours.primaryColour,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  contentSection: {
    marginBottom: 20,
  },
  sheetBody: {
    fontSize: 16,
    color: Colours.black,
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colours.primaryColour,
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  churchFooter: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colours.surfaceVariantColour,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colours.primaryColour,
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: Colours.black,
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
    borderTopColor: Colours.surfaceVariantColour,
  },
  sheetBackButton: {
    alignSelf: 'flex-start',
    minWidth: 80,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingEnd: 8,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colours.white,
    borderWidth: 1,
    borderColor: Colours.primaryColour,
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  sheetBackText: {
    color: Colours.primaryColour,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  navPillPrev: {
    backgroundColor: Colours.white,
    borderWidth: 1,
    borderColor: Colours.primaryColour,
    paddingVertical: 10,
    paddingEnd: 8,
    borderRadius: 20,
    minWidth: 96,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navPillNext: {
    backgroundColor: Colours.white,
    borderWidth: 1,
    borderColor: Colours.primaryColour,
    paddingVertical: 10,
    paddingStart: 8,
    borderRadius: 20,
    minWidth: 96,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioBackdrop: {
    backgroundColor: Colours.surfaceVariantColour,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 0,
    alignSelf: 'center',
    shadowColor: Colours.primaryColour,
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
    backgroundColor: Colours.primaryColour,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  audioLabel: {
    marginTop: 6,
    color: Colours.primaryColour,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  navPill: {
    backgroundColor: Colours.white,
    borderWidth: 1,
    borderColor: Colours.primaryColour,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 96,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  endTourPill: {
    backgroundColor: Colours.primaryColour,
    borderWidth: 1,
    borderColor: Colours.primaryColour,
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 96,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  endTourPillText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    color: Colours.white,
  },
  pillGhost: { 
    backgroundColor: Colours.surfaceColour,
    borderWidth: 1,
    borderColor: Colours.surfaceVariantColour,
  },
  pillGhostText: { 
    color: Colours.primaryColour 
  },
  pillPrimary: { 
    backgroundColor: Colours.primaryColour,
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pillPrimaryText: { 
    color: Colours.white,
    fontWeight: '700',
  },
  bottomBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colours.surfaceColour,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  bannerHandle: {
    alignSelf: 'center',
    width: 30,
    height: 6,
    borderRadius: 4,
    backgroundColor: Colours.primaryColour,
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
    paddingHorizontal: 20,
  },
  bannerIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colours.primaryColour,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerIndexText: {
    color: Colours.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colours.black,
    fontFamily: 'Inter-Bold',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colours.white,
    borderWidth: 1,
    borderColor: Colours.primaryColour,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonText: {
    color: Colours.primaryColour,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  endTourButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: Colours.primaryColour,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  endTourButtonText: {
    color: Colours.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
  },
  bannerFooter: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  swipeUpButton: {
    backgroundColor: Colours.surfaceVariantColour,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 12,
    paddingTop: 8,
    paddingHorizontal: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  swipeUpText: {
    color: Colours.primaryColour,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default MapPage;
