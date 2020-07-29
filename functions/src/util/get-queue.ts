import {Queue, Party, QueueInfo, diff_minutes} from './queue';
import {firestore} from '../firestore';
import { FirebaseError } from 'firebase-admin';

/**
 * Get Queue from database based on uid
 * @param {string} uid queue uid
 */
export default async function getQueue(uid : string) {
  let ret: Queue | undefined;
  await firestore.collection('queues').doc(uid)
      .get().then(function(doc: FirebaseFirestore.DocumentData) {
        if (doc.exists) {
          const data = doc.data();
          ret = {
            name: data.name,
            end: data.end.toDate(),
            uid: '',
            open: data.open,
            parties: data.parties.map((party: any)=> Party.fromFirebase(party)),
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

export async function getQueueInfo(uid : string) {
  let ret : QueueInfo | undefined;
  await firestore.collection('queues').doc(uid)
      .get().then(function(doc: FirebaseFirestore.DocumentData) {
        if (doc.exists) {
          const data = doc.data();
          ret = {
            length: data.parties.length,
            longestWaitTime: diff_minutes(data.parties[0].checkIn.toDate(), new Date()),
            open: data.open,
          }
        } else {
          console.log('No such document!');
        }
      }).catch(function(error: FirebaseError) {
        console.log('Error getting document:', error);
      });
      
  return ret;
}

