import {Customer} from './customer';
import {firestore} from '../firestore';
import { FirebaseError } from 'firebase-admin';

/**
 * Get Customer from database based on uid
 * @param {string} uid customer uid
 */
export default async function getCustomer(uid : string) {
  let ret: Customer | undefined;
  await firestore.collection('customer').doc(uid)
      .get().then(function(doc: FirebaseFirestore.DocumentData) {
        if (doc.exists) {
          const data = doc.data();
          ret = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            uid: '',
            currentQueue: data.currentQueue,
            favorites: data.favorites,
            recents: data.recents,
          };
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
