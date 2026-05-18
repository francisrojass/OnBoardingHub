import { Prisma } from '@prisma/client';
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

  const task = await prisma.task.create({
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

  // Notify the employee about the new task
  await prisma.notification.create({
    data: {
      userId: data.userId,
      title: '📌 Nueva tarea asignada',
      message: `Se te ha asignado la tarea: "${data.title}"`,
      type: 'TASK_ASSIGNED',
    },
  });

  return task;
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

const XP_PER_LEVEL = 500;
const TASK_XP: Record<string, number> = { LOW: 25, MEDIUM: 50, HIGH: 100 };

export const updateTaskStatus = async (
  adminUserId: string,
  taskId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
) => {
  const companyId = await getAdminCompanyId(adminUserId);
  const task = await prisma.task.findFirst({
    where: { id: taskId },
    include: { user: { select: { id: true, companyId: true } } },
  });
  if (!task || task.user.companyId !== companyId) throw new Error('Tarea no encontrada');

  const wasCompleted = task.status === 'COMPLETED';
  const isNowCompleted = status === 'COMPLETED';

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: { box: { select: { id: true, title: true, difficulty: true } } },
  });

  // Grant XP when admin approves completion
  if (isNowCompleted && !wasCompleted) {
    const xpGained = TASK_XP[task.priority] ?? 50;

    const updatedUser = await prisma.user.update({
      where: { id: task.userId },
      data: { xp: { increment: xpGained } },
    });

    const newLevel = Math.floor(updatedUser.xp / XP_PER_LEVEL) + 1;
    if (newLevel > updatedUser.level) {
      await prisma.user.update({ where: { id: task.userId }, data: { level: newLevel } });
      await prisma.notification.create({
        data: {
          userId: task.userId,
          title: '¡Subiste de nivel!',
          message: `Felicidades, ahora eres nivel ${newLevel}.`,
          type: 'XP_GAINED',
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: task.userId,
        title: `✅ Tarea aprobada: ${task.title}`,
        message: `Tu PM ha aprobado la tarea. Has ganado ${xpGained} XP.`,
        type: 'SUCCESS',
      },
    });
  }

  return updated;
};

export const getTimesheetSubmissions = async (adminUserId: string) => {
  const companyId = await getAdminCompanyId(adminUserId);
  return prisma.task.findMany({
    where: {
      user: { companyId },
      completionData: { not: Prisma.DbNull },
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      completionData: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true } },
      box: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
};
