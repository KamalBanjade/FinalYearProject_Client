'use client';

import React from 'react';
import {
    FileText,
    Download,
    Trash2,
    AlertCircle,
    CheckCircle,
    Clock,
    FileImage,
    ChevronRight,
    Search,
    Edit2,
    Loader2,
    SendHorizontal
} from 'lucide-react';
import { MedicalRecordResponseDTO, medicalRecordsApi } from '@/lib/api/medicalRecords';
import { RecordVerificationBadge } from './RecordVerificationBadge';
import { getRelativeTimeString, formatDate } from '@/lib/utils/dateUtils';

interface RecordCardProps {
    record: MedicalRecordResponseDTO;
    onDownload: (id: string, fileName: string) => void;
    onDelete: (id: string) => void;
    onEdit: (record: MedicalRecordResponseDTO) => void;
    onSubmit?: (record: MedicalRecordResponseDTO) => void;
    onView?: (record: MedicalRecordResponseDTO, url: string) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({
    record,
    onDownload,
    onDelete,
    onEdit,
    onSubmit,
    onView
}) => {
    const [viewLoading, setViewLoading] = React.useState(false);
    const isPdf = record.mimeType.toLowerCase().includes('pdf');
    const isImage = record.mimeType.toLowerCase().includes('image');

    const handleViewClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onView) return;

        setViewLoading(true);
        try {
            const url = await medicalRecordsApi.previewRecord(record.id);
            if (url) onView(record, url);
        } catch (error) {
            // Handled by API
        } finally {
            setViewLoading(false);
        }
    };

    const getStatusConfig = (state: number) => {
        switch (state) {
            case 0: // Draft (or Rejected)
                return {
                    label: record.rejectionReason ? '⚠️ Action Required' : '📝 Draft',
                    colorClass: record.rejectionReason
                        ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
                    icon: record.rejectionReason ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />
                };
            case 1: // Pending
                return {
                    label: '⏳ Awaiting Review',
                    colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300',
                    icon: <Clock className="w-5 h-5" />
                };
            case 2: // Certified
                return {
                    label: '✅ Certified Authentic',
                    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
                    icon: <CheckCircle className="w-5 h-5" />
                };
            case 4: // Archived
                return {
                    label: '📁 Archived',
                    colorClass: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-500',
                    icon: <Clock className="w-5 h-5" />
                };
            default:
                return {
                    label: record.stateLabel,
                    colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: <Clock className="w-5 h-5" />
                };
        }
    };

    const status = getStatusConfig(record.state);

    return (
        <div className={`
            relative group overflow-hidden
            bg-white dark:bg-slate-900 
            rounded-2xl border transition-all duration-300
            hover:shadow-md hover:translate-y-[-2px]
            ${record.rejectionReason ? 'border-rose-200 dark:border-rose-900/50' : 'border-slate-100 dark:border-slate-800'}
            p-4
        `}>
            {/* Status Header */}
            <div className="flex justify-between items-start mb-4">
                <div className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm
                    ${status.colorClass}
                `}>
                    <span className="w-3.5 h-3.5 flex items-center justify-center">
                        {status.icon}
                    </span>
                    {status.label}
                </div>

                {record.state === 2 && (
                    <RecordVerificationBadge recordId={record.id} isCertified={true} />
                )}
            </div>

            {/* Main Content Area */}
            <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={handleViewClick}
            >
                <div className={`
                    w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0
                    shadow-sm border border-black/5 dark:border-white/5
                    ${isPdf ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                        isImage ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' :
                            'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20'}
                `}>
                    {isPdf ? <FileText className="w-6 h-6 md:w-7 md:h-7" /> :
                        isImage ? <FileImage className="w-6 h-6 md:w-7 md:h-7" /> :
                            <FileText className="w-6 h-6 md:w-7 md:h-7" />}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                            {record.recordType}
                        </span>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                            • {getRelativeTimeString(record.uploadedAt)}
                        </span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white truncate leading-snug">
                        {record.originalFileName}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                        Uploaded on {formatDate(record.uploadedAt)}
                    </p>
                </div>

                <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>

            {/* Subtler Doctor Info */}
            {(record.isCertified || record.assignedDoctorName) && (
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {record.isCertified ? 'Certified by' : 'Assigned to'} <span className="text-slate-700 dark:text-slate-200">Dr. {record.certifiedBy || record.assignedDoctorName}</span>
                        {record.assignedDepartment && (
                            <span className="opacity-60 ml-1">({record.assignedDepartment})</span>
                        )}
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                <button
                    onClick={handleViewClick}
                    disabled={viewLoading}
                    aria-busy={viewLoading}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                    {viewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    {viewLoading ? 'Viewing...' : 'View'}
                </button>

                {record.canDownload && (
                    <button
                        onClick={() => onDownload(record.id, record.originalFileName)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download
                    </button>
                )}

                {(record.state === 0 || record.state === 1) && (
                    <button
                        onClick={() => onEdit(record)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                    </button>
                )}

                {record.state === 0 && onSubmit && (
                    <button
                        onClick={() => onSubmit(record)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <SendHorizontal className="w-3.5 h-3.5" />
                        Submit
                    </button>
                )}

                {record.state !== 4 && (
                    <button
                        onClick={() => onDelete(record.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </button>
                )}
            </div>

            {/* Rejection Message if applicable */}
            {record.rejectionReason && (
                <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <p className="text-[10px] font-black text-rose-800 dark:text-rose-300 uppercase leading-none mb-1">Feedback:</p>
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400 italic">
                        "{record.rejectionReason}"
                    </p>
                </div>
            )}
        </div>
    );
};
