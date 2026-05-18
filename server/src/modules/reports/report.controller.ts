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

export const getTimesheets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await reportService.getTimesheetReports(req.userId!);
    res.json(data);
  } catch (err: any) {
    res.status(err.message === 'Acceso denegado' ? 403 : 400).json({ message: err.message });
  }
};

export const updateTimesheetStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Estado inválido. Usar APPROVED o REJECTED' });
      return;
    }
    const data = await reportService.updateTimesheetStatus(req.userId!, id as string, status);
    res.json(data);
  } catch (err: any) {
    res.status(err.message === 'Acceso denegado' ? 403 : 400).json({ message: err.message });
  }
};
