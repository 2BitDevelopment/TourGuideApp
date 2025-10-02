// Firebase configuration
export const firebaseConfig = {
  // TODO: Replace with your actual Firebase configuration
  // You can find this in your Firebase Console > Project Settings > General > Your apps
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};

// Collection names
export const COLLECTIONS = {
  TOUR_ITEMS: 'tourItems',
  IMAGES: 'images'
} as const;

// Storage paths
export const STORAGE_PATHS = {
  IMAGES: 'images/',
  THUMBNAILS: 'thumbnails/'
} as const;