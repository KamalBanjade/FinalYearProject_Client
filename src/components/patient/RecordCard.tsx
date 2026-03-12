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
import { Card } from '@/components/ui/Card';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { Text, H3 } from '@/components/ui/Typography';

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
                    colorClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300',
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
        <Card 
            className={`
                relative group overflow-hidden transition-all duration-300
                hover:shadow-md hover:translate-y-[-2px]
                ${record.rejectionReason ? 'border-rose-200 dark:border-rose-900/50' : ''}
            `}
        >
            {/* Status Header */}
            <Stack direction="row" justify="between" align="start" className="mb-4">
                <Stack direction="row" align="center" spacing="xs" className={`
                    px-3 py-1 rounded-full text-xs font-bold border shadow-sm
                    ${status.colorClass}
                `}>
                    <span className="w-3.5 h-3.5 flex items-center justify-center">
                        {status.icon}
                    </span>
                    {status.label}
                </Stack>

                {record.state === 2 && (
                    <RecordVerificationBadge recordId={record.id} isCertified={true} />
                )}
            </Stack>

            {/* Main Content Area */}
            <Stack
                direction="row"
                align="center"
                spacing="sm"
                className="cursor-pointer group/content"
                onClick={handleViewClick as any}
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

                <Stack direction="col" spacing="xs" className="min-w-0 flex-1">
                    <Stack direction="row" align="center" spacing="xs" className="mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                            {record.recordType}
                        </span>
                        <Text variant="label" className="text-indigo-600 dark:text-indigo-400">
                            • {getRelativeTimeString(record.uploadedAt)}
                        </Text>
                    </Stack>
                    <H3 className="truncate leading-snug">
                        {record.originalFileName}
                    </H3>
                    <Text variant="muted" className="mt-1">
                        Uploaded on {formatDate(record.uploadedAt)}
                    </Text>
                </Stack>

                <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover/content:bg-indigo-600 group-hover/content:text-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                </div>
            </Stack>

            {/* Subtler Doctor Info */}
            {(record.isCertified || record.assignedDoctorName) && (
                <Stack direction="row" align="center" spacing="xs" className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <Text variant="label">
                        {record.isCertified ? 'Certified by' : 'Assigned to'} <span className="text-slate-700 dark:text-slate-200">Dr. {record.certifiedBy || record.assignedDoctorName}</span>
                        {record.assignedDepartment && (
                            <span className="opacity-60 ml-1">({record.assignedDepartment})</span>
                        )}
                    </Text>
                </Stack>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                <Button
                    variant="action"
                    size="compact"
                    onClick={handleViewClick as any}
                    disabled={viewLoading}
                    aria-busy={viewLoading}
                >
                    {viewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    {viewLoading ? 'Viewing...' : 'View'}
                </Button>

                {record.canDownload && (
                    <Button
                        variant="action"
                        size="compact"
                        onClick={() => onDownload(record.id, record.originalFileName)}
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download
                    </Button>
                )}

                {(record.state === 0 || record.state === 1) && (
                    <Button
                        variant="action"
                        size="compact"
                        onClick={() => onEdit(record)}
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                    </Button>
                )}

                {record.state === 0 && onSubmit && (
                    <Button
                        variant="primary"
                        size="compact"
                        onClick={() => onSubmit(record)}
                        className="gap-1.5"
                    >
                        <SendHorizontal className="w-3.5 h-3.5" />
                        Submit
                    </Button>
                )}

                {record.state !== 4 && (
                    <Button
                        variant="ghost"
                        size="compact"
                        onClick={() => onDelete(record.id)}
                        className="bg-slate-50 text-slate-600 border border-slate-100 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-700 font-bold gap-1.5 justify-center"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </Button>
                )}
            </div>

            {/* Rejection Message if applicable */}
            {record.rejectionReason && (
                <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <Text variant="label" className="text-rose-800 dark:text-rose-300 mb-1">Feedback:</Text>
                    <Text variant="muted" className="text-rose-700 dark:text-rose-400 italic">
                        "{record.rejectionReason}"
                    </Text>
                </div>
            )}
        </Card>
    );
};
