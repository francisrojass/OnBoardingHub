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
  dockerImage: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  companyId: string;
}) => {
  const box = await prisma.box.create({
    data: {
      title: data.title,
      description: data.description,
      objectives: data.objectives,
      dockerImage: data.dockerImage,
      difficulty: data.difficulty || 'BEGINNER',
    },
  });

  await prisma.companyBox.create({
    data: { companyId: data.companyId, boxId: box.id },
  });

  return box;
};

export const getAllBoxes = async () => {
  return prisma.box.findMany();
};
