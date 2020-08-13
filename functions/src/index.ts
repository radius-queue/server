import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as express from 'express';

const cors = require('cors');
const app = express();


admin.initializeApp();

app.use(cors({origin: true}));

const firestore = admin.firestore();
// const storage = admin.storage();

// const mkdirp = require('mkdirp');

const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const sharp = require('sharp');
import { Storage } from '@google-cloud/storage';

import {Business, BusinessLocation} from './util/business';
import {Customer} from './util/customer';
import { Queue, Party, QueueInfo } from './util/queue';

/**
 * Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
 * The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
 * `Authorization: Bearer <Firebase ID Token>`.
 */
const authentication = async (req: express.Request, res: express.Response, next: () => any) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(403).send('Unauthorized');
    return;
  }
  const idToken : string = req.headers.authorization.split('Bearer ')[1];
  try {
    await admin.auth().verifyIdToken(idToken);
    next();
    return;
  } catch(error) {
    res.status(403).send('Unauthorized');
    return;
  }
}

app.use(authentication);

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
  if (!req.query.uid) {
    res.status(400).send('Malformed Request');
    return;
  }

  const uid : string = req.query.uid as string;

  let result : Business | undefined;
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
  if (!req.body.business) {
    res.status(400).send('Malformed Request');
    return;
  }

  const business : Business = {
    ...req.body.business,
    locations: [businessLocationToFirebase(req.body.business.locations[0])],
  };

  try {
    await firestore.collection('businesses').doc(business.uid).set(business);
  } catch(error) {
    res.sendStatus(500);
    return;
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
  if (!req.query.uid) {
    res.status(400).send('Malformed Request');
    return;
  }

  const uid : string = req.query.uid as string;

  let ret : Queue | undefined;
  await firestore.collection('queues').doc(uid)
    .get().then(function(doc: admin.firestore.DocumentData) {
      if (doc.exists) {
        const data = doc.data();
        ret = {
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

  if (!ret) {
    return;
  }

  ret.uid = uid;

  res.status(200).json(ret);

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
  if (!req.body.queue || !req.body.queue.parties) {
    res.status(400).send('Malformed Request');
    return;
  }

  const queue : any = req.body.queue;
  queue.parties = queue.parties.map((e: any) => partyToFirebase(e));

  try {
    await firestore.collection('queues').doc(queue.uid).set(queue);
  } catch (error) {
    res.sendStatus(500);
    return;
  }

  res.sendStatus(201);

});

/**
 * POST /api/queues/new
 * Creation of a new queue for the specified business
 *
 * Query params:
 *  uid: the id of the business whom creation is taking place
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
  if (!req.query.uid) {
    res.status(400).send('Malformed Request');
    return;
  }

  const uid : string = req.query.uid as string;

  const newQueue : Queue= {
    uid: uid,
    open: false,
    parties: [],
  };

  try {
    await firestore.collection('queues').doc(newQueue.uid).set(newQueue);
  } catch (error) {
    res.status(500).send(error.message);
    return;
  }

  res.status(201).json(newQueue);
});

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
app.get('/api/businesses/:uid/location', async (req, res) => {
  if (!req.params.uid) {
    res.status(400).send('Malformed Request');
    return;
  }

  const uid : string= req.params.uid;

  let ret: BusinessLocation | undefined;
  await firestore.collection('businesses').doc(uid)
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
  if (!req.query.uid) {
    res.status(400).send('Malformed Request');
    return;
  }

  const uid: string = req.query.uid as string;

  let ret : Customer | undefined;
  await firestore.collection('customer').doc(uid)
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
  if (!req.body.customer) {
    res.status(400).send('Malformed Request');
    return;
  }

  const {customer} = req.body;

  try {
    await firestore.collection('customer').doc(customer.uid).set(customer);
  } catch(error) {
    res.sendStatus(500);
    return;
  }

  res.sendStatus(201);
});

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
app.post('/api/customers/new', async (req, res) => {
  if (!req.query.uid) {
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
  };

  try {
    await firestore.collection('customer').doc(result.uid).set(result);
  } catch(error) {
    res.sendStatus(500);
    return;
  }

  res.status(201).json(result);
});

/**
 * GET /api/queues/info
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
  if (!req.query.uid) {
    res.status(400).send('Malformed Request');
    return;
  }
  const uid : string = req.query.uid as string;

  let result : QueueInfo | undefined;
  await firestore.collection('queues').doc(uid)
    .get().then(function(doc: FirebaseFirestore.DocumentData) {
      if (doc.exists) {
        const data = doc.data();
        result = {
          length: data.parties.length,
          longestWaitTime: data.parties.length ? diff_minutes(new Date(data.parties[0].checkIn), new Date()) : -1,
          open: data.open,
        }
      } else {
        res.sendStatus(404);
      }
    }).catch(() => {
      res.sendStatus(500);
    });

  if(!result) {
    return;
  }

  res.status(200).json(result);
});

/**
 * POST /api/queues/:uid
 * Appends a party to the back of a queue and returns the
 * queue object.
 *
 * Path Parameters:
 *  uid: the id of the queue
 *
 * Body Content:
 *  party: the party to be added to the queue
 *
 * Response Result:
 *  The queue object with the given party appended to it.
 *
 * Error Cases:
 *  400 -> no uid in the path and no party property in the body
 *  404 -> no queue with given uid
 *  500 -> problem connecting to firebase
 */
app.post('/api/queues/:uid', async (req, res) => {
  if (!req.params.uid || !req.body.party) {
    res.status(400).send('Malformed Request');
    return;
  }
  const { party } = req.body;
  const uid = req.params.uid;

  let ret : Queue | undefined;
  await firestore.collection('queues').doc(uid)
    .get().then(function(doc: admin.firestore.DocumentData) {
      if (doc.exists) {
        const data = doc.data();
        ret = {
          uid: '',
          open: data.open,
          parties: data.parties,
        }
      } else {
        res.sendStatus(404);
      }
    }).catch(function(error) {
      res.status(500).send('Pulling');
    });

  if (!ret) {
    return;
  }

  ret.uid = uid;

  ret.parties.push(party);

  try {
    await firestore.collection('queues').doc(uid).set(ret);
  } catch(error) {
    res.status(500).send(error.message);
    return;
  }

  res.status(201).json(ret);
});

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
app.get('/api/businesses/locations/all', async (req, res) => {
  const businesses = await firestore.collection('businesses').get()
    .then((querySnap : admin.firestore.QuerySnapshot) => {
      return querySnap.docs.map((doc: admin.firestore.DocumentData) => {
        const data = doc.data();
        let ret = BusinessLocation.fromFirebase(data.type, data.locations[0]);
        ret.uid = data.uid;
        return ;
      })
    }).catch(function(error) {
      res.status(500).send(error.message);
    });

  if (!businesses) {
    return;
  }

  res.status(200).json(businesses);
});

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
app.get('/api/businesses/locations', async (req, res) => {
  if (!req.query.locations) {
    res.status(400).send('Malformed Request');
    return;
  }
  const locations = JSON.parse(req.query.locations as string);
  const result = await firestore.collection('businesses').where('uid', 'in', locations).get()
    .then((snapshot: admin.firestore.QuerySnapshot) => {
        return snapshot.docs.map((doc : admin.firestore.DocumentData) => {
          const data = doc.data();
          return BusinessLocation.fromFirebase(data.type, data.locations[0]);
      })
    }).catch(function(error) {
      res.sendStatus(500);
    });

  if (!result) {
    return;
  }

  res.status(200).json(result);
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
    images: location.images,
  };
}

function diff_minutes(dt2: Date, dt1: Date) {
  let diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

// const JPEG_EXTENSION = '.jpg';
// const IMAGE_MAX_WIDTH = 1080;
// const IMAGE_MAX_HEIGHT = 1350;

// /**
//  * When an image is uploaded in the Storage bucket it is converted to JPEG,
//  * and resized
//  */
// exports.imageToJPG = functions.storage.object().onFinalize(async (object) => {
//   const filePath = object.name; // File path in the bucket.
//   const baseFileName = path.basename(filePath, path.extname(filePath)); // file name without extension
//   const fileDir = path.dirname(filePath); // Directory of the file
//   const JPEGFilePath = path.normalize(path.format({dir: fileDir, name: baseFileName, ext: JPEG_EXTENSION})); // final path
//   const tempLocalFile = path.join(os.tmpdir(), filePath); // Copy of file in temp
//   const tempLocalDir = path.dirname(tempLocalFile); // temp directory
//   const tempLocalJPEGFile = path.join(os.tmpdir(), JPEGFilePath); // JPEG version of file in temp
//   const contentType = object.contentType; // File content type.
//   const metadata = {
//     contentType: contentType,
//   };

//   try {
//     // Exit if this is triggered on a file that is not an image.
//     if (!contentType!.startsWith('image/')) {
//       console.log('This is not an image.');
//       return null;
//     }

//     const bucket = storage.bucket(object.bucket);
//     // Create the temp directory where the storage file will be downloaded.
//     await mkdirp(tempLocalDir);
//     // Download file from bucket.
//     await bucket.file(filePath!).download({destination: tempLocalFile});
//     console.log('The file has been downloaded to', tempLocalFile);

//     // if the image is not JPEG.
//     if (!object.contentType!.startsWith('image/jpeg')) {
//       // Convert the image to JPEG using ImageMagick.
//       await spawn('convert', [tempLocalFile, tempLocalJPEGFile]);
//       console.log('JPEG image created at', tempLocalJPEGFile);
//     }

//     const thumbnailUploadStream = bucket.file(JPEGFilePath).createWriteStream({metadata});

//     // Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
//     const pipeline = sharp();
//     pipeline.resize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, {fit: 'contain'}).pipe(thumbnailUploadStream);

//     bucket.file(tempLocalJPEGFile).createReadStream().pipe(pipeline);

//     const resizeMessage = await new Promise((resolve, reject) =>
//         thumbnailUploadStream.on('finish', resolve).on('error', reject));
//     console.log(resizeMessage);

//     if (resizeMessage === 'finish') {
//       // delete old image
//       bucket.file(filePath!).delete().then(() => {
//         console.log(`Successfully deleted photo ${filePath}`)
//       }).catch(err => {
//           console.log(`Failed to remove photo, error: ${err}`)
//       });
//     }

//     // Once the image has been converted delete the local files to free up disk space.
//     fs.unlinkSync(tempLocalJPEGFile);
//     fs.unlinkSync(tempLocalFile);

//   } catch (error) {
//     console.log(error);
//   }

//   return null;
// });

exports.imageToJPG = functions.storage
  .object()
  .onFinalize(async object => {
    const gcs = new Storage();
    const bucket = gcs.bucket(object.bucket);
    const filePath = object.name;
    const fileName = filePath!.split('/').pop();

    const bucketDir = path.dirname(filePath);

    const workingDir = path.join(os.tmpdir(), 'thumbs');
    console.log('Code updated 2!!');
    const timestamp = Math.floor(Date.now() / 1000);
    const tmpFilePath = path.join(workingDir, 'source_' + timestamp + '.jpg');

    // CONTINUE WITH ACTUAL PROCESS
    if ((fileName!.includes('thumb_') || !object.contentType!.includes('image') ||
      fileName!.includes('largeJPG_'))) {
      console.log('exiting function');
      return false;
    } else {
      console.log('continuing function');
    }

    // 1. Ensure thumbnail dir exists
    await fs.ensureDir(workingDir);

    // 2. Download Source File
    await bucket.file(filePath!).download({
      destination: tmpFilePath
    });

    // 3. Resize the images and define an array of upload promises
    // - this is the actual place where we can define the thumbnail size.
    const sizes = [128, 1080];

    const uploadPromises = sizes.map(async size => {
      const thumbName = (size !== 1080) ?`thumb_${size}_${fileName}`:`largeJPG_${fileName}`;
      const thumbPath = path.join(workingDir, thumbName);

      // Resize source image
      await sharp(tmpFilePath)
        .resize(size, null)
        .toFile(thumbPath);

      // Upload to GCS
      return bucket.upload(thumbPath, {
        destination: path.join(bucketDir, thumbName)
      });
    });

    // 4. Run the upload operations
    await Promise.all(uploadPromises);

    // 5. Cleanup remove the tmp/thumbs from the filesystem
    return fs.remove(workingDir);
  });