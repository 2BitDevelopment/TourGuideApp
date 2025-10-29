import { Colours } from '@/constants/Colours';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text
} from 'react-native';

////////////////////////////////////////////////
// Cookie popup
////////////////////////////////////////////////
export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const slideAnim = useState(new Animated.Value(-300))[0];

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }, 500);

    const hideTimer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }, 4500);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [slideAnim]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <Text style={styles.text}>Hey there! We use cookies to help make your visit awesome! 🍪</Text>
    </Animated.View>
  );
};

////////////////////////////////////////////////
// Styles
////////////////////////////////////////////////
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: Colours.white,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colours.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: Colours.surfaceVariantColour,
  },
  text: {
    color: Colours.primaryColour,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 22,
  },
});