import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as express from 'express';


admin.initializeApp();

import Auth from './controllers/authentication';
import Notifs from './controllers/push';
import Customers from './routes/customers';
import Businesses from './routes/businesses';
import Queues from './routes/queues';
import Images from './controllers/images';

const cors = require('cors');
const app = express();

app.use(cors({origin: true}));

app.use(Auth);

app.post('/api/push', Notifs);

app.use('/api/queues', Queues);

app.use('/api/businesses', Businesses)

app.use('/api/customers', Customers);

exports.widgets = functions.https.onRequest(app);

exports.imageToJPG = functions.storage.object().onFinalize(Images);