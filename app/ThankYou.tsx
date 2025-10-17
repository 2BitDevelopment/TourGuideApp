import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ThankYou = () => {
  return (
    <View style={styles.container}>
      <View style={styles.mainCard}>
        <Text style={styles.brand}>St. George's{"\n"}Cathedral</Text>
        <Text style={styles.title}>Thank you!</Text>
        
        <Text style={styles.subtitle}>
          We appreciate your time for visiting us.
        </Text>
        <Text style={styles.subtitle}>
          Make sure to read about our First Thursday Events and don't think twice to contact us for any queries.
        </Text>

        <View style={styles.contactCard}>
          <Text style={styles.contactHeading}>Contact Us</Text>
          <Text style={styles.contact}>☎  +27 21 424 7360</Text>
          <Text style={styles.contact}>✉  reception@sgcathedral.co.za</Text>
          <Text style={styles.contact}>⌖  5 Wale St, Cape Town, 8001</Text>
        </View>

        <TouchableOpacity style={styles.backButton}>
          <Link href="/" asChild>
            <Text style={styles.backText}>Back home</Text>
          </Link>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', // White background
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9CA3AF', // Light gray
    marginBottom: 20,
    fontFamily: 'Inter-Medium',
  },
  mainCard: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  brand: { 
    color: '#8F000D', // Primary red
    fontSize: 28, 
    fontWeight: '800', 
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 30,
    lineHeight: 34,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Bold',
  },
  subtitle: { 
    fontSize: 16, 
    color: '#374151', 
    textAlign: 'center', 
    marginBottom: 12, 
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  contactCard: { 
    marginTop: 30,
    marginBottom: 40,
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: '#8F000D', 
    backgroundColor: '#FFFFFF',
    padding: 20,
    width: '100%',
    alignItems: 'flex-start',
  },
  contactHeading: { 
    fontWeight: '800', 
    marginBottom: 16, 
    fontSize: 18,
    color: '#2D2D2D',
    fontFamily: 'Inter-Bold',
  },
  contact: { 
    fontSize: 16, 
    color: '#374151', 
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  backButton: { 
    backgroundColor: '#FFDAD6', 
    paddingVertical: 16, 
    paddingHorizontal: 32, 
    borderRadius: 25, 
    minWidth: 200,
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backText: { 
    textAlign: 'center', 
    color: '#8F000D', 
    fontSize: 16, 
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
});

export default ThankYou;


