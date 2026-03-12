'use client';

import React, { useState, Suspense } from 'react';
import { DoctorProfile } from '@/components/doctor/DoctorProfile';
import { useRouter } from 'next/navigation';
import {
    ClipboardDocumentCheckIcon,
    ClockIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    UserIcon,
    ArrowRightIcon
} from '@heroicons/react/24/solid';
import { medicalRecordsApi, MedicalRecordResponseDTO } from '@/lib/api/medicalRecords';
import { DoctorReviewModal } from '@/components/doctor/DoctorReviewModal';
import { DesktopPairing } from '@/components/scanner/DesktopPairing';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { FadeIn, FadeInStagger } from '@/components/ui/FadeIn';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { Card } from '@/components/ui/Card';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { H1, H2, H3, Text } from '@/components/ui/Typography';

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => {
    const colorStyles: Record<string, string> = {
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10 group-hover:bg-rose-500 group-hover:text-white',
        primary: 'text-primary bg-primary/10 border-primary/20 shadow-primary/10 group-hover:bg-primary group-hover:text-white',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10 group-hover:bg-blue-500 group-hover:text-white',
    };

    const style = colorStyles[colorClass] || colorStyles.primary;

    return (
        <FadeIn direction="down" distance={10} className="h-full">
            <Card padding="lg" variant="elevated" className="transition-all hover:-translate-y-1 group relative overflow-hidden h-full border-slate-200/60 dark:border-slate-800">
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 ${style.split(' ')[0]}`}></div>
                <Stack direction="row" align="center" spacing="md" className="relative z-10 h-full">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border shrink-0 ${style}`}>
                        <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                    </div>
                    <Stack direction="col" spacing="xs" className="flex-1 min-w-0 gap-0">
                        <Text variant="label" className="opacity-80 leading-tight mb-1">{title}</Text>
                        <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter truncate leading-none">
                            {value}
                        </Text>
                    </Stack>
                </Stack>
            </Card>
        </FadeIn>
    );
};

