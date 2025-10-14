//Home Page of the App
//Three Buttons: Begin Virtual Tour, First Thursdays, Donate

import { primaryColor, white } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
  </View>
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

  //Donate button link to St Georges Cathedral website
  const handleDonate = () => {
    const url = 'https://sgcathedral.co.za/';
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
            <Link style={styles.buttonText} href="/MapPage">
              Begin Virtual Tour
              <MaterialIcons name="arrow-forward" size={24} color={primaryColor} style={{ marginLeft: 10, textAlignVertical: 'center' }} />
            </Link>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Link style={styles.buttonText} href="/FirstThursdays">First Thursdays</Link>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleDonate}>
            <Text style={styles.buttonText}>Donate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: primaryColor, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center'
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: white, 
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay-Black',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 20,
    color: white,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 38,
    opacity: 0.95,
    fontWeight: '400',
    fontFamily: 'Inter-Regular', 
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 16
  },
  button: {
    backgroundColor: white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'white',
    marginBottom: 16,
    minWidth: 260,
    minHeight: 54,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  buttonText: {
    color: primaryColor, 
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }
});

export default CathedralHomePage;