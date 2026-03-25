import { prisma } from '../../config/database';

export const getNotificationsForUser = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return prisma.notification.count({ where: { userId, read: false } });
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notif = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notif) throw new Error('Notificación no encontrada');
  return prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
};

export const deleteNotification = async (notificationId: string, userId: string) => {
  const notif = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notif) throw new Error('Notificación no encontrada');
  await prisma.notification.delete({ where: { id: notificationId } });
};
