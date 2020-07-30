const admin = require('firebase-admin');

admin.initializeApp();

import * as functions from 'firebase-functions';
import getQueue, {getQueueInfo} from './util/get-queue';
import getCustomer from './util/get-customer';
import postCustomer from './util/post-customer';
import getBusiness, { getBusinessLocation } from './util/get-business';
import postBusiness from './util/post-business';
import postQueue from './util/post-queue';
import { Queue, Party } from './util/queue';


// Callable functions:
// Website functions

// Full business
// - push
// - pull
// Full Queue -- parties (one time call, pull)

exports.getBusiness = functions.https.onCall(async (data, context) => {
  if (!data.uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a business uid'
    );
  }

  if (!context.auth || context.auth.uid !== data.uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'only authenticated users can access their data'
    );
  }

  return await getBusiness(data.uid);
});

exports.postBusiness = functions.https.onCall((data, context) => {
  if (!data.business) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a business uid to post'
    );
  }

  if (!context.auth || context.auth.uid !== data.business.uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'only authenticated users can post their information'
    );
  }
  postBusiness(data.business);
});

exports.getQueue = functions.https.onCall(async (data, context) => {
  if (data.queueID) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a queue id'
    );
  }

  return await getQueue(data.uid);
});

exports.postQueue = functions.https.onCall((data, context) => {
  if (!data.queue || !data.queue.uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a queue and an id to post'
    );
  }
 
  postQueue(data.queue);
});

exports.createNewQueue = functions.https.onCall((data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'only authenticated users can create a queue'
    )
  }
  if (!data.uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a uid to associate with the queue'
    );
  }

  if(!data.name) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a business name to associate with the queue'
    );
  }

  const queueParams : [string, Date, string, boolean, Party[]]= [
    data.name,
    new Date('2020-08-30'),
    data.uid,
    false,
    []
  ]

  const newQueue = new Queue(...queueParams);

  postQueue(newQueue);
  return newQueue;
})

// App functions

// Business location - pull
exports.getBusinessLocation = functions.https.onCall(async (data, context) => {
  if (!data.uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a business uid'
    );
  }
  return await getBusinessLocation(data.uid);
});
// Customer profile
// - push
// - pull
exports.getCustomer = functions.https.onCall(async (data, context) => {
  // check auth state
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'only authenticated users can vote up requests'
    );
  }
  return await getCustomer(context.auth.uid);
});

exports.postCustomer = functions.https.onCall((data, context) => {
  if (!data.customer) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a customer to post'
    );
  }
  postCustomer(data.customer);
});
// Queue mini
exports.getQueueInfo = functions.https.onCall(async (data, context) => {
  if (!data.uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a business uid'
    );
  }
  return await getQueueInfo(data.uid);
});

// Listeners functions:

// Customer profile init - empty recents etc