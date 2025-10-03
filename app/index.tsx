import { black, primaryColor, white } from '@/constants/Colors';
import { Link } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Cathedral Icon Component
const CathedralIcon = () => (
  <View style={{ alignItems: 'center', marginBottom: 20 }}>
    <Image
      source={require("../assets/images/ST_GEORGES_CATHEDRAL_LOGO.png")}
      style={{ width: 140, height: 140, marginBottom: 10 }}
      resizeMode="contain"
    />
    <Text style={styles.estText}>EST. 1848</Text>
  </View>
);

const Arrow = () => (
  <Text style={styles.arrow}>{'\u2192'}</Text>
);

const CathedralHomePage = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CathedralIcon />

        <Text style={styles.title}>St. George’s Cathedral</Text>

        <Text style={styles.subtitle}>
          Known as the Peoples Cathedral{'\n'}
          for its role in the resistance{'\n'}
          against apartheid, St. George’s{'\n'}
          Cathedral is the oldest cathedral{'\n'}
          in Southern Africa.
        </Text>

        <View style={styles.buttonGroup}>
          <Link href="/MapPage" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Begin Virtual Tour <Arrow /></Text>
            </TouchableOpacity>
          </Link>
          <Link href="/FirstThursdays" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>First Thursdays <Arrow /></Text>
            </TouchableOpacity>
          </Link>
          <Link href="/Donate" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Donate <Arrow /></Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryColor, // Use your constant color
    justifyContent: 'center',
    shadowColor: black, // Use your constant color
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  estText: {
    color: white, // Use your constant color
    fontSize: 12,
    opacity: 0.7,
    fontFamily: 'inter', // Changed to Inter
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: white, // Use your constant color
    textAlign: 'center',
    fontFamily: 'serif',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: white, // Use your constant color
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 38,
    opacity: 0.95,
    fontWeight: '400',
    fontFamily: 'inter', // Changed to Inter
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: white, // Use your constant color
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 0,
    width: 240,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
  },
  buttonText: {
    color: primaryColor, // Use your constant color
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'inter', // Changed to Inter
    letterSpacing: 0.5,
  },
  arrow: {
    fontSize: 18,
    marginLeft: 8,
    color: primaryColor, // Use your constant color
    fontWeight: 'bold',
    fontFamily: 'inter', // Changed to Inter
  },
});

export default CathedralHomePage;
// ...existing code...