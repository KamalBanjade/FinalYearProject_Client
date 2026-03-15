'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Stack } from '@/components/ui/Stack';

export function AppointmentSkeleton() {
    return (
        <div className="space-y-6">
            {[1, 2, 3].map((i) => (
                <Card key={i} padding="lg" className="overflow-hidden relative">
                    {/* Left accent strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    
                    <Stack direction={{ base: 'col', md: 'row' } as any} align="center" spacing="lg">
                        {/* Time/Date Section */}
                        <Stack 
                            direction="col" 
                            align="center" 
                            justify="center" 
                            className="w-full md:w-36 shrink-0 py-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800"
                        >
                            <Skeleton className="h-8 w-20 rounded-full" />
                            <Skeleton className="h-3 w-12 mt-2 rounded-full" />
                            <div className="h-px w-10 bg-slate-200 dark:bg-slate-700 my-4" />
                            <Skeleton className="h-3 w-16 rounded-full" />
                        </Stack>

                        {/* Content Section */}
                        <Stack direction="col" spacing="md" className="flex-1 min-w-0 w-full">
                            <Stack direction="col" spacing="xs" align={{ base: 'center', md: 'start' } as any}>
                                <Stack direction="row" align="center" spacing="sm">
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                    <Skeleton className="h-3 w-32 rounded-full" />
                                </Stack>
                                <Skeleton className="h-7 w-3/4 rounded-xl mt-2" />
                                <Stack direction="row" align="center" spacing="sm" className="mt-2 text-center md:text-left">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-4 w-40 rounded-full" />
                                </Stack>
                            </Stack>
                            
                            <Stack direction="row" align="center" justify={{ base: 'center', md: 'start' } as any} spacing="md" className="mt-2">
                                <Skeleton className="h-8 w-32 rounded-xl" />
                                <Skeleton className="h-8 w-32 rounded-xl" />
                            </Stack>
                        </Stack>

                        {/* Actions Section */}
                        <Stack direction={{ base: 'col', sm: 'row' } as any} align="center" spacing="sm" className="shrink-0 w-full md:w-auto">
                            <Skeleton className="h-12 w-full sm:w-32 rounded-2xl" />
                            <Skeleton className="h-12 w-full sm:w-24 rounded-2xl" />
                        </Stack>
                    </Stack>
                </Card>
            ))}
        </div>
    );
}
