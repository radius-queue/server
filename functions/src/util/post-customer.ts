import {Customer} from './customer';
import {firestore} from '../firestore';

/**
 * upload Customer object to firebase server.
 * if already exist replaces old entry, else creates new one
 * @param {Customer} c customer object to be pushed to database
 */
export default function postCustomer(c : Customer) {
  const data: any = {
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phoneNumber: c.phoneNumber,
    currentQueue: c.currentQueue,
    favorites: c.favorites,
    recents: c.recents,
  };
  return firestore.collection('customer').doc(c.uid).set(data);
}
