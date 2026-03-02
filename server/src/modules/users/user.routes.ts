import { Router } from 'express';
import * as userController from './user.controller';
import { verifyToken } from '../../middlewares/verifyToken';

const router = Router();

router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);

export default router;
