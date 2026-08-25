import { Router, Response } from 'express';
import { requireOwner, AuthenticatedRequest } from '../auth';
import { db } from '../db';
import { createHrSchema, resetPasswordSchema, updateHrSchema, validateRequest } from '../middleware/validate';

export const ownerRouter = Router();
ownerRouter.use(requireOwner);

ownerRouter.get('/hr', async (req: AuthenticatedRequest, res: Response) => {
  try { res.json({ hrs: await db.getHrs(req.user!) }); } catch (error: any) { res.status(400).json({ error: error.message }); }
});
ownerRouter.post('/hr', validateRequest(createHrSchema), async (req: AuthenticatedRequest, res: Response) => {
  try { res.status(201).json({ hr: await db.createHr(req.body, req.user!) }); } catch (error: any) { res.status(400).json({ error: error.message }); }
});
ownerRouter.patch('/hr/:id', validateRequest(updateHrSchema), async (req: AuthenticatedRequest, res: Response) => {
  try { res.json({ hr: await db.updateHr(req.params.id, req.body, req.user!) }); } catch (error: any) { res.status(400).json({ error: error.message }); }
});
ownerRouter.post('/hr/:id/reset-password', validateRequest(resetPasswordSchema), async (req: AuthenticatedRequest, res: Response) => {
  try { res.json(await db.resetHrPassword(req.params.id, req.body.password, req.user!)); } catch (error: any) { res.status(400).json({ error: error.message }); }
});
