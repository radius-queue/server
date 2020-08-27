import * as express from 'express';
import {
  getBusiness,
  postBusiness,
  getBusinessLocation,
  getAllLocations,
  getLocationsFromArray
} from '../controllers/businesses';

const router = express.Router();

router.get('/', getBusiness);

router.post('/', postBusiness);

router.get('/:uid/location', getBusinessLocation);

router.get('/locations/all', getAllLocations);

router.get('/locations', getLocationsFromArray);

export default router;