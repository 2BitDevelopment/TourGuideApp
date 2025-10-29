import { Colours } from '@/constants/Colours';
import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

////////////////////////////////////////////////
// First Thursdays Page
////////////////////////////////////////////////
const FirstThursdays = () => {
  return (
    <View style={styles.container}>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton}>
          <Link href="/" asChild>
            <View style={styles.backContent}>
              <MaterialIcons name="keyboard-arrow-left" size={18} color={Colours.primaryColour} style={{ textAlignVertical: 'center' }} />
              <Text style={styles.backTextLabel}>Back</Text>
            </View>
          </Link>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>First Thursdays</Text>

          <View style={styles.cardLarge}>
            <Text style={styles.cardTitle}>What&apos;s happening?</Text>
            <View style={styles.bullets}>
              <Text style={styles.bullet}>• Open from 5pm-8pm</Text>
              <Text style={styles.bullet}>• St George&apos;s Marimba Team Performances</Text>
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
          <Text style={styles.footerText}>St. George&apos;s Cathedral</Text>
          <Text style={styles.footerSubtext}>The People&apos;s Cathedral</Text>
        </View>
      </ScrollView>
    </View>
  );
};

////////////////////////////////////////////////
// Styles
////////////////////////////////////////////////
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 
    Colours.surfaceColour 
  },
  scroll: {
    padding: 24,
    paddingBottom: 120,
    paddingTop: 60,
  },
  contentContainer: {
    backgroundColor: Colours.white,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 8,
    marginTop: 50,
    shadowColor: Colours.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heading: {
    fontSize: 32,
    color: Colours.primaryColour,
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
    borderColor: Colours.primaryColour,
    backgroundColor: Colours.surfaceVariantColour,
    padding: 20,
    marginBottom: 18,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  cardSmall: {
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: Colours.surfaceColour,
    borderColor: Colours.primaryColour,
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
    color: Colours.primaryColour,
    textAlign: 'left',
    fontFamily: 'Inter-Bold',
  },
  smallTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colours.primaryColour,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colours.black,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  bullets: { 
    gap: 8 
  },
  bullet: { 
    fontSize: 18, 
    color: Colours.black, 
    marginBottom: 2, 
    fontFamily: 'Inter-Regular' 
  },
  eventButton: {
    backgroundColor: Colours.primaryColour,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 8,
    shadowColor: Colours.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventButtonText: {
    color: Colours.white,
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
    borderTopColor: Colours.surfaceVariantColour,
    alignItems: 'center',
    backgroundColor: Colours.surfaceColour,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colours.primaryColour,
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 20,
  },
  footerSubtext: {
    fontSize: 14,
    color: Colours.black,
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
    backgroundColor: Colours.white,
    borderColor: Colours.primaryColour,
    borderWidth: 1,
    borderRadius: 20,
    minWidth: 80,
    minHeight: 40,
    paddingVertical: 10,
    paddingEnd: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colours.primaryColour,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTextLabel: {
    color: Colours.primaryColour,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    marginLeft: 2,
  },
});

export default FirstThursdays;