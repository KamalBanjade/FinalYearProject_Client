'use client';

import React, { useState, useEffect } from 'react';
import { adminAuditLogsApi, SecurityAlertDTO } from '@/lib/api/adminAuditLogs';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { formatLocalTime } from '@/lib/utils/dateUtils';
import {
    Shield, RefreshCw, AlertCircle, AlertTriangle,
    Zap, Clock, XCircle, User, Globe,
    CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';

const ALERT_META: Record<string, { label: string; icon: React.ElementType; colorClass: string }> = {
    BRUTE_FORCE:      { label: 'Brute Force Attempt',  icon: XCircle,       colorClass: 'rose' },
    EMERGENCY_OVERUSE:{ label: 'Emergency QR Overuse', icon: Zap,           colorClass: 'amber' },
    CRITICAL_EVENT:   { label: 'Critical System Event',icon: AlertCircle,   colorClass: 'rose' },
    OFF_HOURS_ACCESS: { label: 'Off-Hours Access',     icon: Clock,         colorClass: 'blue' },
};

const severityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function AlertCard({ alert }: { alert: SecurityAlertDTO }) {
    const [expanded, setExpanded] = useState(false);
    const meta = ALERT_META[alert.alertType] ?? { label: alert.alertType, icon: AlertTriangle, colorClass: 'slate' };
    const Icon = meta.icon;

    const c = meta.colorClass;
    const colorMap: Record<string, string> = {
        rose:  'bg-rose-50  dark:bg-rose-900/20  border-rose-200  dark:border-rose-800  text-rose-700  dark:text-rose-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
        blue:  'bg-blue-50  dark:bg-blue-900/20  border-blue-200  dark:border-blue-800  text-blue-700  dark:text-blue-400',
        slate: 'bg-slate-50 dark:bg-slate-800    border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
    };
    const colorCls = colorMap[c] ?? colorMap.slate;

    const severityColors: Record<string, string> = {
        Critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
        High:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
        Medium:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
        Low:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-2xl overflow-hidden ${colorCls}`}
        >
            <button
                className="w-full flex items-center gap-4 p-5 text-left"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-black/20">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black">{alert.title}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${severityColors[alert.severity] ?? ''}`}>
                            {alert.severity}
                        </span>
                    </div>
                    <p className="text-xs opacity-80 mt-0.5 line-clamp-1">{alert.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-bold opacity-60 hidden sm:block">
                        {formatLocalTime(alert.detectedAt, 'MMM dd, HH:mm')}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
                </div>
            </button>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-3 border-t border-current/10 pt-4">
                            <p className="text-sm">{alert.description}</p>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Detected At</span>
                                    <p className="font-bold">{formatLocalTime(alert.detectedAt, 'EEEE, MMM dd yyyy – HH:mm:ss')}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Event Count</span>
                                    <p className="font-bold text-xl">{alert.eventCount}</p>
                                </div>
                                {alert.relatedUserName && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1">
                                            <User className="w-3 h-3" /> Related User
                                        </span>
                                        <p className="font-bold">{alert.relatedUserName}</p>
                                        {alert.relatedUserEmail && <p className="opacity-70">{alert.relatedUserEmail}</p>}
                                    </div>
                                )}
                                {alert.ipAddress && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> IP Address
                                        </span>
                                        <p className="font-mono font-bold">{alert.ipAddress}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function SecurityAlertsPage() {
    const [alerts, setAlerts]   = useState<SecurityAlertDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const data = await adminAuditLogsApi.getSecurityAlerts();
            setAlerts(data);
        } catch {
            toast.error('Failed to load security alerts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAlerts(); }, []);

    const filtered = alerts
        .filter(a => !filterSeverity || a.severity === filterSeverity)
        .sort((a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99));

    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    alerts.forEach(a => { if (a.severity in counts) counts[a.severity as keyof typeof counts]++; });

    return (
        <PageLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Security Monitoring</h1>
                    <p className="text-sm text-slate-400 font-medium mt-1">Suspicious activity detection and security alerts</p>
                </div>
                <Button
                    variant="ghost"
                    onClick={fetchAlerts}
                    className="h-11 px-4 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {(['Critical', 'High', 'Medium', 'Low'] as const).map(sev => {
                    const colorMap: Record<string, string> = {
                        Critical: 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
                        High:     'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
                        Medium:   'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
                        Low:      'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
                    };
                    const isActive = filterSeverity === sev;
                    return (
                        <button
                            key={sev}
                            onClick={() => setFilterSeverity(isActive ? null : sev)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${colorMap[sev]} ${isActive ? 'ring-2 ring-offset-2 ring-current' : 'border-opacity-50'}`}
                        >
                            <div className="text-3xl font-black">{counts[sev]}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest mt-1">{sev}</div>
                        </button>
                    );
                })}
            </div>

            {/* Alerts List */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                    <div className="text-center space-y-4">
                        <Shield className="w-10 h-10 text-indigo-400 animate-pulse mx-auto" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Scanning for threats…</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <Card padding="lg">
                    <div className="py-16 text-center space-y-4">
                        <div className="w-20 h-20 rounded-3xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">
                            {filterSeverity ? `No ${filterSeverity} alerts` : 'No Security Alerts Detected'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {filterSeverity
                                ? 'Try selecting a different severity filter.'
                                : 'The system looks clean. All activity patterns appear normal.'}
                        </p>
                        {filterSeverity && (
                            <button
                                onClick={() => setFilterSeverity(null)}
                                className="text-indigo-600 text-sm font-black uppercase tracking-widest"
                            >
                                Show all alerts
                            </button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {filtered.length} alert{filtered.length !== 1 ? 's' : ''}
                            {filterSeverity ? ` · ${filterSeverity}` : ''}
                        </span>
                        {filterSeverity && (
                            <button onClick={() => setFilterSeverity(null)} className="text-xs text-indigo-600 font-black uppercase tracking-widest">
                                Clear filter
                            </button>
                        )}
                    </div>
                    {filtered.map((alert, i) => (
                        <AlertCard key={`${alert.alertType}-${alert.detectedAt}-${i}`} alert={alert} />
                    ))}
                </div>
            )}
        </PageLayout>
    );
}
