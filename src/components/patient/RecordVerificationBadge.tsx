'use client';

import React, { useState } from 'react';
import {
    ShieldCheck,
    ShieldAlert,
    ShieldQuestion,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Info,
    Calendar,
    User,
    X
} from 'lucide-react';
import { medicalRecordsApi } from '@/lib/api/medicalRecords';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface VerificationResult {
    isValid: boolean;
    message: string;
    isCertified: boolean;
    certifiedBy: string;
    certifiedAt: string;
    recordHash: string;
    signature: string;
    hashMatchesCurrentFile: boolean;
    integrityStatus: string;
}

interface RecordVerificationBadgeProps {
    recordId: string;
    isCertified: boolean;
    onVerificationComplete?: (isValid: boolean) => void;
}

export const RecordVerificationBadge: React.FC<RecordVerificationBadgeProps> = ({
    recordId,
    isCertified,
    onVerificationComplete
}) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const handleVerify = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        try {
            const response = await medicalRecordsApi.verifySignature(recordId);
            const data = response.data;
            setResult(data);
            setShowDetails(true);

            if (data.isValid) {
                toast.success('Record verified authentic!');
            } else if (data.integrityStatus === 'File Tampered') {
                toast.error('TAMPERING DETECTED: File content changed!', { duration: 6000 });
            } else {
                toast.error('Verification failed: Invalid signature.');
            }

            if (onVerificationComplete) {
                onVerificationComplete(data.isValid);
            }
        } catch (error) {
            console.error('Verification failed:', error);
            toast.error('Verification service unavailable.');
        } finally {
            setLoading(false);
        }
    };

    if (!isCertified) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-tight">
                <ShieldQuestion size={12} />
                Uncertified
            </span>
        );
    }

    return (
        <div className="relative inline-block">
            <button
                onClick={handleVerify}
                disabled={loading}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border shadow-sm
                    ${result
                        ? (result.isValid
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50 animate-pulse')
                        : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                    }`}
            >
                {loading ? <RefreshCw size={14} className="animate-spin" /> :
                    result ? (result.isValid ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />) :
                        <ShieldCheck size={14} />}

                {loading ? 'Verifying...' : result ? (result.isValid ? 'Verified' : 'Tampered!') : 'Verify Integrity'}
            </button>

            {showDetails && result && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowDetails(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <div className={`p-6 ${result.isValid ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-2xl ${result.isValid ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm'}`}>
                                    {result.isValid ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
                                </div>
                                <button onClick={() => setShowDetails(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <h3 className={`text-2xl font-bold mt-4 ${result.isValid ? 'text-emerald-900 dark:text-emerald-50' : 'text-red-900 dark:text-red-50'}`}>
                                {result.isValid ? 'Authenticity Confirmed' : 'Security Warning'}
                            </h3>
                            <p className={`text-sm mt-1 font-medium ${result.isValid ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                {result.message}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                        <User size={10} /> Certified By
                                    </label>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{result.certifiedBy || 'Unknown Doctor'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                        <Calendar size={10} /> Timestamp
                                    </label>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {result.certifiedAt ? new Date(result.certifiedAt).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Verification Checklist</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600 dark:text-slate-400">Digital Signature Validity</span>
                                            {result.integrityStatus !== 'Invalid Signature' ?
                                                <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" /> :
                                                <XCircle size={16} className="text-red-500 dark:text-red-400" />}
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600 dark:text-slate-400">File Content Integrity (Hash Match)</span>
                                            {result.hashMatchesCurrentFile ?
                                                <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" /> :
                                                <XCircle size={16} className="text-red-500 dark:text-red-400" />}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-3">
                                    <label className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                                        <Info size={10} /> Cryptographic Proof
                                    </label>
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-indigo-900 dark:text-indigo-300 font-mono break-all opacity-70">
                                            HASH: {result.recordHash || 'N/A'}
                                        </p>
                                        <p className="text-[9px] text-indigo-900 dark:text-indigo-300 font-mono break-all opacity-70">
                                            SIG: {result.signature ? `${result.signature.substring(0, 64)}...` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className={`w-full ${result.isValid ? 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600' : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700'} text-white border-none py-6 rounded-xl font-bold`}
                                onClick={() => setShowDetails(false)}
                            >
                                Understood
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
