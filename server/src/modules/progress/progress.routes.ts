import { Router } from 'express';
import * as progressController from './progress.controller';
import { verifyToken } from '../../middlewares/verifyToken';

const router = Router();

router.get('/me', verifyToken, progressController.getMyProgress);
router.post('/box/:boxId/complete', verifyToken, progressController.completeBox);

export default router;
