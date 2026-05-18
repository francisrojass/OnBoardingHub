import { prisma } from '../../config/database';

const XP_PER_LEVEL = 500;

const TASK_XP: Record<string, number> = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 100,
};

export const getTasksForUser = async (userId: string) => {
  return prisma.task.findMany({
    where: { userId },
    include: { box: { select: { id: true, title: true, difficulty: true } } },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
  });
};

export const updateTaskStatus = async (
  taskId: string,
  userId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error('Tarea no encontrada');

  // Employees cannot mark tasks as COMPLETED – only PENDING <-> IN_PROGRESS
  if (status === 'COMPLETED') {
    throw new Error('Solo un administrador puede aprobar la finalización de una tarea');
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  return updated;
};

export const createDefaultTasksForUser = async (userId: string) => {
  const defaults = [
    { title: 'Completa tu perfil', description: 'Añade tu información personal en la sección de configuración', priority: 'HIGH' as const, category: 'Onboarding' },
    { title: 'Explora el Dashboard', description: 'Familiarízate con la plataforma y sus secciones principales', priority: 'MEDIUM' as const, category: 'Onboarding' },
    { title: 'Lanza tu primer sandbox', description: 'Accede a un box y lanza el entorno de laboratorio interactivo', priority: 'HIGH' as const, category: 'Técnico' },
    { title: 'Configura tu entorno local', description: 'Instala las herramientas necesarias según la guía de tu equipo', priority: 'HIGH' as const, category: 'Técnico' },
    { title: 'Lee la documentación de onboarding', description: 'Revisa los recursos de formación asignados a tu rol', priority: 'MEDIUM' as const, category: 'Formación' },
    { title: 'Completa el checklist de seguridad', description: 'Revisa y acepta las políticas de seguridad de la empresa', priority: 'HIGH' as const, category: 'Compliance' },
    { title: 'Preséntate a tu equipo', description: 'Envía un mensaje de presentación al canal de tu equipo', priority: 'LOW' as const, category: 'Social' },
    { title: 'Agenda tu primera reunión 1:1', description: 'Programa una reunión introductoria con tu manager directo', priority: 'MEDIUM' as const, category: 'Social' },
  ];

  await prisma.task.createMany({
    data: defaults.map((t) => ({ ...t, userId })),
  });
};
