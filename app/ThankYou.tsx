import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ThankYou = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>St. George's{"\n"}Cathedral</Text>
        <Text style={styles.title}>Thank you!</Text>
        <Text style={styles.subtitle}>
          We appreciate your time for visiting us. Make sure to read about our First Thursday Events and don't think twice to contact us for any queries.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>Contact Us</Text>
        <Text style={styles.contact}>☎  +27 011 111 1111</Text>
        <Text style={styles.contact}>✉  info@stgeorges.co.za</Text>
        <Text style={styles.contact}>⌖  5 Wale St, Cape Town, 8001</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton}>
          <Link style={styles.backText} href="/">Back home</Link>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 24 },
  header: { alignItems: 'center', marginTop: 24 },
  brand: { color: '#b61f24', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#4b5563', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  card: { marginTop: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 16 },
  cardHeading: { fontWeight: '700', marginBottom: 8, fontSize: 16 },
  contact: { fontSize: 14, color: '#111827', marginTop: 4 },
  footer: { position: 'absolute', bottom: 20, left: 24, right: 24, alignItems: 'center' },
  backButton: { backgroundColor: '#f3f4f6', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, minWidth: 200 },
  backText: { textAlign: 'center', color: '#111827', fontSize: 16, fontWeight: '600' },
});

export default ThankYou;


