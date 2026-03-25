import { Response } from 'express';
import * as adminService from './admin.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const getWorkers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workers = await adminService.getWorkers(req.userId!);
    res.json(workers);
  } catch (err: any) {
    res.status(err.message.includes('permisos') ? 403 : 400).json({ message: err.message });
  }
};

export const getWorkerTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await adminService.getWorkerTasks(req.userId!, req.params['workerId'] as string);
    res.json(tasks);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, title, description, priority, category, boxId } = req.body;
    if (!userId || !title) {
      res.status(400).json({ message: 'userId y title son obligatorios' });
      return;
    }
    const task = await adminService.createTask(req.userId!, { userId, title, description, priority, category, boxId });
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await adminService.deleteTask(req.userId!, req.params['taskId'] as string);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
