import { prisma } from '../../config/database';

const XP_PER_LEVEL = 500;

export function computeLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpForNextLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export const getProgressForUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });
  if (!user) throw new Error('Usuario no encontrado');

  const boxProgresses = await prisma.boxProgress.findMany({
    where: { userId },
    include: { box: { select: { id: true, title: true, difficulty: true, xpReward: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  const completedBoxes = boxProgresses.filter(p => p.completedAt !== null).length;
  const currentLevelXp = user.xp % XP_PER_LEVEL;
  const nextLevelXp = XP_PER_LEVEL;

  return {
    xp: user.xp,
    level: user.level,
    currentLevelXp,
    nextLevelXp,
    completedBoxes,
    boxProgresses,
  };
};

export const completeBox = async (userId: string, boxId: string) => {
  const box = await prisma.box.findUnique({ where: { id: boxId } });
  if (!box) throw new Error('Box no encontrado');

  const existing = await prisma.boxProgress.findUnique({
    where: { userId_boxId: { userId, boxId } },
  });

  if (existing?.completedAt) {
    return { alreadyCompleted: true, xpEarned: 0 };
  }

  const xpEarned = box.xpReward;

  await prisma.boxProgress.upsert({
    where: { userId_boxId: { userId, boxId } },
    create: { userId, boxId, xpEarned, completedAt: new Date() },
    update: { xpEarned, completedAt: new Date() },
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: xpEarned },
    },
  });

  const newLevel = computeLevel(updatedUser.xp);
  const leveledUp = newLevel > updatedUser.level;

  await prisma.user.update({
    where: { id: userId },
    data: { level: newLevel },
  });

  // Notification: box completed
  await prisma.notification.create({
    data: {
      userId,
      title: `Box completado: ${box.title}`,
      message: `Has ganado ${xpEarned} XP por completar "${box.title}".`,
      type: 'BOX_COMPLETED',
    },
  });

  if (leveledUp) {
    await prisma.notification.create({
      data: {
        userId,
        title: '¡Subiste de nivel!',
        message: `Felicidades, ahora eres nivel ${newLevel}.`,
        type: 'XP_GAINED',
      },
    });
  }

  return { alreadyCompleted: false, xpEarned, leveledUp, newLevel: newLevel };
};
