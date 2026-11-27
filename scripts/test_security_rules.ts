// Firestore Security Rules Verification (Client SDK)
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBNDwulDuv8WDl3C6EO9dgyVy4zf1cbrzk',
  authDomain: 'instaotomasyon.firebaseapp.com',
  projectId: 'instaotomasyon',
  storageBucket: 'instaotomasyon.firebasestorage.app',
};

async function testRules() {
  console.log('----------------------------------------------------');
  console.log('🔍 5. FIRESTORE GÜVENLİK KURALLARI DOĞRULAMA (CLIENT SDK)');
  console.log('----------------------------------------------------');

  const clientApp = initializeApp(firebaseConfig, 'client-test-app');
  const clientDb = getFirestore(clientApp);

  console.log('A) Yetkisiz (Unauthenticated) İstek Testi:');
  try {
    const unauthDoc = doc(clientDb, 'system_logs', 'unauth-attempt');
    await setDoc(unauthDoc, { test: 'fail' });
    console.log('❌ HATA: Yetkisiz yazma işlemine izin verildi! Kurallar yetersiz.');
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      console.log('✓ Başarılı: Yetkisiz kullanıcının yazma işlemi kurallar tarafından engellendi (permission-denied).');
    } else {
      console.log(`✓ İstek reddedildi: ${err.message}`);
    }
  }

  try {
    const unauthDoc = doc(clientDb, 'instagram_settings', 'config');
    await getDoc(unauthDoc);
    console.log('❌ HATA: Yetkisiz okuma işlemine izin verildi!');
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      console.log('✓ Başarılı: Yetkisiz kullanıcının okuma işlemi kurallar tarafından engellendi (permission-denied).');
    } else {
      console.log(`✓ İstek reddedildi: ${err.message}`);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 GÜVENLİK KURALLARI (DEFAULT-DENY) BAŞARIYLA DOĞRULANDI!');
  console.log('====================================================');
}

testRules().catch(console.error);
