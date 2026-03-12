'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import {
    Users, Stethoscope, FileText, QrCode, RefreshCw,
    Shield, Calendar, Activity, UserCheck, TrendingUp,
    PlusCircle, ClipboardList, Zap,
    AlertTriangle, CheckCircle, Clock, FileClock,
    Eye, ArrowUpRight
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { toast } from 'react-hot-toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { adminAuditLogsApi, SystemStatisticsDTO } from '@/lib/api/adminAuditLogs';
import { InviteDoctorModal } from '@/components/admin/InviteDoctorModal';
import { RecentActivityTable } from '@/components/dashboard/RecentActivityTable';

// ─── Framer Motion ───────────────────────────────────────────────────────────

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
};
const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

// ─── Tooltip Style ───────────────────────────────────────────────────────────

const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
    fontSize: '12px',
};
const tooltipLabelStyle = { color: 'var(--foreground)', fontWeight: 700 };

// ─── Static chart data (trend lines) ─────────────────────────────────────────



// ─── Glass stat card ─────────────────────────────────────────────────────────

function GlassMetricCard({
    icon: Icon, label, value, sub, accentColor, glowColor, change, delay = 0
}: {
    icon: React.ElementType; label: string; value: number | string;
    sub?: string; accentColor: string; glowColor: string;
    change?: { label: string; positive?: boolean }; delay?: number;
}) {
    return (
        <motion.div
            variants={itemVariants}
            transition={{ delay: delay * 0.07 }}
            className={`group relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-5 lg:p-6 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm cursor-default`}
        >
            {/* Soft glow */}
            <div className={`absolute -inset-px rounded-[2rem] opacity-0 group-hover:opacity-60 transition-opacity duration-700 blur-2xl ${glowColor}`} />

            {/* Decorative icon watermark */}
            <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 opacity-[0.04] pointer-events-none text-foreground">
                <Icon className="w-24 h-24" />
            </div>

            <div className="relative z-10 flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${accentColor} text-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                </div>
                {change && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${change.positive !== false
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                        <ArrowUpRight className="w-3 h-3" />
                        {change.label}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <div className="text-3xl font-black text-foreground mb-0.5">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</div>
                {sub && <div className="text-[10px] text-muted/70 mt-1">{sub}</div>}
            </div>
        </motion.div>
    );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) {
    return (
        <div className="flex items-center gap-4 mb-4">
            <div className="p-2 rounded-lg bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-sm">
                {Icon && <Icon className="w-4 h-4 text-primary" />}
            </div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">{children}</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
        </div>
    );
}

// ─── Glass chart panel ────────────────────────────────────────────────────────

function ChartPanel({ title, sub, children, className = '' }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
    return (
        <motion.div variants={itemVariants} className={`bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] sm:rounded-[3rem] p-6 lg:p-8 shadow-xl shadow-slate-200/20 dark:shadow-black/30 ${className}`}>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="text-base font-black text-foreground">{title}</h3>
                    {sub && <p className="text-xs text-muted font-medium mt-0.5">{sub}</p>}
                </div>
            </div>
            {children}
        </motion.div>
    );
}

// ─── Progress bar row ─────────────────────────────────────────────────────────

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold">
                <span className="text-muted uppercase tracking-wider">{label}</span>
                <span className="text-foreground">{value}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className={`h-full rounded-full transition-all duration-300 ${color}`}
                />
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`bg-white/30 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/20 dark:border-slate-700/40 rounded-[2.5rem] animate-pulse ${className}`} />;
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function AdminDashboard() {
    const [stats, setStats] = useState<SystemStatisticsDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const router = useRouter();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminAuditLogsApi.getSystemStatistics();
            setStats(data);
            setLastUpdated(new Date());
        } catch {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Data Transformation Helpers
    const userDist = stats ? [
        { name: 'Doctors', value: stats.totalDoctors, color: '#00A388' },
        { name: 'Patients', value: stats.totalPatients, color: '#3B82F6' },
        { name: 'Admins', value: stats.totalAdmins, color: '#F59E0B' },
    ] : [];

    const recordStatusData = stats ? [
        { status: 'Certified', count: stats.totalRecordsCertified, color: '#00A388' },
        { status: 'Pending', count: stats.totalRecordsPending, color: '#F59E0B' },
        { status: 'Draft', count: stats.totalRecordsDraft, color: '#64748B' },
        { status: 'Emergency', count: stats.totalRecordsEmergency, color: '#EF4444' },
        { status: 'Archived', count: stats.totalRecordsArchived, color: '#A78BFA' },
    ] : [];

    const apptData = stats ? [
        { name: 'Completed', value: stats.completedAppointments, color: '#00A388' },
        { name: 'Upcoming', value: stats.upcomingAppointments, color: '#3B82F6' },
        { name: 'Other', value: Math.max(0, stats.totalAppointments - stats.completedAppointments - stats.upcomingAppointments), color: '#64748B' },
    ].filter(d => d.value > 0) : [];

    const RADIAN = Math.PI / 180;
    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
    };

    return (
        <PageLayout>
            {/* Ambient background decoration */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[10%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[150px]" />
            </div>

            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-12 pb-20">

                {/* ── Header Area ── */}
                <motion.div variants={itemVariants} className="flex justify-end gap-6 px-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Button onClick={() => setInviteOpen(true)}
                            className="h-11 px-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5">
                            <PlusCircle className="w-5 h-5" /> Onboard Doctor
                        </Button>
                        <Button variant="ghost" onClick={() => router.push('/admin/audit-logs')}
                            className="h-11 px-5 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm flex items-center gap-2 cursor-pointer bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                            <ClipboardList className="w-4 h-4" /> Comprehensive Logs
                        </Button>
                    </div>
                </motion.div>

                {/* ── Key Indicators (Hero) ── */}
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36" />)}
                    </div>
                ) : stats ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <GlassMetricCard delay={0} icon={Users} label="Total Users" value={stats.totalUsers} accentColor="bg-indigo-500" glowColor="bg-indigo-500/20" change={{ label: `+${stats.newUsersThisMonth} this month`, positive: true }} />
                        <GlassMetricCard delay={1} icon={Stethoscope} label="Doctors" value={stats.totalDoctors} accentColor="bg-teal-500" glowColor="bg-teal-500/20" sub={`${stats.totalPatients} patients registered`} />
                        <GlassMetricCard delay={2} icon={FileText} label="Medical Records" value={stats.totalRecordsUploaded} accentColor="bg-blue-500" glowColor="bg-blue-500/20" change={{ label: `+${stats.recordsUploadedThisMonth} this month`, positive: true }} />
                        <GlassMetricCard delay={3} icon={QrCode} label="QR Scans" value={stats.totalQRScans} accentColor="bg-rose-500" glowColor="bg-rose-500/20" sub={`${stats.normalQRScans} normal · ${stats.emergencyQRScans} emergency`} />
                    </div>
                ) : null}

                {/* ── User & Network Insights Section ── */}
                <section className="space-y-6">
                    <SectionLabel icon={Users}>User Insights & Network Growth</SectionLabel>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <ChartPanel title="Growth Trends" sub="User registration history & network growth" className="lg:col-span-2">
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={stats?.userGrowthTrend || []} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
                                    <XAxis dataKey="label" stroke="var(--muted)" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={{ color: 'var(--foreground)' }} />
                                    <Area type="natural" dataKey="value" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" name="Total Users" animationDuration={2000} />
                                    <Area type="natural" dataKey="value2" stroke="#00A388" strokeWidth={2} fill="transparent" name="Doctors" animationDuration={2200} />
                                    <Area type="natural" dataKey="value3" stroke="#f63b3bff" strokeWidth={2} fill="transparent" name="Patients" animationDuration={2400} />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="flex items-center gap-6 mt-6 pt-5 border-t border-border">
                                {[{ l: 'Total Network', c: 'var(--primary)' }, { l: 'Medical Staff', c: '#00A388' }, { l: 'Patients', c: '#f63b3bff' }].map(x => (
                                    <div key={x.l} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: x.c }} />
                                        <span className="text-[11px] text-muted font-bold uppercase tracking-tight">{x.l}</span>
                                    </div>
                                ))}
                            </div>
                        </ChartPanel>

                        <ChartPanel title="User Distribution" sub="Demographics by account role">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={userDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false} label={renderLabel} animationBegin={200} animationDuration={1600}>
                                        {userDist.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-border">
                                {userDist.map(x => (
                                    <div key={x.name} className="text-center">
                                        <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1.5" style={{ backgroundColor: x.color }} />
                                        <p className="text-lg font-black text-foreground leading-none">{x.value}</p>
                                        <p className="text-[10px] text-muted font-bold uppercase mt-1">{x.name}</p>
                                    </div>
                                ))}
                            </div>
                        </ChartPanel>
                    </div>
                </section>

                {/* ── Clinical & Data Section ── */}
                <section className="space-y-6">
                    <SectionLabel icon={ClipboardList}>Clinical & Records Analytics</SectionLabel>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Appointments visualistion */}
                        {(() => {
                            const completionRate = stats && stats.totalAppointments > 0
                                ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100) : 0;
                            return (
                                <ChartPanel title="Clinical Appointments" sub="Scheduling & completion trends">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        <div className="relative mx-auto">
                                            <ResponsiveContainer width={180} height={180}>
                                                <PieChart>
                                                    <Pie data={apptData} cx="50%" cy="50%" innerRadius={60} outerRadius={82} paddingAngle={6} dataKey="value" stroke="none" animationBegin={200} animationDuration={1800}>
                                                        {apptData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <p className="text-3xl font-black text-foreground leading-none">{stats?.totalAppointments}</p>
                                                <p className="text-[9px] text-muted font-black uppercase tracking-widest mt-1">Visits</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="bg-surface-2 p-4 rounded-3xl border border-border flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Efficiency</p>
                                                    <p className="text-3xl font-black text-foreground mt-1">{completionRate}%</p>
                                                </div>
                                                <div className="w-12 h-12 relative">
                                                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3" />
                                                        <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke="#00A388" strokeWidth="3" strokeLinecap="round"
                                                            strokeDasharray={`${completionRate} 100`}
                                                            initial={{ strokeDasharray: '0 100' }}
                                                            animate={{ strokeDasharray: `${completionRate} 100` }}
                                                            transition={{ duration: 1.5, ease: 'easeOut' }}
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <ProgressRow label="Done" value={stats?.completedAppointments || 0} total={stats?.totalAppointments || 0} color="bg-teal-500" />
                                                <ProgressRow label="Scheduled" value={stats?.upcomingAppointments || 0} total={stats?.totalAppointments || 0} color="bg-blue-500" />
                                            </div>
                                        </div>
                                    </div>
                                </ChartPanel>
                            );
                        })()}

                        {/* Records breakdown */}
                        <ChartPanel title="Repository Status" sub="Medical record lifecycle distribution">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={recordStatusData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
                                    <XAxis dataKey="status" stroke="var(--muted)" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="var(--muted)" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} cursor={{ fill: 'var(--surface-2)' }} />
                                    <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]} animationDuration={1800}>
                                        {recordStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border">
                                {[
                                    { l: 'Certified', v: stats?.totalRecordsCertified, c: 'text-teal-600 dark:text-teal-400' },
                                    { l: 'Pending', v: stats?.totalRecordsPending, c: 'text-amber-500' },
                                    { l: 'Emergency', v: stats?.totalRecordsEmergency, c: 'text-rose-500' },
                                    { l: 'Archived', v: stats?.totalRecordsArchived, c: 'text-purple-400' },
                                ].map(x => (
                                    <div key={x.l} className="text-center">
                                        <p className={`text-xl font-black ${x.c}`}>{x.v}</p>
                                        <p className="text-[9px] text-muted font-bold uppercase tracking-tight">{x.l}</p>
                                    </div>
                                ))}
                            </div>
                        </ChartPanel>
                    </div>
                </section>

                {/* ── Security & System Integrity Section ── */}
                <section className="space-y-6">
                    <SectionLabel icon={Shield}>Security Health & Monitoring</SectionLabel>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Audit Log Signals */}
                        <ChartPanel title="Audit Signals" sub="Severity distribution (24h Window)" className="lg:col-span-1">
                            <div className="space-y-6">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-rose-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> CRITICAL</span>
                                            <span className="text-foreground">{stats?.criticalEvents24h}</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: stats?.criticalEvents24h ? '70%' : '0%' }}
                                                className="h-full bg-rose-500 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.4)]" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-amber-500 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> WARNINGS</span>
                                            <span className="text-foreground">{stats?.warningEvents24h}</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: stats?.warningEvents24h ? '40%' : '0%' }}
                                                className="h-full bg-amber-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 rounded-3xl bg-surface-2 border border-border">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-1">Total Signals Logged</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-foreground">{stats?.totalAuditLogs}</span>
                                        <span className="text-sm font-bold text-muted text-emerald-500 flex items-center gap-0.5"><TrendingUp className="w-4 h-4" /> Healthy</span>
                                    </div>
                                </div>
                            </div>
                        </ChartPanel>

                        {/* QR Activity Trends */}
                        <ChartPanel title="Access Activity" sub="Daily QR scan volume (Last 7 Days)" className="lg:col-span-2">
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={stats?.qrScanTrend || []} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
                                    <XAxis dataKey="label" stroke="var(--muted)" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                                    <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={4} dot={{ r: 6, fill: "#EF4444", strokeWidth: 0 }} activeDot={{ r: 8 }} name="Emergency" animationDuration={2000} />
                                    <Line type="monotone" dataKey="value2" stroke="#00A388" strokeWidth={3} dot={{ r: 4, fill: "#00A388", strokeWidth: 0 }} name="Normal" animationDuration={1800} />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="flex items-center gap-6 mt-6 pt-5 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-2 rounded-full bg-rose-500" />
                                    <span className="text-[11px] text-muted font-bold uppercase">Emergency Scans ({stats?.emergencyQRScans})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[11px] text-muted font-bold uppercase">Authorized Access ({stats?.normalQRScans})</span>
                                </div>
                                <div className="flex-1" />
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">{stats?.activeAccessSessions} LIVE SESSIONS</span>
                                </div>
                            </div>
                        </ChartPanel>
                    </div>
                </section>

                {/* ── Recent Activity Log ── */}
                <section className="space-y-6">
                    <SectionLabel icon={Activity}>Real-time Audit Trace</SectionLabel>
                    <RecentActivityTable />
                </section>

            </motion.div>

            <InviteDoctorModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
        </PageLayout>
    );
}
