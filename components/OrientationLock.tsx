import { usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface OrientationLockProps {
  children: React.ReactNode;
}

export const OrientationLock: React.FC<OrientationLockProps> = ({ children }) => {
  const [isLandscape, setIsLandscape] = useState(false);
  const [wasLandscape, setWasLandscape] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      const newIsLandscape = width > height;
      
      // Track if we were in landscape and now back to portrait
      if (wasLandscape && !newIsLandscape) {
        // We just returned from landscape to portrait
        // The app should continue normally
      }
      
      setIsLandscape(newIsLandscape);
      setWasLandscape(newIsLandscape);
    };

    // Check initial orientation
    updateOrientation();

    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => {
      subscription?.remove();
    };
  }, [wasLandscape]);

  if (isLandscape) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <View style={styles.content}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.title}>Please Rotate Your Device</Text>
          <Text style={styles.subtitle}>
            This app works best in portrait mode.{'\n'}
            Please rotate to portrait.
          </Text>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>↻</Text>
          </View>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8F000D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderRadius: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 300,
    width: '100%',
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  arrowContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
