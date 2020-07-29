const admin = require('firebase-admin');

export const firestore = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();