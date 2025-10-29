import { Colours } from '@/constants/Colours';
import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface ImageModalProps {
  visible: boolean;
  imageUri: string;
  title?: string;
  onClose: () => void;
}

////////////////////////////////////////////////
// Image popup
////////////////////////////////////////////////
export const ImageModal: React.FC<ImageModalProps> = ({
  visible,
  imageUri,
  title,
  onClose
}) => {
  if (!visible || !imageUri) return null;

////////////////////////////////////////////////
// Modal Layout
////////////////////////////////////////////////
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor={Colours.black} barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.overlay}>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {title && (
            <Text style={styles.title}>{title}</Text>
          )}

          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

////////////////////////////////////////////////
// Styles
////////////////////////////////////////////////
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.black,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colours.black,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: Colours.white,
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    color: Colours.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 8,
  },
});
