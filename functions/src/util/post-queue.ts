/*import {firestore} from '../index';
import {Queue, Party} from './queue';

 * upload Queue object to firebase server.
 * if already exist replaces old entry, else creates new one
 * @param {Queue} q Queue object to be updated on the database

export default function postQueue(q : Queue) {
  const data : any = {
    name: q.name,
    parties: q.parties.map((e) => Party.toFirebase(e)),
    end: firestore.Timestamp.fromDate(q.end),
    open: q.open,
  };
  firestore.collection('queues').doc(q.uid).set(data);
}
*/
