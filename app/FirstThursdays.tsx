import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';

const FirstThursdays = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>First Thursdays</Text>

        <View style={styles.cardLarge}>
          <Text style={styles.cardTitle}>What is first Thursdays?</Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>• Monthly late-night art walk.</Text>
            <Text style={styles.bullet}>• St George's: mini tours, organ sets.</Text>
            <Text style={styles.bullet}>• Add bookshop, quiet space, coffee.</Text>
          </View>
        </View>

        <View style={styles.cardSmall}>
          <Text style={styles.smallTitle}>First Thursday Offering:</Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>• Monthly late-night art walk.</Text>
            <Text style={styles.bullet}>• Mini tours; organ sets.</Text>
            <Text style={styles.bullet}>• Bookshop, quiet space, coffee.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton}>
          <Link style={styles.backText} href="/">Back home</Link>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { padding: 24, paddingBottom: 120 },
  heading: {
    fontSize: 28,
    color: '#b61f24',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  cardLarge: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    marginBottom: 16,
  },
  cardSmall: {
    borderRadius: 16,
    backgroundColor: '#b61f24',
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  smallTitle: { fontSize: 16, fontWeight: '700', color: 'white', marginBottom: 12 },
  bullets: { gap: 6 },
  bullet: { fontSize: 14, color: '#111827' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    minWidth: 200,
  },
  backText: { textAlign: 'center', color: '#111827', fontSize: 16, fontWeight: '600' },
});

export default FirstThursdays;


