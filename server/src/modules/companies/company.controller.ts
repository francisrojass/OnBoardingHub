import { Response } from 'express';
import * as companyService from './company.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const getCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    const companies = await companyService.getCompanies();
    res.json(companies);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const assignBox = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    const id = req.params['id'] as string;
    const { boxId } = req.body;
    if (!boxId) {
      res.status(400).json({ message: 'Falta boxId' });
      return;
    }
    const result = await companyService.assignBoxToCompany(id, boxId);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const removeBox = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    const id = req.params['id'] as string;
    const boxId = req.params['boxId'] as string;
    await companyService.removeBoxFromCompany(id, boxId);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    const companyId = req.params['id'] as string;
    await companyService.deleteCompany(companyId);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
