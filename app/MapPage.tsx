import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, LayoutChangeEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Marker = {
  id: number;
  x: number; // percentage 0..1 across map area
  y: number; // percentage 0..1 down map area
  title: string;
  image?: any;
  blurb?: string;
  history?: string;
};

const lorem = 'The ornate wooden pulpit is where sermons are delivered during services. Crafted from rich mahogany, the pulpit features intricate carvings depicting biblical scenes and symbols.';
const hist = "From this pulpit, Archbishop Desmond Tutu and other religious leaders spoke out against apartheid. Many famous sermons advocating for justice and reconciliation were delivered here during South Africa's struggle for democracy.";

// Placeholder images (replace with real photos in assets/images/poi/)
const fallbackImg = require('../assets/images/react-logo.png');
const poiImages = {
  // Specific mappings provided
  northAisle: require('../assets/images/st_george_images/img_03.jpg'),
  northTransept: require('../assets/images/st_george_images/img_16.jpg'),
  southTransept: require('../assets/images/st_george_images/img_14.jpg'),
  platform: require('../assets/images/st_george_images/img_12.jpg'),

  // Reasonable defaults for the rest (can be updated anytime)
  link: require('../assets/images/st_george_images/img_01.jpg'),
  stJohnsChapel: require('../assets/images/st_george_images/img_10.jpg'),
  sanctuary: require('../assets/images/st_george_images/img_18.jpg'),
  stDavidsChapel: require('../assets/images/st_george_images/img_11.jpg'),
  southAisle: require('../assets/images/st_george_images/img_05.jpg'),
  ladyChapel: require('../assets/images/st_george_images/img_06.jpg'),
  bellTower: require('../assets/images/st_george_images/img_21.jpg'),
} as const;

