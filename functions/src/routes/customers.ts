import * as express from 'express';
import { getCustomer, postCustomer, newCustomer } from '../controllers/customers';

const router = express.Router();

router.get('/', getCustomer);

router.post('/', postCustomer);

router.post('/', newCustomer);

export default router;