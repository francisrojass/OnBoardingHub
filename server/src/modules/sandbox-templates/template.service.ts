import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';

const SANDBOXES_DIR = path.resolve(__dirname, '../../../../docker/sandboxes');

export interface SandboxMetadata {
  title: string;
  description: string;
  objectives: string;
  guide?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  innerPort: number;
  xpReward: number;
}

export interface SandboxTemplate {
  name: string;
  dockerImage: string;
  hasDockerfile: boolean;
  metadata: SandboxMetadata | null;
}

/**
 * Read metadata.json from a sandbox template folder.
 */
export const getTemplateMetadata = (templateName: string): SandboxMetadata | null => {
  const sanitized = path.basename(templateName);
  const metadataPath = path.join(SANDBOXES_DIR, sanitized, 'metadata.json');
  if (!fs.existsSync(metadataPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  } catch {
    logger.warn(`metadata.json inválido en ${sanitized}`);
    return null;
  }
};

export const getAvailableTemplates = (): SandboxTemplate[] => {
  try {
    if (!fs.existsSync(SANDBOXES_DIR)) {
      logger.warn(`Directorio de sandboxes no encontrado: ${SANDBOXES_DIR}`);
      return [];
    }

    const entries = fs.readdirSync(SANDBOXES_DIR, { withFileTypes: true });
    const templates: SandboxTemplate[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const dockerfilePath = path.join(SANDBOXES_DIR, entry.name, 'Dockerfile');
      const hasDockerfile = fs.existsSync(dockerfilePath);
      const metadata = getTemplateMetadata(entry.name);

      templates.push({
        name: entry.name,
        dockerImage: `onboardinghub/${entry.name}`,
        hasDockerfile,
        metadata,
      });
    }

    return templates;
  } catch (err: any) {
    logger.error(`Error leyendo templates de sandbox: ${err.message}`);
    return [];
  }
};

export const getTemplateDockerfile = (templateName: string): string | null => {
  const sanitized = path.basename(templateName);
  const dockerfilePath = path.join(SANDBOXES_DIR, sanitized, 'Dockerfile');

  if (!fs.existsSync(dockerfilePath)) return null;
  return fs.readFileSync(dockerfilePath, 'utf-8');
};

export const createTemplate = (
  templateName: string,
  dockerfileContent: string,
  metadata?: Partial<SandboxMetadata>
): SandboxTemplate => {
  const sanitized = templateName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!sanitized) throw new Error('Nombre de template inválido');

  const templateDir = path.join(SANDBOXES_DIR, sanitized);

  if (fs.existsSync(templateDir)) {
    throw new Error(`El template "${sanitized}" ya existe`);
  }

  fs.mkdirSync(templateDir, { recursive: true });
  fs.writeFileSync(path.join(templateDir, 'Dockerfile'), dockerfileContent, 'utf-8');

  // Write metadata.json if provided
  const meta: SandboxMetadata = {
    title: metadata?.title || sanitized,
    description: metadata?.description || '',
    objectives: metadata?.objectives || '',
    guide: metadata?.guide,
    difficulty: metadata?.difficulty || 'BEGINNER',
    innerPort: metadata?.innerPort || 7681,
    xpReward: metadata?.xpReward || 100,
  };
  fs.writeFileSync(path.join(templateDir, 'metadata.json'), JSON.stringify(meta, null, 2), 'utf-8');

  logger.info(`Template de sandbox creado: ${sanitized}`);

  return {
    name: sanitized,
    dockerImage: `onboardinghub/${sanitized}`,
    hasDockerfile: true,
    metadata: meta,
  };
};

// Sync: read all sandbox template metadata and upsert Box records in DB.
export const syncTemplatesWithDB = async (): Promise<number> => {
  const templates = getAvailableTemplates();
  let count = 0;

  for (const tpl of templates) {
    if (!tpl.hasDockerfile || !tpl.metadata) continue;

    const existing = await prisma.box.findFirst({
      where: { dockerImage: tpl.dockerImage },
    });

    const data = {
      title: tpl.metadata.title,
      description: tpl.metadata.description,
      objectives: tpl.metadata.objectives,
      guide: tpl.metadata.guide || null,
      dockerImage: tpl.dockerImage,
      innerPort: tpl.metadata.innerPort,
      difficulty: tpl.metadata.difficulty,
      xpReward: tpl.metadata.xpReward,
    };

    if (existing) {
      await prisma.box.update({ where: { id: existing.id }, data });
      logger.info(`♻️  Box sincronizada: "${data.title}"`);
    } else {
      await prisma.box.create({ data });
      logger.info(`✅  Box creada desde template: "${data.title}"`);
    }
    count++;
  }

  return count;
};
