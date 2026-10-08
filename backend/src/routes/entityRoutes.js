import { Router } from 'express';
import {
  listEntities,
  filterEntities,
  countEntities,
  getEntity,
  createEntity,
  bulkCreateEntities,
  updateEntity,
  deleteEntity,
} from '../controllers/entityController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(optionalAuth);

router.get('/:entity', listEntities);
router.post('/:entity/filter', filterEntities);
router.post('/:entity/count', countEntities);
router.post('/:entity/bulk', bulkCreateEntities);
router.post('/:entity', createEntity);
router.get('/:entity/:id', getEntity);
router.put('/:entity/:id', updateEntity);
router.delete('/:entity/:id', deleteEntity);

export default router;
