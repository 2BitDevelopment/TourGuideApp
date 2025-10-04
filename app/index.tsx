import { black, primaryColor, white } from '@/constants/Colors';
import { Link } from 'expo-router';
import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// require('dotenv').config();

// Cathedral Icon Component
const CathedralIcon = () => (
  <View style={{ alignItems: 'center', marginBottom: 20 }}>
    <Image
      source={require("../assets/images/ST_GEORGES_CATHEDRAL_LOGO.png")}
      style={{ width: 140, height: 140, marginBottom: 10 }}
      resizeMode="contain"
    />
    <Text style={styles.estText}>EST. 1848</Text>
  </View>
);

const Arrow = () => (
  <Text style={styles.arrow}>{'\u2192'}</Text>
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
      <View style={styles.content}>
        <CathedralIcon />

        <Text style={styles.title}>St. George’s Cathedral</Text>

        <Text style={styles.subtitle}>
          Known as the Peoples Cathedral{'\n'}
          for its role in the resistance{'\n'}
          against apartheid, St. George’s{'\n'}
          Cathedral is the oldest cathedral{'\n'}
          in Southern Africa.
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
    backgroundColor: primaryColor, // Use your constant color
    justifyContent: 'center',
    shadowColor: black, // Use your constant color
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
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
    fontSize: 28,
    fontWeight: 'bold',
    color: white, // Use your constant color
    textAlign: 'center',
    fontFamily: 'serif',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: white, // Use your constant color
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 38,
    opacity: 0.95,
    fontWeight: '400',
    fontFamily: 'inter', // Changed to Inter
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: white, // Use your constant color
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'white',
    marginBottom: 16,
    minWidth: 220,
  },
  buttonText: {
    color: primaryColor, // Use your constant color
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'inter', // Changed to Inter
    letterSpacing: 0.5,
  },
  arrow: {
    fontSize: 18,
    marginLeft: 8,
    color: primaryColor, // Use your constant color
    fontWeight: 'bold',
    fontFamily: 'inter', // Changed to Inter
  },
});

export default CathedralHomePage;
// ...existing code...