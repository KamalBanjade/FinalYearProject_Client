'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AppointmentDTO } from '@/lib/api/appointments';
import { formatLocalTime } from '@/lib/utils/dateUtils';
import { Stethoscope, User, Clock, FileText, Zap, XCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { H3, Text } from '@/components/ui/Typography';

export interface PatientAppointmentCardProps {
    appointment: AppointmentDTO;
    isHistory: boolean;
    onCancel: () => void;
    onViewDetails: () => void;
}

export function PatientAppointmentCard({ appointment, isHistory, onCancel, onViewDetails }: PatientAppointmentCardProps) {
    const statusStyles: Record<string, any> = {
        Confirmed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Confirmed' },
        Scheduled: { bg: 'bg-primary/10', text: 'text-primary', label: 'Scheduled' },
        Pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Pending' },
        Cancelled: { bg: 'bg-rose-500/10', text: 'text-rose-500', label: 'Terminated' },
        Completed: { bg: 'bg-emerald-600', text: 'text-white', label: 'Completed' },
        Overdue: { bg: 'bg-rose-600', text: 'text-white', label: 'Overdue' },
    };

    const status = statusStyles[appointment.status] || { bg: 'bg-slate-500/10', text: 'text-slate-500', label: appointment.status };

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.005 }}
            className={`group relative overflow-hidden transition-all duration-500 ${isHistory ? 'opacity-80 grayscale-[20%]' : ''}`}
        >
            <Card padding="lg" className="hover:shadow-2xl hover:border-emerald-500/30 overflow-hidden">
                <Stack direction={{ base: 'col', md: 'row' } as any} align={{ base: 'center', md: 'center' } as any} spacing="lg">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${appointment.status === 'Completed' || appointment.status === 'Overdue' ? status.bg : status.text.replace('text-', 'bg-')}`} />

                    <Stack direction="col" align="center" justify="center" className="w-full md:w-36 shrink-0 py-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 group-hover:bg-emerald-500/5 transition-colors">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic">
                            {formatLocalTime(appointment.appointmentDate, 'h:mm')}
                        </span>
                        <Text variant="label" className="mt-2 tracking-[0.3em]">
                            {formatLocalTime(appointment.appointmentDate, 'a')}
                        </Text>
                        <div className="h-px w-10 bg-slate-200 dark:bg-slate-700 my-4 group-hover:w-16 group-hover:bg-emerald-500/30 transition-all duration-500" />
                        <Text variant="label" className="text-emerald-600 dark:text-emerald-400">
                            {formatLocalTime(appointment.appointmentDate, 'MMM dd')}
                        </Text>
                    </Stack>

                    <Stack direction="col" spacing="md" className="flex-1 min-w-0 text-center md:text-left">
                        <Stack direction="col" spacing="xs">
                            <Stack direction="row" align="center" justify={{ base: 'center', md: 'start' } as any} spacing="sm" wrap>
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent shadow-sm ${status.bg} ${status.text}`}>
                                    {status.label}
                                </div>
                                <Stack direction="row" align="center" spacing="xs" className="text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-black text-[9px]">
                                    <Stethoscope className="w-3.5 h-3.5" />
                                    {appointment.doctorDepartment}
                                </Stack>
                            </Stack>
                            <H3 className="truncate group-hover:text-emerald-600 transition-colors">
                                {appointment.reasonForVisit || 'General Medical Consultation'}
                            </H3>
                            <Stack direction="row" align="center" justify={{ base: 'center', md: 'start' } as any} spacing="sm">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <User className="w-4 h-4 text-emerald-600" />
                                </div>
                                <Text variant="muted" className="!font-black uppercase tracking-tight">Physician: {appointment.doctorName}</Text>
                            </Stack>
                        </Stack>
                        <Stack direction="row" align="center" justify={{ base: 'center', md: 'start' } as any} spacing="md" wrap>
                            <Stack direction="row" align="center" spacing="sm" className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <Text variant="label">{appointment.duration} Minutes</Text>
                            </Stack>
                            {appointment.linkedRecordsCount > 0 && (
                                <Stack direction="row" align="center" spacing="sm" className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                    <Text variant="label" className="text-emerald-600 dark:text-emerald-400">{appointment.linkedRecordsCount} Records</Text>
                                </Stack>
                            )}
                        </Stack>
                    </Stack>

                    <Stack direction={{ base: 'col', sm: 'row' } as any} align="center" spacing="sm" className="shrink-0 w-full md:w-auto relative z-10">
                        {!isHistory ? (
                            <>
                                <button
                                    onClick={onViewDetails}
                                    className="w-full sm:w-auto sm:px-8 h-12 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 transition-all hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-2 group/btn cursor-pointer"
                                >
                                    <Zap className="w-4 h-4 fill-current group-hover/btn:animate-pulse text-amber-400" />
                                    Full Insights
                                </button>
                                {appointment.canCancel && (
                                    <button
                                        onClick={onCancel}
                                        className="w-full sm:w-auto sm:px-8 h-12 flex items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-2 border-rose-100 dark:border-rose-900/30 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95 group/cancel cursor-pointer"
                                    >
                                        <XCircle className="w-4 h-4 mr-2 transition-transform group-hover/cancel:rotate-90" />
                                        <span className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">Cancel</span>
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <Link href={`/appointments/new?doctorId=${appointment.doctorId}&reason=Follow-up for ${appointment.reasonForVisit}`} className="w-full sm:w-auto">
                                    <button className="w-full sm:px-8 h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 group/rebook transition-all hover:scale-[1.05]">
                                        Re-Book
                                        <ArrowRight className="inline-block w-4 h-4 ml-2 group-hover/rebook:translate-x-1.5 transition-transform" />
                                    </button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={onViewDetails}
                                    className="w-full sm:w-auto sm:px-6 h-12 rounded-2xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    Summary
                                </Button>
                            </>
                        )}
                    </Stack>
                </Stack>
            </Card>
        </motion.div>
    );
}
