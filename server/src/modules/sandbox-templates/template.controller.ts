import { Response } from 'express';
import * as templateService from './template.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const getTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templates = templateService.getAvailableTemplates();
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getTemplateMetadata = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const name = req.params['name'] as string;
    const metadata = templateService.getTemplateMetadata(name);
    if (!metadata) {
      res.status(404).json({ message: 'Metadata no encontrada para este template' });
      return;
    }
    res.json(metadata);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getTemplateDockerfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    const name = req.params['name'] as string;
    const content = templateService.getTemplateDockerfile(name);
    if (!content) {
      res.status(404).json({ message: 'Dockerfile no encontrado para este template' });
      return;
    }
    res.json({ name, dockerfile: content });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Solo el Super Admin puede crear templates' });
      return;
    }
    const { name, dockerfile, metadata } = req.body;
    if (!name || !dockerfile) {
      res.status(400).json({ message: 'name y dockerfile son obligatorios' });
      return;
    }
    const template = templateService.createTemplate(name, dockerfile, metadata);
    res.status(201).json(template);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const syncTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    const count = await templateService.syncTemplatesWithDB();
    res.json({ message: `${count} templates sincronizados`, count });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
