import { Router } from 'express';
import * as sandboxController from './sandbox.controller';
import { verifyToken } from '../../middlewares/verifyToken';

const router = Router();

router.post('/launch', verifyToken, sandboxController.launch);
router.post('/event', verifyToken, sandboxController.handleEvent);
router.get('/', verifyToken, sandboxController.getMySandboxes);
router.get('/:id', verifyToken, sandboxController.getStatus);
router.delete('/:id', verifyToken, sandboxController.stop);

export default router;
