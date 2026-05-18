import Docker from 'dockerode';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../config/database';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const SANDBOXES_DIR = path.resolve(__dirname, '../../../../docker/sandboxes');

// Tracks images currently being built to prevent concurrent duplicate builds
const buildsInProgress = new Map<string, Promise<void>>();

/**
 * Reconcile DB state with Docker reality: mark ghost sandboxes (DB says RUNNING
 * but container is dead) as STOPPED so their ports are freed.
 */
const reconcileOrphanedSandboxes = async (): Promise<void> => {
  const runningSandboxes = await prisma.sandbox.findMany({
    where: { status: { in: ['RUNNING', 'PENDING'] } },
  });

  for (const sb of runningSandboxes) {
    if (!sb.containerId) {
      // PENDING without container for too long — mark as ERROR
      await prisma.sandbox.update({ where: { id: sb.id }, data: { status: 'ERROR' } });
      logger.info(`Orphan sandbox ${sb.id} (no container) marcado como ERROR`);
      continue;
    }
    try {
      const info = await docker.getContainer(sb.containerId).inspect();
      if (!info.State.Running) {
        await prisma.sandbox.update({ where: { id: sb.id }, data: { status: 'STOPPED', stoppedAt: new Date() } });
        logger.info(`Orphan sandbox ${sb.id} (container stopped) reconciliado`);
      }
    } catch {
      // Container doesn't exist at all
      await prisma.sandbox.update({ where: { id: sb.id }, data: { status: 'STOPPED', stoppedAt: new Date() } });
      logger.info(`Orphan sandbox ${sb.id} (container not found) reconciliado`);
    }
  }
};

const getAvailablePort = async (): Promise<number> => {
  // Reconcile orphans before allocating to avoid phantom port reservations
  await reconcileOrphanedSandboxes();

  const usedPorts = await prisma.sandbox.findMany({
    where: { status: { in: ['RUNNING', 'PENDING'] } },
    select: { port: true },
  });
  const used = new Set(usedPorts.map((s) => s.port));

  for (let port = ENV.SANDBOX_PORT_START; port <= ENV.SANDBOX_PORT_END; port++) {
    if (!used.has(port)) return port;
  }
  throw new Error('No hay puertos disponibles');
};

const imageExists = async (imageName: string): Promise<boolean> => {
  try {
    // getImage().inspect() is more reliable than listImages() for freshly built images
    await docker.getImage(`${imageName}:latest`).inspect();
    return true;
  } catch {
    try {
      await docker.getImage(imageName).inspect();
      return true;
    } catch {
      return false;
    }
  }
};

const buildImageFromSandboxes = async (imageName: string): Promise<void> => {
  // imageName format: "onboardinghub/<folder-name>" — extract folder name
  const parts = imageName.split('/');
  const folderName = parts.length > 1 ? parts[parts.length - 1] : imageName;
  const contextDir = path.join(SANDBOXES_DIR, folderName);
  const dockerfilePath = path.join(contextDir, 'Dockerfile');

  if (!fs.existsSync(dockerfilePath)) {
    throw new Error(
      `Imagen Docker "${imageName}" no encontrada y no hay Dockerfile en docker/sandboxes/${folderName}/. ` +
      `Crea el Dockerfile o ejecuta: docker build -t ${imageName} docker/sandboxes/${folderName}/`
    );
  }

  logger.info(`Imagen "${imageName}" no encontrada — construyendo desde docker/sandboxes/${folderName}/...`);

  // Only include Dockerfile and non-json files in the build context (exclude metadata.json)
  const contextFiles = fs.readdirSync(contextDir).filter(f => !f.endsWith('.json'));

  const stream = await docker.buildImage(
    { context: contextDir, src: contextFiles },
    { t: imageName }
  );

  // Wait for build to finish
  await new Promise<void>((resolve, reject) => {
    let rejected = false;
    docker.modem.followProgress(stream, (err: Error | null) => {
      if (rejected) return;
      if (err) {
        rejected = true;
        reject(new Error(`Error construyendo imagen "${imageName}": ${err.message}`));
      } else {
        resolve();
      }
    }, (event: any) => {
      if (rejected) return;
      if (event.stream) {
        const line = event.stream.trim();
        if (line) logger.info(`[build ${folderName}] ${line}`);
      }
      if (event.error) {
        rejected = true;
        logger.error(`[build ${folderName}] ERROR: ${event.error}`);
        reject(new Error(`Error construyendo imagen: ${event.error}`));
      }
      if (event.errorDetail?.message) {
        rejected = true;
        logger.error(`[build ${folderName}] ERROR: ${event.errorDetail.message}`);
        reject(new Error(`Error construyendo imagen: ${event.errorDetail.message}`));
      }
    });
  });

  // Post-build verification
  if (!(await imageExists(imageName))) {
    throw new Error(`Build de "${imageName}" terminó pero la imagen no se encuentra en Docker`);
  }

  logger.info(`Imagen "${imageName}" construida correctamente.`);
};

