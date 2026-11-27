// Production Verification Script: Firebase Real Connectivity Test
import { getAdminApp, getAdminDb, getAdminAuth, getAdminStorage } from '../src/lib/firebase/admin';

async function verifyFirebaseProduction() {
  console.log('----------------------------------------------------');
  console.log('🔍 1. FIREBASE INSTAOTOMASYON BAĞLANTI DOĞRULAMA');
  console.log('----------------------------------------------------');

  const app = getAdminApp();
  if (!app) {
    throw new Error('Firebase Admin App başlatılamadı. serviceAccountKey.json bulunamadı.');
  }
  console.log(`✓ Firebase Admin App başlatıldı. Proje ID: ${app.options.projectId}`);
  console.log(`✓ Storage Bucket: ${app.options.storageBucket}`);

  console.log('\n----------------------------------------------------');
  console.log('🔍 2. FIRESTORE GERÇEK VERİ YAZMA VE OKUMA TESTİ');
  console.log('----------------------------------------------------');

  const db = getAdminDb();
  if (!db) {
    throw new Error('Firestore instance alınamadı.');
  }

  const testDocRef = db.collection('system_logs').doc('verify-live-test');
  const now = new Date().toISOString();
  await testDocRef.set({
    id: 'verify-live-test',
    level: 'INFO',
    module: 'SYSTEM',
    action: 'PRODUCTION_VERIFICATION',
    message: 'Canlı Firestore bağlantısı başarıyla doğrulandı.',
    timestamp: now,
  });
  console.log('✓ Firestore "system_logs" koleksiyonuna test dokümanı yazıldı.');

  const readDoc = await testDocRef.get();
  if (!readDoc.exists) {
    throw new Error('Firestore yazılan test dokümanı okunamadı!');
  }
  console.log(`✓ Firestore test dokümanı başarıyla okundu: "${readDoc.data()?.message}"`);

  console.log('\n----------------------------------------------------');
  console.log('🔍 3. FIREBASE AUTHENTICATION TESTİ');
  console.log('----------------------------------------------------');

  const auth = getAdminAuth();
  if (!auth) {
    throw new Error('Firebase Auth instance alınamadı.');
  }

  const adminEmail = 'admin@evlilikilanlari.com';
  let adminUid = '';

  try {
    const existingUser = await auth.getUserByEmail(adminEmail);
    adminUid = existingUser.uid;
    console.log(`✓ Mevcut Admin kullanıcısı bulundu: UID=${adminUid}, Email=${existingUser.email}`);
  } catch (e: any) {
    if (e.code === 'auth/user-not-found') {
      const newUser = await auth.createUser({
        email: adminEmail,
        password: 'AdminPassword2026!Secure',
        displayName: 'Evlilik İlanları Süper Admin',
      });
      adminUid = newUser.uid;
      console.log(`✓ Yeni Admin kullanıcısı oluşturuldu: UID=${adminUid}, Email=${newUser.email}`);
    } else {
      throw e;
    }
  }

  // Set Custom User Claims for Admin role
  await auth.setCustomUserClaims(adminUid, { admin: true, role: 'admin' });
  console.log('✓ Admin kullanıcısına custom claims eklendi: { admin: true, role: "admin" }');

  // Verify Admin document in Firestore 'admin_users'
  const adminUserDoc = db.collection('admin_users').doc(adminUid);
  await adminUserDoc.set(
    {
      email: adminEmail,
      role: 'admin',
      displayName: 'Evlilik İlanları Süper Admin',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
  console.log('✓ Firestore "admin_users" koleksiyonundaki yönetici kaydı güncellendi.');

  console.log('\n----------------------------------------------------');
  console.log('🔍 4. FIREBASE STORAGE YÜKLEME VE İNDİRME TESTİ');
  console.log('----------------------------------------------------');

  const storage = getAdminStorage();
  if (!storage) {
    throw new Error('Firebase Storage instance alınamadı.');
  }

  const bucket = storage.bucket();
  console.log(`✓ Storage Bucket hedefleniyor: ${bucket.name}`);

  const testFileName = `tests/verify-test-${Date.now()}.txt`;
  const file = bucket.file(testFileName);
  const testContent = `Evlilik İlanları Reels Otomasyon Canlı Storage Testi - ${now}`;

  await file.save(testContent, {
    contentType: 'text/plain',
    metadata: {
      customMetadata: {
        verifiedBy: 'Antigravity AI Agent',
      },
    },
  });
  console.log(`✓ Firebase Storage'a test dosyası yüklendi: ${testFileName}`);

  const [downloadedBuffer] = await file.download();
  const downloadedContent = downloadedBuffer.toString('utf8');
  if (downloadedContent !== testContent) {
    throw new Error('Storage indirilen dosya içeriği uyuşmuyor!');
  }
  console.log(`✓ Firebase Storage'dan dosya indirildi ve doğrulandı: "${downloadedContent}"`);

  // Clean up test file
  await file.delete();
  console.log('✓ Test dosyası temizlendi.');

  console.log('\n====================================================');
  console.log('🎉 FIREBASE TEMEL BAĞLANTI VE SERVİSLERİ TAMAMEN ÇALIŞIYOR!');
  console.log('====================================================');
}

verifyFirebaseProduction().catch((err) => {
  console.error('❌ Doğrulama Hatası:', err);
  process.exit(1);
});
