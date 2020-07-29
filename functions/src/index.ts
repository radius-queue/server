const admin = require('firebase-admin');

admin.initializeApp();

import * as functions from 'firebase-functions';
import {getQueueInfo} from './util/get-queue';

// Callable functions:
// Website functions

// Full business
// - push
// - pull
// Full Queue -- parties (one time call, pull)


// App functions

// Business location - pull
// Customer profile
// - push
// - pull
// Queue mini
exports.getQueueInfo = functions.https.onCall((data, context) => {
  const uid = data.uid;
  return getQueueInfo(uid);
})

// Listeners functions:

// Customer profile init - empty recents etc