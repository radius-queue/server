import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
const mkdirp = require('mkdirp');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');
const gcs = require('@google-cloud/storage')();
const sharp = require('sharp');

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
  const business = req.body.business;

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

  const bucket = admin.storage().bucket(object.bucket);
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
