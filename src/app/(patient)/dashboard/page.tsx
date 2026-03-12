'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PatientProfile } from '@/components/patient/PatientProfile';
import { PlusIcon, DocumentDuplicateIcon, ClockIcon, ClipboardDocumentCheckIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '@/store/authStore';
import { medicalRecordsApi } from '@/lib/api/medicalRecords';
import { useQuery } from '@tanstack/react-query';

import { FadeIn, FadeInStagger } from '@/components/ui/FadeIn';
import { PageLayout, Section } from '@/components/layout/PageLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { Card } from '@/components/ui/Card';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { H1, H2, H3, Text } from '@/components/ui/Typography';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <FadeIn direction="down" distance={10} className="h-full">
        <Card padding="md" className="h-full hover:scale-[1.02] border-white/5 dark:border-white/5">
            <Stack direction="row" align="center" spacing="sm">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color} shadow-lg shadow-black/5`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <Stack direction="col" spacing="xs" className="gap-0.5">
                    <Text variant="muted" className="text-sm font-semibold tracking-tight">{title}</Text>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                </Stack>
            </Stack>
        </Card>
    </FadeIn>
);

export default function PatientDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();

    const { data: recordsResponse } = useQuery({
        queryKey: ['patient-medical-records'],
        queryFn: () => medicalRecordsApi.getMyRecords(),
    });

    const groupedData = recordsResponse?.data;
    const allRecords = groupedData?.sections.flatMap(section => section.records) || [];

    const stats = {
        total: groupedData?.totalCount || 0,
        certified: allRecords.filter(r => r.isCertified).length,
        pending: allRecords.filter(r => !r.isCertified).length,
    };

    const recentRecords = allRecords.slice(0, 3);

    return (
        <PageLayout>
            {/* Setup Reminder Banner */}
            {user && !user.totpSetupCompleted && (
                <FadeIn direction="down" delay={0.1}>
                    <Card className="bg-amber-50 border-l-4 border-amber-400 p-4 md:p-6 rounded-2xl shadow-sm dark:bg-amber-900/10">
                        <Stack direction={{ base: 'col', md: 'row' } as any} align={{ base: 'start', md: 'center' } as any} spacing="md">
                            <Stack direction="row" align="center" spacing="md" className="flex-1">
                                <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                                </div>
                                <Stack direction="col" spacing="xs" className="gap-0.5">
                                    <Text variant="label" className="text-amber-800 dark:text-amber-500 opacity-80">Security Setup Incomplete</Text>
                                    <Text className="text-amber-700 dark:text-amber-600 font-bold text-sm leading-tight">
                                        Complete two-factor authentication to secure your health data.
                                    </Text>
                                </Stack>
                            </Stack>
                            <Button
                                variant="primary"
                                onClick={() => router.push('/complete-setup')}
                                className="w-full md:w-auto bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20"
                            >
                                Complete Setup Now
                            </Button>
                        </Stack>
                    </Card>
                </FadeIn>
            )}

            {/* Dashboard Actions Toolbar */}
            <FadeIn direction="down" delay={0.2}>
                <Card padding="none" className="bg-white dark:bg-white/5 rounded-[2rem] border border-slate-200/60 dark:border-white/10 shadow-premium dark:shadow-none overflow-hidden">
                    <Stack direction={{ base: 'col', md: 'row' } as any} align={{ base: 'stretch', md: 'center' } as any} justify="between" className="p-4">
                        <Stack direction="row" align="center" spacing="sm" className="px-4 py-2 md:py-0">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <Text variant="label" className="opacity-60">Active Health Monitor</Text>
                        </Stack>

                        <Button
                            onClick={() => router.push('/records/upload')}
                            className="w-full md:w-auto px-8 py-3.5 rounded-2xl shadow-xl shadow-primary/20 gap-2 group"
                        >
                            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            <span>Upload New Medical Record</span>
                        </Button>
                    </Stack>
                </Card>
            </FadeIn>

            {/* Stats */}
            <Section>
                <FadeInStagger delay={0.3}>
                    <ResponsiveGrid columns={4}>
                        <StatCard title="Total Records" value={stats.total} icon={DocumentDuplicateIcon} color="bg-blue-600" />
                        <StatCard title="Pending" value={stats.pending} icon={ClockIcon} color="bg-amber-500" />
                        <StatCard title="Certified" value={stats.certified} icon={ClipboardDocumentCheckIcon} color="bg-emerald-600" />
                        <StatCard title="Upcoming" value="—" icon={PlusIcon} color="bg-primary" />
                    </ResponsiveGrid>
                </FadeInStagger>
            </Section>

            {/* Main content */}
            <ResponsiveGrid columns={3} gap="lg">
                <Stack direction="col" spacing="lg" className="lg:col-span-2">
                    <FadeIn direction="down" delay={0.4}>
                        <PatientProfile />
                    </FadeIn>

                    {/* Recent Records */}
                    <FadeIn direction="down" delay={0.5}>
                        <Card padding="lg" className="bg-white/40 dark:bg-white/5 rounded-3xl border border-white/10 dark:border-white/5 shadow-sm backdrop-blur-sm">
                            <Stack direction="row" align="center" justify="between" className="mb-6">
                                <H3>Recent Records</H3>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push('/records')}
                                    className="text-indigo-600 dark:text-primary-light text-sm font-semibold gap-1 hover:underline p-0 h-auto"
                                >
                                    <span>View all</span>
                                    <ArrowRightIcon className="w-4 h-4" />
                                </Button>
                            </Stack>
                            
                            {recentRecords.length === 0 ? (
                                <Stack align="center" justify="center" className="py-8 text-slate-400">
                                    <DocumentDuplicateIcon className="w-10 h-10 mb-2 opacity-40" />
                                    <Text variant="muted">
                                        No records yet.{' '}
                                        <button
                                            onClick={() => router.push('/records/upload')}
                                            className="text-indigo-600 dark:text-primary-light font-semibold hover:underline"
                                        >
                                            Upload one now.
                                        </button>
                                    </Text>
                                </Stack>
                            ) : (
                                <FadeInStagger className="space-y-4">
                                    {recentRecords.map((r) => (
                                        <FadeIn key={r.id} direction="down" distance={10}>
                                            <Card
                                                padding="sm"
                                                className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-primary/30 transition-all cursor-pointer"
                                                onClick={() => router.push('/records')}
                                            >
                                                <Stack direction="row" align="center" justify="between">
                                                    <Stack direction="row" align="center" spacing="md">
                                                        <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                                                            <DocumentDuplicateIcon className="w-5 h-5 text-indigo-600 dark:text-primary-light" />
                                                        </div>
                                                        <Stack direction="col" spacing="xs" className="gap-0">
                                                            <Text className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-xs">{r.originalFileName}</Text>
                                                            <Text variant="muted" className="text-xs">{r.recordType} • {new Date(r.uploadedAt).toLocaleDateString()}</Text>
                                                        </Stack>
                                                    </Stack>
                                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.isCertified ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                                        {r.isCertified ? 'Certified' : 'Pending'}
                                                    </div>
                                                </Stack>
                                            </Card>
                                        </FadeIn>
                                    ))}
                                </FadeInStagger>
                            )}
                        </Card>
                    </FadeIn>
                </Stack>

                {/* QR Emergency */}
                <FadeIn direction="down" delay={0.6} className="h-full">
                    <Card padding="lg" className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white shadow-xl relative overflow-hidden h-fit border-none">
                        <span className="absolute top-6 right-6 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full z-20">Phase 4</span>
                        <Stack spacing="lg" className="relative z-10">
                            <H3 className="text-white">Emergency Quick Access</H3>
                            <Text className="text-indigo-100 text-sm leading-relaxed">Download your emergency medical pass for quick identification by medical personnel.</Text>
                            <Button variant="ghost" className="w-full bg-white/10 opacity-50 cursor-not-allowed text-white hover:bg-white/20" title="Coming in Phase 4">
                                Generate QR Code
                            </Button>
                        </Stack>
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </Card>
                </FadeIn>
            </ResponsiveGrid>
        </PageLayout>
    );
}
