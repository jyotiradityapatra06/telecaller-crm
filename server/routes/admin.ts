import { Router, Response } from 'express';
import { db } from '../db';
import { requireAdmin, AuthenticatedRequest } from '../auth';
import { LeadStatus, BusinessBrand, BrandAccess } from '../../src/types';

export const adminRouter = Router();

// Protect all admin routes with requireAdmin middleware
adminRouter.use(requireAdmin);

// GET /api/admin/telecallers
adminRouter.get('/telecallers', (req: AuthenticatedRequest, res: Response): void => {
  const brand = req.query.brand as 'ALL' | BusinessBrand | undefined;
  const telecallers = db.getTelecallers(brand);
  const performance = db.getAllTelecallersPerformance(brand);

  const enriched = telecallers.map((tc) => {
    const perf = performance.find((p) => p.telecallerId === tc.id);
    return {
      ...tc,
      metrics: perf,
    };
  });

  res.json({ telecallers: enriched });
});

// POST /api/admin/telecallers
adminRouter.post('/telecallers', (req: AuthenticatedRequest, res: Response): void => {
  const { name, loginId, password, brandAccess, phone, email, dailyTarget } = req.body;

  if (!name || !loginId || !password) {
    res.status(400).json({ error: 'Name, Telecaller ID, and Password are required.' });
    return;
  }

  try {
    const newTelecaller = db.createTelecaller({
      name,
      loginId,
      password,
      brandAccess: (brandAccess as BrandAccess) || 'APNI_VIDYA',
      phone,
      email,
      dailyTarget: Number(dailyTarget) || 50,
    });

    res.status(201).json({
      message: `Telecaller ${newTelecaller.name} (${newTelecaller.loginId}) [${newTelecaller.brandAccess}] created successfully`,
      telecaller: newTelecaller,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create telecaller' });
  }
});

// PATCH /api/admin/telecallers/:id
adminRouter.patch('/telecallers/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updated = db.updateTelecaller(id, updates);
    res.json({
      message: `Telecaller ${updated.name} updated successfully`,
      telecaller: updated,
    });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Telecaller not found' });
  }
});

// DELETE /api/admin/telecallers/:id
adminRouter.delete('/telecallers/:id', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;

  try {
    const result = db.deleteTelecaller(id);
    res.json({
      message: `Telecaller removed. ${result.unassignedLeadsCount} leads moved to unassigned pool.`,
      result,
    });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Failed to delete telecaller' });
  }
});

// GET /api/admin/leads
adminRouter.get('/leads', (req: AuthenticatedRequest, res: Response): void => {
  const { brand, assignedTo, status, search } = req.query;

  const leads = db.getAllLeads({
    brand: brand as 'ALL' | BusinessBrand,
    assignedTo: assignedTo as string,
    status: status as LeadStatus,
    search: search as string,
  });

  res.json({ leads, total: leads.length });
});

// POST /api/admin/leads (create a single lead with brand custom fields)
adminRouter.post('/leads', (req: AuthenticatedRequest, res: Response): void => {
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

  if (!name || !phone) {
    res.status(400).json({ error: 'Name and Phone number are required.' });
    return;
  }

  const selectedBrand: BusinessBrand = (brand as BusinessBrand) || (courseInterest ? 'APNI_VIDYA' : 'APNI_ESTATE');

  try {
    const result = db.importLeads(
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
    res.status(500).json({ error: err.message || 'Failed to create lead.' });
  }
});

// POST /api/admin/leads/import
adminRouter.post('/leads/import', (req: AuthenticatedRequest, res: Response): void => {
  const { rows, assignedTelecallerId, defaultBrand } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: 'Please provide a valid array of lead rows to import.' });
    return;
  }

  try {
    const result = db.importLeads(rows, assignedTelecallerId, req.user, defaultBrand);
    res.status(201).json({
      message: `Successfully imported ${result.importedCount} leads (${result.failedCount} invalid rows skipped).`,
      importedCount: result.importedCount,
      failedCount: result.failedCount,
      leads: result.leads,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to import leads.' });
  }
});

// POST /api/admin/leads/assign
adminRouter.post('/leads/assign', (req: AuthenticatedRequest, res: Response): void => {
  const { leadIds, telecallerId } = req.body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    res.status(400).json({ error: 'Please select at least one lead to assign.' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = db.assignLeads(leadIds, telecallerId || null, req.user);
    res.json({
      message: `Successfully assigned ${result.assignedCount} leads.`,
      assignedCount: result.assignedCount,
      leads: result.leads,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to assign leads.' });
  }
});

// POST /api/admin/leads/auto-distribute
adminRouter.post('/leads/auto-distribute', (req: AuthenticatedRequest, res: Response): void => {
  const { brand } = req.body;

  try {
    const result = db.autoDistributeLeads(brand as 'ALL' | BusinessBrand, req.user);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to auto-distribute leads.' });
  }
});

// GET /api/admin/leads/:id/history
adminRouter.get('/leads/:id/history', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const lead = db.getLeadById(id);

  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  const history = db.getLeadHistory(id);
  res.json({ lead, history });
});

// GET /api/admin/performance
adminRouter.get('/performance', (req: AuthenticatedRequest, res: Response): void => {
  const brand = req.query.brand as 'ALL' | BusinessBrand | undefined;
  const metrics = db.getAdminMetrics(brand);
  const telecallersPerformance = db.getAllTelecallersPerformance(brand);
  res.json({ metrics, telecallersPerformance });
});

// GET /api/admin/telecallers/:id/performance
adminRouter.get('/telecallers/:id/performance', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const tc = db.findUserById(id);

  if (!tc || tc.role !== 'TELECALLER') {
    res.status(404).json({ error: 'Telecaller not found' });
    return;
  }

  const metrics = db.getTelecallerMetrics(id);
  const assignedLeads = db.getAllLeads({ assignedTo: id });

  res.json({
    telecaller: {
      id: tc.id,
      name: tc.name,
      loginId: tc.loginId,
      brandAccess: tc.brandAccess,
      phone: tc.phone,
      email: tc.email,
      dailyTarget: tc.dailyTarget,
      isActive: tc.isActive,
      createdAt: tc.createdAt,
    },
    metrics,
    assignedLeads,
  });
});

// GET /api/admin/followups
adminRouter.get('/followups', (req: AuthenticatedRequest, res: Response): void => {
  const brand = req.query.brand as 'ALL' | BusinessBrand | undefined;
  const followUps = db.getFollowUps(undefined, brand);
  res.json(followUps);
});
