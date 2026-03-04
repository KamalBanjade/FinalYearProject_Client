'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
    CheckCircleIcon,
    ClipboardIcon,
    ChevronRightIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import axiosInstance from '@/lib/utils/axios';
import { useConfirm } from '@/context/ConfirmContext';

interface SetupData {
    totpQRData: string;
    totpSecretManual: string;
}

export default function CompleteSetupPage() {
    const { confirm } = useConfirm();
    const router = useRouter();
    const { user, checkAuth } = useAuthStore();
    const [setupData, setSetupData] = useState<SetupData | null>(null);
    const [totpScanned, setTotpScanned] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            await checkAuth();
            if (user?.twoFactorEnabled && (user as any).totpSetupCompleted) {
                router.push('/dashboard');
                return;
            }

            try {
                const response = await axiosInstance.get('auth/setup-data');
                if (response.data.success) {
                    const apiData = response.data.data;
                    const formattedData = {
                        totpQRData: apiData.totpSetupQRData,
                        totpSecretManual: apiData.totpSecretManual
                    };
                    setSetupData(formattedData);
                    setIsLoading(false);
                } else {
                    toast.error('Could not fetch setup data. Please log in again.');
                    router.push('/login');
                }
            } catch (error) {
                toast.error('Setup data not found. Please log in or register again.');
                router.push('/login');
            }
        };

        checkStatus();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleCompleteSetup = async () => {
        if (!totpScanned || verificationCode.length !== 6) {
            toast.error('Please complete all steps and verify your code.');
            return;
        }

        setIsSubmitting(true);
        try {
            await axiosInstance.post('auth/complete-setup', {
                totpCode: verificationCode,
                totpScanned: true,
                medicalQRSaved: true
            });

            await checkAuth(); // Mute the setup banner
            toast.success('Security setup completed!');
            sessionStorage.removeItem('registrationSetupData');
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Verification failed. Please check your code.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !setupData) {
        return (
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Loading setup data...</p>
            </div>
        );
    }

    const canComplete = totpScanned && verificationCode.length === 6;

    return (
        <div className="max-w-3xl mx-auto w-full">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Complete Your Security Setup</h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    Follow this essential step to secure your medical records and enable quick access for your doctors.
                </p>
            </div>

            <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] transition-all group-hover:w-40 group-hover:h-40" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <ShieldCheckIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Security</h2>
                            <p className="text-[11px] font-black text-primary uppercase tracking-widest">Setup Authenticator</p>
                        </div>
                    </div>

                    <p className="text-slate-500 mb-8 leading-relaxed">
                        Use Google Authenticator or Microsoft Authenticator to scan this code. This will be used for all future logins.
                    </p>

                    <div className="bg-slate-50 p-8 rounded-[40px] mb-8 flex justify-center group/qr border-2 border-transparent hover:border-primary/20 transition-all">
                        <QRCodeSVG value={setupData.totpQRData} size={240} level="M" className="transition-transform duration-500 group-hover/qr:scale-105" />
                    </div>

                    <div className="space-y-6">
                        <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Manual Secret Key</p>
                                <code className="text-lg font-mono font-bold text-slate-700 tracking-wider">{setupData.totpSecretManual}</code>
                            </div>
                            <button
                                onClick={() => copyToClipboard(setupData.totpSecretManual)}
                                className="p-3 bg-white text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                                <ClipboardIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Enter 6-digit verification code</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-center text-4xl font-black tracking-[0.5em] focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none"
                                placeholder="000000"
                            />
                        </div>

                        <label className="flex items-center gap-4 p-5 bg-slate-50 rounded-[24px] border border-slate-100 cursor-pointer group/check">
                            <input
                                type="checkbox"
                                checked={totpScanned}
                                onChange={(e) => setTotpScanned(e.target.checked)}
                                className="w-7 h-7 rounded-xl border-2 border-slate-300 text-primary focus:ring-primary/10 transition-all cursor-pointer"
                            />
                            <span className="text-sm font-bold text-slate-600 group-hover/check:text-slate-900 transition-colors">I've successfully added my account</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Complete Button */}
            <div className="mt-12 flex flex-col items-center gap-6">
                <button
                    onClick={handleCompleteSetup}
                    disabled={!canComplete || isSubmitting}
                    className={`w-full max-w-md h-20 rounded-3xl text-xl font-black flex items-center justify-center gap-4 transition-all ${canComplete
                        ? 'bg-primary text-white shadow-xl shadow-primary/25 hover:scale-[1.05] active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed mx-auto'
                        }`}
                >
                    {isSubmitting ? 'Finalizing Setup...' : 'Complete Setup & Dashboard'}
                    <ChevronRightIcon className="w-7 h-7" />
                </button>
                {!canComplete && (
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse text-center">
                        Please verify your security code to proceed
                    </p>
                )}
            </div>

            {/* Skip for now */}
            <div className="text-center mt-8">
                <button
                    onClick={async () => {
                        const confirmed = await confirm({
                            title: 'Skip Security Setup?',
                            message: "Are you sure? You won't be able to share records with doctors until setup is complete.",
                            confirmText: 'Skip Setup',
                            type: 'warning'
                        });
                        if (confirmed) {
                            router.push('/dashboard');
                        }
                    }}
                    className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-4"
                >
                    Skip for now (Security Setup Required)
                </button>
            </div>
        </div>
    );
}
