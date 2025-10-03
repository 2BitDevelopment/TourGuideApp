// Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_apiKey,
  authDomain: process.env.REACT_APP_authDomain,
  projectId: process.env.REACT_APP_projectId,
  storageBucket: process.env.REACT_APP_storageBucket,
  messagingSenderId: process.env.REACT_APP_messagingSenderId,
  appId: process.env.REACT_APP_appId,
  measurementId: process.env.REACT_APP_measurementId
};

// Collection names
export const COLLECTIONS = {
  POI_ITEMS: 'POIs',
  IMAGES: 'images'
} as const;

// Storage paths
export const STORAGE_PATHS = {
  IMAGES: 'images/',
  THUMBNAILS: 'thumbnails/'
} as const;