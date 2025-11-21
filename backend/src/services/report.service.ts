import prisma from '../config/database';
import { ReportStatus, ReportType } from '@prisma/client';
import * as auditService from './audit.service';
import * as notificationService from './notification.service';
import { NotificationType } from '@prisma/client';

export interface CreateReportData {
  type: 'TASK' | 'USER' | 'MESSAGE' | 'REVIEW';
  targetId: string; // taskId, userId, messageId, or reviewId
  reporterId: string;
  reason: string;
  evidence?: string[]; // Array of screenshot URLs
}

/**
 * Create a new report
 */
export const createReport = async (data: CreateReportData) => {
  const { type, targetId, reporterId, reason, evidence } = data;

  // Validate that target exists
  let targetExists = false;
  switch (type) {
    case 'TASK':
      targetExists = !!(await prisma.task.findUnique({ where: { taskId: targetId } }));
      break;
    case 'USER':
      targetExists = !!(await prisma.user.findUnique({ where: { userId: targetId } }));
      break;
    case 'MESSAGE':
      targetExists = !!(await prisma.chatMessage.findUnique({ where: { messageId: targetId } }));
      break;
    case 'REVIEW':
      targetExists = !!(await prisma.review.findUnique({ where: { reviewId: targetId } }));
      break;
  }

  if (!targetExists) {
    throw new Error(`${type} not found`);
  }

  // Check if user already reported this item
  const existingReport = await getExistingReport(type, targetId, reporterId);
  if (existingReport) {
    throw new Error('You have already reported this item');
  }

  // Create report based on type
  let report;
  const evidenceJson = evidence ? JSON.stringify(evidence) : null;

  switch (type) {
    case 'TASK':
      report = await prisma.taskReport.create({
        data: {
          taskId: targetId,
          reporterId,
          reason,
          evidence: evidenceJson,
          status: ReportStatus.OPEN,
        },
        include: {
          task: {
            select: {
              taskId: true,
              title: true,
            },
          },
          reporter: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
      });
      break;

    case 'USER':
      report = await prisma.userReport.create({
        data: {
          reportedUserId: targetId,
          reporterId,
          reason,
          evidence: evidenceJson,
          status: ReportStatus.OPEN,
        },
        include: {
          reportedUser: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
          reporter: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
      });
      break;

    case 'MESSAGE':
      report = await prisma.messageReport.create({
        data: {
          messageId: targetId,
          reporterId,
          reason,
          evidence: evidenceJson,
          status: ReportStatus.OPEN,
        },
        include: {
          message: {
            select: {
              messageId: true,
              body: true,
            },
          },
          reporter: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
      });
      break;

    case 'REVIEW':
      report = await prisma.reviewReport.create({
        data: {
          reviewId: targetId,
          reporterId,
          reason,
          evidence: evidenceJson,
          status: ReportStatus.OPEN,
        },
        include: {
          review: {
            select: {
              reviewId: true,
              rating: true,
              comment: true,
            },
          },
          reporter: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
      });
      break;
  }

  return report;
};

/**
 * Get existing report to prevent duplicates
 */
const getExistingReport = async (
  type: string,
  targetId: string,
  reporterId: string
): Promise<any> => {
  switch (type) {
    case 'TASK':
      return await prisma.taskReport.findFirst({
        where: {
          taskId: targetId,
          reporterId,
          status: { in: [ReportStatus.OPEN, ReportStatus.RESOLVED] },
        },
      });
    case 'USER':
      return await prisma.userReport.findFirst({
        where: {
          reportedUserId: targetId,
          reporterId,
          status: { in: [ReportStatus.OPEN, ReportStatus.RESOLVED] },
        },
      });
    case 'MESSAGE':
      return await prisma.messageReport.findFirst({
        where: {
          messageId: targetId,
          reporterId,
          status: { in: [ReportStatus.OPEN, ReportStatus.RESOLVED] },
        },
      });
    case 'REVIEW':
      return await prisma.reviewReport.findFirst({
        where: {
          reviewId: targetId,
          reporterId,
          status: { in: [ReportStatus.OPEN, ReportStatus.RESOLVED] },
        },
      });
    default:
      return null;
  }
};

/**
 * Get all reports with filtering and pagination (admin only)
 */
export const getReports = async (params: {
  page?: number;
  limit?: number;
  type?: 'TASK' | 'USER' | 'MESSAGE' | 'REVIEW';
  status?: ReportStatus;
  startDate?: Date;
  endDate?: Date;
}) => {
  const {
    page = 1,
    limit = 50,
    type,
    status,
    startDate,
    endDate,
  } = params;

  const skip = (page - 1) * limit;

  // Get reports from all tables
  const allReports: any[] = [];

  if (!type || type === 'TASK') {
    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const taskReports = await prisma.taskReport.findMany({
      where,
      include: {
        task: {
          select: {
            taskId: true,
            title: true,
          },
        },
        reporter: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    allReports.push(
      ...taskReports.map((r: any) => ({
        ...r,
        type: 'TASK' as const,
        targetId: r.taskId,
        evidence: r.evidence ? JSON.parse(r.evidence) : null,
      }))
    );
  }

  if (!type || type === 'USER') {
    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const userReports = await prisma.userReport.findMany({
      where,
      include: {
        reportedUser: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
        reporter: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    allReports.push(
      ...userReports.map((r: any) => ({
        ...r,
        type: 'USER' as const,
        targetId: r.reportedUserId,
        evidence: r.evidence ? JSON.parse(r.evidence) : null,
      }))
    );
  }

  if (!type || type === 'MESSAGE') {
    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const messageReports = await prisma.messageReport.findMany({
      where,
        include: {
          message: {
            select: {
              messageId: true,
              body: true,
            },
          },
        reporter: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    allReports.push(
      ...messageReports.map((r: any) => ({
        ...r,
        type: 'MESSAGE' as const,
        targetId: r.messageId,
        evidence: r.evidence ? JSON.parse(r.evidence) : null,
      }))
    );
  }

  if (!type || type === 'REVIEW') {
    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const reviewReports = await prisma.reviewReport.findMany({
      where,
      include: {
        review: {
          select: {
            reviewId: true,
            rating: true,
            comment: true,
          },
        },
        reporter: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    allReports.push(
      ...reviewReports.map((r: any) => ({
        ...r,
        type: 'REVIEW' as const,
        targetId: r.reviewId,
        evidence: r.evidence ? JSON.parse(r.evidence) : null,
      }))
    );
  }

  // Sort by createdAt desc and paginate
  allReports.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const total = allReports.length;
  const paginatedReports = allReports.slice(skip, skip + limit);

  return {
    reports: paginatedReports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Get a single report by ID and type
 */
export const getReportById = async (type: string, reportId: string) => {
  switch (type) {
    case 'TASK':
      return await prisma.taskReport.findUnique({
        where: { reportId },
        include: {
          task: true,
          reporter: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
      });
    case 'USER':
      return await prisma.userReport.findUnique({
        where: { reportId },
        include: {
          reportedUser: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
          reporter: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
      });
    case 'MESSAGE':
      return await prisma.messageReport.findUnique({
        where: { reportId },
        include: {
          message: true,
          reporter: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
      });
    case 'REVIEW':
      return await prisma.reviewReport.findUnique({
        where: { reportId },
        include: {
          review: true,
          reporter: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
      });
    default:
      throw new Error('Invalid report type');
  }
};

/**
 * Resolve a report (admin only)
 */
export const resolveReport = async (
  type: string,
  reportId: string,
  adminId: string,
  status: ReportStatus,
  resolutionNotes?: string
) => {
  const updateData: any = {
    status,
    reviewedAt: new Date(),
    reviewedBy: adminId,
    resolutionNotes,
  };

  let report;
  switch (type) {
    case 'TASK':
      report = await prisma.taskReport.update({
        where: { reportId },
        data: updateData,
        include: {
          task: true,
          reporter: true,
        },
      });
      break;
    case 'USER':
      report = await prisma.userReport.update({
        where: { reportId },
        data: updateData,
        include: {
          reportedUser: true,
          reporter: true,
        },
      });
      break;
    case 'MESSAGE':
      report = await prisma.messageReport.update({
        where: { reportId },
        data: updateData,
        include: {
          message: true,
          reporter: true,
        },
      });
      break;
    case 'REVIEW':
      report = await prisma.reviewReport.update({
        where: { reportId },
        data: updateData,
        include: {
          review: true,
          reporter: true,
        },
      });
      break;
    default:
      throw new Error('Invalid report type');
  }

  // Log audit trail
  await auditService.createAuditLog({
    adminId,
    action: 'RESOLVE_REPORT',
    entityType: type,
    entityId: reportId,
    reportId,
    details: {
      status,
      resolutionNotes,
    },
    notes: `Resolved ${type} report`,
  });

  // Send notification to reporter
  try {
    await notificationService.createNotification({
      userId: report.reporterId,
      type: NotificationType.OTHER,
      title: 'Report Resolved',
      message: `Your report has been ${status.toLowerCase()}. ${resolutionNotes || ''}`,
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }

  return report;
};

/**
 * Get report metrics (admin dashboard)
 */
export const getReportMetrics = async () => {
  const [taskReports, userReports, messageReports, reviewReports] = await Promise.all([
    prisma.taskReport.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.userReport.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.messageReport.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.reviewReport.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const allReports = [
    ...taskReports.map((r: any) => ({ ...r, type: 'TASK' })),
    ...userReports.map((r: any) => ({ ...r, type: 'USER' })),
    ...messageReports.map((r: any) => ({ ...r, type: 'MESSAGE' })),
    ...reviewReports.map((r: any) => ({ ...r, type: 'REVIEW' })),
  ];

  const metrics = {
    total: {
      OPEN: 0,
      RESOLVED: 0,
      CLOSED: 0,
    },
    byType: {
      TASK: { OPEN: 0, RESOLVED: 0, CLOSED: 0 },
      USER: { OPEN: 0, RESOLVED: 0, CLOSED: 0 },
      MESSAGE: { OPEN: 0, RESOLVED: 0, CLOSED: 0 },
      REVIEW: { OPEN: 0, RESOLVED: 0, CLOSED: 0 },
    },
  };

  allReports.forEach((report: any) => {
    const status = report.status as ReportStatus;
    metrics.total[status] += report._count;
    if (report.type) {
      metrics.byType[report.type as keyof typeof metrics.byType][status] += report._count;
    }
  });

  return metrics;
};

