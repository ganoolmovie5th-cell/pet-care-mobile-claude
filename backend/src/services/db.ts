import * as admin from 'firebase-admin';

// ponytail: lazy singleton — initialize once, reuse everywhere
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
