import { prisma } from '../../config/database';

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  });
  if (!user) throw new Error('Usuario no encontrado');

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    company: { id: user.company.id, name: user.company.name },
    createdAt: user.createdAt,
  };
};

export const updateProfile = async (
  userId: string,
  data: { name?: string; avatar?: string }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
  };
};