function DashboardContent() {
    const router = useRouter();
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecordResponseDTO | null>(null);

    const { data: recordsRes, isLoading, refetch } = useQuery({
        queryKey: ['doctor', 'records', 'pending'],
        queryFn: () => medicalRecordsApi.getPendingRecords(),
        staleTime: 1000 * 60 * 5,
    });

    const records = recordsRes?.data || [];
    const pendingRecords = records.filter(r => r.state === 1);
    const certifiedCount = records.filter(r => r.state === 2).length;

    // Unique patients based on records
    const patientCount = new Set(records.map(r => r.patientName)).size;

    return (
        <PageLayout>
            <FadeInStagger delay={0.1}>
                <ResponsiveGrid columns={4}>
                    <StatCard title="Pending Requests" value={isLoading ? '...' : pendingRecords.length} icon={ClockIcon} colorClass="rose" />
                    <StatCard title="Today's Consults" value="5" icon={CalendarDaysIcon} colorClass="primary" />
                    <StatCard title="Total Verified" value={isLoading ? '...' : certifiedCount} icon={ClipboardDocumentCheckIcon} colorClass="emerald" />
                    <StatCard title="Patients Linked" value={isLoading ? '...' : (patientCount > 0 ? patientCount : 0)} icon={UserGroupIcon} colorClass="blue" />
                </ResponsiveGrid>
            </FadeInStagger>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Stack direction="col" spacing="lg" className="lg:col-span-2">
                    <FadeIn direction="down" delay={0.2} className="h-full">
                        <Card padding="none" className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-premium dark:shadow-none relative overflow-hidden group/queue h-full">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/queue:bg-primary/10 transition-colors"></div>
                            <Stack direction="col" spacing="lg" className="p-8 relative z-10">
                                <Stack direction={{ base: 'col', sm: 'row' } as any} align={{ base: 'start', sm: 'center' } as any} justify="between" className="gap-4">
                                    <Stack direction="col" spacing="xs" className="gap-1">
                                        <H3>Active Review Queue</H3>
                                        <Text variant="label" className="text-primary dark:text-primary-light opacity-80">Clinical Certification Verification</Text>
                                    </Stack>
                                    <Button
                                        variant="ghost"
                                        onClick={() => router.push('/doctor/pending-records')}
                                        className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl hover:text-primary transition-all border border-slate-100 dark:border-slate-700 h-auto"
                                    >
                                        View History
                                    </Button>
                                </Stack>

                                <Stack direction="col" spacing="md" className="relative z-10">
                                    {isLoading ? (
                                        <Stack align="center" justify="center" className="py-20 opacity-40">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                                            <Text variant="label" className="text-slate-400">Loading records...</Text>
                                        </Stack>
                                    ) : pendingRecords.length === 0 ? (
                                        <Card className="py-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                            <Text variant="muted">No records awaiting your review.</Text>
                                        </Card>
                                    ) : (
                                        <FadeInStagger className="space-y-4">
                                            {pendingRecords.slice(0, 4).map((record) => (
                                                <FadeIn key={record.id} direction="down" distance={10}>
                                                    <Card padding="md" className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
                                                        <Stack direction={{ base: 'col', sm: 'row' } as any} align={{ base: 'stretch', sm: 'center' } as any} justify="between" className="gap-4">
                                                            <Stack direction="row" align="center" spacing="md" className="flex-1 min-w-0">
                                                                <div className="w-11 h-11 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                    <UserIcon className="w-6 h-6" />
                                                                </div>
                                                                <Stack direction="col" spacing="xs" className="flex-1 min-w-0 gap-0">
                                                                    <Text className="font-bold text-slate-900 dark:text-white text-base truncate">{record.patientName || 'Anonymous Patient'}</Text>
                                                                    <Text variant="label" className="text-slate-400 truncate tracking-widest">{record.originalFileName}</Text>
                                                                    <Stack direction="row" align="center" spacing="xs" className="mt-1">
                                                                        <Text variant="label" className="text-primary">{record.recordType || 'General'}</Text>
                                                                        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                                                                        <Text variant="label" className="text-slate-400 dark:text-slate-500">{new Date(record.uploadedAt).toLocaleDateString()}</Text>
                                                                    </Stack>
                                                                </Stack>
                                                            </Stack>
                                                            <Button
                                                                onClick={() => setSelectedRecord(record)}
                                                                className="w-full sm:w-auto px-6 py-2.5 shadow-lg shadow-primary/10 transition-all active:scale-95 shrink-0"
                                                                size="sm"
                                                            >
                                                                Review
                                                            </Button>
                                                        </Stack>
                                                    </Card>
                                                </FadeIn>
                                            ))}
                                        </FadeInStagger>
                                    )}
                                </Stack>
                            </Stack>
                        </Card>
                    </FadeIn>
                </Stack>

                <Stack direction="col" spacing="lg">
                    <FadeIn direction="down" delay={0.3}>
                        <DoctorProfile />
                    </FadeIn>

                    <FadeIn direction="down" delay={0.4}>
                        <DesktopPairing />
                    </FadeIn>

                    <FadeIn direction="down" delay={0.5}>
                        <Card padding="lg" className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none relative overflow-hidden">
                            <span className="absolute top-6 right-6 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Phase 5</span>
                            <H3 className="mb-6">Today's Schedule</H3>
                            <Stack direction="col" spacing="md" className="opacity-80">
                                {[
                                    { time: '10:30 AM', patient: 'Sarah Wilson', type: 'Consultation' },
                                    { time: '02:15 PM', patient: 'Robert Chen', type: 'Follow-up' },
                                ].map((app, i) => (
                                    <div key={i} className="relative pl-6 border-l-2 border-primary/20 dark:border-primary/40 py-1">
                                        <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-primary"></div>
                                        <Text variant="label" className="text-primary">{app.time}</Text>
                                        <Text className="font-bold text-slate-900 dark:text-white mt-0.5">{app.patient}</Text>
                                        <Text variant="muted" className="text-xs">{app.type}</Text>
                                    </div>
                                ))}
                            </Stack>
                        </Card>
                    </FadeIn>

                    <FadeIn direction="down" delay={0.6}>
                        <Card padding="lg" className="bg-gradient-to-br from-primary to-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-primary/20 dark:shadow-none relative overflow-hidden group border-none">
                            <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -mr-12 -mt-12 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                            <Stack direction="col" spacing="xs" className="relative z-10">
                                <H3 className="text-white">Quick Actions</H3>
                                <Text variant="label" className="text-primary-foreground/60">Efficiency Tools</Text>
                            </Stack>

                            <Stack direction="col" spacing="md" className="mt-8 relative z-10">
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push('/doctor/patients')}
                                    className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white text-white hover:text-primary rounded-2xl border border-white/10 hover:border-white transition-all h-auto group/btn"
                                >
                                    <Stack direction="row" align="center" spacing="md">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 group-hover/btn:bg-primary/10 flex items-center justify-center transition-colors">
                                            <UserGroupIcon className="w-5 h-5" />
                                        </div>
                                        <Stack direction="col" spacing="xs" className="text-left gap-0">
                                            <Text variant="label" className="text-white group-hover/btn:text-primary">Create Record</Text>
                                            <Text className="text-[10px] font-medium opacity-60 group-hover/btn:opacity-100 transition-opacity">Select patient from directory</Text>
                                        </Stack>
                                    </Stack>
                                    <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-2 group-hover/btn:translate-x-0" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => router.push('/doctor/appointments')}
                                    className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white text-white hover:text-primary rounded-2xl border border-white/10 hover:border-white transition-all h-auto group/btn"
                                >
                                    <Stack direction="row" align="center" spacing="md">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 group-hover/btn:bg-primary/10 flex items-center justify-center transition-colors">
                                            <CalendarDaysIcon className="w-5 h-5" />
                                        </div>
                                        <Stack direction="col" spacing="xs" className="text-left gap-0">
                                            <Text variant="label" className="text-white group-hover/btn:text-primary">Today's Roster</Text>
                                            <Text className="text-[10px] font-medium opacity-60 group-hover/btn:opacity-100 transition-opacity">Check upcoming appointments</Text>
                                        </Stack>
                                    </Stack>
                                    <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-2 group-hover/btn:translate-x-0" />
                                </Button>
                            </Stack>
                        </Card>
                    </FadeIn>

                    <FadeIn direction="down" delay={0.7}>
                        <Card padding="lg" className="bg-emerald-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group border-none">
                            <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-xl rotate-12 -mr-8 -mt-8 opacity-20 shadow-inner group-hover:rotate-45 transition-transform duration-700" />
                            <H3 className="text-white mb-2 pr-16 relative z-10 uppercase">Digital Signature</H3>
                            <Text className="text-emerald-100 text-sm font-medium leading-relaxed mb-6 relative z-10">Your cryptographic key is active. All records will be signed with RSA-2048.</Text>
                            <div className="flex items-center space-x-2 text-xs font-mono bg-black/10 p-3 rounded-2xl border border-white/10 opacity-70 relative z-10">
                                <span className="opacity-60 font-black uppercase tracking-widest text-[10px]">AUTH-RSA-2048-ACTIVE</span>
                            </div>
                        </Card>
                    </FadeIn>
                </Stack>
            </div>

            {selectedRecord && (
                <DoctorReviewModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSuccess={() => refetch()}
                />
            )}
        </PageLayout>
    );
}

export default function DoctorDashboard() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hydrating Dashboard...</p>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
