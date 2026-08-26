import { Router, Response } from 'express';
import { db } from '../db';
import { requireManagement, AuthenticatedRequest } from '../auth';
import { LeadStatus, BusinessBrand, BrandAccess } from '../../src/types';
import {
  validateRequest,
  createTelecallerSchema,
  updateTelecallerSchema,
  createLeadSchema,
  importLeadsSchema,
  assignLeadsSchema,
  autoDistributeSchema,
  resetPasswordSchema,
} from '../middleware/validate';

export const adminRouter = Router();

// Protect all admin routes with requireAdmin middleware
adminRouter.use(requireManagement);

// GET /api/admin/telecallers
adminRouter.get('/telecallers', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const brand = req.query.brand as 'ALL' | BusinessBrand | undefined;
    const telecallers = await db.getTelecallers(brand, req.user);
    const performance = await db.getAllTelecallersPerformance(brand, req.user);

    const enriched = telecallers.map((tc) => {
      const perf = performance.find((p) => p.telecallerId === tc.id);
      return {
        ...tc,
        metrics: perf,
      };
    });

    res.json({ telecallers: enriched });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to fetch telecallers.';
    res.status(500).json({ error: errorMsg });
  }
});

// POST /api/admin/telecallers
adminRouter.post('/telecallers', validateRequest(createTelecallerSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, loginId, password, brandAccess, phone, email, dailyTarget } = req.body;

  try {
    const result = await db.createTelecaller({
      name,
      loginId,
      password,
      brandAccess: (brandAccess as BrandAccess) || 'APNI_VIDYA',
      phone,
      email,
      dailyTarget: Number(dailyTarget) || 50,
    }, req.user);

    const safeUser = result.user;

    res.status(201).json({
      message: `Telecaller ${safeUser.name} (${safeUser.loginId}) [${safeUser.brandAccess}] created successfully`,
      telecaller: safeUser,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create telecaller' });
  }
});

// PATCH /api/admin/telecallers/:id
adminRouter.patch('/telecallers/:id', validateRequest(updateTelecallerSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updated = await db.updateTelecaller(id, updates, req.user);
    res.json({
      message: `Telecaller ${updated.name} updated successfully`,
      telecaller: updated,
    });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Telecaller not found' });
  }
});

// DELETE /api/admin/telecallers/:id
adminRouter.delete('/telecallers/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await db.deleteTelecaller(id, req.user);
    res.json({
      message: `Telecaller removed. ${result.unassignedLeadsCount} leads moved to unassigned pool.`,
      result,
    });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Failed to delete telecaller' });
  }
});

// POST /api/admin/telecallers/:id/reset-password
adminRouter.post('/telecallers/:id/reset-password', validateRequest(resetPasswordSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await db.resetTelecallerPassword(id, req.body.password, req.user);
    res.json({
      message: 'Password updated successfully.',
      user,
    });
  } catch (err: any) {
    const status = err.message?.includes('not found') ? 404 : 403;
    res.status(status).json({ error: err.message || 'Failed to reset telecaller password' });
  }
});

// GET /api/admin/leads
adminRouter.get('/leads', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { brand, assignedTo, status, search } = req.query;

    const leads = await db.getAllLeads({
      brand: brand as 'ALL' | BusinessBrand,
      assignedTo: assignedTo as string,
      status: status as LeadStatus,
      search: search as string,
    }, req.user);

    res.json({ leads, total: leads.length });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to fetch leads.';
    res.status(500).json({ error: errorMsg });
  }
});

