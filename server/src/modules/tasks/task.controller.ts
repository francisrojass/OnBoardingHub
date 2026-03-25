import { Response } from 'express';
import * as taskService from './task.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await taskService.getTasksForUser(req.userId!);
    res.json(tasks);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params['id'] as string;
    const { status } = req.body;
    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      res.status(400).json({ message: 'Estado inválido' });
      return;
    }
    const task = await taskService.updateTaskStatus(taskId, req.userId!, status);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
