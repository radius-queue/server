import {firestore} from '../firestore';
import {BusinessLocation, Business} from './business';

/**
 * upload Business object to firebase server.
 * if already exist replaces old entry, else creates new one
 * @param {Business} b business to be pushed to server
 */
export default function postBusiness(b : Business) {
  const data: any = {
    name: b.name,
    firstName: b.firstName,
    lastName: b.lastName,
    email: b.email,
    type: b.type,
    locations: b.locations.map((e) => BusinessLocation.toFirebase(e)),
  }
  firestore.collection('businesses').doc(b.uid).set(data);
}
