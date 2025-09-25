import { useNavigation } from '@react-navigation/native';
import { Link } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';

// Cathedral Icon Component
const CathedralIcon = () => (
              <Image
        source={require("../assets/images/ST_GEORGES_CATHEDRAL_LOGO.png")}
        style={{ width: 200, height: 200, marginBottom: 40 }}
      />
);

const CathedralHomePage = () => {
  const navigation = useNavigation<any>();
  const handleVirtualTour = () => {
    // Handle virtual tour navigation
    // navigation.navigate('CustomMap');
    // navigate not working
    // <Link href="/CustomMap" />;
    console.log('Starting virtual tour...');
  };

  const handleDonate = () => {
    const url = 'https://stgeorgescathedral.org.za/';
    Linking.openURL(url).catch(() => {
      console.warn('Unable to open donation link');
    });
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        <CathedralIcon />

        <Text style={styles.title}>St. George's Cathedral</Text>
        
        <Text style={styles.subtitle}>
          Known as the "People's Cathedral" for its role in the resistance against apartheid,
          St. George's Cathedral is the oldest cathedral in Southern Africa.
        </Text>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={handleVirtualTour}>
            <Link style={styles.buttonText} href="/MapPage">Begin Virtual Tour</Link>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Link style={styles.buttonText} href="/FirstThursdays">First Thursdays</Link>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleDonate}>
            <Text style={styles.buttonText}>Donate →</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.footerText}>
          Tap to explore the historical landmarks
        </Text>
        
        <Text style={styles.tagline}>
          A PLACE OF HEALING AND HOPE
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b61f24',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  cathedral: {
    position: 'relative',
    width: 80,
    height: 60,
  },
  leftTower: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 20,
    height: 40,
    backgroundColor: 'white',
  },
  centerTower: {
    position: 'absolute',
    left: 25,
    bottom: 0,
    width: 20,
    height: 50,
    backgroundColor: 'white',
  },
  rightTower: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 20,
    height: 40,
    backgroundColor: 'white',
  },
  leftTowerTop: {
    position: 'absolute',
    left: 5,
    bottom: 40,
    width: 10,
    height: 10,
    backgroundColor: 'white',
  },
  centerTowerTop: {
    position: 'absolute',
    left: 30,
    bottom: 50,
    width: 10,
    height: 10,
    backgroundColor: 'white',
  },
  rightTowerTop: {
    position: 'absolute',
    right: 5,
    bottom: 40,
    width: 10,
    height: 10,
    backgroundColor: 'white',
  },
  cross: {
    position: 'absolute',
    left: 32,
    bottom: 60,
  },
  crossVertical: {
    width: 2,
    height: 8,
    backgroundColor: 'white',
    position: 'absolute',
    left: 2,
  },
  crossHorizontal: {
    width: 6,
    height: 2,
    backgroundColor: 'white',
    position: 'absolute',
    top: 2,
  },
  base: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 8,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 50,
    opacity: 0.9,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'white',
    marginBottom: 16,
    minWidth: 220,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  tagline: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '300',
    opacity: 0.9,
  },
});

export default CathedralHomePage;