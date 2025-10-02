// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId
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