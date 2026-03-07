import axiosInstance from "../utils/axios";

export enum AuditSeverity {
    Info = 0,
    Warning = 1,
    Error = 2,
    Critical = 3
}

export interface AuditLogResponseDTO {
    id: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    action: string;
    details: string;
    timestamp: string;
    ipAddress: string;
    userAgent: string;
    entityType?: string;
    entityId?: string;
    severity: AuditSeverity;
    severityLabel: string;
}

export interface PaginatedAuditLogsDTO {
    logs: AuditLogResponseDTO[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface AuditLogFilters {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    action?: string;
    severity?: AuditSeverity;
    fromDate?: string;
    toDate?: string;
}

export const adminAuditLogsApi = {
    getAuditLogs: async (filters: AuditLogFilters): Promise<PaginatedAuditLogsDTO> => {
        const response = await axiosInstance.get('admin/audit-logs', { params: filters });
        return response.data.data;
    }
};
