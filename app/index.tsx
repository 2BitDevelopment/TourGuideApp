//Home Page of the App
//Three Buttons: Begin Virtual Tour, First Thursdays, Donate

import { Colours } from '@/constants/Colours';
import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


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
          <TouchableOpacity style={styles.button}>
            <Link style={styles.buttonText} href="/MapPage">
              Begin Virtual Tour
              <MaterialIcons name="arrow-forward" size={24} color={Colours.primaryColour} style={{ marginLeft: 10, textAlignVertical: 'center' }} />
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
    backgroundColor: Colours.primaryColour,
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
    color: Colours.surfaceColour, 
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay-Black',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colours.white,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    opacity: 0.95,
    fontWeight: '400',
    fontFamily: 'Inter-Regular', 
  },
  button: {
    backgroundColor: Colours.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colours.primaryColour,
    marginBottom: 12,
    minWidth: 220,
    minHeight: 50,
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  buttonText: {
    color: Colours.primaryColour, 
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