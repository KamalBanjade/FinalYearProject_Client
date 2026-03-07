'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { useConfirm } from '@/context/ConfirmContext';

interface TrustedDevice {
    deviceToken: string;
    deviceName: string;
    ipAddress: string;
    createdAt: string;
    expiresAt: string;
    lastUsedAt?: string;
    daysUntilExpiry: number;
    isCurrentDevice: boolean;
}

export default function SecuritySettingsPage() {
    const { confirm } = useConfirm();
    const { user, getUserDevices, revokeDevice, revokeAllDevices } = useAuthStore();
    const [devices, setDevices] = useState<TrustedDevice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRevoking, setIsRevoking] = useState<string | null>(null);
    const [isRevokingAll, setIsRevokingAll] = useState(false);

    const loadDevices = async () => {
        try {
            setIsLoading(true);
            const userDevices = await getUserDevices();
            setDevices(userDevices);
        } catch (error) {
            toast.error('Failed to load trusted devices');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDevices();
    }, []);

    const handleRevokeDevice = async (deviceId: string) => {
        try {
            setIsRevoking(deviceId);
            await revokeDevice(deviceId);
            toast.success('Device revoked successfully');
            await loadDevices(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || 'Failed to revoke device');
        } finally {
            setIsRevoking(null);
        }
    };

    const handleRevokeAll = async () => {
        const confirmed = await confirm({
            title: 'Revoke All Devices',
            message: 'Are you sure you want to revoke all trusted devices? You will need to enter your authenticator code on all devices next time you login. This action cannot be undone.',
            confirmText: 'Revoke All',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            setIsRevokingAll(true);
            await revokeAllDevices();
            toast.success('All devices revoked successfully');
            await loadDevices(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || 'Failed to revoke all devices');
        } finally {
            setIsRevokingAll(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Security Settings</h1>
                <p className="text-slate-500 mt-1">Manage your account security and device preferences.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            Two-Factor Authentication
                            {user?.twoFactorEnabled ? (
                                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Enabled
                                </span>
                            ) : (
                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                    Disabled
                                </span>
                            )}
                        </h2>
                        <p className="text-slate-500 mt-1 text-sm">Add an extra layer of security to your account.</p>
                    </div>
                    <div className="flex gap-3">
                        {user?.twoFactorEnabled && (
                            <Button variant="outline" className="text-sm h-9">
                                View Backup Codes
                            </Button>
                        )}
                        <Button variant={user?.twoFactorEnabled ? "danger" : "primary"} className="text-sm h-9">
                            {user?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">Trusted Devices</h2>
                    <p className="text-slate-500 mt-1 text-sm">Devices that can login without entering a code for 30 days.</p>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-slate-500 font-medium">No trusted devices found</p>
                            <p className="text-slate-400 text-sm mt-1">When you select "Remember this device" on login, it will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {devices.map((device) => (
                                <div key={device.deviceToken} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-primary/20 hover:bg-white transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm mt-1">
                                            {device.deviceName.toLowerCase().includes('phone') || device.deviceName.toLowerCase().includes('mobile') ? (
                                                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-800">{device.deviceName || 'Unknown Device'}</h3>
                                                {device.isCurrentDevice && (
                                                    <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">This device</span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                    </svg>
                                                    IP: {device.ipAddress}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Trusted: {format(new Date(device.createdAt), 'MMM d, yyyy')}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Last used: {device.lastUsedAt ? formatDistanceToNow(new Date(device.lastUsedAt), { addSuffix: true }) : 'Never'}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Expires in: {differenceInDays(new Date(device.expiresAt), new Date())} days
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-slate-200 sm:border-0 pl-14 sm:pl-0 sm:ml-4">
                                        <Button
                                            variant="danger"
                                            className="w-full sm:w-auto text-sm"
                                            onClick={() => handleRevokeDevice(device.deviceToken)}
                                            isLoading={isRevoking === device.deviceToken}
                                            disabled={isRevoking !== null}
                                        >
                                            Revoke Device
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {devices.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                                    <Button
                                        variant="outline"
                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 hover:border-rose-300"
                                        onClick={handleRevokeAll}
                                        isLoading={isRevokingAll}
                                        disabled={isRevoking !== null || isRevokingAll}
                                    >
                                        Revoke All Devices
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
