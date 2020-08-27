import * as admin from 'firebase-admin';
import type {Request, Response} from 'express';

import type {Business} from '../util/business';
import {BusinessLocation} from '../util/business';
import {businessLocationToFirebase} from '../util/util-functions';

/**
 * GET /api/businesses
 * Retreival of all business information for a specific business
 * using the Radius service
 *
 * Query params:
 *  uid: the id of the business that is being retreived
 *
 * Body Content:
 *  None
 *
 * Response Result:
 *  object of type business that has the uid passed in
 *
 * Error Cases:
 *  400 -> No uid in query
 *  404 -> No business found with that uid
 *  500 -> Error in accessing firebase
 */
export const getBusiness = async (req : Request, res : Response) => {
  if (!req.query.uid) {
    res.status(400).send('Malformed Request');
    return;
  }

  const uid : string = req.query.uid as string;

  let result : Business | undefined;
  await admin.firestore().collection('businesses').doc(uid)
  .get().then(function(doc: admin.firestore.DocumentData) {
    if (doc.exists) {
      const data = doc.data();
      result = {
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        uid: '',
        type: data.type,
        locations: data.locations.map((e: any) => BusinessLocation.fromFirebase(data.type, e))
      }
    } else {
      res.sendStatus(404);
    }
  }).catch(function(error) {
    res.sendStatus(500);
  });

  if (!result) {
    return;
  }

  result.uid = uid;

  res.status(200).json(result);
};

/**
 * POST /api/businesses
 * Post of a businesses information upon registering or updating
 * their profile page
 *
 * Query params:
 *  None
 *
 * Body Content:
 *  JSON object with one property called "business" that
 *  holds the business' information.
 *
 * Response Result:
 *  Empty content with status of 201
 *
 * Error Cases:
 *  400 -> No business property in body
 *  500 -> Error in accessing firebase
 */
export const postBusiness = async (req : Request, res : Response) => {
  if (!req.body.business) {
    res.status(400).send('Malformed Request');
    return;
  }

  const business : Business = {
    ...req.body.business,
    locations: [businessLocationToFirebase(req.body.business.locations[0])],
  };

  try {
    await admin.firestore().collection('businesses').doc(business.uid).set(business);
  } catch(error) {
    res.sendStatus(500);
    return;
  }

  res.sendStatus(201);
};


/**
 * GET /api/businesses/:uid/location
 * Retreival of all business information for a specific business
 * using the Radius service
 *
 * Query params:
 *  uid: the id of the business that is being retreived
 *
 * Body Content:
 *  None
 *
 * Response Result:
 *  object of type BusinessLocation that has the uid passed in,
 *  and status 200.
 *
 * Error Cases:
 *  400 -> No uid in query
 *  404 -> No business found with that uid
 *  500 -> Error in accessing firebase
 */
export const getBusinessLocation =  async (req : Request, res : Response) => {
  if (!req.params.uid) {
    res.status(400).send('Malformed Request');
    return;
  }

  const uid : string= req.params.uid;

  let ret: BusinessLocation | undefined;
  await admin.firestore().collection('businesses').doc(uid)
    .get().then(function(doc: admin.firestore.DocumentData) {
      if (doc.exists) {
        const data = doc.data();
        ret =  BusinessLocation.fromFirebase(data.type, data.locations[0]);
      } else {
        res.sendStatus(404);
      }
    }).catch(() => {
      res.sendStatus(500);
    });

  if (!ret) {
    return;
  }

  res.status(200).json(ret);
};

/**
 * GET /api/business/locations/all
 * Retreival of all business location objects on file
 *
 * Query params:
 *  None
 *
 * Body Content:
 *  None
 *
 * Response Result:
 *  Array of BusinessLocation objects.
 *
 * Error Cases:
 *  500 -> Error in accessing firebase
 */
export const getAllLocations = async (req : Request, res : Response) => {
  const businesses = await admin.firestore().collection('businesses').get()
    .then((querySnap : admin.firestore.QuerySnapshot) => {
      return querySnap.docs.map((doc: admin.firestore.DocumentData) => {
        const data = doc.data();
        const ret = BusinessLocation.fromFirebase(data.type, data.locations[0]);
        ret.uid = data.uid;
        return ret;
      })
    }).catch(function(error) {
      res.status(500).send(error.message);
    });

  if (!businesses) {
    return;
  }

  res.status(200).json(businesses);
};


/**
 * GET /api/business/locations
 * Retreival of at most 10 business locations who's uid's are in the given
 * array
 *
 * Query params:
 *  None
 *
 * Body Content:
 *  an object with a single property locations that is an array
 *  of string uids.
 *
 * Response Result:
 *  Array of BusinessLocation objects.
 *
 * Error Cases:
 *  500 -> Error in accessing firebase
 */
export const getLocationsFromArray = async (req : Request, res : Response) => {
  if (!req.query.locations) {
    res.status(400).send('Malformed Request');
    return;
  }
  const locations = JSON.parse(req.query.locations as string);
  const result = await admin.firestore().collection('businesses').where('uid', 'in', locations).get()
    .then((snapshot: admin.firestore.QuerySnapshot) => {
        return snapshot.docs.map((doc : admin.firestore.DocumentData) => {
          const data = doc.data();
          const ret = BusinessLocation.fromFirebase(data.type, data.locations[0]);
          ret.uid = data.uid;
          return ret;
      })
    }).catch(function(error) {
      res.sendStatus(500);
    });

  if (!result) {
    return;
  }

  res.status(200).json(result);
};