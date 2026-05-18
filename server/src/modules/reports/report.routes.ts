import { Router } from 'express';
import * as reportController from './report.controller';
import { verifyToken } from '../../middlewares/verifyToken';

const router = Router();

router.get('/team', verifyToken, reportController.getTeamOverview);
router.get('/boxes', verifyToken, reportController.getCompanyBoxStats);
router.get('/timesheets', verifyToken, reportController.getTimesheets);
router.patch('/timesheets/:id', verifyToken, reportController.updateTimesheetStatus);

export default router;
