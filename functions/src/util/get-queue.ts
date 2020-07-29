import {Queue, queueConverter, QueueInfo, queueInfoConverter} from './queue';
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
  let ret: QueueInfo | undefined;
  await firestore.collection('queues').doc(uid)
      .withConverter(queueInfoConverter)
      .get().then(function(doc: FirebaseFirestore.DocumentData) {
        if (doc.exists) {
          const q: QueueInfo | undefined = doc.data();
          // Use a City instance method
          ret = q;
        } else {
          console.log('No such document!');
        }
      }).catch(function(error: FirebaseError) {
        console.log('Error getting document:', error);
      });
      
  return ret;
}

