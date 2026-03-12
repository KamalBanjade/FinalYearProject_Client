'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { adminAuditLogsApi, AuditLogResponseDTO, AuditSeverity, AuditLogFilters } from '@/lib/api/adminAuditLogs';
import { formatLocalTime } from '@/lib/utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { H1, H2, H3, Text } from '@/components/ui/Typography';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import {
    Search,
    RefreshCw,
    Download,
    Fingerprint,
    Filter,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
    Calendar,
    Clock,
    Globe,
    Smartphone,
    AlertCircle,
    AlertTriangle,
    Info,
    XCircle
} from 'lucide-react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 0, page: 1, pageSize: 15 });
    const [selectedLog, setSelectedLog] = useState<AuditLogResponseDTO | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Filter states
    const [filters, setFilters] = useState<AuditLogFilters>({
        page: 1,
        pageSize: 15,
        searchTerm: '',
        severity: undefined,
        fromDate: '',
        toDate: ''
    });

    const fetchLogs = async (filterOverride?: AuditLogFilters) => {
        setLoading(true);
        try {
            const data = await adminAuditLogsApi.getAuditLogs(filterOverride || filters);
            setLogs(data.logs);
            setPagination({
                totalCount: data.totalCount,
                totalPages: data.totalPages,
                page: data.page,
                pageSize: data.pageSize
            });
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
            toast.error('Could not load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filters.page, filters.pageSize, filters.severity]); // Re-fetch on pagination or severity change quickly

    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const blob = await adminAuditLogsApi.exportLogs({
                searchTerm: filters.searchTerm,
                action: filters.action,
                fromDate: filters.fromDate,
                toDate: filters.toDate
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_logs_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Audit logs exported successfully');
        } catch {
            toast.error('Failed to export logs');
        } finally {
            setExporting(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedFilters = { ...filters, page: 1 };
        setFilters(updatedFilters);
        fetchLogs(updatedFilters);
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            pageSize: 15,
            searchTerm: '',
            severity: undefined,
            fromDate: '',
            toDate: ''
        });
        fetchLogs();
    };

    const getSeverityStyles = (severity: AuditSeverity) => {
        switch (severity) {
            case AuditSeverity.Critical:
                return {
                    bg: 'bg-rose-100 dark:bg-rose-900/30',
                    text: 'text-rose-700 dark:text-rose-400',
                    border: 'border-rose-200 dark:border-rose-800/50',
                    icon: XCircle
                };
            case AuditSeverity.Error:
                return {
                    bg: 'bg-orange-100 dark:bg-orange-900/30',
                    text: 'text-orange-700 dark:text-orange-400',
                    border: 'border-orange-200 dark:border-orange-800/50',
                    icon: AlertTriangle
                };
            case AuditSeverity.Warning:
                return {
                    bg: 'bg-amber-100 dark:bg-amber-900/30',
                    text: 'text-amber-700 dark:text-amber-400',
                    border: 'border-amber-200 dark:border-amber-800/50',
                    icon: AlertTriangle
                };
            default:
                return {
                    bg: 'bg-blue-100 dark:bg-blue-900/30',
                    text: 'text-blue-700 dark:text-blue-400',
                    border: 'border-blue-200 dark:border-blue-800/50',
                    icon: Info
                };
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <PageLayout>
            <Stack direction={{ base: 'col', lg: 'row' } as any} align={{ base: 'stretch', lg: 'end' } as any} justify="between" spacing="lg" className="mb-8">
                <div className="flex-1 max-w-2xl">
                    <form onSubmit={handleSearchSubmit} className="relative group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by User, action, or details..."
                            className="w-full pl-12 pr-4 h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white shadow-sm"
                            value={filters.searchTerm}
                            onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                        />
                    </form>
                </div>

                <Stack direction="row" spacing="md" align="center">
                    <Button
                        variant="ghost"
                        onClick={() => fetchLogs()}
                        className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm h-14 w-14 flex items-center justify-center p-0"
                        title="Refresh Logs"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleExportCsv}
                        disabled={exporting}
                        className="px-6 h-14 bg-white dark:bg-slate-900 rounded-2xl font-bold flex items-center space-x-2 border border-slate-100 dark:border-slate-800 shadow-sm disabled:opacity-50"
                    >
                        <Download className={`w-5 h-5 ${exporting ? 'animate-bounce' : ''}`} />
                        <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export CSV'}</span>
                    </Button>
                    <Button
                        className="px-6 h-14 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Fingerprint className="w-5 h-5" />
                        <span>Real-time Feed</span>
                    </Button>
                </Stack>
            </Stack>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <aside className="xl:col-span-1">
                    <Card padding="lg" className="sticky top-8">
                        <Stack direction="row" align="center" justify="between" className="mb-6">
                            <H3>Filters</H3>
                            <button onClick={resetFilters} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:underline">Reset All</button>
                        </Stack>

                        <form onSubmit={handleSearchSubmit} className="space-y-8">
                            <Stack spacing="sm">
                                <Text variant="label" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Severity Level</Text>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Critical', val: AuditSeverity.Critical, color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' },
                                        { label: 'Error', val: AuditSeverity.Error, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' },
                                        { label: 'Warning', val: AuditSeverity.Warning, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
                                        { label: 'Info', val: AuditSeverity.Info, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
                                    ].map((s) => (
                                        <button
                                            key={s.label}
                                            type="button"
                                            onClick={() => setFilters(f => ({ ...f, severity: f.severity === s.val ? undefined : s.val, page: 1 }))}
                                            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border-2 ${filters.severity === s.val ? 'border-slate-900 dark:border-white' : 'border-transparent'} ${s.color}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </Stack>

                            <Stack spacing="sm" className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <Text variant="label" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Range</Text>
                                <Stack spacing="md">
                                    <Stack spacing="xs">
                                        <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase">From</span>
                                        <input
                                            type="date"
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                            value={filters.fromDate}
                                            onChange={(e) => setFilters(f => ({ ...f, fromDate: e.target.value, page: 1 }))}
                                        />
                                    </Stack>
                                    <Stack spacing="xs">
                                        <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase">To</span>
                                        <input
                                            type="date"
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                            value={filters.toDate}
                                            onChange={(e) => setFilters(f => ({ ...f, toDate: e.target.value, page: 1 }))}
                                        />
                                    </Stack>
                                </Stack>
                            </Stack>

                            <Button
                                type="submit"
                                className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                            >
                                <Filter className="w-5 h-5 mr-2" />
                                Apply Filters
                            </Button>
                        </form>
                    </Card>
                </aside>

                <div className="xl:col-span-3">
                    <Section>
                        <div>
                            <ResponsiveTable
                                loading={loading}
                                data={logs}
                                keyExtractor={(log) => log.id}
                                emptyState={
                                    <div className="max-w-xs mx-auto py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                                            <Search className="w-8 h-8" />
                                        </div>
                                        <Text variant="body" className="text-slate-500 font-bold uppercase tracking-widest text-xs">No matching logs found</Text>
                                        <button onClick={resetFilters} className="text-indigo-600 font-black text-sm uppercase">Clear search</button>
                                    </div>
                                }
                                columns={[
                                    {
                                        header: 'Timestamp',
                                        accessor: (log) => (
                                            <Stack spacing="xs">
                                                <Text className="text-sm font-black text-slate-900 dark:text-white">{formatLocalTime(log.timestamp, 'MMM dd, yyyy')}</Text>
                                                <Text className="text-xs font-bold text-slate-400">{formatLocalTime(log.timestamp, 'HH:mm:ss')}</Text>
                                            </Stack>
                                        )
                                    },
                                    {
                                        header: 'User Context',
                                        accessor: (log) => (
                                            <Stack direction="row" align="center" spacing="md">
                                                <div className={`w-10 h-10 rounded-xl ${log.userName === 'System' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} flex items-center justify-center font-black text-xs`}>
                                                    {log.userName?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <Stack spacing="xs">
                                                    <Text className="text-sm font-black text-slate-800 dark:text-slate-200">{log.userName || 'Anonymous'}</Text>
                                                    <Text className="text-[10px] font-bold text-slate-400 lowercase">{log.userEmail || 'no-email'}</Text>
                                                </Stack>
                                            </Stack>
                                        )
                                    },
                                    {
                                        header: 'Action',
                                        accessor: (log) => (
                                            <Stack spacing="xs">
                                                <Text className="text-sm font-black text-indigo-600 dark:text-indigo-400">{log.action}</Text>
                                                <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[200px]">{log.details}</Text>
                                            </Stack>
                                        )
                                    },
                                    {
                                        header: 'Severity',
                                        className: 'text-center',
                                        accessor: (log) => {
                                            const sev = getSeverityStyles(log.severity);
                                            const SevIcon = sev.icon;
                                            return (
                                                <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border ${sev.bg} ${sev.text} ${sev.border}`}>
                                                    <SevIcon className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">{log.severityLabel}</span>
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        header: 'Action',
                                        className: 'text-right',
                                        accessor: (log) => (
                                            <Button
                                                variant="ghost"
                                                onClick={() => setSelectedLog(log)}
                                                className="p-3 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600 rounded-xl transition-all border border-slate-100 dark:border-slate-600 shadow-sm p-0 flex items-center justify-center"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Button>
                                        )
                                    }
                                ]}
                                renderMobileCard={(log) => {
                                    const sev = getSeverityStyles(log.severity);
                                    const SevIcon = sev.icon;
                                    return (
                                        <div className="p-5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Stack direction="row" align="center" spacing="md">
                                                    <div className={`w-10 h-10 rounded-xl ${log.userName === 'System' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} flex items-center justify-center font-black text-xs`}>
                                                        {log.userName?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <Stack spacing="xs">
                                                        <Text className="text-sm font-black text-slate-800 dark:text-slate-200">{log.userName}</Text>
                                                        <Text className="text-[10px] font-bold text-slate-400">{formatLocalTime(log.timestamp, 'MMM dd, HH:mm')}</Text>
                                                    </Stack>
                                                </Stack>
                                                <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${sev.bg} ${sev.text} ${sev.border}`}>
                                                    <SevIcon className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-wider">{log.severityLabel}</span>
                                                </div>
                                            </div>
                                            <Stack spacing="xs">
                                                <Text className="text-sm font-black text-indigo-600">{log.action}</Text>
                                                <Text className="text-xs text-slate-500 line-clamp-2">{log.details}</Text>
                                            </Stack>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setSelectedLog(log)}
                                                className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl"
                                            >
                                                View Technical Details
                                            </Button>
                                        </div>
                                    );
                                }}
                            />

                            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center space-x-3">
                                    <Text variant="label" className="text-xs font-bold text-slate-400">Entries per page:</Text>
                                    <select
                                        className="bg-transparent border-none text-xs font-black text-slate-900 dark:text-white focus:ring-0 cursor-pointer"
                                        value={filters.pageSize}
                                        onChange={(e) => setFilters(f => ({ ...f, pageSize: Number(e.target.value), page: 1 }))}
                                    >
                                        {[15, 30, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                                    </select>
                                </div>

                                <Stack direction="row" align="center" spacing="lg">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        Page <span className="text-slate-900 dark:text-white">{pagination.page}</span> of {pagination.totalPages || 1}
                                    </span>
                                    <Stack direction="row" spacing="xs">
                                        <Button
                                            disabled={pagination.page <= 1}
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFilters(f => ({ ...f, page: f.page! - 1 }))}
                                            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 p-0 flex items-center justify-center h-10 w-10"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            disabled={pagination.page >= pagination.totalPages}
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFilters(f => ({ ...f, page: f.page! + 1 }))}
                                            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 p-0 flex items-center justify-center h-10 w-10"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </Stack>
                                </Stack>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLog(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm shadow-2xl"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] p-0 h-full overflow-y-auto"
                        >
                            {/* Slide-over Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Audit log Entry</h2>
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Details & Technical Context</p>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-8 space-y-10 pb-20">
                                {/* Large Severity Badge */}
                                <div className={`p-6 rounded-[2rem] border-2 flex items-center space-x-6 ${getSeverityStyles(selectedLog.severity).bg} ${getSeverityStyles(selectedLog.severity).text} ${getSeverityStyles(selectedLog.severity).border}`}>
                                    {React.createElement(getSeverityStyles(selectedLog.severity).icon, { className: "w-12 h-12" })}
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">{selectedLog.severityLabel} EVENT</h3>
                                        <p className="text-sm font-medium opacity-80">This event was recorded by the system core module.</p>
                                    </div>
                                </div>

                                {/* Main Details Grid */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" />
                                            Event Date
                                        </label>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-sm dark:text-white">
                                            {formatLocalTime(selectedLog.timestamp, 'EEEE, MMMM dd, yyyy')}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" />
                                            Time (Local)
                                        </label>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-sm dark:text-white">
                                            {formatLocalTime(selectedLog.timestamp, 'HH:mm:ss.SSS')}
                                        </div>
                                    </div>
                                </div>

                                {/* User & Network Section */}
                                <div className="space-y-6">
                                    <h4 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <Fingerprint className="w-5 h-5 text-indigo-600" />
                                        User & Network Identity
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                                                <Globe className="w-3 h-3" />
                                                IP Address
                                            </div>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">{selectedLog.ipAddress}</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                                                <Info className="w-3 h-3" />
                                                User Account
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-[10px] font-black">
                                                    US
                                                </div>
                                                <span className="text-sm font-black dark:text-white">{selectedLog.userName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                                            <Smartphone className="w-3 h-3" />
                                            Technical User Agent
                                        </div>
                                        <p className="text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-400 break-all">{selectedLog.userAgent}</p>
                                    </div>
                                </div>

                                {/* Activity Content */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5 text-indigo-600" />
                                        Activity Metadata
                                    </h4>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Performed</label>
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-2xl font-black text-sm">
                                            {selectedLog.action}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Payload Context</label>
                                        <div className="p-6 bg-slate-900 dark:bg-black rounded-3xl font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                                            {selectedLog.details}
                                        </div>
                                    </div>
                                </div>

                                {selectedLog.entityType && (
                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Type</span>
                                            <p className="font-bold text-sm text-slate-800 dark:text-white">{selectedLog.entityType}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity reference ID</span>
                                            <p className="font-mono text-[11px] text-slate-800 dark:text-white break-all">{selectedLog.entityId}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageLayout>
    );
}
