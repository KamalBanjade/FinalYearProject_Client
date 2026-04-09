'use client';

import React from 'react';
import { Skeleton } from './Skeleton';
import { PageLayout, Section } from '../layout/PageLayout';

export function DirectorySkeleton() {
    return (
        <PageLayout>
            <div className="space-y-6">
                {/* Toolbar Skeleton */}
                <div className="flex flex-col lg:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <Skeleton className="h-12 flex-1 rounded-2xl" />
                    <Skeleton className="h-12 w-32 rounded-2xl" />
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="p-6 rounded-[2rem] bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
                            <Skeleton className="w-12 h-12 rounded-2xl mb-6" />
                            <Skeleton className="h-8 w-1/2 mb-2" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    ))}
                </div>

                {/* Table Skeleton Placeholder */}
                <Section className="p-0 overflow-hidden shadow-2xl shadow-indigo-100/50 dark:shadow-none border-none rounded-[2.5rem]">
                    <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden p-8">
                        <div className="space-y-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-3 w-1/2 opacity-50" />
                                    </div>
                                    <Skeleton className="h-10 w-24 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>
            </div>
        </PageLayout>
    );
}
