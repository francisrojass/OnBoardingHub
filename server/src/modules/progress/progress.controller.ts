import { Response } from 'express';
import * as progressService from './progress.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const getMyProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await progressService.getProgressForUser(req.userId!);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const completeBox = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const boxId = req.params['boxId'] as string;
    const result = await progressService.completeBox(req.userId!, boxId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
