import { Response } from 'express';
import * as reportService from './report.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const getTeamOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await reportService.getTeamOverview(req.userId!);
    res.json(data);
  } catch (err: any) {
    res.status(err.message === 'Acceso denegado' ? 403 : 400).json({ message: err.message });
  }
};

export const getCompanyBoxStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await reportService.getCompanyBoxStats(req.userId!);
    res.json(data);
  } catch (err: any) {
    res.status(err.message === 'Acceso denegado' ? 403 : 400).json({ message: err.message });
  }
};
