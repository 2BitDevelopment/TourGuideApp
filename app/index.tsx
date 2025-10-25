//Home Page of the App
//Three Buttons: Begin Virtual Tour, First Thursdays, Donate

import { primaryColor, white } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Link } from 'expo-router';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    const url = 'https://sgcathedral.co.za/donate-now/';
    Linking.openURL(url).catch(() => {
      console.warn('Unable to open donation link');
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        <CathedralIcon />

        <Text style={styles.title}>St. George&apos;s Cathedral</Text>

        <Text style={styles.subtitle}>
          Known as the Peoples Cathedral{'\n'}
          for its role in the resistance{'\n'}
          against apartheid, St. George&apos;s{'\n'}
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryColor,
  },
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: white, 
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay-Black',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: white,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'white',
    marginBottom: 12,
    minWidth: 220,
    minHeight: 50,
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
    fontSize: 16,
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