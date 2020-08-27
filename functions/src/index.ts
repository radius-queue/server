import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as express from 'express';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import * as sharp from 'sharp';
import { Storage } from '@google-cloud/storage';

admin.initializeApp();

import Auth from './controllers/authentication';
import Notifs from './controllers/push';
import Customers from './routes/customers';
import Businesses from './routes/businesses';
import Queues from './routes/queues';

const cors = require('cors');
const app = express();

app.use(cors({origin: true}));

app.use(Auth);

app.post('/api/push', Notifs);

app.use('/api/queues', Queues);

app.use('/api/businesses', Businesses)

app.use('/api/customers', Customers);

exports.widgets = functions.https.onRequest(app);

exports.imageToJPG = functions.storage
  .object()
  .onFinalize(async object => {
    const gcs = new Storage();
    const bucket = gcs.bucket(object.bucket);
    const filePath = object.name;
    const fileName = filePath!.split('/').pop();

    const bucketDir = path.dirname(filePath!);

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