import { Response } from 'express';
import { AuthRequest } from '../types';
import * as reportService from '../services/report.service';

/**
 * Create a new report
 */
export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { type, targetId, reason, evidence } = req.body;

    if (!type || !targetId || !reason) {
      res.status(400).json({ error: 'Type, targetId, and reason are required' });
      return;
    }

    if (!['TASK', 'USER', 'MESSAGE', 'REVIEW'].includes(type)) {
      res.status(400).json({ error: 'Invalid report type' });
      return;
    }

    const report = await reportService.createReport({
      type,
      targetId,
      reporterId: req.user.userId,
      reason,
      evidence,
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create report' });
    }
  }
};

/**
 * Get all reports (admin only)
 */
export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      page = '1',
      limit = '50',
      type,
      status,
      startDate,
      endDate,
    } = req.query;

    const result = await reportService.getReports({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      type: type as 'TASK' | 'USER' | 'MESSAGE' | 'REVIEW' | undefined,
      status: status as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching reports:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }
};

/**
 * Get a single report by ID (admin only)
 */
export const getReportById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { type, reportId } = req.params;

    if (!type || !reportId) {
      res.status(400).json({ error: 'Type and reportId are required' });
      return;
    }

    const report = await reportService.getReportById(type, reportId);

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.status(200).json({
      message: 'Report retrieved successfully',
      report,
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  }
};

/**
 * Resolve a report (admin only)
 */
export const resolveReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { type, reportId } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!type || !reportId || !status) {
      res.status(400).json({ error: 'Type, reportId, and status are required' });
      return;
    }

    if (!['OPEN', 'RESOLVED', 'CLOSED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const report = await reportService.resolveReport(
      type,
      reportId,
      req.user.userId,
      status,
      resolutionNotes
    );

    res.status(200).json({
      message: 'Report resolved successfully',
      report,
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to resolve report' });
    }
  }
};

/**
 * Get report metrics (admin only)
 */
export const getReportMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const metrics = await reportService.getReportMetrics();

    res.status(200).json({
      message: 'Metrics retrieved successfully',
      metrics,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

