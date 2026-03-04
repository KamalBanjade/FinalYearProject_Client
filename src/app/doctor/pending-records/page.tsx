'use client';

import React, { useState, useEffect } from 'react';
import { medicalRecordsApi, MedicalRecordResponseDTO } from '@/lib/api/medicalRecords';
import { DoctorReviewModal } from '@/components/doctor/DoctorReviewModal';
import {
    ClipboardDocumentCheckIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ChevronRightIcon,
    DocumentTextIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function PendingRecordsPage() {
    const [records, setRecords] = useState<MedicalRecordResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecordResponseDTO | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPendingRecords = async () => {
        try {
            setLoading(true);
            const response = await medicalRecordsApi.getPendingRecords();
            setRecords(response.data || []);
        } catch (err) {
            toast.error('Failed to load pending records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRecords();
    }, []);

    const handleReviewSuccess = (updatedRecord: MedicalRecordResponseDTO) => {
        // Remove from pending list
        setRecords(records.filter(r => r.id !== updatedRecord.id));
    };

    const filteredRecords = records.filter(r =>
        r.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                            <ClockIcon className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Certification Queue</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Verify and sign medical documents awaiting professional review.</p>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="relative group">
                        <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search records or patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-full md:w-80 shadow-sm"
                        />
                    </div>
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                        <FunnelIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* List Area */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p className="font-bold text-sm uppercase tracking-widest animate-pulse">Scanning Secure Vault...</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <ClipboardDocumentCheckIcon className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Queue is Clear</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">All submitted medical records have been certified or reviewed.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Document Name</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Patient</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Type</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Date Received</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRecords.map((record) => (
                                    <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                    <DocumentTextIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{record.originalFileName}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Size: {record.fileSizeFormatted}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <span className="font-bold text-slate-700 text-sm">{record.patientName || 'Anonymous Patient'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                {record.recordType || 'Other'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-medium text-slate-600">{new Date(record.uploadedAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => setSelectedRecord(record)}
                                                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/20"
                                            >
                                                <span>Review</span>
                                                <ChevronRightIcon className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selectedRecord && (
                <DoctorReviewModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSuccess={handleReviewSuccess}
                />
            )}
        </div>
    );
}