const markersSeed: Marker[] = [
  { id: 1, x: 0.48, y: 0.72, title: 'The Link', blurb: lorem, history: hist, image: poiImages.link },
  { id: 2, x: 0.18, y: 0.52, title: 'North Aisle', blurb: lorem, history: hist, image: poiImages.northAisle },
  { id: 3, x: 0.36, y: 0.34, title: 'North Transept', blurb: lorem, history: hist, image: poiImages.northTransept },
  { id: 4, x: 0.70, y: 0.40, title: 'South Transept', blurb: lorem, history: hist, image: poiImages.southTransept },
  { id: 5, x: 0.52, y: 0.62, title: 'Platform', blurb: lorem, history: hist, image: poiImages.platform },
  { id: 6, x: 0.10, y: 0.70, title: "St John's Chapel", blurb: lorem, history: hist, image: poiImages.stJohnsChapel },
  { id: 7, x: 0.60, y: 0.18, title: 'Sanctuary', blurb: lorem, history: hist, image: poiImages.sanctuary },
  { id: 8, x: 0.20, y: 0.80, title: "St David's Chapel", blurb: lorem, history: hist, image: poiImages.stDavidsChapel },
  { id: 9, x: 0.82, y: 0.58, title: 'South Aisle', blurb: lorem, history: hist, image: poiImages.southAisle },
  { id: 10, x: 0.86, y: 0.88, title: 'Lady Chapel', blurb: lorem, history: hist, image: poiImages.ladyChapel },
  { id: 11, x: 0.12, y: 0.16, title: 'Bell Tower', blurb: lorem, history: hist, image: poiImages.bellTower },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MapPage = () => {
  // User position within map (percent coordinates 0..1)
  const [userPos, setUserPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });

  // Bottom sheet selection (only opens when a POI is tapped)
  const [markers, setMarkers] = useState<Marker[]>(markersSeed);
  const [sheetId, setSheetId] = useState<number | null>(null);
  const selectedMarker = useMemo(() => markers.find(m => m.id === sheetId) ?? null, [sheetId, markers]);

  // Edit mode for fine-tuning POI positions
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editableId, setEditableId] = useState<number | null>(null);

  // Determine nearest POI to user
  const nearestId = useMemo(() => {
    let bestId = markersSeed[0].id;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const m of markers) {
      const dx = userPos.x - m.x;
      const dy = userPos.y - m.y;
      const d = Math.hypot(dx, dy);
      if (d < bestDist) {
        bestDist = d;
        bestId = m.id;
      }
    }
    return bestId;
  }, [userPos, markers]);

  const onMapLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMapSize({ width, height });
  };

  const moveUserTo = (xPixels: number, yPixels: number) => {
    if (mapSize.width <= 0 || mapSize.height <= 0) return;
    setUserPos({ x: xPixels / mapSize.width, y: yPixels / mapSize.height });
  };

  // Request location and subscribe
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // NOTE: GPS accuracy indoors is limited; later we can integrate beacons.
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 1 },
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Simple affine mapping: calibrate two corners to map percent space
          // TEMP: Rough bounds for Cape Town Cathedral area (example only)
          const northWest = { lat: -33.92427, lon: 18.41950 };
          const southEast = { lat: -33.92500, lon: 18.42030 };

          const clamp = (v: number) => Math.max(0, Math.min(1, v));
          const x = clamp((longitude - northWest.lon) / (southEast.lon - northWest.lon));
          const y = clamp((latitude - northWest.lat) / (southEast.lat - northWest.lat));

          setUserPos({ x, y });
        }
      );
    })();
    return () => { if (sub) sub.remove(); };
  }, [mapSize.width, mapSize.height]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>St. George's{"\n"}Cathedral</Text>
      </View>

      {/* Map mock using gray block with tappable markers positioned by percentage */}
      <View
        style={styles.mapArea}
        onLayout={onMapLayout}
        onStartShouldSetResponder={() => true}
        onResponderRelease={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          if (editMode && editableId != null) {
            const x = Math.max(0, Math.min(1, locationX / mapSize.width));
            const y = Math.max(0, Math.min(1, locationY / mapSize.height));
            setMarkers(prev => prev.map(m => m.id === editableId ? { ...m, x, y } : m));
          } else {
            moveUserTo(locationX, locationY);
          }
        }}
      >
        {/* Floorplan background */}
        <Image
          source={require('../assets/images/cathedral-floor.svg')}
          style={styles.floor}
          resizeMode="contain"
        />
        {/* User position indicator */}
        <View
          style={[styles.userDot, {
            left: `${userPos.x * 100}%`,
            top: `${userPos.y * 100}%`,
          }]}
          pointerEvents="none"
        />
        {markers.map(m => (
          <TouchableOpacity
            key={m.id}
            accessibilityRole="button"
            style={[styles.pin, {
              left: `${m.x * 100}%`,
              top: `${m.y * 100}%`,
              backgroundColor: nearestId === m.id ? '#b61f24' : '#991b1b',
              borderWidth: nearestId === m.id ? 2 : 0,
              borderColor: nearestId === m.id ? '#ffffff' : 'transparent'
            }]}
            onPress={() => {
              if (editMode) {
                setEditableId(m.id);
              } else {
                setSheetId(m.id);
              }
            }}
          >
            <Text style={styles.pinText}>{m.id}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Edit controls */}
      <View style={styles.editControls} pointerEvents="box-none">
        <TouchableOpacity style={[styles.editButton, editMode ? styles.editOn : undefined]} onPress={() => setEditMode(v => !v)}>
          <Text style={styles.editText}>{editMode ? 'Editing' : 'Edit'}</Text>
        </TouchableOpacity>
        {editMode && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              const exportData = markers.map(({ id, x, y, title }) => ({ id, x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), title }));
              // eslint-disable-next-line no-console
              console.log('POI positions:', JSON.stringify(exportData, null, 2));
            }}
          >
            <Text style={styles.editText}>Dump</Text>
          </TouchableOpacity>
        )}
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
                const idx = markers.findIndex(m => m.id === selectedMarker.id);
                const next = markers[(idx + 1) % markers.length];
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
  mapArea: { flex: 1, backgroundColor: '#f3f4f6', position: 'relative' },
  floor: { ...StyleSheet.absoluteFillObject },
  editControls: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  editButton: { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  editOn: { backgroundColor: '#b61f24' },
  editText: { color: 'white', fontWeight: '700' },
  userDot: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#2563eb', borderWidth: 3, borderColor: 'white', transform: [{ translateX: -9 }, { translateY: -9 }], shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
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