import { prisma } from '../../config/database';

const getAdminCompanyId = async (adminUserId: string): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { id: adminUserId } });
  if (!user || user.role !== 'ADMIN') throw new Error('Acceso denegado');
  return user.companyId;
};

export const getTeamOverview = async (adminUserId: string) => {
  const companyId = await getAdminCompanyId(adminUserId);

  const workers = await prisma.user.findMany({
    where: { companyId, role: 'EMPLOYEE' },
    select: {
      id: true,
      name: true,
      email: true,
      xp: true,
      level: true,
      tasks: {
        select: { status: true },
      },
      boxProgresses: {
        select: { completedAt: true },
      },
    },
    orderBy: { xp: 'desc' },
  });

  const totalTasks = workers.reduce((acc, w) => acc + w.tasks.length, 0);
  const completedTasks = workers.reduce(
    (acc, w) => acc + w.tasks.filter(t => t.status === 'COMPLETED').length,
    0
  );
  const totalBoxesCompleted = workers.reduce(
    (acc, w) => acc + w.boxProgresses.filter(p => p.completedAt !== null).length,
    0
  );
  const avgXp = workers.length > 0
    ? Math.round(workers.reduce((acc, w) => acc + w.xp, 0) / workers.length)
    : 0;

  return {
    totalWorkers: workers.length,
    totalTasks,
    completedTasks,
    taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    totalBoxesCompleted,
    avgXp,
    workers: workers.map(w => ({
      id: w.id,
      name: w.name,
      email: w.email,
      xp: w.xp,
      level: w.level,
      totalTasks: w.tasks.length,
      completedTasks: w.tasks.filter(t => t.status === 'COMPLETED').length,
      completedBoxes: w.boxProgresses.filter(p => p.completedAt !== null).length,
      taskProgress: w.tasks.length > 0
        ? Math.round((w.tasks.filter(t => t.status === 'COMPLETED').length / w.tasks.length) * 100)
        : 0,
    })),
  };
};

export const getCompanyBoxStats = async (adminUserId: string) => {
  const companyId = await getAdminCompanyId(adminUserId);

  const companyBoxes = await prisma.companyBox.findMany({
    where: { companyId },
    include: {
      box: {
        include: {
          boxProgresses: {
            where: { user: { companyId } },
            select: { completedAt: true, xpEarned: true },
          },
        },
      },
    },
  });

  return companyBoxes.map(cb => ({
    id: cb.box.id,
    title: cb.box.title,
    difficulty: cb.box.difficulty,
    xpReward: cb.box.xpReward,
    totalCompletions: cb.box.boxProgresses.filter(p => p.completedAt !== null).length,
    totalAttempts: cb.box.boxProgresses.length,
  }));
};
