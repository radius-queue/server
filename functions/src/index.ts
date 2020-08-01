import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();


import * as express from 'express';
const app = express();

const cors = require('cors');
app.use(cors({origin: true}));

const firestore = admin.firestore();
//const auth = admin.auth();
//const storage = admin.storage();

import {BusinessLocation} from './util/business';
import { Queue, Party } from './util/queue';


// Callable functions:
// Website functions

// Full business
// - push
// - pull
// Full Queue -- parties (one time call, pull)

/**
 * ALL DATE OBJECTS ARE RETURNED AS DATE STRINGS,
 * MUST CONVERT TO DATE OBJECTS UPON RETREIVAL
 */

app.get('/api/businesses', async (req, res) => {
  const uid : string = req.query.uid as string;

  let result : any;
  await firestore.collection('businesses').doc(uid)
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
        locations: data.locations.map((e: any) => BusinessLocation.fromFirebase(e))
      }
    }
  }).catch(function() {
    res.sendStatus(500);
  });

  if (result) {
    result.uid = uid;
  }

  res.status(200).json(result);
});



app.post('/api/businesses', async (req, res) => {

  const business = {
    ...req.body.business,
    locations: [businessLocationToFirebase(req.body.business.locations[0])],
  };


  await firestore.collection('businesses').doc(business.uid).set(business);

  res.sendStatus(201);
});


/**
 * returns a queue wherein each party object's date fields are string
 * representations. Make sure to convert back to Date objects upon retreival.
 */
app.get('/api/queues', async (req, res) => {
  const uid : string = req.query.uid as string;

  let ret : any;
  await firestore.collection('queues').doc(uid)
      .get().then(function(doc: admin.firestore.DocumentData) {
        if (doc.exists) {
          const data = doc.data();
          ret = {
            name: data.name,
            uid: '',
            open: data.open,
            parties: data.parties.map((party: any)=> Party.fromFirebase(party)),
          }
        }
      }).catch(function(error) {
        res.status(500).send('Error On Firestore Entry');
      });

  if (ret) {
    ret.uid = uid;
  }

  res.status(200).json(ret);

});




app.post('/api/queues', async (req, res) => {

  const queue : Queue = req.body.queue;
  let data;
  try {
    data = {
      name: queue.name,
      parties: queue.parties.map((e) => partyToFirebase(e)),
      open: queue.open,
    };
    await firestore.collection('queues').doc(queue.uid).set(data);
  } catch (error) {
    res.status(500).send(error.message);
  }

  res.sendStatus(201);
 
});





app.get('/api/queues/new', async (req, res) => {

  const name : string = req.query.name as string;
  const uid : string = req.query.uid as string;

  const queueParams : [string, string, boolean, Party[]]= [
    name,
    uid,
    false,
    []
  ];

  const newQueue = new Queue(...queueParams);

  try {
    await firestore.collection('queues').doc(newQueue.uid).set({...newQueue});
  } catch (error) {
    res.status(500).send(error.message);
  }
  
  res.status(201).json({...newQueue});
});



// App functions

// Business location - pull
app.get('/api/businesses/locations', async (req, res) => {

  const uid : string = req.query.uid as string;

  let ret: BusinessLocation | undefined;
  await firestore.collection('businesses').doc(uid)
      .get().then(function(doc: admin.firestore.DocumentData) {
        if (doc.exists) {
          const data = doc.data().locations[0];
          ret =  BusinessLocation.fromFirebase(data);
        } 
      }).catch(function(error: admin.FirebaseError) {
        console.log('Error getting document:', error);
      });
  

  res.status(200).json(ret);
});

exports.widgets = functions.https.onRequest(app);

// Customer profile
// - push
// - pull


// TODO:

  // getCustomer
  // postCustomer
  // getQueueInfo


// Listeners functions:

// Customer profile init - empty recents etc


/*function locationToFirebase(location: BusinessLocation): any {
  return {
    name: location.name,
    address: location.address,
    phoneNumber: location.phoneNumber,
    hours: BusinessLocation.hoursToFirebase(location.hours), // need fixing
    coordinates: new admin.firestore.GeoPoint(
        location.coordinates[0],
        location.coordinates[1],
    ),
    queues: location.queues,
    geoFenceRadius: location.geoFenceRadius,
  };
};*/

function partyToFirebase(party: Party): any {
  return {
    firstName: party.firstName,
    size: party.size,
    phoneNumber: party.phoneNumber,
    quote: party.quote,
    checkIn: party.checkIn,
    lastName: party.lastName,
    messages: messageToFB(party.messages),
  };
}

function messageToFB(messages: [string, string][]) : any[] {
  const ret : any[] = [];
  if (messages) {
    for (const message of messages) {
      const entry = {
        date: message[0],
        message: message[1],
      };
      ret.push(entry);
    }
  }
  return ret;
}

function businessLocationToFirebase(location: any) {
  return {
    name: location.name,
    address: location.address,
    phoneNumber: location.phoneNumber,
    hours: BusinessLocation.hoursToFirebase(location.hours), // need fixing
    coordinates: new admin.firestore.GeoPoint(
        location.coordinates[0],
        location.coordinates[1],
    ),
    queues: location.queues,
    geoFenceRadius: location.geoFenceRadius,
  };
}