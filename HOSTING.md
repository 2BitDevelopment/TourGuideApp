# Firebase Hosting - Deployment Guide

This guide covers deploying the St. George's Cathedral Tour Guide App web version to Firebase Hosting.

## Quick Deployment

Deploy the web version to Firebase Hosting:
```bash
npm run predeploy        # Exports web build
npm run deploy-hosting   # Deploys to Firebase Hosting
```

## Step-by-Step Deployment

### 1. Build the Web Version
```bash
npm run predeploy
```
This command:
- Runs `expo export -p web` to create an optimized web build
- Outputs static files to the `dist/` directory
- Prepares assets for hosting

### 2. Deploy to Firebase Hosting
```bash
npm run deploy-hosting
```
This command:
- Runs `firebase deploy --only hosting`
- Uploads the `dist/` directory to Firebase Hosting
- Makes the app available at your Firebase Hosting URL

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project configured: `firebase init hosting`
- Authenticated with Firebase: `firebase login`
- Project built successfully: `npm run predeploy`

## Configuration

The hosting configuration is defined in `firebase.json`:
- **Public directory**: `dist/` (contains the exported web build)
- **Single Page App**: Configured for React Router navigation
- **Static file caching**: Optimized for performance

## Hosting URL

After successful deployment, your app will be available at:
- Production: `https://[your-project-id].web.app`
- Custom domain: Configure in Firebase Console if set up

## Troubleshooting

- **Build fails**: Ensure all dependencies are installed with `npm install`
- **Deploy fails**: Check Firebase authentication with `firebase login`
- **404 errors**: Verify `firebase.json` rewrites configuration for SPA routing