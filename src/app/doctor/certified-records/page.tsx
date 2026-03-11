'use client';

import React, { useEffect, useState } from 'react';
import { doctorApi } from '@/lib/api/doctor';
import { medicalRecordsApi } from '@/lib/api/medicalRecords';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    FileText,
    Search,
    SearchX,
    Calendar,
    User,
    Download,
    ShieldCheck,
    History,
    ExternalLink,
    Loader2,
    Filter
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/utils/axios';
import { FullScreenRecordModal } from '@/components/ui/FullScreenRecordModal';

export default function CertifiedRecordsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [recordType, setRecordType] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loadingRecordId, setLoadingRecordId] = useState<string | null>(null);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await doctorApi.getCertifiedRecords();
            setRecords(response.data);
        } catch (error) {
            console.error('Failed to fetch certified records:', error);
            toast.error('Failed to load clinical certification history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const filteredRecords = records.filter(record => {
        const matchesSearch =
            record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.originalFileName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = recordType === '' || record.recordType === recordType;

        return matchesSearch && matchesType;
    });

    const handleDownload = async (recordId: string, fileName: string) => {
        try {
            await medicalRecordsApi.downloadRecordForDoctor(recordId);
        } catch (error) {
            toast.error('Failed to download secure record');
        }
    };

    const handlePreview = async (recordId: string) => {
        setLoadingRecordId(recordId);
        try {
            const url = await medicalRecordsApi.previewRecordForDoctor(recordId);
            if (url) setPreviewUrl(url);
        } catch (error) {
            // Error toast handled by API
        } finally {
            setLoadingRecordId(null);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">

            {/* Subtle Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input
                        placeholder="Search by patient name or file..."
                        className="pl-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-primary/10 rounded-xl text-xs font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 transition-all cursor-pointer min-w-[160px]"
                >
                    <option value="">All Categories</option>
                    <option value="Lab Report">Lab Reports</option>
                    <option value="Prescription">Prescriptions</option>
                    <option value="Imaging">Imaging / Scans</option>
                    <option value="Discharge Summary">Discharge Summaries</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Registry Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Document</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Patient Identity</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Certification</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-6 py-5">
                                            <div className="h-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No entries found</p>
                                    </td>
                                </tr>
                            ) : filteredRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-slate-800 text-primary dark:text-primary-light flex items-center justify-center border border-transparent dark:border-slate-700">
                                                <FileText size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                                    {record.originalFileName}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    {record.recordType} • {record.fileSizeFormatted}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize leading-tight">{record.patientName}</span>
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">ID: {record.patientId.substring(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                                                    {format(new Date(record.certifiedAt), 'MMM dd, yyyy')}
                                                </span>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <ShieldCheck size={10} className="text-emerald-500" />
                                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handlePreview(record.id)}
                                                disabled={loadingRecordId === record.id}
                                                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/10 flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {loadingRecordId === record.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <ExternalLink size={12} />
                                                )}
                                                {loadingRecordId === record.id ? 'Loading' : 'View'}
                                            </button>
                                            <button
                                                onClick={() => handleDownload(record.id, record.originalFileName)}
                                                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-primary hover:border-indigo-100 dark:hover:border-indigo-900 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                                            >
                                                <Download size={12} />
                                                File
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Immersive Preview */}
            {previewUrl && (
                <FullScreenRecordModal
                    pdfUrl={previewUrl}
                    onClose={() => setPreviewUrl(null)}
                />
            )}
        </div>
    );
}
