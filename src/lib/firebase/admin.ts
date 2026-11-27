// Firebase Admin SDK Configuration (Server-Side only)
import fs from 'fs';
import path from 'path';

let adminDb: any = null;
let adminAuth: any = null;
let adminStorage: any = null;
let hasValidCredentials = false;

export function getAdminApp(): any {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  const hasLocalKey = fs.existsSync(localKeyPath);
  const hasGcpCredentials = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE);

  if (!serviceAccountJson && !hasLocalKey && !hasGcpCredentials) {
    return null;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'instaotomasyon';
  const storageBucket = `${projectId}.firebasestorage.app`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const existingApps = getApps();
    if (existingApps.length > 0) {
      return existingApps[0]!;
    }

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

export function getAdminDb(): any {
  if (adminDb) return adminDb;
  const app = getAdminApp();
  if (app && hasValidCredentials) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getFirestore } = require('firebase-admin/firestore');
      adminDb = getFirestore(app);
      return adminDb;
    } catch (e) {
      console.warn('Firestore admin db init warning:', e);
    }
  }
  return null;
}

export function getAdminAuth(): any {
  if (adminAuth) return adminAuth;
  const app = getAdminApp();
  if (app && hasValidCredentials) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAuth } = require('firebase-admin/auth');
      adminAuth = getAuth(app);
      return adminAuth;
    } catch (e) {
      console.warn('Auth admin init warning:', e);
    }
  }
  return null;
}

export function getAdminStorage(): any {
  if (adminStorage) return adminStorage;
  const app = getAdminApp();
  if (app && hasValidCredentials) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getStorage } = require('firebase-admin/storage');
      adminStorage = getStorage(app);
      return adminStorage;
    } catch (e) {
      console.warn('Storage admin init warning:', e);
    }
  }
  return null;
}
