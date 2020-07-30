const admin = require('firebase-admin');

admin.initializeApp();

import * as functions from 'firebase-functions';
import {getQueueInfo} from './util/get-queue';
import getCustomer from './util/get-customer';
import postCustomer from './util/post-customer';
import { getBusinessLocation } from './util/get-business';

// Callable functions:
// Website functions

// Full business
// - push
// - pull
// Full Queue -- parties (one time call, pull)


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