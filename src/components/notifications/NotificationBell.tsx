'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    BellIcon, 
    CheckCircleIcon, 
    ExclamationCircleIcon,
    CalendarIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { notificationConnectionManager } from '@/lib/signalr/notificationConnection';
import axiosInstance from '@/lib/utils/axios';
import { StabilityAlertDto } from '@/types/analysis';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';

export const NotificationBell = () => {
    const [alerts, setAlerts] = useState<StabilityAlertDto[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [alertsRes, countRes] = await Promise.all([
                    axiosInstance.get('/alerts/unread'),
                    axiosInstance.get('/alerts/unread/count')
                ]);
                setAlerts(alertsRes.data);
                setUnreadCount(countRes.data.count);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchInitialData();

        // Setup SignalR
        let connection: any;
        const setupSignalR = async () => {
            try {
                connection = await notificationConnectionManager.connect();
                connection.on('ReceiveStabilityAlert', (alert: StabilityAlertDto) => {
                    setAlerts(prev => [alert, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    toast.error(`Stability Alert: ${alert.patientName}'s score dropped to ${alert.stabilityScore} (${alert.scoreInterpretation})`, {
                        duration: 6000,
                        position: 'top-right'
                    });
                });
            } catch (err) {
                console.error('SignalR setup failed:', err);
            }
        };

        setupSignalR();

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            if (connection) {
                connection.off('ReceiveStabilityAlert');
                // We don't disconnect globally as it might be used elsewhere or in re-mounts
            }
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const markAsRead = async (alertId: string) => {
        try {
            await axiosInstance.patch(`/alerts/${alertId}/read`);
            setAlerts(prev => prev.filter(a => a.alertId !== alertId));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark alert as read:', error);
        }
    };

    const getScoreColor = (interpretation: string) => {
        switch (interpretation.toLowerCase()) {
            case 'excellent': return 'text-emerald-500';
            case 'good': return 'text-blue-500';
            case 'fair': return 'text-amber-500';
            case 'poor': return 'text-rose-500';
            default: return 'text-slate-500';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-2xl hover:bg-[var(--surface-2)] transition-all duration-200 group"
            >
                <BellIcon className={`w-6 h-6 transition-all duration-300 ${unreadCount > 0 ? 'text-primary animate-ring' : 'text-[var(--muted)] group-hover:text-[var(--foreground)]'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[var(--surface)] shadow-lg animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                    <Card padding="none" className="overflow-hidden shadow-2xl border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
                        <div className="px-5 py-4 border-b border-[var(--border)] bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Text className="font-black uppercase tracking-widest text-xs">Stability Alerts</Text>
                                <Badge variant="secondary" className="px-1.5 py-0.5">{unreadCount}</Badge>
                            </div>
                            <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">Mark all read</button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                            {alerts.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                    <CheckCircleIcon className="w-12 h-12 mb-3" />
                                    <Text variant="label" className="uppercase">All patients are stable</Text>
                                </div>
                            ) : (
                                <div className="divide-y divide-[var(--border)]">
                                    {alerts.map((alert) => (
                                        <div 
                                            key={alert.alertId}
                                            onClick={() => markAsRead(alert.alertId)}
                                            className="px-5 py-4 hover:bg-[var(--surface-2)] transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                    <ExclamationCircleIcon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Text className="font-bold text-sm truncate pr-2">{alert.patientName}</Text>
                                                        <Text className="text-[10px] font-bold opacity-40 whitespace-nowrap">
                                                            {format(new Date(alert.triggeredAt), 'MMM dd, HH:mm')}
                                                        </Text>
                                                    </div>
                                                    <p className="text-xs text-[var(--foreground)] leading-relaxed mb-2">
                                                        Stability score dropped to <span className={`font-black ${getScoreColor(alert.scoreInterpretation)}`}>{alert.stabilityScore}</span> ({alert.scoreInterpretation}) in {alert.quarter}.
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 opacity-50">
                                                            <CalendarIcon className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase">{alert.quarter}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-50">
                                                            <UserIcon className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase">Assigned Dr</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]/50 text-center">
                            <Text variant="label" className="text-[9px] uppercase tracking-widest opacity-40">Automated Health Analysis Engine</Text>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
