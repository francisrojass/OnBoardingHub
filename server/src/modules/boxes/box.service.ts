import { prisma } from '../../config/database';

export const getBoxesForUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });
  if (!user) throw new Error('Usuario no encontrado');

  const companyBoxes = await prisma.companyBox.findMany({
    where: { companyId: user.companyId },
    include: { box: true },
  });

  return companyBoxes.map((cb) => cb.box);
};

export const getBoxById = async (boxId: string, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });
  if (!user) throw new Error('Usuario no encontrado');

  const companyBox = await prisma.companyBox.findFirst({
    where: { boxId, companyId: user.companyId },
    include: { box: true },
  });

  if (!companyBox) throw new Error('Box no encontrado o no disponible para tu empresa');

  return companyBox.box;
};

export const createBox = async (data: {
  title: string;
  description: string;
  objectives: string;
  guide?: string;
  dockerImage: string;
  innerPort?: number;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  companyId?: string;
}) => {
  const box = await prisma.box.create({
    data: {
      title: data.title,
      description: data.description,
      objectives: data.objectives,
      guide: data.guide || null,
      dockerImage: data.dockerImage,
      innerPort: data.innerPort || 7681,
      difficulty: data.difficulty || 'BEGINNER',
    },
  });

  if (data.companyId) {
    await prisma.companyBox.create({
      data: { companyId: data.companyId, boxId: box.id },
    });
  }

  return box;
};

export const getAllBoxes = async () => {
  return prisma.box.findMany();
};

export const deleteBox = async (boxId: string) => {
  await prisma.$transaction([
    prisma.boxProgress.deleteMany({ where: { boxId } }),
    prisma.task.deleteMany({ where: { boxId } }),
    prisma.companyBox.deleteMany({ where: { boxId } }),
    prisma.sandbox.deleteMany({ where: { boxId } }),
    prisma.box.delete({ where: { id: boxId } })
  ]);
};
