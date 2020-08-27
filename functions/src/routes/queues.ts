import * as express from 'express';
import { getQueue, postQueue, newQueue, appendParty, getQueueInfo } from '../controllers/queues';

const router = express.Router();

router.get('/', getQueue);

router.post('/', postQueue);

router.post('/new', newQueue);

router.post('/:uid', appendParty);

router.get('/info', getQueueInfo);

export default router;
