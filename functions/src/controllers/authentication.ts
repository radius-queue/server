import * as admin from 'firebase-admin';
import type {Request, Response} from 'express';

/**
 * Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
 * The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
 * `Authorization: Bearer <Firebase ID Token>`.
 */
const authentication = async (req: Request, res: Response, next: () => any) => {
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

export default authentication;