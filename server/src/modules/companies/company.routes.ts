import { Router } from 'express';
import * as companyController from './company.controller';
import { verifyToken } from '../../middlewares/verifyToken';

const router = Router();

router.get('/', verifyToken, companyController.getCompanies);
router.post('/:id/boxes', verifyToken, companyController.assignBox);
router.delete('/:id/boxes/:boxId', verifyToken, companyController.removeBox);

export default router;
