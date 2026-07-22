import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import {
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// نفس مشروع Firebase الحالي المستخدم في تطبيق Flutter (my-university-cc6bc).
// لا يوجد أي تغيير في المشروع أو الـ Collections أو الـ Security Rules.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// مطابقة لإعدادات Flutter: persistenceEnabled + cacheSizeBytes unlimited.
// (webExperimentalForceLongPolling غير مطلوب هنا لأن SDK الويب لا يواجه
// نفس قيود الشبكات الجامعية بطريقة Flutter، لكن يمكن تفعيله لاحقًا إذا احتجنا).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }),
});

export const auth = getAuth(app);
