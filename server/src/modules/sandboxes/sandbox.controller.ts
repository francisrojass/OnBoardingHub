import { Response } from 'express';
import * as sandboxService from './sandbox.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const launch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boxId } = req.body;
    if (!boxId) {
      res.status(400).json({ message: 'boxId es obligatorio' });
      return;
    }
    const sandbox = await sandboxService.launchSandbox(boxId, req.userId!);
    res.status(201).json(sandbox);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const stop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sandboxId = req.params['id'] as string;
    const result = await sandboxService.stopSandbox(sandboxId, req.userId!);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sandboxId = req.params['id'] as string;
    const sandbox = await sandboxService.getSandboxStatus(sandboxId, req.userId!);
    res.json(sandbox);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const getMySandboxes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sandboxes = await sandboxService.getUserSandboxes(req.userId!);
    res.json(sandboxes);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
