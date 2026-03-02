import { Response } from 'express';
import * as userService from './user.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await userService.getProfile(req.userId!);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, avatar } = req.body;
    const result = await userService.updateProfile(req.userId!, { name, avatar });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
