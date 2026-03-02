import { Request, Response } from 'express';
import * as authService from './auth.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, companyName } = req.body;
    if (!email || !password || !name || !companyName) {
      res.status(400).json({ message: 'Todos los campos son obligatorios' });
      return;
    }
    const result = await authService.register(email, password, name, companyName);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email y password son obligatorios' });
      return;
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await authService.getMe(req.userId!);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};
