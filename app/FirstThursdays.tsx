import { black, primaryColor, secondaryColor, surfaceColor, surfaceVariantColor } from '@/constants/Colors';
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
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>First Thursdays</Text>

          <View style={styles.cardLarge}>
            <Text style={styles.cardTitle}>What's happening?</Text>
            <View style={styles.bullets}>
              <Text style={styles.bullet}>• Open from 5pm-8pm</Text>
              <Text style={styles.bullet}>• St George's Marimba Team Performances</Text>
              <Text style={styles.bullet}>
                • Explore the history alongside other art expeditions in Cape Town
              </Text>
            </View>
          </View>

          <View style={styles.cardSmall}>
            <Text style={styles.smallTitle}>Latest Events</Text>
            <Text style={styles.subtitle}>Want to know more about what First Thursdays is all about?</Text>
            <Link href="https://www.first-thursdays.co.za/programme/first-thursdays-at-st-georges-cathedral" asChild>
              <TouchableOpacity style={styles.eventButton}>
                <Text style={styles.eventButtonText}>Learn more</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={styles.churchFooter}>
          <Text style={styles.footerText}>St. George's Cathedral</Text>
          <Text style={styles.footerSubtext}>The People's Cathedral</Text>
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
  contentContainer: {
    backgroundColor: surfaceColor,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 8,
    marginTop: 50,
        shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 18,
  },
  heading: {
    fontSize: 32,
    color: primaryColor,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25,
    fontFamily: 'PlayfairDisplay-Bold',
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
    borderWidth: 2,
    backgroundColor: surfaceColor,
    borderColor: primaryColor,
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
    fontSize: 20,
    fontWeight: '700',
    color: primaryColor,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: secondaryColor,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  bullets: { gap: 8 },
  bullet: { fontSize: 18, color: black, marginBottom: 2, fontFamily: 'Inter-Regular' },
  eventButton: {
    backgroundColor: primaryColor,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  eventButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  churchFooter: {
    marginTop: 130,
    paddingTop: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#FFDAD6',
    alignItems: 'center',
    backgroundColor: surfaceColor,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: primaryColor,
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
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
  shadowColor: '#000',
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