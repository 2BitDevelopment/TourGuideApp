# Database API Setup and Usage

This guide explains how to set up and use the Firestore Database API for the Cathedral Tour Guide App.

## Prerequisites

1. Install Firebase dependencies:
```bash
npm install firebase
```

2. Set up a Firebase project at [Firebase Console](https://console.firebase.google.com/)

3. Enable Firestore Database and Firebase Storage in your Firebase project

## Configuration

### 1. Firebase Configuration

Update the configuration in `services/firebase.config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com", 
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

You can find these values in your Firebase Console under:
- Project Settings → General → Your apps → SDK setup and configuration

### 2. Firestore Database Structure

Create a collection called `tourItems` with documents that have this structure:

```javascript
{
  id: "auto-generated-document-id",
  title: "Tour Stop Title",
  text: "Detailed description text about this location",
  location: {
    latitude: -33.9249,
    longitude: 18.4241,
    name: "St George's Cathedral"
  },
  description: "Short description for previews",
  imageID: "cathedral-main.jpg"
}
```

### 3. Firebase Storage Structure

Upload images to Firebase Storage in this structure:
```
/images/
  ├── cathedral-main.jpg
  ├── altar-photo.jpg
  └── stained-glass.jpg
```

## Security Rules

Don't forget to set up Firestore security rules in your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tourItems/{document} {
      // Allow read access to all users
      allow read: if true;
      // Restrict write access (adjust based on your needs)
      allow write: if false;
    }
  }
}
```

And Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{allPaths=**} {
      // Allow read access to all users
      allow read: if true;
      // Restrict write access
      allow write: if false;
    }
  }
}
```