const admin = require('firebase-admin');

admin.initializeApp();

import * as functions from 'firebase-functions';
import {getQueueInfo} from './util/get-queue';



// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// exports.getQueueInfo = functions.https.onRequest(async (req, res) => {
//   const businessID = req.query.business;

//   res.send(businessID);
//   const queueInfo : QueueInfo | undefined = await getQueueInfo(businessID as string);

//   if (queueInfo) {
//     res.json({...queueInfo});
//   } else {
//     res.status(404).send('This Queue Does Not Exist');
//   }
// })

exports.getQueueInfo = functions.https.onCall((data, context) => {
  const uid = data.uid;
  return getQueueInfo(uid);
})