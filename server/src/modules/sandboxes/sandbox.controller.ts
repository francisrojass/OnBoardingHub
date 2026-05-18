import { Response } from 'express';
import * as sandboxService from './sandbox.service';
import { AuthRequest } from '../../middlewares/verifyToken';
import { prisma } from '../../config/database';

export const launch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boxId } = req.body;
    if (!boxId) {
      res.status(400).json({ message: 'boxId es obligatorio' });
      return;
    }
    const sandbox = await sandboxService.launchSandbox(boxId, req.userId!);
    res.status(201).json(sandbox);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const handleEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventType, payload, boxId } = req.body;
    if (!eventType) {
      res.status(400).json({ message: 'eventType es obligatorio' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, name: true, companyId: true },
    });
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return; }

    if (eventType === 'TIMESHEET_SUBMITTED') {
      // Find the task linked to this box for this user
      const task = boxId
        ? await prisma.task.findFirst({ where: { userId: user.id, boxId, status: { not: 'COMPLETED' } } })
        : null;

      // Mark task as COMPLETED and store what the employee filled in
      if (task) {
        await prisma.task.update({
          where: { id: task.id },
          data: { status: 'COMPLETED', completionData: payload || {} },
        });

        // Grant XP
        const XP_MAP: Record<string, number> = { LOW: 25, MEDIUM: 50, HIGH: 100 };
        const xpGained = XP_MAP[task.priority] ?? 50;
        await prisma.user.update({
          where: { id: user.id },
          data: { xp: { increment: xpGained } },
        });
      }

      // Notify admins
      const admins = await prisma.user.findMany({
        where: { companyId: user.companyId, role: 'ADMIN' },
        select: { id: true },
      });

      const report = payload || {};
      const totalHours = report.totalHours || 0;
      const daysSummary = (report.days || [])
        .map((d: any) => `${d.day}: ${d.totalHours}h`)
        .join(' | ');

      const message = task
        ? `${user.name} ha completado la tarea "${task.title}". Total: ${totalHours}h. Desglose: ${daysSummary}`
        : `${user.name} ha enviado su parte de horas. Total: ${totalHours}h. Desglose: ${daysSummary}`;

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: `✅ Tarea completada — ${user.name}`,
            message,
            type: 'INFO',
          },
        });
      }

      res.json({ ok: true, taskCompleted: !!task });
    } else {
      res.status(400).json({ message: `Evento no soportado: ${eventType}` });
    }
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const stop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sandboxId = req.params['id'] as string;
    const result = await sandboxService.stopSandbox(sandboxId, req.userId!);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sandboxId = req.params['id'] as string;
    const sandbox = await sandboxService.getSandboxStatus(sandboxId, req.userId!);
    res.json(sandbox);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const getMySandboxes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sandboxes = await sandboxService.getUserSandboxes(req.userId!);
    res.json(sandboxes);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
