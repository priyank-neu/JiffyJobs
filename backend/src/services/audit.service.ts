import prisma from '../config/database';

export interface AuditLogData {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  reportId?: string;
  details?: Record<string, unknown>;
  notes?: string;
}

/**
 * Create an audit log entry for admin actions
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      adminId: data.adminId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      reportId: data.reportId,
      details: data.details ? JSON.stringify(data.details) : null,
      notes: data.notes,
    },
  });
};

/**
 * Get audit logs with pagination and filtering
 */
export const getAuditLogs = async (params: {
  page?: number;
  limit?: number;
  adminId?: string;
  entityType?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const {
    page = 1,
    limit = 50,
    adminId,
    entityType,
    action,
    startDate,
    endDate,
  } = params;

  const skip = (page - 1) * limit;

  const where: any = {};
  if (adminId) where.adminId = adminId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    })),
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

