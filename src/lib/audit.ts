import { db } from '@/lib/db';

export function logAudit(params: {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
}) {
  // Fire-and-forget: don't block the calling mutation
  db.auditLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    })
    .catch((err) => {
      console.error('[audit] Failed to write audit log:', err);
    });
}
