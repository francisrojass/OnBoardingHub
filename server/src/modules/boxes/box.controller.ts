import { Response } from 'express';
import * as boxService from './box.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const getBoxes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const boxes = await boxService.getBoxesForUser(req.userId!);
    res.json(boxes);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getBoxById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const boxId = req.params['id'] as string;
    const box = await boxService.getBoxById(boxId, req.userId!);
    res.json(box);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const createBox = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole !== 'ADMIN') {
      res.status(403).json({ message: 'Solo los administradores pueden crear boxes' });
      return;
    }
    const { title, description, objectives, dockerImage, difficulty, companyId } = req.body;
    if (!title || !description || !objectives || !dockerImage || !companyId) {
      res.status(400).json({ message: 'Faltan campos obligatorios' });
      return;
    }
    const box = await boxService.createBox({ title, description, objectives, dockerImage, difficulty, companyId });
    res.status(201).json(box);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