// POST /api/admin/leads (create a single lead with brand custom fields)
adminRouter.post('/leads', validateRequest(createLeadSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    name,
    phone,
    email,
    city,
    brand,
    courseInterest,
    qualification,
    preferredBatch,
    propertyType,
    budget,
    preferredLocation,
    siteVisitDate,
    source,
    assignedTo,
    notes,
  } = req.body;

  const selectedBrand: BusinessBrand = (brand as BusinessBrand) || (courseInterest ? 'APNI_VIDYA' : 'APNI_ESTATE');

  try {
    const result = await db.importLeads(
      [
        {
          name,
          phone,
          email,
          city,
          brand: selectedBrand,
          courseInterest,
          qualification,
          preferredBatch,
          propertyType,
          budget,
          preferredLocation,
          siteVisitDate,
          source: source || 'Manual Entry',
          notes,
        },
      ],
      assignedTo || null,
      req.user,
      selectedBrand
    );

    if (result.leads.length > 0) {
      res.status(201).json({
        message: `Lead ${name} for [${selectedBrand === 'APNI_VIDYA' ? 'Apni Vidya' : 'Apni Estate'}] created successfully`,
        lead: result.leads[0],
      });
    } else {
      res.status(400).json({ error: 'Failed to create lead with provided details.' });
    }
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to create lead.';
    res.status(500).json({ error: errorMsg });
  }
});

// POST /api/admin/leads/import
adminRouter.post('/leads/import', validateRequest(importLeadsSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { rows, assignedTelecallerId, defaultBrand } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: 'Please provide a valid array of lead rows to import.' });
    return;
  }

  if (rows.length > 5000) {
    res.status(400).json({ error: 'Maximum 5000 leads per import batch allowed.' });
    return;
  }

  try {
    const result = await db.importLeads(rows, assignedTelecallerId, req.user, defaultBrand);
    res.status(200).json(result);
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to import leads.';
    res.status(500).json({ error: errorMsg });
  }
});

// POST /api/admin/leads/assign
adminRouter.post('/leads/assign', validateRequest(assignLeadsSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { leadIds, telecallerId } = req.body;

  try {
    const result = await db.assignLeads(leadIds, telecallerId, req.user!);
    res.json({
      message: telecallerId
        ? `Successfully assigned ${result.assignedCount} leads to telecaller.`
        : `Successfully unassigned ${result.assignedCount} leads back to pool.`,
      assignedCount: result.assignedCount,
      leads: result.leads,
    });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to assign leads.';
    res.status(500).json({ error: errorMsg });
  }
});

// POST /api/admin/leads/auto-distribute
adminRouter.post('/leads/auto-distribute', validateRequest(autoDistributeSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { brand } = req.body;

  try {
    const result = await db.autoDistributeLeads(brand, req.user!);
    res.json({
      message: result.message,
      vidyaAssigned: result.vidyaAssigned,
      estateAssigned: result.estateAssigned,
      totalAssigned: result.totalAssigned,
    });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Auto-distribution failed.';
    res.status(500).json({ error: errorMsg });
  }
});

// GET /api/admin/leads/:id/history
adminRouter.get('/leads/:id/history', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const history = await db.getLeadHistory(id, req.user);
    res.json({ history });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to fetch lead history.';
    res.status(500).json({ error: errorMsg });
  }
});

// GET /api/admin/performance
adminRouter.get('/performance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const brand = req.query.brand as 'ALL' | BusinessBrand | undefined;
    const metrics = await db.getAdminMetrics(brand, req.user);
    const telecallersPerformance = await db.getAllTelecallersPerformance(brand, req.user);

    res.json({
      metrics,
      telecallersPerformance,
    });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to fetch performance metrics.';
    res.status(500).json({ error: errorMsg });
  }
});

// GET /api/admin/telecallers/:id/performance
adminRouter.get('/telecallers/:id/performance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const metrics = await db.getTelecallerMetrics(id, req.user);
    res.json({ metrics });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to fetch telecaller metrics.';
    res.status(500).json({ error: errorMsg });
  }
});

// GET /api/admin/followups
adminRouter.get('/followups', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const brand = req.query.brand as 'ALL' | BusinessBrand | undefined;
    const followups = await db.getFollowUps(undefined, brand, req.user);
    res.json(followups);
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to fetch follow-ups.';
    res.status(500).json({ error: errorMsg });
  }
});
