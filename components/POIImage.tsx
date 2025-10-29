import { Colours } from '@/constants/Colours';
import React from 'react';
import { ActivityIndicator, Image, ImageStyle, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSingleImage } from '../hooks/useImageLoading';

interface POIImageProps {
  imageID?: string;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackSource?: any;
  showLoadingIndicator?: boolean;
  showRetryButton?: boolean;
  loadingIndicatorColor?: string;
  loadingIndicatorSize?: 'small' | 'large';
  onImageLoad?: () => void;
  onError?: (error: string) => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

////////////////////////////////////////////////
// Image component with loading state and error handling
////////////////////////////////////////////////
export const POIImage: React.FC<POIImageProps> = ({
  imageID,
  style,
  containerStyle,
  fallbackSource,
  showLoadingIndicator = true,
  showRetryButton = true,
  loadingIndicatorColor = Colours.primaryColour,
  loadingIndicatorSize = 'small',
  onImageLoad,
  onError,
  resizeMode = 'cover'
}) => {
  const { imageUrl, isLoading, error, retry } = useSingleImage(imageID);

  React.useEffect(() => {
    if (imageUrl && onImageLoad) {
      onImageLoad();
    }
  }, [imageUrl, onImageLoad]);

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const defaultFallback = require('../assets/images/ST_GEORGES_CATHEDRAL_LOGO.png');
  const imageSource = imageUrl ? { uri: imageUrl } : (fallbackSource || defaultFallback);

  if (isLoading && showLoadingIndicator) {
    return (
      <View style={[styles.container, containerStyle, style]}>
        <ActivityIndicator 
          size={loadingIndicatorSize} 
          color={loadingIndicatorColor} 
        />
        <Text style={styles.loadingText}>Loading image...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, containerStyle, style]}>
        <Text style={styles.errorText}>Failed to load image</Text>
        {showRetryButton && (
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[containerStyle]}>
      <Image
        source={imageSource}
        style={[styles.image, style]}
        resizeMode={resizeMode}
        onError={(e) => {
          console.error('Image load error:', e.nativeEvent.error);
          onError && onError(e.nativeEvent.error || 'Failed to load image');
        }}
      />
    </View>
  );
};

////////////////////////////////////////////////
// Styles
////////////////////////////////////////////////
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colours.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  errorContainer: {
    backgroundColor: Colours.surfaceVariantColour,
    borderColor: Colours.primaryColour,
    borderWidth: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: Colours.black,
  },
  errorText: {
    fontSize: 14,
    color: Colours.primaryColour,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: Colours.primaryColour,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: {
    color: Colours.white,
    fontSize: 12,
    fontWeight: '600',
  },
});