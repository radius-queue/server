const admin = require('firebase-admin');

admin.initializeApp();

import * as functions from 'firebase-functions';
import getQueue, {getQueueInfo} from './util/get-queue';
import getCustomer from './util/get-customer';
import postCustomer from './util/post-customer';
import getBusiness, { getBusinessLocation } from './util/get-business';
import postBusiness from './util/post-business';
import postQueue from './util/post-queue';

// Callable functions:
// Website functions

// Full business
// - push
// - pull
// Full Queue -- parties (one time call, pull)

exports.getBusiness = functions.https.onCall((data, context) => {
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

  return getBusiness(data.uid);
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

  return postBusiness(data.business);
});

exports.getQueue = functions.https.onCall((data, context) => {
  if (data.queueID) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a queue id'
    );
  }

  return getQueue(data.uid);
});

exports.postQueue = functions.https.onCall((data, context) => {
  if (!data.queue || !data.queue.uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a queue and an id to post'
    );
  }

  return postQueue(data.queue);
});


// App functions

// Business location - pull
exports.getBusinessLocation = functions.https.onCall((data, context) => {
  if (!data.uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a business uid'
    );
  }
  return getBusinessLocation(data.uid);
});
// Customer profile
// - push
// - pull
exports.getCustomer = functions.https.onCall((data, context) => {
  // check auth state
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'only authenticated users can vote up requests'
    );
  }
  return getCustomer(context.auth.uid);
});

exports.postCustomer = functions.https.onCall((data, context) => {
  if (!data.customer) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a customer to post'
    );
  }
  return postCustomer(data.customer);
});
// Queue mini
exports.getQueueInfo = functions.https.onCall((data, context) => {
  if (!data.uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'please provide a business uid'
    );
  }
  return getQueueInfo(data.uid);
});

// Listeners functions:

// Customer profile init - empty recents etc