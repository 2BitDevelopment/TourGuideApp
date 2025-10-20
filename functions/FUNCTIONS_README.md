# Firebase Functions - Deployment Guide

This directory contains Firebase Cloud Functions for the St. George's Cathedral Tour Guide App, providing backend analytics and data processing capabilities.

## Setup

1. Install dependencies:
```bash
cd functions
npm install
```

2. Build the functions:
```bash
npm run build
```

## Deployment

### Deploy All Functions
```bash
firebase deploy --only functions
```

### Deploy Specific Function
```bash
firebase deploy --only functions:functionName
```

### Local Development
To test functions locally:
```bash
npm run serve
```

## Project Structure

- `src/index.ts` - Main functions entry point
- `src/config.ts` - Firebase configuration
- `package.json` - Dependencies and build scripts
- `tsconfig.json` - TypeScript configuration

## Prerequisites

- Firebase CLI installed globally: `npm install -g firebase-tools`
- Firebase project configured with `firebase init`
- Proper authentication: `firebase login`

## Notes

- Functions are written in TypeScript and compiled to JavaScript before deployment
- The build process is handled by `npm run build` which compiles TypeScript files
- All functions use Firebase Admin SDK for backend operations