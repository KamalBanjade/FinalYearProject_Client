'use client';

import React, { useEffect, useState } from 'react';
import { doctorApi } from '@/lib/api/doctor';
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

export default function CertifiedRecordsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [recordType, setRecordType] = useState('');

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
            const response = await axiosInstance.get(`doctor/records/${recordId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download secure record');
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-10">
            {/* Professional Header */}
            <div className="flex justify-between items-end mb-10 border-b border-slate-100 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <History size={24} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Certification History</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-12">Comprehensive registry of all medical records you have cryptographically certified.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Certified</span>
                        <span className="text-lg font-bold text-emerald-600">{records.length}</span>
                    </div>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="Search by patient name, file, or description..."
                        className="pl-12 h-12 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10 rounded-xl text-sm font-medium transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <select
                        value={recordType}
                        onChange={(e) => setRecordType(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 h-12 text-sm font-bold text-slate-600 outline-none focus:border-emerald-500 shadow-sm transition-all"
                    >
                        <option value="">All Document Types</option>
                        <option value="Lab Report">Lab Reports</option>
                        <option value="Prescription">Prescriptions</option>
                        <option value="Imaging">Imaging / Scans</option>
                        <option value="Discharge Summary">Discharge Summaries</option>
                        <option value="Other">Other Documents</option>
                    </select>

                    <Button
                        variant="ghost"
                        onClick={fetchRecords}
                        className="h-12 w-12 p-0 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-white"
                    >
                        <Filter size={20} />
                    </Button>
                </div>
            </div>

            {/* Records Grid/List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <th className="px-8 py-5">Record Details</th>
                            <th className="px-8 py-5">Patient Identity</th>
                            <th className="px-8 py-5">Certification Date</th>
                            <th className="px-8 py-5">Security</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-8 py-6">
                                        <div className="h-16 bg-slate-50 rounded-2xl w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-32 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-4">
                                        <SearchX size={48} className="text-slate-200" strokeWidth={1.5} />
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-600">No certified records found</p>
                                            <p className="text-sm font-medium">Try adjusting your filters or search terms.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-all group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                            <FileText size={22} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{record.originalFileName}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">
                                                    {record.recordType}
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-400">{record.fileSizeFormatted}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-300" />
                                            <span className="text-sm font-bold text-slate-700">{record.patientName}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Patient ID: {record.patientId.substring(0, 8)}...</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                                            <Calendar size={14} className="text-slate-300" />
                                            {format(new Date(record.certifiedAt), 'MMM dd, yyyy')}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">{format(new Date(record.certifiedAt), 'hh:mm aa')}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 w-fit">
                                        <ShieldCheck size={14} fill="currentColor" className="fill-emerald-200" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Signed & Secured</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 w-10 p-0 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm"
                                            title="View Details"
                                        >
                                            <ExternalLink size={18} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 w-10 p-0 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm"
                                            title="Download Secure File"
                                            onClick={() => handleDownload(record.id, record.originalFileName)}
                                        >
                                            <Download size={18} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
