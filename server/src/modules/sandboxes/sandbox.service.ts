import Docker from 'dockerode';
import { prisma } from '../../config/database';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const getAvailablePort = async (): Promise<number> => {
  const usedPorts = await prisma.sandbox.findMany({
    where: { status: 'RUNNING' },
    select: { port: true },
  });
  const used = new Set(usedPorts.map((s) => s.port));

  for (let port = ENV.SANDBOX_PORT_START; port <= ENV.SANDBOX_PORT_END; port++) {
    if (!used.has(port)) return port;
  }
  throw new Error('No hay puertos disponibles');
};

export const launchSandbox = async (boxId: string, userId: string) => {
  const box = await prisma.box.findUnique({ where: { id: boxId } });
  if (!box) throw new Error('Box no encontrado');

  const port = await getAvailablePort();

  const sandbox = await prisma.sandbox.create({
    data: { userId, boxId, status: 'PENDING', port },
  });

  try {
    const container = await docker.createContainer({
      Image: box.dockerImage,
      Tty: true,
      HostConfig: {
        PortBindings: {},
        Memory: 256 * 1024 * 1024,
        CpuShares: 256,
        AutoRemove: false,
      },
      Labels: { sandboxId: sandbox.id, userId },
    });

    await container.start();

    await prisma.sandbox.update({
      where: { id: sandbox.id },
      data: { containerId: container.id, status: 'RUNNING' },
    });

    logger.info(`Sandbox ${sandbox.id} lanzado - container ${container.id}`);

    return { ...sandbox, containerId: container.id, status: 'RUNNING' };
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
