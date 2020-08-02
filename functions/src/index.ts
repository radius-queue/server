import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as express from 'express';

const cors = require('cors');
const app = express();


admin.initializeApp();

app.use(cors({origin: true}));

const firestore = admin.firestore();
const storage = admin.storage();

const mkdirp = require('mkdirp');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');
//const gcs = require('@google-cloud/storage')();
const sharp = require('sharp');

import {Business, BusinessLocation} from './util/business';
import {Customer} from './util/customer';
import { Queue, Party, QueueInfo } from './util/queue';


/**
 * ALL NATIVE JS OBJECTS MUST BE CONVERTED TO STRINGS PRIOR TO
 * SENDING, AND CONVERTED BACK TO NATIVE JS OBJECTS UPON RETREIVAL
 */

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
app.get('/api/businesses', async (req, res) => {
  let uid : string | undefined;
  try {
    uid = req.query.uid as string;
  } catch {
    res.status(400).send('Malformed Request');
  }

  let result : Business | undefined;
  await firestore.collection('businesses').doc(uid!)
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
    } else {
      res.sendStatus(404);
    }
  }).catch(function() {
    res.sendStatus(500);
  });

 result!.uid = uid!;

  res.status(200).json(result!);
});


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
app.post('/api/businesses', async (req, res) => {

  let business : Business | undefined;
  try {
    business = {
      ...req.body.business,
      locations: [businessLocationToFirebase(req.body.business.locations[0])],
    };
  } catch {
    res.status(400).send('Malformed Request');
  }

  try {
    await firestore.collection('businesses').doc(business!.uid).set(business!);
  } catch {
    res.sendStatus(500);
  }

  res.sendStatus(201);
});

/**
 * GET /api/queues
 * Retreival of queue information for a specified business
 * 
 * Query params: 
 *  uid: the id of the business whose queue is being retreived
 * 
 * Body Content: 
 *  None
 * 
 * Response Result:
 *  object of type Queue from the business whose uid is passed in
 * 
 * Error Cases:
 *  400 -> No uid in query
 *  404 -> No queue found with that uid
 *  500 -> Error in accessing firebase
 */
app.get('/api/queues', async (req, res) => {
  let uid : string | undefined;
  try {
    uid = req.query.string as string;
  } catch {
    res.status(400).send('Malformed Request');
  }

  let ret : Queue | undefined;
  await firestore.collection('queues').doc(uid!)
    .get().then(function(doc: admin.firestore.DocumentData) {
      if (doc.exists) {
        const data = doc.data();
        ret = {
          name: data.name,
          uid: '',
          open: data.open,
          parties: data.parties.map((party: any)=> Party.fromFirebase(party)),
        }
      } else {
        res.sendStatus(404);
      }
    }).catch(function(error) {
      res.sendStatus(500);
    });

  ret!.uid = uid!;

  res.status(200).json(ret!);

});



/**
 * POST /api/queues
 * Post of a businesses' queue information
 * 
 * Query params: 
 *  None
 * 
 * Body Content:
 *  JSON object with one property called "queue" that
 *  holds the business' queue information.
 * 
 * Response Result:
 *  Empty content with status of 201
 * 
 * Error Cases:
 *  400 -> No queue property in body
 *  500 -> Error in accessing firebase
 */
app.post('/api/queues', async (req, res) => {

  let  queue : any;
  let data: Queue | undefined;
  try {
    queue = req.body.queue;
    data = {
      name: queue.name,
      parties: queue.parties.map((e: any) => partyToFirebase(e)),
      open: queue.open,
      uid: queue.uid,
    };
  } catch (error) {
    res.status(400).send('Malformed Request');
  }

  try {
    await firestore.collection('queues').doc(queue.uid).set(data!);
  } catch (error) {
    res.sendStatus(500);
  }

  res.sendStatus(201);

});

/**
 * POST /api/queues/new
 * Creation of a new queue for the specified business
 * 
 * Query params: 
 *  uid: the id of the business whom creation is taking place
 *  name: the name of the queue's business
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
app.post('/api/queues/new', async (req, res) => {
  let name : string | undefined;
  let uid : string | undefined; 

  try {
    name = req.query.name as string;
    uid = req.query.uid as string;
  } catch (error) {
    res.status(400).send('Malformed Request');
  }

  const newQueue : Queue= {
    name: name!,
    uid: uid!,
    open: false,
    parties: [],
  };

  try {
    await firestore.collection('queues').doc(newQueue.uid).set(newQueue);
  } catch (error) {
    res.status(500).send(error.message);
  }

  res.status(201).json(newQueue);
});

/**
 * GET /api/businesses/locations
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
app.get('/api/businesses/locations', async (req, res) => {
  let uid : string | undefined;
  try {
    uid = req.query.uid as string;
  } catch {
    res.status(400).send('Malformed Request');
  }

  let ret: BusinessLocation | undefined;
  await firestore.collection('businesses').doc(uid!)
    .get().then(function(doc: admin.firestore.DocumentData) {
      if (doc.exists) {
        const data = doc.data().locations[0];
        ret =  BusinessLocation.fromFirebase(data);
      } else {
        res.sendStatus(404);
      }
    }).catch(() => {
      res.sendStatus(500);
    });

  res.status(200).json(ret!);
});

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
app.get('/api/customers', async (req, res) => {
  let uid: string | undefined;
  try {
    uid = req.query.uid as string;
  } catch (error) {
    res.status(400).send('Malformed Request');
  }

  let ret : Customer | undefined;
  await firestore.collection('customer').doc(uid!)
    .get().then(function(doc: FirebaseFirestore.DocumentData) {
      if (doc.exists) {
        const data = doc.data();
        ret = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          uid: '',
          currentQueue: data.currentQueue,
          favorites: data.favorites,
          recents: data.recents,
        };
      } else {
        res.sendStatus(404);
      }
    }).catch(() => {
      res.sendStatus(500);
    });
    
  ret!.uid = uid!;

  res.status(200).json(ret!);
});

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
app.post('/api/customers', async (req, res) => {
  let customer : Customer | undefined;
  try {
    customer = req.body.customer;
  } catch {
    res.status(400).send('Malformed Request');
  }

  try {
    await firestore.collection('customer').doc(customer!.uid).set(customer!);
  } catch {
    res.sendStatus(500);
  }

  res.sendStatus(201);
});

/**
 * POST /api/customers/new
 * Creation of a new customer
 * 
 * Query params: 
 *  None
 * 
 * Body Content:
 *  JSON object with the following properties: {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phoneNumber: string,
 *   uid: string,
 * }
 * 
 * Response Result:
 *  JSON object that represents a brand new queue that can
 *  be manipulated by the client, has status of 201
 * 
 * Error Cases:
 *  400 -> No uid or name in query
 *  500 -> Error in accessing firebase
 */
