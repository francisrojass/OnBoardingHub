import { Router } from 'express';
import * as templateController from './template.controller';
import { verifyToken } from '../../middlewares/verifyToken';

const router = Router();

router.get('/', verifyToken, templateController.getTemplates);
router.get('/:name/metadata', verifyToken, templateController.getTemplateMetadata);
router.get('/:name/dockerfile', verifyToken, templateController.getTemplateDockerfile);
router.post('/', verifyToken, templateController.createTemplate);
router.post('/sync', verifyToken, templateController.syncTemplates);

export default router;
