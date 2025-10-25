import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { POIImage } from '../components/POIImage';

const HelpPage = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton}>
          <Link href="/MapPage" style={styles.backButtonLink}>
            <Text style={styles.backButtonText}>&lt; Back</Text>
          </Link>
        </TouchableOpacity>

        {/* Help Title */}
        <Text style={styles.title}>Help</Text>

        {/* POI Image */}
        <View style={styles.cathedralImage}>
          <POIImage
            imageID="2.jpg"
            style={styles.cathedralImage}
            resizeMode="cover"
           
          />
        </View>

        {/* Instructions List */}
        <View style={styles.instructionsContainer}>
          {/* Instruction 1 */}
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.numberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Click on a number on the map or press next to view a certain item.
            </Text>
          </View>

          {/* Instruction 2 */}
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.numberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Swipe up to read more about that item.
            </Text>
          </View>

          {/* Instruction 3 */}
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.numberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Additional Images and context will be listed
            </Text>
          </View>

          {/* Instruction 4 */}
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.numberText}>4</Text>
            </View>
            <Text style={styles.instructionText}>
              Click on the Play Button to have a Voice read out the description
            </Text>
          </View>
        </View>

        {/* Church Footer */}
        <View style={styles.churchFooter}>
          <Text style={styles.footerText}>St. George&apos;s Cathedral</Text>
          <Text style={styles.footerSubtext}>The People&apos;s Cathedral</Text>
        </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  scrollContent: {
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#OOOOOO', 
    margin: 20,
    borderRadius: 20,
    padding: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    minWidth: 80,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8F000D',
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#8F000D',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#8F000D',
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 30,
  },
  cathedralImage: {
    width: '100%',
    height: 200,
    marginBottom: 30,
  },
  instructionsContainer: {
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8F000D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#8F000D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  numberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  churchFooter: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#FFDAD6',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8F000D',
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
});

export default HelpPage;
