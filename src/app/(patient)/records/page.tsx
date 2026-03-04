'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { medicalRecordsApi, MedicalRecordResponseDTO, UpdateMedicalRecordMetadataDTO } from '@/lib/api/medicalRecords';
import { RecordVerificationBadge } from '@/components/patient/RecordVerificationBadge';
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
    UploadCloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useConfirm } from '@/context/ConfirmContext';

function PatientRecordsPageInner() {
    const [records, setRecords] = useState<MedicalRecordResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<MedicalRecordResponseDTO | null>(null);
    const { confirm } = useConfirm();

    // Edit State
    const [editDesc, setEditDesc] = useState('');
    const [editRecordType, setEditRecordType] = useState('');

    const fetchRecords = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await medicalRecordsApi.getMyRecords();
            if (response && response.data) {
                setRecords(Array.isArray(response.data) ? response.data : []);
            }
        } catch (err: any) {
            setError('Failed to fetch medical records');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

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
            setRecords(records.filter(r => r.id !== id));
            toast.success('Record deleted successfully.');
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

            // Update local state
            setRecords(records.map(r => r.id === editingRecord.id ? { ...r, description: editDesc, recordType: editRecordType } : r));
            setEditingRecord(null);
            toast.success('Record details updated.');
        } catch (err) {
            toast.error('Failed to update record details');
        }
    };

    const handleSubmitForReview = async (record: MedicalRecordResponseDTO) => {
        try {
            await medicalRecordsApi.submitForReview(record.id);
            toast.success(`"${record.originalFileName}" submitted for review.`);
            setRecords(records.map(r => r.id === record.id ? { ...r, state: 1, stateLabel: 'Awaiting Review' } : r));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to submit record.');
        }
    };

    const handleArchive = async (record: MedicalRecordResponseDTO) => {
        const confirmed = await confirm({
            title: 'Archive Record',
            message: `Archive "${record.originalFileName}"? It will become read-only.`,
            confirmText: 'Archive',
            type: 'warning'
        });
        if (!confirmed) return;
        try {
            await medicalRecordsApi.archiveRecord(record.id);
            toast.success(`"${record.originalFileName}" archived.`);
            setRecords(records.map(r => r.id === record.id ? { ...r, state: 4, stateLabel: 'Archived' } : r));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to archive record.');
        }
    };

    const StateBadge = ({ record }: { record: MedicalRecordResponseDTO }) => {
        const configs: Record<number, { label: string; cls: string }> = {
            0: { label: record.stateLabel || 'Draft', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
            1: { label: record.stateLabel || 'Awaiting Review', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500' },
            2: { label: record.stateLabel || 'Certified', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
            3: { label: record.stateLabel || 'Emergency', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
            4: { label: record.stateLabel || 'Archived', cls: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-500' },
        };
        const cfg = configs[record.state] ?? configs[0];

        return (
            <div className="flex flex-col gap-1.5 items-start">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm border border-black/5 dark:border-white/5 ${cfg.cls}`}>
                    {record.state === 2 && <CheckCircle className="w-3.5 h-3.5" />}
                    {cfg.label}
                </span>

                {record.state === 2 && (
                    <RecordVerificationBadge
                        recordId={record.id}
                        isCertified={record.isCertified}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white/40 dark:bg-white/5 p-6 md:p-8 rounded-2xl shadow-sm border border-white/10 dark:border-white/5 backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Medical Records
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage, upload, and securely manage your medical history.</p>
                </div>

                {/* Navigation Actions */}
                <div className="flex p-1.5 bg-gray-100/80 dark:bg-slate-800 rounded-xl max-w-sm w-full lg:w-auto shadow-inner border border-gray-200/50 dark:border-slate-700">
                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 border border-slate-200 dark:border-slate-700">
                        <FileText className="w-4 h-4" />
                        My Records
                    </div>
                    <Link
                        href="/records/upload"
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-700 transition-all duration-200"
                    >
                        <UploadCloud className="w-4 h-4" />
                        Upload New
                    </Link>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center space-x-2 text-sm border border-red-100 dark:border-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white/40 dark:bg-white/5 rounded-2xl border border-white/10 dark:border-white/5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 backdrop-blur-sm">
                {loading ? (
                    <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur animate-pulse" />
                            <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
                        </div>
                        <p className="mt-4 font-medium text-gray-500 dark:text-slate-400 tracking-wide">Decrypting secure index...</p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-100/50 dark:border-indigo-800/50">
                            <FileText className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No records found</h3>
                        <p className="mt-2 text-gray-500 dark:text-slate-400 max-w-sm mx-auto text-balance">
                            You haven't uploaded any medical records yet. Your secure vault is empty.
                        </p>
                        <Link
                            href="/records/upload"
                            className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
                        >
                            <UploadCloud className="w-4 h-4" />
                            Upload your first record
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50/80 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
                                    <th className="p-5">File & Details</th>
                                    <th className="p-5">Status & Verification</th>
                                    <th className="p-5">Type</th>
                                    <th className="p-5">Size</th>
                                    <th className="p-5">Date</th>
                                    <th className="p-5 text-right w-[160px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {records.map((record) => (
                                    <React.Fragment key={record.id}>
                                        <tr className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="p-5">
                                                <div className="flex items-start space-x-4">
                                                    <div className={`p-3 rounded-xl shadow-sm border border-black/5 dark:border-white/5 mt-0.5
                                                            ${record.mimeType.includes('pdf') ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                                            record.mimeType.includes('image') ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                                                'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'}`
                                                    }>
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 dark:text-white text-sm md:max-w-xs xl:max-w-md truncate" title={record.originalFileName}>
                                                            {record.originalFileName}
                                                        </p>
                                                        {record.description && (
                                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-1 max-w-[200px] xl:max-w-xs" title={record.description}>{record.description}</p>
                                                        )}
                                                        <div className="mt-2.5">
                                                            {record.isCertified && record.certifiedBy ? (
                                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-800">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    <span>Dr. {record.certifiedBy}</span>
                                                                </div>
                                                            ) : record.assignedDoctorName ? (
                                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                                                    <span>Dr. {record.assignedDoctorName}</span>
                                                                    <span className="text-indigo-400 opacity-80 pl-1 border-l border-indigo-200 dark:border-indigo-800">
                                                                        {record.assignedDepartment}
                                                                    </span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <StateBadge record={record} />
                                            </td>
                                            <td className="p-5">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 shadow-sm">
                                                    {record.recordType || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-sm font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                                {record.fileSizeFormatted}
                                            </td>
                                            <td className="p-5 text-sm font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                                {new Date(record.uploadedAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-5 text-right whitespace-nowrap align-middle">
                                                <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    {/* FSM: Submit for Review (Draft only) */}
                                                    {record.state === 0 && (
                                                        <button
                                                            onClick={() => handleSubmitForReview(record)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800 rounded-lg transition-all shadow-sm"
                                                            title="Submit for Doctor Review"
                                                        >
                                                            <SendHorizontal className="w-3.5 h-3.5" />
                                                            Submit
                                                        </button>
                                                    )}
                                                    {/* FSM: Archive (Certified only) */}
                                                    {record.state === 2 && (
                                                        <button
                                                            onClick={() => handleArchive(record)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm"
                                                            title="Archive this certified record"
                                                        >
                                                            <Archive className="w-3.5 h-3.5" />
                                                            Archive
                                                        </button>
                                                    )}
                                                    {record.canDownload !== false && (
                                                        <button
                                                            onClick={() => handleDownload(record.id, record.originalFileName)}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                            title="Download Original File"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {/* Only allow edit on Draft/Pending */}
                                                    {(record.state === 0 || record.state === 1) && (
                                                        <button
                                                            onClick={() => handleEditOpen(record)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="Edit Record Details"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {record.state !== 4 && (
                                                        <button
                                                            onClick={() => handleDelete(record.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Rejection reason banner */}
                                        {record.state === 0 && record.rejectionReason && (
                                            <tr className="bg-rose-50/80 dark:bg-rose-900/10 border-t border-rose-100/50 dark:border-rose-900/50">
                                                <td colSpan={6} className="px-5 py-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400 shrink-0">
                                                            <AlertCircle className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Review Failed</p>
                                                            <p className="text-xs text-rose-700 dark:text-rose-400 font-medium mt-0.5 max-w-2xl text-balance">
                                                                Doctor Notes: "{record.rejectionReason}"<br />
                                                                <span className="opacity-80">Please upload a corrected file or update the details and resubmit.</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100/50 dark:border-slate-800 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100/80 dark:border-slate-800">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Edit Record Metadata</h3>
                                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5">Update details for {editingRecord.originalFileName}</p>
                            </div>
                            <button
                                onClick={() => setEditingRecord(null)}
                                className="text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Record Type</label>
                                <select
                                    value={editRecordType}
                                    onChange={(e) => setEditRecordType(e.target.value)}
                                    className="w-full rounded-xl border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors shadow-sm appearance-none cursor-pointer"
                                    required
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
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Description</label>
                                <textarea
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="w-full rounded-xl border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors shadow-sm h-32 resize-none"
                                    placeholder="Add clinical details..."
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-100/80 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end p-5 space-x-3">
                            <button
                                onClick={() => setEditingRecord(null)}
                                className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors focus:ring-2 focus:ring-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSave}
                                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all active:scale-[0.98]"
                            >
                                Save Changes
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
