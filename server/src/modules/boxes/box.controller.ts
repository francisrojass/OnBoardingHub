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
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Solo los administradores pueden crear boxes' });
      return;
    }
    const { title, description, objectives, guide, dockerImage, innerPort, difficulty, companyId } = req.body;
    if (!title || !description || !objectives || !dockerImage) {
      res.status(400).json({ message: 'Faltan campos obligatorios' });
      return;
    }
    if (req.userRole === 'ADMIN' && !companyId) {
      res.status(400).json({ message: 'companyId es obligatorio para administradores de empresa' });
      return;
    }
    const box = await boxService.createBox({ title, description, objectives, guide, dockerImage, innerPort, difficulty, companyId });
    res.status(201).json(box);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllBoxes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    const boxes = await boxService.getAllBoxes();
    res.json(boxes);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBox = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    const boxId = req.params['id'] as string;
    await boxService.deleteBox(boxId);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
