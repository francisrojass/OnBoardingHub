import { prisma } from '../../config/database';

const getAdminCompanyId = async (adminUserId: string) => {
  const user = await prisma.user.findUnique({ where: { id: adminUserId }, select: { companyId: true, role: true } });
  if (!user) throw new Error('Usuario no encontrado');
  if (user.role !== 'ADMIN') throw new Error('Sin permisos de administrador');
  return user.companyId;
};

export const getWorkers = async (adminUserId: string) => {
  const companyId = await getAdminCompanyId(adminUserId);
  return prisma.user.findMany({
    where: { companyId },
    select: {
      id: true, name: true, email: true, role: true, avatar: true, createdAt: true,
      tasks: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const getWorkerTasks = async (adminUserId: string, workerId: string) => {
  const companyId = await getAdminCompanyId(adminUserId);
  const worker = await prisma.user.findFirst({ where: { id: workerId, companyId } });
  if (!worker) throw new Error('Trabajador no encontrado en tu empresa');
  return prisma.task.findMany({
    where: { userId: workerId },
    include: { box: { select: { id: true, title: true, difficulty: true } } },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
  });
};

export const createTask = async (
  adminUserId: string,
  data: {
    userId: string;
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    category?: string;
    boxId?: string;
  }
) => {
  const companyId = await getAdminCompanyId(adminUserId);
  const worker = await prisma.user.findFirst({ where: { id: data.userId, companyId } });
  if (!worker) throw new Error('Trabajador no encontrado en tu empresa');

  if (data.boxId) {
    const cb = await prisma.companyBox.findFirst({ where: { companyId, boxId: data.boxId } });
    if (!cb) throw new Error('El box no pertenece a tu empresa');
  }

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      category: data.category || 'General',
      userId: data.userId,
      boxId: data.boxId || null,
    },
    include: { box: { select: { id: true, title: true, difficulty: true } } },
  });
};

export const deleteTask = async (adminUserId: string, taskId: string) => {
  const companyId = await getAdminCompanyId(adminUserId);
  const task = await prisma.task.findFirst({
    where: { id: taskId },
    include: { user: { select: { companyId: true } } },
  });
  if (!task || task.user.companyId !== companyId) throw new Error('Tarea no encontrada');
  await prisma.task.delete({ where: { id: taskId } });
};
