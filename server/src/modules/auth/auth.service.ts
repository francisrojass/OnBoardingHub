import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { ENV } from '../../config/env';

const signToken = (userId: string, role: string): string => {
  return jwt.sign(
    { userId, role },
    ENV.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

export const register = async (
  email: string,
  password: string,
  name: string,
  companyName: string
) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('El email ya está registrado');

  let company = await prisma.company.findFirst({ where: { name: companyName } });
  if (!company) {
    company = await prisma.company.create({ data: { name: companyName } });
  }

  const hashed = await bcrypt.hash(password, 10);

  const role = email === 'frarojram@gmail.com' ? 'ADMIN' : 'EMPLOYEE';

  const user = await prisma.user.create({
    data: { email, password: hashed, name, companyId: company.id, role },
  });

  const token = signToken(user.id, user.role);

  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Credenciales incorrectas');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Credenciales incorrectas');

  const token = signToken(user.id, user.role);

  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
};

export const getMe = async (userId: string) => {
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
  };
};
