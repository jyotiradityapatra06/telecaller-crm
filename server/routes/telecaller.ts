import { Router, Response } from 'express';
import { db } from '../db';
import { requireTelecaller, AuthenticatedRequest } from '../auth';
import { LeadStatus, BusinessBrand } from '../../src/types';

export const telecallerRouter = Router();

// Protect all telecaller routes with requireTelecaller middleware
telecallerRouter.use(requireTelecaller);

// GET /api/telecaller/leads - Returns ONLY assigned leads with strict brand isolation
telecallerRouter.get('/leads', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { status, search, brand } = req.query;

  // Determine brand filter based on telecaller's brandAccess and optional query
  let brandFilter: 'ALL' | BusinessBrand | undefined = undefined;
  if (user.brandAccess === 'APNI_VIDYA') {
    brandFilter = 'APNI_VIDYA';
  } else if (user.brandAccess === 'APNI_ESTATE') {
    brandFilter = 'APNI_ESTATE';
  } else if (brand && brand !== 'ALL') {
    brandFilter = brand as BusinessBrand;
  }

  const leads = db.getAllLeads({
    assignedTo: user.id,
    brand: brandFilter,
    status: status as LeadStatus,
    search: search as string,
  });

  res.json({ leads, total: leads.length, brandAccess: user.brandAccess });
});

// GET /api/telecaller/followups - Returns ONLY assigned follow-ups for current telecaller
telecallerRouter.get('/followups', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { brand } = req.query;

  let brandFilter: 'ALL' | BusinessBrand | undefined = undefined;
  if (user.brandAccess === 'APNI_VIDYA') {
    brandFilter = 'APNI_VIDYA';
  } else if (user.brandAccess === 'APNI_ESTATE') {
    brandFilter = 'APNI_ESTATE';
  } else if (brand && brand !== 'ALL') {
    brandFilter = brand as BusinessBrand;
  }

  const followUps = db.getFollowUps(user.id, brandFilter);
  res.json(followUps);
});

// POST /api/telecaller/calls - Records call or WhatsApp result and updates status
telecallerRouter.post('/calls', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { leadId, status, note, durationSeconds, callType, followUp } = req.body;

  if (!leadId || !status) {
    res.status(400).json({ error: 'Lead ID and call status are required.' });
    return;
  }

  // Verify lead belongs to telecaller (or admin)
  const lead = db.getLeadById(leadId);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found.' });
    return;
  }

  if (user.role !== 'ADMIN' && lead.assignedTo !== user.id) {
    res.status(403).json({ error: 'Forbidden: You can only record calls for leads assigned to you.' });
    return;
  }

  // Enforce Brand Isolation
  if (user.role !== 'ADMIN' && user.brandAccess !== 'BOTH' && lead.brand !== user.brandAccess) {
    res.status(403).json({ error: `Forbidden: You do not have permission to access leads from [${lead.brand}].` });
    return;
  }

  try {
    const result = db.recordCallActivity({
      leadId,
      telecallerId: user.id,
      status,
      note,
      durationSeconds,
      callType: callType || 'CALL',
      customFields: req.body.customFields,
      followUp,
    });

    res.json({
      message: `Call status updated to [${status}] successfully`,
      lead: result.lead,
      callActivity: result.callActivity,
      followUp: result.followUp,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record call activity.' });
  }
});

// POST /api/telecaller/followups - Schedules a follow-up
telecallerRouter.post('/followups', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { leadId, dueDate, dueTime, note } = req.body;

  if (!leadId || !dueDate) {
    res.status(400).json({ error: 'Lead ID and follow-up date are required.' });
    return;
  }

  const lead = db.getLeadById(leadId);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found.' });
    return;
  }

  if (user.role !== 'ADMIN' && lead.assignedTo !== user.id) {
    res.status(403).json({ error: 'Forbidden: You can only schedule follow-ups for leads assigned to you.' });
    return;
  }

  try {
    const followUp = db.scheduleFollowUp({
      leadId,
      telecallerId: user.id,
      dueDate,
      dueTime: dueTime || '04:00 PM',
      note,
    });

    res.status(201).json({
      message: 'Follow-up scheduled successfully',
      followUp,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to schedule follow-up.' });
  }
});

// PATCH /api/telecaller/followups/:id/complete - Completes a follow-up
telecallerRouter.patch('/followups/:id/complete', (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const result = db.completeFollowUp(id, req.user!, note);
    res.json({
      message: 'Follow-up completed successfully',
      followUp: result.followUp,
      lead: result.lead,
    });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Failed to complete follow-up.' });
  }
});

// GET /api/telecaller/performance - Returns current telecaller metrics & target progress
telecallerRouter.get('/performance', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const metrics = db.getTelecallerMetrics(user.id);
  res.json({ metrics, brandAccess: user.brandAccess });
});
