'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { healthRecordApi } from '@/lib/api/healthRecordApi';
import { doctorApi } from '@/lib/api';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import {
    ChevronLeft, Database, Activity, ClipboardList,
    Calendar, User, Heart, AlertTriangle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

export default function PatientDataTablePage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;

    const { data: recordsRes, isLoading } = useQuery({
        queryKey: ['doctor', 'patient', patientId, 'records', 'health', 'tabular'],
        queryFn: () => healthRecordApi.getPatientRecords(patientId),
        staleTime: 1000 * 60 * 5,
    });

    const { data: patientRes } = useQuery({
        queryKey: ['doctor', 'patient', patientId],
        queryFn: () => doctorApi.getPatientInfo(patientId),
        staleTime: 1000 * 60 * 5,
    });

    const records = (recordsRes as any)?.data || (recordsRes as any)?.Data || [];
    const patient = patientRes?.success ? patientRes.data : null;

    const columns = [
        {
            header: "Date & Context",
            accessor: (row: any) => (
                <div className="flex flex-col gap-1.5 min-w-[130px]">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black whitespace-nowrap">
                        <Calendar size={14} className="text-indigo-500" />
                        {format(new Date(row.recordDate), 'MMM dd, yyyy')}
                    </div>
                    {row.appointmentId && (
                        <div className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest flex items-center gap-1.5 bg-indigo-500/5 px-2 py-0.5 rounded-md w-fit">
                            <Clock size={10} /> Appt-{row.appointmentId.slice(0, 5)}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Patient Info",
            accessor: (row: any) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
                        <User size={14} className="text-slate-400" />
                        {row.patientName || `${patient?.firstName} ${patient?.lastName}`}
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        ID: {row.patientId.slice(0, 12)}
                    </div>
                </div>
            )
        },
        {
            header: "Clinical Vitals",
            accessor: (row: any) => (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 min-w-[250px] p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm backdrop-blur-sm">
                    <VitalRow label="BP" value={row.bloodPressure} isAbnormal={row.isBloodPressureAbnormal} />
                    <VitalRow label="HR" value={row.heartRate} isAbnormal={row.isHeartRateAbnormal} fallbackUnit="bpm" />
                    <VitalRow label="TEMP" value={row.temperature} isAbnormal={row.isTemperatureAbnormal} />
                    <VitalRow label="SPO2" value={row.spO2} isAbnormal={row.isSpO2Abnormal} fallbackUnit="%" />
                    {row.bmi && (
                        <div className="col-span-2 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase">BMI Status</span>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                {row.bmi} · {row.bmiCategory}
                            </span>
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Medical Data & Assessment",
            className: "min-w-[300px]",
            accessor: (row: any) => (
                <div className="space-y-3">
                    {/* Diagnosis & Complaint */}
                    <div className="flex flex-col gap-1.5 px-3 py-2 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/50 rounded-xl">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-glow shadow-indigo-500/40" />
                            <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Diagnosis</p>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-relaxed line-clamp-2">
                            {row.diagnosis || 'General Clinical Review'}
                        </p>
                    </div>

                    {/* Protocol Sections */}
                    {((row.sections || row.Sections) as any[])?.filter((s: any) => (s.attributes || s.Attributes)?.some((a: any) => (a.fieldValue || a.FieldValue)?.trim())).length > 0 && (
                        <div className="grid grid-cols-1 gap-2">
                            {((row.sections || row.Sections) as any[])
                                .filter((s: any) => (s.attributes || s.Attributes)?.some((a: any) => (a.fieldValue || a.FieldValue)?.trim()))
                                .map((section: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group-hover:border-indigo-500/20 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ClipboardList size={12} className="text-slate-400" />
                                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider truncate">
                                                {section.sectionName || section.SectionName}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                            {(section.attributes || section.Attributes)
                                                ?.filter((attr: any) => (attr.fieldValue || attr.FieldValue)?.trim())
                                                .map((attr: any, aIdx: number) => {
                                                    const label = attr.fieldLabel || attr.FieldLabel || attr.fieldName || attr.FieldName;
                                                    const value = attr.fieldValue || attr.FieldValue;
                                                    const unit = attr.fieldUnit || attr.FieldUnit;
                                                    return (
                                                        <div key={aIdx} className="flex items-center gap-1.5">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}:</span>
                                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">
                                                                {value} {unit && !value.includes(unit) && <span className="opacity-60 font-bold">{unit}</span>}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="w-full flex-1 flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Longitudinal Medical Data</h1>
                            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-black text-indigo-500 uppercase tracking-widest hidden sm:block">
                                Structured Table View
                            </div>
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
                            <User size={12} className="text-indigo-600" />
                            <span className="opacity-60">Archive for:</span>
                            <span className="text-slate-900 dark:text-white bg-indigo-500/5 px-3 py-0.5 rounded-lg border border-indigo-500/10">
                                {patient ? `${patient.firstName} ${patient.lastName}` : 'Loading Patient...'}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="h-12 px-6 rounded-2xl border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase cursor-pointer"
                    >
                        Back to Profile
                    </Button>
                    <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Record Count</p>
                            <p className="text-sm font-black text-indigo-600 tracking-tighter">{records.length} Entries</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                            <Database size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TABLE CONTAINER ── */}
            <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/5 to-emerald-500/5 blur-3xl rounded-[4rem] -z-10" />
                <ResponsiveTable
                    data={records}
                    columns={columns}
                    loading={isLoading}
                    keyExtractor={(row) => row.id}
                    renderMobileCard={(row) => (
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(row.recordDate), 'PPPP')}</p>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase">{row.diagnosis || 'Clinical Record'}</h4>
                                </div>
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <ClipboardList size={20} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Vital Stats</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <MobileVital label="Blood Pressure" value={row.bloodPressure} />
                                    <MobileVital label="Heart Rate" value={row.heartRate ? `${row.heartRate} bpm` : null} />
                                    <MobileVital label="Temperature" value={row.temperature ? `${row.temperature}°C` : null} />
                                    <MobileVital label="SpO2 Level" value={row.spO2 ? `${row.spO2}%` : null} />
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/doctor/records/${row.id}`)}
                                className="w-full py-4 bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-indigo-500/10"
                            >
                                View Detailed Report
                            </button>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}

function VitalRow({ label, value, isAbnormal, fallbackUnit }: { label: string, value: string | null, isAbnormal?: boolean, fallbackUnit?: string }) {
    if (!value) return null;

    // Clean up double units (e.g. "82 bpm bpm")
    let displayValue = value.trim();
    if (fallbackUnit && !displayValue.toLowerCase().includes(fallbackUnit.toLowerCase())) {
        displayValue = `${displayValue} ${fallbackUnit}`;
    }

    return (
        <div className="flex justify-between items-center text-[10px] py-1 border-b border-slate-100/50 dark:border-slate-800/30 last:border-0 gap-3">
            <span className="text-slate-400 font-black uppercase tracking-widest text-[9px] whitespace-nowrap">{label}</span>
            <div className={`flex items-center gap-1.5 font-black tracking-tight whitespace-nowrap ${isAbnormal ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                {displayValue}
                {isAbnormal && <AlertTriangle size={10} className="fill-rose-500/10 shrink-0" />}
            </div>
        </div>
    );
}

function MobileVital({ label, value }: { label: string, value: string | null }) {
    if (!value) return null;
    return (
        <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}
