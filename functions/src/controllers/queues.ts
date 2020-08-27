import * as admin from 'firebase-admin';
import type {Request, Response} from 'express';
import { Queue, Party, QueueInfo } from '../util/queue';
import { partyToFirebase, diff_minutes } from '../util/util-functions';

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
export const getQueue = async (req : Request, res : Response) => {
  if (!req.query.uid) {
    res.status(400).send('Malformed Request');
    return;
  }

  const uid : string = req.query.uid as string;

  let ret : Queue | undefined;
  await admin.firestore().collection('queues').doc(uid)
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

};



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
export const postQueue = async (req : Request, res : Response) => {
  if (!req.body.queue || !req.body.queue.parties) {
    res.status(400).send('Malformed Request');
    return;
  }

  const queue : any = req.body.queue;
  queue.parties = queue.parties.map((e: any) => partyToFirebase(e));

  try {
    await admin.firestore().collection('queues').doc(queue.uid).set(queue);
  } catch (error) {
    res.sendStatus(500);
    return;
  }

  res.sendStatus(201);

};

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
export const newQueue = async (req : Request, res : Response) => {
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
    await admin.firestore().collection('queues').doc(newQueue.uid).set(newQueue);
  } catch (error) {
    res.status(500).send(error.message);
    return;
  }

  res.status(201).json(newQueue);
};


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
export const appendParty = async (req : Request, res : Response) => {
  if (!req.params.uid || !req.body.party) {
    res.status(400).send('Malformed Request');
    return;
  }
  const { party } = req.body;
  const uid = req.params.uid;

  let ret : Queue | undefined;
  await admin.firestore().collection('queues').doc(uid)
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
    }).catch(function() {
      res.status(500).send('Pulling');
    });

  if (!ret) {
    return;
  }

  ret.uid = uid;

  ret.parties.push(party);

  try {
    await admin.firestore().collection('queues').doc(uid).set(ret);
  } catch(error) {
    res.status(500).send(error.message);
    return;
  }

  res.status(201).json(ret);
};

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
export const getQueueInfo = async (req : Request, res : Response) => {
  if (!req.query.uid) {
    res.status(400).send('Malformed Request');
    return;
  }
  const uid : string = req.query.uid as string;

  let result : QueueInfo | undefined;
  await admin.firestore().collection('queues').doc(uid)
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
};
