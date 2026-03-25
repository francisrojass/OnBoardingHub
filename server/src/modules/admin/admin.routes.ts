import { Router } from 'express';
import * as adminController from './admin.controller';
import { verifyToken } from '../../middlewares/verifyToken';

const router = Router();

router.get('/workers', verifyToken, adminController.getWorkers);
router.get('/workers/:workerId/tasks', verifyToken, adminController.getWorkerTasks);
router.post('/tasks', verifyToken, adminController.createTask);
router.delete('/tasks/:taskId', verifyToken, adminController.deleteTask);

export default router;
