import {Customer, customerConverter} from './customer';
import {firestore} from '../firestore';
import { FirebaseError } from 'firebase-admin';

/**
 * Get Customer from database based on uid
 * @param {string} uid customer uid
 */
export default async function getCustomer(uid : string) {
  let ret: Customer | undefined;
  await firestore.collection('customer').doc(uid)
      .withConverter(customerConverter)
      .get().then(function(doc: FirebaseFirestore.DocumentData) {
        if (doc.exists) {
          const q: Customer | undefined = doc.data();
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
