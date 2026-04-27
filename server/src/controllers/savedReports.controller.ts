import { Request, Response } from 'express';
import * as svc from '../services/savedReports.service.js';
import type { ReportType } from '../../../shared/types/savedReports.types.js';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const reportType = req.query.type as ReportType | undefined;
    res.json(await svc.getAllSavedReports(reportType));
  } catch (e) {
    console.error('Get saved reports error:', e);
    res.status(500).json({ error: 'Failed to fetch saved reports' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await svc.getSavedReportById(req.params.id);
    if (!report) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(report);
  } catch (e) {
    console.error('Get saved report error:', e);
    res.status(500).json({ error: 'Failed to fetch saved report' });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const savedBy = req.user!.email || 'Unknown';
    res.status(201).json(await svc.createSavedReport(req.body, savedBy));
  } catch (e) {
    console.error('Create saved report error:', e);
    res.status(500).json({ error: 'Failed to save report' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await svc.deleteSavedReport(req.params.id);
    if (!deleted) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Delete saved report error:', e);
    res.status(500).json({ error: 'Failed to delete saved report' });
  }
};
