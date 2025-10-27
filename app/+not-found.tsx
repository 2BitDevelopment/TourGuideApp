import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colours } from '../constants/Colours';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Oops!</Text>
        <Text style={styles.message}>
          The page you’re looking for doesn’t exist or may have been moved.
        </Text>
        <Link href="/" style={styles.link}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Back Home</Text>
          </View>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.surfaceColour,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colours.primaryColour,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    color: Colours.black,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 30,
    lineHeight: 22,
  },
  link: {
    textDecorationLine: 'none',
  },
  button: {
    backgroundColor: Colours.white,
    borderColor: Colours.primaryColour,
    borderWidth: 1.5,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 22,
    shadowColor: Colours.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: Colours.primaryColour,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
