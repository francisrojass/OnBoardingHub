import { Router } from 'express';
import * as boxController from './box.controller';
import { verifyToken } from '../../middlewares/verifyToken';

const router = Router();

router.get('/', verifyToken, boxController.getBoxes);
router.get('/all', verifyToken, boxController.getAllBoxes);
router.get('/:id', verifyToken, boxController.getBoxById);
router.delete('/:id', verifyToken, boxController.deleteBox);
router.post('/', verifyToken, boxController.createBox);

export default router;
