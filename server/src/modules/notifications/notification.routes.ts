import { Router } from 'express';
import * as notifController from './notification.controller';
import { verifyToken } from '../../middlewares/verifyToken';

const router = Router();

router.get('/', verifyToken, notifController.getNotifications);
router.patch('/read-all', verifyToken, notifController.markAllRead);
router.patch('/:id/read', verifyToken, notifController.markRead);
router.delete('/:id', verifyToken, notifController.deleteNotif);

export default router;
