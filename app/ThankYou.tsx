import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ThankYou = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          <View style={styles.contactRow}>
            <MaterialIcons name="call" size={18} color="#111827" style={{ marginRight: 8 }} />
            <Text style={styles.contact}>+27 21 424 7360</Text>
          </View>
          <View style={styles.contactRow}>
            <MaterialIcons name="mail-outline" size={18} color="#111827" style={{ marginRight: 8 }} />
            <Text style={styles.contact}>reception@sgcathedral.co.za</Text>
          </View>
          <View style={styles.contactRow}>
            <MaterialIcons name="location-on" size={18} color="#111827" style={{ marginRight: 8 }} />
            <Text style={styles.contact}>5 Wale St, Cape Town, 8001</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.backButton}>
          <Link href="/" asChild>
            <Text style={styles.backText}>Back home</Text>
          </Link>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 20,
    fontFamily: 'Inter-Medium',
  },
  mainCard: {
    minHeight: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 20,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  brand: { 
    color: '#8F000D',
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: '#FFFFFF', 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    minWidth: 80,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#8F000D',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { 
    textAlign: 'center', 
    color: '#8F000D', 
    fontSize: 14, 
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
});

export default ThankYou;


