'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { medicalRecordsApi, MedicalRecordResponseDTO } from '@/lib/api/medicalRecords';
import toast from 'react-hot-toast';
import { FullScreenRecordModal } from '@/components/ui/FullScreenRecordModal';

interface DoctorReviewModalProps {
    record: MedicalRecordResponseDTO;
    onClose: () => void;
    onSuccess: (updatedRecord: MedicalRecordResponseDTO) => void;
}

export const DoctorReviewModal = ({ record, onClose, onSuccess }: DoctorReviewModalProps) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [action, setAction] = useState<'certify' | 'reject' | null>(null);

    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handlePreview = async () => {
        setPreviewLoading(true);
        try {
            const url = await medicalRecordsApi.previewRecordForDoctor(record.id);
            if (url) setPreviewUrl(url);
        } catch (err) {
            // Toast is handled in API
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleCertify = async () => {
        setLoading(true);
        try {
            const response = await medicalRecordsApi.certifyRecord(record.id, notes);
            toast.success('Record certified successfully');
            onSuccess(response.data);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to certify record');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!notes.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }
        setLoading(true);
        try {
            const response = await medicalRecordsApi.rejectRecord(record.id, notes);
            toast.success('Record rejected and returned to patient');
            onSuccess(response.data);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reject record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md transition-all duration-300">
            <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/50 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="relative overflow-hidden bg-slate-900 px-8 py-10 text-white">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <FileText className="w-32 h-32 rotate-12" />
                    </div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span>Clinical Review Protocol</span>
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight">Verify Record</h3>
                            <p className="text-slate-400 text-sm mt-1 max-w-[240px]">Ensuring data integrity and medical authenticity.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl backdrop-blur-md transition-all group"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 bg-white">
                    {/* Record Info Card */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[32px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                        <div className="relative bg-slate-50 rounded-[32px] p-6 border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider shadow-sm">
                                    Patient: {record.patientName || 'Anonymous'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">UUID: {record.id.split('-')[0]}</span>
                            </div>

                            <h4 className="text-xl font-bold text-slate-900 mb-1">{record.originalFileName}</h4>
                            <p className="text-sm text-slate-500 mb-6 line-clamp-2 italic">
                                {record.description || 'No clinical description provided by patient.'}
                            </p>

                            <button
                                onClick={handlePreview}
                                disabled={previewLoading}
                                className="w-full flex items-center justify-center space-x-3 py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 hover:shadow-indigo-500/30 disabled:opacity-50"
                            >
                                {previewLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FileText className="w-4 h-4" />
                                )}
                                <span>{previewLoading ? 'Decrypting Secure Vault...' : 'Review Document (Secure Preview)'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Selection */}
                    <div className="space-y-4">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-2">
                            {action === 'reject' ? 'Rejection Protocol' : 'Clinical Summary & Decision'}
                            {action === 'reject' && <span className="text-rose-500 ml-1">*</span>}
                        </label>

                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full rounded-[24px] border-slate-200 px-6 py-5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 min-h-[140px] transition-all shadow-inner bg-slate-50/50 placeholder:text-slate-400"
                            placeholder={action === 'reject' ? "Please detail the reason for rejection..." : "Add clinical remarks, validation notes, or relevant observations..."}
                        />
                    </div>

                    {!action ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setAction('reject')}
                                className="flex flex-col items-center justify-center p-6 rounded-[32px] border-2 border-slate-100 hover:border-rose-100 hover:bg-rose-50/30 text-slate-500 hover:text-rose-600 transition-all group"
                            >
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-rose-100 transition-colors">
                                    <AlertCircle className="w-6 h-6 opacity-40 group-hover:opacity-100" />
                                </div>
                                <span className="font-bold text-xs uppercase tracking-widest">Reject</span>
                            </button>
                            <button
                                onClick={() => setAction('certify')}
                                className="flex flex-col items-center justify-center p-6 rounded-[32px] border-2 border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 text-slate-500 hover:text-emerald-600 transition-all group"
                            >
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                                    <CheckCircle className="w-6 h-6 opacity-40 group-hover:opacity-100" />
                                </div>
                                <span className="font-bold text-xs uppercase tracking-widest">Certify</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setAction(null)}
                                className="px-8 py-4 text-xs font-bold text-slate-500 rounded-2xl hover:bg-slate-100 transition-colors"
                            >
                                Back
                            </button>
                            {action === 'certify' ? (
                                <button
                                    onClick={handleCertify}
                                    disabled={loading}
                                    className="flex-1 bg-emerald-600 text-white rounded-2xl h-14 text-sm font-bold shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center space-x-3"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /><span>Confirm Certification</span></>}
                                </button>
                            ) : (
                                <button
                                    onClick={handleReject}
                                    disabled={loading}
                                    className="flex-1 bg-rose-600 text-white rounded-2xl h-14 text-sm font-bold shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center space-x-3"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><AlertCircle className="w-5 h-5" /><span>Confirm Rejection</span></>}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 flex items-center justify-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        Secure Encryption Link Active
                    </p>
                </div>
            </div>

            {/* Render immersive preview if loaded */}
            {previewUrl && (
                <FullScreenRecordModal
                    pdfUrl={previewUrl}
                    onClose={() => setPreviewUrl(null)}
                />
            )}
        </div>
    );
};
