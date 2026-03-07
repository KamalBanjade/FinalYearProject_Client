'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { adminAuditLogsApi, AuditLogResponseDTO, AuditSeverity, AuditLogFilters } from '@/lib/api/adminAuditLogs';
import {
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    FingerPrintIcon,
    DevicePhoneMobileIcon,
    GlobeAltIcon,
    CalendarIcon,
    ClockIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatLocalTime } from '@/lib/utils/dateUtils';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 0, page: 1, pageSize: 15 });
    const [selectedLog, setSelectedLog] = useState<AuditLogResponseDTO | null>(null);
    const [showFilters, setShowFilters] = useState(false);

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
                    icon: XCircleIcon
                };
            case AuditSeverity.Error:
                return {
                    bg: 'bg-orange-100 dark:bg-orange-900/30',
                    text: 'text-orange-700 dark:text-orange-400',
                    border: 'border-orange-200 dark:border-orange-800/50',
                    icon: ExclamationTriangleIcon
                };
            case AuditSeverity.Warning:
                return {
                    bg: 'bg-amber-100 dark:bg-amber-900/30',
                    text: 'text-amber-700 dark:text-amber-400',
                    border: 'border-amber-200 dark:border-amber-800/50',
                    icon: ExclamationTriangleIcon
                };
            default:
                return {
                    bg: 'bg-blue-100 dark:bg-blue-900/30',
                    text: 'text-blue-700 dark:text-blue-400',
                    border: 'border-blue-200 dark:border-blue-800/50',
                    icon: InformationCircleIcon
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
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex-1 max-w-2xl">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 group w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by User, action, or details..."
                                className="w-full pl-12 pr-4 h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white"
                                value={filters.searchTerm}
                                onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                            />
                        </div>
                    </form>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchLogs()}
                        className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all active:scale-95 hover:text-indigo-600"
                        title="Refresh Logs"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        className="px-6 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-2xl font-bold flex items-center space-x-2 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <button
                        className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <FingerPrintIcon className="w-5 h-5" />
                        <span>Real-time Feed</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pt-4">
                {/* Filters sidebar remains but is more integrated */}
                <aside className="xl:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm sticky top-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Filters</h3>
                            <button onClick={resetFilters} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:underline">Reset All</button>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="space-y-6">

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Severity Level</label>
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
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Range</label>
                                    <div className="space-y-3">
                                        <div className="flex flex-col space-y-1">
                                            <span className="text-[10px] font-bold text-slate-500 ml-1">FROM</span>
                                            <input
                                                type="date"
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                                value={filters.fromDate}
                                                onChange={(e) => setFilters(f => ({ ...f, fromDate: e.target.value, page: 1 }))}
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <span className="text-[10px] font-bold text-slate-500 ml-1">TO</span>
                                            <input
                                                type="date"
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                                value={filters.toDate}
                                                onChange={(e) => setFilters(f => ({ ...f, toDate: e.target.value, page: 1 }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
                            >
                                <FunnelIcon className="w-5 h-5" />
                                <span>Apply Filters</span>
                            </button>
                        </form>
                    </div>
                </aside>

                {/* Logs Table Area */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-full">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">Timestamp</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">User Context</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">Action</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 text-center">Severity</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array(10).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={5} className="p-6">
                                                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center">
                                                <div className="max-w-xs mx-auto space-y-4">
                                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto">
                                                        <MagnifyingGlassIcon className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No matching logs found</p>
                                                    <button onClick={resetFilters} className="text-indigo-600 font-black text-sm uppercase">Clear everything</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : logs.map((log) => {
                                        const sev = getSeverityStyles(log.severity);
                                        const SevIcon = sev.icon;
                                        return (
                                            <motion.tr
                                                layout
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                key={log.id}
                                                className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-50 dark:border-slate-800/50"
                                            >
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white">{formatLocalTime(log.timestamp, 'MMM dd, yyyy')}</span>
                                                        <span className="text-xs font-bold text-slate-400">{formatLocalTime(log.timestamp, 'HH:mm:ss')}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-10 h-10 rounded-xl ${log.userName === 'System' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} flex items-center justify-center font-black text-xs`}>
                                                            {log.userName?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-800 dark:text-slate-200">{log.userName || 'Anonymous'}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 lowercase">{log.userEmail || 'no-email'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{log.action}</span>
                                                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[200px]">{log.details}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border ${sev.bg} ${sev.text} ${sev.border}`}>
                                                        <SevIcon className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-wider">{log.severityLabel}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <button
                                                        onClick={() => setSelectedLog(log)}
                                                        className="p-3 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600 rounded-xl transition-all border border-slate-100 dark:border-slate-600 shadow-sm"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Area */}
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-400">Log entries per page:</span>
                                <select
                                    className="bg-transparent border-none text-xs font-black text-slate-900 dark:text-white focus:ring-0 cursor-pointer"
                                    value={filters.pageSize}
                                    onChange={(e) => setFilters(f => ({ ...f, pageSize: Number(e.target.value), page: 1 }))}
                                >
                                    {[15, 30, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                                </select>
                            </div>

                            <div className="flex items-center space-x-6">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Page <span className="text-slate-900 dark:text-white">{pagination.page}</span> of {pagination.totalPages || 1}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={pagination.page <= 1}
                                        onClick={() => setFilters(f => ({ ...f, page: f.page! - 1 }))}
                                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
                                    >
                                        <ChevronLeftIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => setFilters(f => ({ ...f, page: f.page! + 1 }))}
                                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
                                    >
                                        <ChevronRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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
                                    <XMarkIcon className="w-6 h-6 text-slate-400" />
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
                                            <CalendarIcon className="w-3 h-3" />
                                            Event Date
                                        </label>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-sm dark:text-white">
                                            {formatLocalTime(selectedLog.timestamp, 'EEEE, MMMM dd, yyyy')}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <ClockIcon className="w-3 h-3" />
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
                                        <FingerPrintIcon className="w-5 h-5 text-indigo-600" />
                                        User & Network Identity
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                                                <GlobeAltIcon className="w-3 h-3" />
                                                IP Address
                                            </div>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">{selectedLog.ipAddress}</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                                                <InformationCircleIcon className="w-3 h-3" />
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
                                            <DevicePhoneMobileIcon className="w-3 h-3" />
                                            Technical User Agent
                                        </div>
                                        <p className="text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-400 break-all">{selectedLog.userAgent}</p>
                                    </div>
                                </div>

                                {/* Activity Content */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <ArrowPathIcon className="w-5 h-5 text-indigo-600" />
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
        </div>
    );
}
