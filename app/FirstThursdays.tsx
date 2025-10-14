import { black, primaryColor, surfaceColor, surfaceVariantColor } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FirstThursdays = () => {
  return (
    <View style={styles.container}>
      <View style={styles.footer}>
  <TouchableOpacity style={styles.backButton}>
    <Link href="/" asChild>
      <View style={styles.backContent}>
        <MaterialIcons name="arrow-back" size={12} color={primaryColor} style={{ marginRight: 4, textAlignVertical: 'center' }} />
        <Text style={styles.backTextLabel}>Back</Text>
      </View>
    </Link>
  </TouchableOpacity>
</View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>First Thursdays</Text>

        <View style={styles.cardLarge}>
          <Text style={styles.cardTitle}>What's happening?</Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>• Open from 5pm-8pm</Text>
            <Text style={styles.bullet}>• St George’s Marimba Team Performances</Text>
            <Text style={styles.bullet}>
              • Explore the history alongside other art expeditions in Cape Town
            </Text>
          </View>
        </View>

        <View style={styles.cardSmall}>
          <Text style={styles.smallTitle}>Latest Events</Text>
          <Link style={styles.eventLink} href="https://www.first-thursdays.co.za/programme/first-thursdays-at-st-georges-cathedral">
            More about First Thursdays
          </Link>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: surfaceColor },
  scroll: {
    padding: 24,
    paddingBottom: 120,
    paddingTop: 60, // Move content lower
  },
  heading: {
    fontSize: 32,
    color: primaryColor,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    fontFamily: 'PlayfairDisplay-Black',
    letterSpacing: 1,
  },
  cardLarge: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: primaryColor,
    backgroundColor: surfaceVariantColor,
    padding: 20,
    marginBottom: 18,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  cardSmall: {
    borderRadius: 20,
    backgroundColor: surfaceColor,
    padding: 20,
    marginBottom: 18,
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: primaryColor,
    textAlign: 'left',
    fontFamily: 'Inter-Bold',
  },
  smallTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: primaryColor,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  bullets: { gap: 8 },
  bullet: { fontSize: 18, color: black, marginBottom: 2, fontFamily: 'Inter-Regular' },
  eventLink: {
    color: '#1d4ed8',
    fontSize: 16,
    textDecorationLine: 'underline',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  footer: {
    position: 'absolute',
    top: 20,
    left: 24,
    alignItems: 'flex-start',
    zIndex: 10,
  },
  backButton: {
  backgroundColor: surfaceColor,
  borderColor: primaryColor,
  borderWidth: 1,
  borderRadius: 999,
  minWidth: 60,
  paddingVertical: 4,
  paddingHorizontal: 10,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#b61f24',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.12,
  shadowRadius: 2,
},
backContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
backTextLabel: {
  color: primaryColor,
  fontSize: 14,
  fontWeight: '600',
  fontFamily: 'Inter-Medium',
  marginLeft: 2,
},
});

export default FirstThursdays;