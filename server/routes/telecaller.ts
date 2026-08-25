import { Router, Response } from 'express';
import { db } from '../db';
import { requireTelecaller, AuthenticatedRequest } from '../auth';
import { LeadStatus, BusinessBrand } from '../../src/types';
import {
  validateRequest,
  recordCallSchema,
  scheduleFollowUpSchema,
  completeFollowUpSchema,
} from '../middleware/validate';

export const telecallerRouter = Router();

// Protect all telecaller routes with requireTelecaller middleware
telecallerRouter.use(requireTelecaller);

// GET /api/telecaller/leads - Returns ONLY assigned leads with strict brand isolation
telecallerRouter.get('/leads', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { status, search, brand } = req.query;

  try {
    let brandFilter: 'ALL' | BusinessBrand | undefined = undefined;
    if (user.brandAccess === 'APNI_VIDYA') {
      brandFilter = 'APNI_VIDYA';
    } else if (user.brandAccess === 'APNI_ESTATE') {
      brandFilter = 'APNI_ESTATE';
    } else if (brand && brand !== 'ALL') {
      brandFilter = brand as BusinessBrand;
    }

    const leads = await db.getAllLeads({
      assignedTo: user.id,
      brand: brandFilter,
      status: status as LeadStatus,
      search: search as string,
    }, user);

    res.json({ leads, total: leads.length, brandAccess: user.brandAccess });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to fetch telecaller leads.';
    res.status(500).json({ error: errorMsg });
  }
});

// GET /api/telecaller/followups - Returns ONLY assigned follow-ups for current telecaller
telecallerRouter.get('/followups', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { brand } = req.query;

  try {
    let brandFilter: 'ALL' | BusinessBrand | undefined = undefined;
    if (user.brandAccess === 'APNI_VIDYA') {
      brandFilter = 'APNI_VIDYA';
    } else if (user.brandAccess === 'APNI_ESTATE') {
      brandFilter = 'APNI_ESTATE';
    } else if (brand && brand !== 'ALL') {
      brandFilter = brand as BusinessBrand;
    }

    const followUps = await db.getFollowUps(user.id, brandFilter, user);
    res.json(followUps);
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to fetch follow-ups.';
    res.status(500).json({ error: errorMsg });
  }
});

// POST /api/telecaller/calls - Records call or WhatsApp result and updates status
telecallerRouter.post('/calls', validateRequest(recordCallSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { leadId, status, note, durationSeconds, callType, followUp } = req.body;

  try {
    const lead = await db.getLeadById(leadId, user);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    if (lead.assignedTo !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only record calls for leads assigned to you.' });
      return;
    }

    if (lead.brand !== user.brandAccess) {
      res.status(403).json({ error: `Forbidden: You do not have permission to access leads from [${lead.brand}].` });
      return;
    }

    const result = await db.recordCallActivity({
      leadId,
      telecallerId: user.id,
      status,
      note,
      durationSeconds,
      callType: callType || 'CALL',
      customFields: req.body.customFields,
      followUp,
    }, user);

    res.json({
      message: `Call status updated to [${status}] successfully`,
      lead: result.lead,
      callActivity: result.callActivity,
      followUp: result.followUp,
    });
  } catch (err: any) {
    console.error('[TELECALLER_CALL_ERROR]', {
      route: 'POST /api/telecaller/calls',
      operation: 'record_call_activity',
      userId: user?.id,
      organizationId: user?.organizationId,
      leadId,
      status,
      message: err?.message || String(err),
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to record call activity.';
    res.status(500).json({ error: errorMsg });
  }
});

// POST /api/telecaller/followups - Schedules a follow-up
telecallerRouter.post('/followups', validateRequest(scheduleFollowUpSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { leadId, dueDate, dueTime, note } = req.body;

  try {
    const lead = await db.getLeadById(leadId, user);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    if (lead.assignedTo !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only schedule follow-ups for leads assigned to you.' });
      return;
    }

    const followUp = await db.scheduleFollowUp({
      leadId,
      telecallerId: user.id,
      dueDate,
      dueTime: dueTime || '04:00 PM',
      note,
    }, user);

    res.status(201).json({
      message: 'Follow-up scheduled successfully',
      followUp,
    });
  } catch (err: any) {
    console.error('[TELECALLER_FOLLOWUP_ERROR]', {
      route: 'POST /api/telecaller/followups',
      operation: 'schedule_follow_up',
      userId: user?.id,
      organizationId: user?.organizationId,
      leadId,
      dueDate,
      dueTime,
      message: err?.message || String(err),
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to schedule follow-up.';
    res.status(500).json({ error: errorMsg });
  }
});

// PATCH /api/telecaller/followups/:id/complete - Completes a follow-up
telecallerRouter.patch('/followups/:id/complete', validateRequest(completeFollowUpSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { note, completionNote } = req.body;
  const user = req.user!;
  const noteToUse = completionNote || note;

  try {
    const followUpsObj = await db.getFollowUps(user.id, 'ALL', user);
    const allFollowUps = [
      ...followUpsObj.overdue,
      ...followUpsObj.today,
      ...followUpsObj.upcoming,
      ...followUpsObj.completed,
    ];
    const targetFu = allFollowUps.find((f) => f.id === id);

    if (!targetFu) {
      res.status(404).json({ error: 'Follow-up not found or access denied.' });
      return;
    }

    if (targetFu.telecallerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You are not authorized to complete this follow-up.' });
      return;
    }

    const result = await db.completeFollowUp(id, user, noteToUse);
    res.json({
      message: 'Follow-up completed successfully',
      followUp: result.followUp,
      lead: result.lead,
    });
  } catch (err: any) {
    console.error('[TELECALLER_FOLLOWUP_COMPLETE_ERROR]', {
      route: `PATCH /api/telecaller/followups/${id}/complete`,
      operation: 'complete_follow_up',
      userId: user?.id,
      organizationId: user?.organizationId,
      followUpId: id,
      message: err?.message || String(err),
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to complete follow-up.';
    res.status(500).json({ error: errorMsg });
  }
});

// GET /api/telecaller/performance
telecallerRouter.get('/performance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    const metrics = await db.getTelecallerMetrics(user.id, user);
    res.json({ metrics, brandAccess: user.brandAccess });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to fetch performance.';
    res.status(500).json({ error: errorMsg });
  }
});
