
import {firestore} from '../firestore';
import {Business, BusinessLocation} from './business';
import { FirebaseError } from 'firebase-admin';

/**
 * Get Business from database based on uid
 * @param {string} uid business uid
 */
export default async function getBusiness(uid : string) {
  let ret: Business | undefined;
  await firestore.collection('businesses').doc(uid)
      .get().then(function(doc: FirebaseFirestore.DocumentData) {
        if (doc.exists) {
          const data = doc.data();
          ret = {
            name: data.name,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            uid: '',
            type: data.type,
            locations: data.locations.map((e: any) => BusinessLocation.fromFirebase(e))
          }
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

export async function getBusinessLocation(uid : string) {
  let ret: BusinessLocation | undefined;
  await firestore.collection('businesses').doc(uid)
      .get().then(function(doc: FirebaseFirestore.DocumentData) {
        if (doc.exists) {
          const data = doc.data().locations[0];
          ret =  BusinessLocation.fromFirebase(data);
        } else {
          console.log('No such document!');
        }
      }).catch(function(error: FirebaseError) {
        console.log('Error getting document:', error);
      });
  return ret;
}