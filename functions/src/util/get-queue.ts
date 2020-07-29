import {Queue, queueConverter, QueueInfo, diff_minutes} from './queue';
import {firestore} from '../firestore';
import { FirebaseError } from 'firebase-admin';

/**
 * Get Queue from database based on uid
 * @param {string} uid queue uid
 */
export default async function getQueue(uid : string) {
  let ret: Queue | undefined;
  await firestore.collection('queues').doc(uid)
      .withConverter(queueConverter)
      .get().then(function(doc: FirebaseFirestore.DocumentData) {
        if (doc.exists) {
          const q: Queue | undefined = doc.data();
          // Use a City instance method
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

export async function getQueueInfo(uid : string) {
  let ret : QueueInfo = {
    length: 0,
    longestWaitTime : 0,
    open: true,
  };
  await firestore.collection('queues').doc(uid)
      .get().then(function(doc: FirebaseFirestore.DocumentData) {
        if (doc.exists) {
          ret.length = doc.data().parties.length;
          ret.longestWaitTime = diff_minutes(doc.data().parties[0].checkIn.toDate(), new Date())
          ret.open = doc.data().open;

          // Use a City instance method
        } else {
          console.log('No such document!');
        }
      }).catch(function(error: FirebaseError) {
        console.log('Error getting document:', error);
      });
  return ret;
}

