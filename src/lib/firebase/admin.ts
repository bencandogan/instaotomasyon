// Firebase Admin SDK Configuration (Server-Side only)
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;
let adminStorage: Storage | null = null;
let hasValidCredentials = false;

export function getAdminApp(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0]!;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  const hasLocalKey = fs.existsSync(localKeyPath);
  const hasGcpCredentials = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE);

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'instaotomasyon';
  const storageBucket = `${projectId}.firebasestorage.app`;

  try {
    if (serviceAccountJson) {
      const parsedAccount = JSON.parse(serviceAccountJson);
      hasValidCredentials = true;
      return initializeApp({
        credential: cert(parsedAccount),
        projectId: parsedAccount.project_id || projectId,
        storageBucket,
      });
    }

    if (hasLocalKey) {
      const raw = fs.readFileSync(localKeyPath, 'utf8');
      const parsed = JSON.parse(raw);
      hasValidCredentials = true;
      return initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
        storageBucket,
      });
    }

    if (hasGcpCredentials) {
      hasValidCredentials = true;
      return initializeApp({
        projectId,
        storageBucket,
      });
    }

    return null;
  } catch (error) {
    console.warn('Firebase Admin init warning:', error);
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  if (adminDb) return adminDb;
  const app = getAdminApp();
  if (app && hasValidCredentials) {
    try {
      adminDb = getFirestore(app);
      return adminDb;
    } catch (e) {
      console.warn('Firestore admin db init warning:', e);
    }
  }
  return null;
}

export function getAdminAuth(): Auth | null {
  if (adminAuth) return adminAuth;
  const app = getAdminApp();
  if (app && hasValidCredentials) {
    try {
      adminAuth = getAuth(app);
      return adminAuth;
    } catch (e) {
      console.warn('Auth admin init warning:', e);
    }
  }
  return null;
}

export function getAdminStorage(): Storage | null {
  if (adminStorage) return adminStorage;
  const app = getAdminApp();
  if (app && hasValidCredentials) {
    try {
      adminStorage = getStorage(app);
      return adminStorage;
    } catch (e) {
      console.warn('Storage admin init warning:', e);
    }
  }
  return null;
}