const ensureImageExists = async (imageName: string): Promise<void> => {
  if (await imageExists(imageName)) return;

  // If a build is already in progress for this image, wait for it instead of starting another
  if (buildsInProgress.has(imageName)) {
    logger.info(`Build de "${imageName}" ya en progreso — esperando...`);
    await buildsInProgress.get(imageName);
    return;
  }

  const buildPromise = buildImageFromSandboxes(imageName).finally(() => {
    buildsInProgress.delete(imageName);
  });
  buildsInProgress.set(imageName, buildPromise);
  await buildPromise;
};

export const launchSandbox = async (boxId: string, userId: string) => {
  const box = await prisma.box.findUnique({ where: { id: boxId } });
  if (!box) throw new Error('Box no encontrado');

  // Guard: if user already has an active sandbox for this box, return it
  const existingSandbox = await prisma.sandbox.findFirst({
    where: { userId, boxId, status: { in: ['RUNNING', 'PENDING'] } },
  });
  if (existingSandbox) {
    logger.info(`Sandbox ya existe para usuario ${userId} y box ${boxId} — estado: ${existingSandbox.status}`);
    return existingSandbox;
  }

  // Stop any other RUNNING sandboxes for this user (one sandbox at a time policy)
  const otherRunning = await prisma.sandbox.findMany({
    where: { userId, status: 'RUNNING', boxId: { not: boxId } },
  });
  for (const other of otherRunning) {
    try {
      if (other.containerId) {
        const c = docker.getContainer(other.containerId);
        await c.stop();
        await c.remove();
      }
      await prisma.sandbox.update({
        where: { id: other.id },
        data: { status: 'STOPPED', stoppedAt: new Date() },
      });
      logger.info(`Auto-stopped sandbox ${other.id} (box ${other.boxId}) para liberar recursos`);
    } catch (err: any) {
      logger.warn(`Error auto-stopping sandbox ${other.id}: ${err.message}`);
      await prisma.sandbox.update({
        where: { id: other.id },
        data: { status: 'STOPPED', stoppedAt: new Date() },
      });
    }
  }

  const port = await getAvailablePort();
  const innerPort = box.innerPort; // e.g. 7681 for ttyd

  const sandbox = await prisma.sandbox.create({
    data: { userId, boxId, status: 'PENDING', port },
  });

  try {
    await ensureImageExists(box.dockerImage);

    const exposedPorts: Record<string, object> = { [`${innerPort}/tcp`]: {} };
    const portBindings: Record<string, Array<{ HostPort: string }>> = {
      [`${innerPort}/tcp`]: [{ HostPort: String(port) }],
    };

    const container = await docker.createContainer({
      Image: box.dockerImage,
      Tty: true,
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        Memory: 256 * 1024 * 1024,
        CpuShares: 256,
        AutoRemove: false,
        // RNF-01: sandbox cannot reach internal services or other tenants
        NetworkMode: 'bridge',
      },
      Labels: { sandboxId: sandbox.id, userId },
    });

    await container.start();

    await prisma.sandbox.update({
      where: { id: sandbox.id },
      data: { containerId: container.id, status: 'RUNNING' },
    });

    logger.info(
      `Sandbox ${sandbox.id} lanzado — container ${container.id} — host:${port} → inner:${innerPort}`
    );

    return { ...sandbox, containerId: container.id, status: 'RUNNING', port };
  } catch (err: any) {
    await prisma.sandbox.update({
      where: { id: sandbox.id },
      data: { status: 'ERROR' },
    });
    throw new Error(`Error al lanzar el container: ${err.message}`);
  }
};

export const stopSandbox = async (sandboxId: string, userId: string) => {
  const sandbox = await prisma.sandbox.findFirst({
    where: { id: sandboxId, userId },
  });
  if (!sandbox) throw new Error('Sandbox no encontrado');
  if (!sandbox.containerId) throw new Error('El sandbox no tiene container asociado');

  try {
    const container = docker.getContainer(sandbox.containerId);
    await container.stop();
    await container.remove();
  } catch (err: any) {
    logger.error(`Error parando container: ${err.message}`);
  }

  await prisma.sandbox.update({
    where: { id: sandboxId },
    data: { status: 'STOPPED', stoppedAt: new Date() },
  });

  logger.info(`Sandbox ${sandboxId} detenido`);
  return { message: 'Sandbox detenido correctamente' };
};

export const getSandboxStatus = async (sandboxId: string, userId: string) => {
  const sandbox = await prisma.sandbox.findFirst({
    where: { id: sandboxId, userId },
    include: { box: true },
  });
  if (!sandbox) throw new Error('Sandbox no encontrado');
  return sandbox;
};

export const getUserSandboxes = async (userId: string) => {
  return prisma.sandbox.findMany({
    where: { userId },
    include: { box: true },
    orderBy: { createdAt: 'desc' },
  });
};