app.post('/api/customers/new', async (req, res) => {
  let customer : any;
  let result : Customer | undefined;

  try {
    customer = req.body.customer;
    result = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      uid: customer.uid,
      currentQueue: '',
      recents: [],
      favorites: [],
    };
  } catch {
    res.status(400).send('Malformed Request');
  } 

  try {
    await firestore.collection('customer').doc(customer.uid).set(result!);
  } catch {
    res.sendStatus(500);
  }

  res.status(201).json(result!);

})

/**
 * GET /api/queues
 * Retreival of queue status information for a specified business
 * 
 * Query params: 
 *  uid: the id of the business whose queue is being retreived
 * 
 * Body Content: 
 *  None
 * 
 * Response Result:
 *  object of type QueueInfo from the business whose uid is passed in.
 *  Consists of the length, status and longest wait time for the queue.
 * 
 * Error Cases:
 *  400 -> No uid in query
 *  404 -> No queue found with that uid
 *  500 -> Error in accessing firebase
 */
app.get('/api/queues/info', async (req, res) => {
  let uid : string | undefined;
  try {
    uid = req.query.uid as string;
  } catch {
    res.status(400).send('Malformed Request');
  }

  let result : QueueInfo | undefined;

  await firestore.collection('queues').doc(uid!)
    .get().then(function(doc: FirebaseFirestore.DocumentData) {
      if (doc.exists) {
        const data = doc.data();
        result = {
          length: data.parties.length,
          longestWaitTime: diff_minutes(data.parties[0].checkIn.toDate(), new Date()),
          open: data.open,
        }
      } else {
        res.sendStatus(404);
      }
    }).catch(() => {
      res.sendStatus(500);
    });

  res.status(200).json(result!);
})

exports.widgets = functions.https.onRequest(app);

// Listeners functions:

// Customer profile init - empty recents etc


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

function diff_minutes(dt2: Date, dt1: Date) {
  let diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

const JPEG_EXTENSION = '.jpg';
const IMAGE_MAX_WIDTH = 1080;
const IMAGE_MAX_HEIGHT = 1350;

/**
 * When an image is uploaded in the Storage bucket it is converted to JPEG,
 * and resized
 */
exports.imageToJPG = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name; // File path in the bucket.
  const baseFileName = path.basename(filePath, path.extname(filePath)); // file name without extension
  const fileDir = path.dirname(filePath); // Directory of the file
  const JPEGFilePath = path.normalize(path.format({dir: fileDir, name: baseFileName, ext: JPEG_EXTENSION})); // final path
  const tempLocalFile = path.join(os.tmpdir(), filePath); // Copy of file in temp
  const tempLocalDir = path.dirname(tempLocalFile); // temp directory
  const tempLocalJPEGFile = path.join(os.tmpdir(), JPEGFilePath); // JPEG version of file in temp
  const contentType = object.contentType; // File content type.
  const metadata = {
    contentType: contentType,
  };

  // Exit if this is triggered on a file that is not an image.
  if (!contentType!.startsWith('image/')) {
    console.log('This is not an image.');
    return null;
  }

  const bucket = storage.bucket(object.bucket);
  // Create the temp directory where the storage file will be downloaded.
  await mkdirp(tempLocalDir);
  // Download file from bucket.
  await bucket.file(filePath!).download({destination: tempLocalFile});
  //console.log('The file has been downloaded to', tempLocalFile);

  // if the image is not JPEG.
  if (!object.contentType!.startsWith('image/jpeg')) {
    // Convert the image to JPEG using ImageMagick.
    await spawn('convert', [tempLocalFile, tempLocalJPEGFile]);
    //console.log('JPEG image created at', tempLocalJPEGFile);
  }

  const thumbnailUploadStream = bucket.file(JPEGFilePath).createWriteStream({metadata});

  // Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
  const pipeline = sharp();
  pipeline.resize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT).max().pipe(thumbnailUploadStream);

  bucket.file(tempLocalJPEGFile).createReadStream().pipe(pipeline);

  const resizeMessage = await new Promise((resolve, reject) =>
      thumbnailUploadStream.on('finish', resolve).on('error', reject));
  console.log(resizeMessage);

  if (resizeMessage === 'finish') {
    // delete old image
    bucket.file(filePath!).delete().then(() => {
      console.log(`Successfully deleted photo ${filePath}`)
    }).catch(err => {
        console.log(`Failed to remove photo, error: ${err}`)
    });
  }

  // Once the image has been converted delete the local files to free up disk space.
  fs.unlinkSync(tempLocalJPEGFile);
  fs.unlinkSync(tempLocalFile);
  return null;
});
