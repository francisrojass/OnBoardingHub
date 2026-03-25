import { Response } from 'express';
import * as notifService from './notification.service';
import { AuthRequest } from '../../middlewares/verifyToken';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await notifService.getNotificationsForUser(req.userId!);
    const unreadCount = await notifService.getUnreadCount(req.userId!);
    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    await notifService.markAsRead(id, req.userId!);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await notifService.markAllAsRead(req.userId!);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteNotif = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    await notifService.deleteNotification(id, req.userId!);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
