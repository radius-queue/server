
import {firestore} from '../firestore';
import {Business, businessConverter} from './business';
import { FirebaseError } from 'firebase-admin';

/**
 * Get Business from database based on uid
 * @param {string} uid business uid
 */
export default async function getBusiness(uid : string) {
  let ret: Business | undefined;
  await firestore.collection('businesses').doc(uid)
      .withConverter(businessConverter)
      .get().then(function(doc: FirebaseFirestore.DocumentData) {
        if (doc.exists) {
          const q: Business | undefined = doc.data();
          ret = q;
        } else {
          console.log('No such document!');
        }
      }).catch(function(error: FirebaseError) {
        console.log('Error getting document:', error);
      });

  if (ret) {
    ret.uid = uid;
  }
  return ret;
}
