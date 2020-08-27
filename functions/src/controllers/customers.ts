import * as admin from 'firebase-admin';
import type {Request, Response} from 'express';
import { Customer } from '../util/customer';

/**
 * GET /api/customers
 * Retreival of customer information
 *
 * Query params:
 *  uid: the id of the customer that is being retreived
 *
 * Body Content:
 *  None
 *
 * Response Result:
 *  object of type Customer that has the uid passed in,
 *  and status 200.
 *
 * Error Cases:
 *  400 -> No uid in query
 *  404 -> No customer found with that uid
 *  500 -> Error in accessing firebase
 */
export const getCustomer = async (req : Request, res : Response) => {
  if (!req.query.uid) {
    res.status(400).send('Malformed Request');
    return;
  }

  const uid: string = req.query.uid as string;

  let ret : Customer | undefined;
  await admin.firestore().collection('customer').doc(uid)
    .get().then(function(doc: FirebaseFirestore.DocumentData) {
      if (doc.exists) {
        const data = doc.data();
        ret = {
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          uid: '',
          currentQueue: data.currentQueue,
          favorites: data.favorites,
          recents: data.recents,
          pushToken: data.pushToken,
        };
      } else {
        res.sendStatus(404);
      }
    }).catch((error) => {
      res.sendStatus(500);
    });

  if (!ret) {
    return;
  }

  ret.uid = uid;

  res.status(200).json(ret);
};

/**
 * POST /api/customers
 * Post of customer information upon adding a favorite, recent
 * or updating information
 *
 * Query params:
 *  None
 *
 * Body Content:
 *  JSON object with one property called "customer" that
 *  holds the customer information.
 *
 * Response Result:
 *  Empty content object with status of 201
 *
 * Error Cases:
 *  400 -> No customer property in body
 *  500 -> Error in accessing firebase
 */
export const postCustomer = async (req : Request, res : Response) => {
  if (!req.body.customer) {
    res.status(400).send('Malformed Request');
    return;
  }

  const {customer} = req.body;

  try {
    await admin.firestore().collection('customer').doc(customer.uid).set(customer);
  } catch(error) {
    res.sendStatus(500);
    return;
  }

  res.sendStatus(201);
};

/**
 * POST /api/customers/new
 * Creation of a new customer
 *
 * Query params:
 *  uid: the uid of the new Customer
 *
 * Body Content:
 *  None
 *
 * Response Result:
 *  JSON object that represents a brand new queue that can
 *  be manipulated by the client, has status of 201
 *
 * Error Cases:
 *  400 -> No uid or name in query
 *  500 -> Error in accessing firebase
 */
export const newCustomer = async (req : Request, res : Response) => {
  if (!req.query.uid || !req.query.pushToken) {
      res.status(400).send('Malformed Request');
      return;
  }

  const result : Customer = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    uid: req.query.uid as string,
    currentQueue: '',
    recents: [],
    favorites: [],
    pushToken: req.query.pushToken === 'NO_ID' ? '' : req.query.pushToken as string,
  };

  try {
    await admin.firestore().collection('customer').doc(result.uid).set(result);
  } catch(error) {
    res.sendStatus(500);
    return;
  }

  res.status(201).json(result);
};