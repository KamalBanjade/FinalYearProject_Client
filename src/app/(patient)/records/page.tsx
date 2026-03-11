'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
    medicalRecordsApi,
    MedicalRecordResponseDTO,
    UpdateMedicalRecordMetadataDTO,
    GroupedMedicalRecordsDTO,
    RecordSectionDTO
} from '@/lib/api/medicalRecords';
import { useQuery } from '@tanstack/react-query';
import { RecordsTimeline } from '@/components/patient/RecordsTimeline';
import { RecordCard } from '@/components/patient/RecordCard';
import {
    FileText,
    Download,
    Edit2,
    Trash2,
    X,
    AlertCircle,
    SendHorizontal,
    Archive,
    CheckCircle,
    RefreshCw,
    UploadCloud,
    ArrowUpCircle,
    Bell
} from 'lucide-react';
import { FullScreenRecordModal } from '@/components/ui/FullScreenRecordModal';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useConfirm } from '@/context/ConfirmContext';
import { formatDate, normalizeUTC } from '@/lib/utils/dateUtils';

function PatientRecordsPageInner() {
    const {
        data: recordsResponse,
        isLoading: loading,
        error: queryError,
        refetch: fetchRecords
    } = useQuery({
        queryKey: ['patient-medical-records'],
        queryFn: () => medicalRecordsApi.getMyRecords(),
        placeholderData: (previousData) => previousData,
    });

    const groupedData = recordsResponse?.data || null;
    const error = queryError ? 'Failed to fetch medical records' : null;

    const [editingRecord, setEditingRecord] = useState<MedicalRecordResponseDTO | null>(null);
    const [previewRecord, setPreviewRecord] = useState<MedicalRecordResponseDTO | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { confirm } = useConfirm();

    // Filter State
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    // Edit State
    const [editDesc, setEditDesc] = useState('');
    const [editRecordType, setEditRecordType] = useState('');

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setEditingRecord(null);
        };
        if (editingRecord) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [editingRecord]);

    const handleDownload = async (id: string, fileName: string) => {
        try {
            await medicalRecordsApi.downloadRecord(id);
        } catch (err) {
            toast.error(`Failed to download ${fileName}. Ensure you have the right permissions.`);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Record',
            message: 'Are you sure you want to delete this record? This action cannot be undone.',
            confirmText: 'Delete',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            await medicalRecordsApi.deleteRecord(id);
            toast.success('Record deleted successfully.');
            fetchRecords(); // Refresh grouped data
        } catch (err) {
            toast.error('Failed to delete record');
        }
    };

    const handleEditOpen = (record: MedicalRecordResponseDTO) => {
        setEditingRecord(record);
        setEditDesc(record.description || '');
        setEditRecordType(record.recordType || 'Other');
    };

    const handleEditSave = async () => {
        if (!editingRecord) return;
        try {
            const payload: UpdateMedicalRecordMetadataDTO = {
                description: editDesc,
                recordType: editRecordType,
            };
            await medicalRecordsApi.updateRecordMetadata(editingRecord.id, payload);
            setEditingRecord(null);
            toast.success('Record details updated.');
            fetchRecords(); // Refresh grouped data
        } catch (err) {
            toast.error('Failed to update record details');
        }
    };

    const handleSubmitRecord = async (record: MedicalRecordResponseDTO) => {
        const confirmed = await confirm({
            title: 'Submit for Review',
            message: 'Ready to send this record to the doctor for certification?',
            confirmText: 'Submit Now',
            type: 'primary'
        });
        if (!confirmed) return;

        try {
            await medicalRecordsApi.submitForReview(record.id);
            toast.success('Record submitted for review.');
            fetchRecords();
        } catch (err) {
            toast.error('Failed to submit record.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            {/* Page Actions */}
            <div className="flex flex-col md:flex-row justify-end items-center gap-3">
                <Link
                    href="/records/upload"
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                >
                    <UploadCloud className="w-5 h-5" />
                    Upload Record
                </Link>

                <button
                    onClick={() => fetchRecords()}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-3 text-sm font-bold border border-rose-100 dark:border-rose-900/50">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Date Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Filter By Date:</span>
                </div>

                <div className="flex flex-1 flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">From</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex-1"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">To</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex-1"
                        />
                    </div>
                </div>

                {(fromDate || toDate) && (
                    <button
                        onClick={() => { setFromDate(''); setToDate(''); }}
                        className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-tight sm:ml-auto"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {loading && !groupedData ? (
                    <div className="py-24 text-center">
                        <RefreshCw className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
                        <p className="mt-4 text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Vault...</p>
                    </div>
                ) : groupedData ? (
                    <FilteredTimeline
                        data={groupedData}
                        fromDate={fromDate}
                        toDate={toDate}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onEdit={handleEditOpen}
                        onSubmit={handleSubmitRecord}
                        onView={(record, url) => {
                            setPreviewRecord(record);
                            setPreviewUrl(url);
                        }}
                    />
                ) : null}
            </div>

            {/* Preview Modal */}
            {previewUrl && (
                <FullScreenRecordModal
                    pdfUrl={previewUrl}
                    onClose={() => {
                        setPreviewRecord(null);
                        setPreviewUrl(null);
                    }}
                />
            )}

            {/* Modal */}
            {editingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Metadata</h3>
                            <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-900">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Record Category</label>
                                <select
                                    value={editRecordType}
                                    onChange={(e) => setEditRecordType(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="Lab Report">Lab Report</option>
                                    <option value="Prescription">Prescription</option>
                                    <option value="X-Ray">X-Ray</option>
                                    <option value="CT Scan">CT Scan</option>
                                    <option value="MRI">MRI</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                                <textarea
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                                />
                            </div>
                        </div>

                        <div className="p-6 flex gap-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={handleEditSave}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200/50"
                            >
                                Save Updates
                            </button>
                            <button
                                onClick={() => setEditingRecord(null)}
                                className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PatientRecordsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur animate-pulse" />
                    <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
                </div>
            </div>
        }>
            <PatientRecordsPageInner />
        </Suspense>
    );
}

// Helper component to handle local filtering logic
function FilteredTimeline({
    data,
    fromDate,
    toDate,
    onDownload,
    onDelete,
    onEdit,
    onSubmit,
    onView
}: {
    data: GroupedMedicalRecordsDTO;
    fromDate: string;
    toDate: string;
    onDownload: any;
    onDelete: any;
    onEdit: (record: MedicalRecordResponseDTO) => void;
    onSubmit: (record: MedicalRecordResponseDTO) => void;
    onView: (record: MedicalRecordResponseDTO, url: string) => void;
}) {
    const filteredSections = React.useMemo(() => {
        if (!fromDate && !toDate) return data.sections;

        const start = fromDate ? new Date(fromDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = toDate ? new Date(toDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return data.sections.map((section: RecordSectionDTO) => {
            const filteredRecords = section.records.filter((record: MedicalRecordResponseDTO) => {
                const recordDate = new Date(normalizeUTC(record.uploadedAt));
                if (start && recordDate < start) return false;
                if (end && recordDate > end) return false;
                return true;
            });

            return {
                ...section,
                records: filteredRecords,
                recordCount: filteredRecords.length
            };
        }).filter((section: RecordSectionDTO) => section.records.length > 0);
    }, [data, fromDate, toDate]);

    if (filteredSections.length === 0 && (fromDate || toDate)) {
        return (
            <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No records found for this date range.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 text-xs font-black text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 pb-0.5"
                >
                    Show All Records
                </button>
            </div>
        );
    }

    const { attentionRequired, mainTimeline } = React.useMemo(() => {
        const allRecords: MedicalRecordResponseDTO[] = filteredSections.flatMap(s => s.records);

        // Draft (0) or Pending (1) go to attention required
        const urgent = allRecords.filter(r => r.state === 0 || r.state === 1);

        // Certified (2), Emergency (3), Archived (4) go to main timeline
        // But for elderly friendliness, we still show EVERYTHING in the timeline, 
        // we JUST highlight the urgent ones at the top too.

        return {
            attentionRequired: urgent,
            mainTimeline: filteredSections
        };
    }, [filteredSections]);

    return (
        <div className="space-y-12">
            {/* Urgent Section */}
            {attentionRequired.length > 0 && !fromDate && !toDate && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-2">
                        <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
                            <Bell className="w-5 h-5 text-white animate-bounce" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Awaiting Action</h2>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Found {attentionRequired.length} items requiring review</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attentionRequired.map(record => (
                            <RecordCard
                                key={`urgent-${record.id}`}
                                record={record}
                                onDownload={onDownload}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onSubmit={onSubmit}
                                onView={onView}
                            />
                        ))}
                    </div>

                    <div className="border-b-4 border-dashed border-slate-100 dark:border-slate-800 my-8" />
                </div>
            )}

            <RecordsTimeline
                data={{ totalCount: data.totalCount, sections: mainTimeline }}
                onDownload={onDownload}
                onDelete={onDelete}
                onEdit={onEdit}
                onSubmit={onSubmit}
                onView={onView}
            />
        </div>
    );
}
