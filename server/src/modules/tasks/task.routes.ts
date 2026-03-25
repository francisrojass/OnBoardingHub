import { Router } from 'express';
import * as taskController from './task.controller';
import { verifyToken } from '../../middlewares/verifyToken';

const router = Router();

router.get('/', verifyToken, taskController.getTasks);
router.patch('/:id', verifyToken, taskController.updateTask);

export default router;
