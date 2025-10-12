// Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_apiKey,
  authDomain: process.env.EXPO_PUBLIC_authDomain,
  projectId: process.env.EXPO_PUBLIC_projectId,
  storageBucket: process.env.EXPO_PUBLIC_storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_messagingSenderId,
  appId: process.env.EXPO_PUBLIC_appId,
  measurementId: process.env.EXPO_PUBLIC_measurementId
};

// Collection names
export const COLLECTIONS = {
  POI_ITEMS: 'POIs',
  IMAGES: 'images'
} as const;

// Storage paths
export const STORAGE_PATHS = {
  IMAGES: '',
  THUMBNAILS: 'thumbnails/'
} as const;