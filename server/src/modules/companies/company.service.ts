import { prisma } from '../../config/database';

export const getCompanies = async () => {
  return prisma.company.findMany({
    include: {
      companyBoxes: {
        include: { box: true },
      },
    },
  });
};

export const assignBoxToCompany = async (companyId: string, boxId: string) => {
  const existing = await prisma.companyBox.findUnique({
    where: { companyId_boxId: { companyId, boxId } },
  });
  if (existing) throw new Error('Box ya asignada a la empresa');
  
  return prisma.companyBox.create({
    data: { companyId, boxId },
  });
};

export const removeBoxFromCompany = async (companyId: string, boxId: string) => {
  const existing = await prisma.companyBox.findUnique({
    where: { companyId_boxId: { companyId, boxId } },
  });
  if (!existing) throw new Error('Box no estaba asignada a esta empresa');
  
  return prisma.companyBox.delete({
    where: { companyId_boxId: { companyId, boxId } },
  });
};
