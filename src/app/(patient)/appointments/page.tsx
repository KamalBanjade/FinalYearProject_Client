'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, AppointmentDTO, CancelAppointmentDTO, RescheduleAppointmentDTO } from '@/lib/api/appointments';
import { 
    Calendar, 
    Clock, 
    User, 
    Stethoscope, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    MoreVertical, 
    ChevronRight, 
    Plus, 
    FileText, 
    RefreshCw,
    AlertTriangle,
    Search,
    Filter,
    ArrowLeft
} from 'lucide-react';
import { format, isAfter, isBefore, addDays, subDays } from 'date-fns';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useConfirm } from '@/context/ConfirmContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate, formatTime, getRelativeTimeString, normalizeUTC, formatLocalTime } from '@/lib/utils/dateUtils';

export default function PatientAppointmentsPage() {
    const queryClient = useQueryClient();
    const { confirm } = useConfirm();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: appointmentsResponse, isLoading, error, refetch } = useQuery({
        queryKey: ['patient-appointments', activeTab],
        queryFn: () => appointmentsApi.getPatientAppointments(true), // Fetch all and filter client-side for better UX in tabs
    });

    const appointments = appointmentsResponse?.data || [];

    // Filter logic
    const now = new Date();
    const thresholdDate = subDays(now, 7);

    const filteredAppointments = appointments.filter((app: AppointmentDTO) => {
        const appDate = new Date(normalizeUTC(app.appointmentDate));
        const matchesSearch = 
            app.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.reasonForVisit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.doctorDepartment.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        if (activeTab === 'upcoming') {
            return isAfter(appDate, thresholdDate) && app.status !== 'Cancelled';
        } else {
            return isBefore(appDate, thresholdDate) || app.status === 'Cancelled' || app.status === 'Completed';
        }
    }).sort((a: AppointmentDTO, b: AppointmentDTO) => {
        const dateA = new Date(normalizeUTC(a.appointmentDate));
        const dateB = new Date(normalizeUTC(b.appointmentDate));
        return activeTab === 'upcoming' 
            ? dateA.getTime() - dateB.getTime() 
            : dateB.getTime() - dateA.getTime();
    });

    const handleCancel = async (id: string) => {
        const confirmed = await confirm({
            title: 'Cancel Appointment',
            message: 'Are you sure you want to cancel this appointment? This action cannot be undone.',
            confirmText: 'Yes, Cancel',
            type: 'danger'
        });

        if (confirmed) {
            try {
                await appointmentsApi.cancelAppointment(id, { cancellationReason: 'Cancelled by patient' });
                toast.success('Appointment cancelled successfully');
                queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
            } catch (err) {
                toast.error('Failed to cancel appointment');
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">My Appointments</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage your healthcare schedule and doctor visits</p>
                </div>
                <Link href="/appointments/new">
                    <Button size="lg" className="shadow-xl shadow-indigo-200 dark:shadow-none group">
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        Book New Appointment
                    </Button>
                </Link>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                            activeTab === 'upcoming' 
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                            activeTab === 'history' 
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        History
                    </button>
                </div>

                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by doctor, reason or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Retrieving schedule...</p>
                </div>
            ) : filteredAppointments.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {filteredAppointments.map((app: AppointmentDTO) => (
                        <AppointmentCard 
                            key={app.id} 
                            appointment={app} 
                            isHistory={activeTab === 'history'}
                            onCancel={() => handleCancel(app.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent dark:from-indigo-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner rotate-3 group-hover:rotate-6 transition-transform duration-500">
                            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {searchTerm ? 'No matches found' : activeTab === 'upcoming' ? 'Your schedule is clear' : 'No past visits'}
                        </h3>
                        
                        <p className="text-slate-400 dark:text-slate-500 mt-3 max-w-sm mx-auto font-medium text-sm leading-relaxed">
                            {searchTerm 
                                ? `We couldn't find any appointments matching "${searchTerm}". Try a different search term.` 
                                : activeTab === 'upcoming' 
                                    ? 'You don\'t have any upcoming healthcare appointments scheduled at the moment.' 
                                    : 'When you complete or cancel appointments, they will be archived here for your records.'}
                        </p>
                        
                        {!searchTerm && activeTab === 'upcoming' && (
                            <Link href="/appointments/new" className="inline-block mt-10">
                                <Button size="lg" className="rounded-2xl px-8 shadow-xl shadow-indigo-100 dark:shadow-none">
                                    Book Your First Appointment
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function AppointmentCard({ appointment, isHistory, onCancel }: { appointment: AppointmentDTO; isHistory: boolean; onCancel: () => void }) {
    const rawDate = appointment.appointmentDate;
    
    return (
        <div className={`group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-500 ${isHistory ? 'opacity-90' : ''}`}>
            {/* Status Ribbon/Badge */}
            <div className={`absolute top-0 right-8 px-4 py-1.5 rounded-b-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                appointment.status === 'Confirmed' ? 'bg-emerald-500 text-white' :
                appointment.status === 'Scheduled' ? 'bg-indigo-500 text-white' :
                appointment.status === 'Cancelled' ? 'bg-rose-500 text-white' :
                appointment.status === 'Completed' ? 'bg-slate-500 text-white' :
                'bg-amber-500 text-white'
            }`}>
                {appointment.status}
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Date Column */}
                <div className="flex flex-row md:flex-col items-center justify-center md:w-32 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 gap-2 md:gap-0">
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                        {formatLocalTime(rawDate, 'MMM')}
                    </span>
                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                        {formatLocalTime(rawDate, 'dd')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                        {formatLocalTime(rawDate, 'yyyy')}
                    </span>
                    <div className="hidden md:block w-8 h-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-full my-3" />
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                        {formatTime(rawDate)}
                    </span>
                </div>

                {/* Info Column */}
                <div className="flex-1 space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <Stethoscope className="w-4 h-4 text-indigo-500" />
                             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{appointment.doctorDepartment}</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                            {appointment.reasonForVisit || 'Regular Checkup'}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                             <User className="w-4 h-4 text-slate-400" />
                             <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Dr. {appointment.doctorName}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                         <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{appointment.duration} Minutes</span>
                         </div>
                         {appointment.linkedRecordsCount > 0 && (
                             <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full">
                                <FileText className="w-3.5 h-3.5" />
                                <span>{appointment.linkedRecordsCount} Records Linked</span>
                             </div>
                         )}
                    </div>

                    {appointment.linkedRecordsCount > 0 && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Discussed Records:</p>
                             <div className="flex flex-wrap gap-2">
                                  {appointment.linkedRecords.map((rec, i) => (
                                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                          <FileText className="w-3 h-3 text-indigo-400" />
                                          <span className="truncate max-w-[150px]">{rec.recordFileName}</span>
                                      </div>
                                  ))}
                             </div>
                        </div>
                    )}
                </div>

                {/* Actions Column */}
                <div className="flex flex-row md:flex-col gap-3 md:w-48 justify-end md:justify-start">
                    {!isHistory ? (
                        <>
                            <Link href={`/appointments/${appointment.id}`} className="flex-1">
                                <Button variant="primary" className="w-full h-12 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none">
                                    View Details
                                </Button>
                            </Link>
                            <div className="flex gap-2 flex-1 md:flex-none">
                                <Link href={`/appointments/${appointment.id}/reschedule`} className="flex-1">
                                    <Button variant="outline" className="w-full h-12 rounded-2xl">
                                        Reschedule
                                    </Button>
                                </Link>
                                <Button 
                                    variant="outline" 
                                    className="h-12 w-12 p-0 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 border-rose-100"
                                    onClick={onCancel}
                                >
                                    <XCircle className="w-5 h-5" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2 flex-1">
                                <Link href={`/appointments/new?doctorId=${appointment.doctorId}&reason=Follow-up from ${formatDate(rawDate)} appointment`}>
                                    <Button variant="primary" className="w-full h-11 rounded-2xl text-[10px] font-black uppercase tracking-tight shadow-md shadow-indigo-100">
                                        Book Follow-up
                                    </Button>
                                </Link>
                                <Link href={`/appointments/${appointment.id}`} className="w-full">
                                    <Button variant="outline" className="w-full h-11 rounded-2xl text-[10px] font-black uppercase tracking-tight">
                                        View Summary
                                    </Button>
                                </Link>
                            </div>
                            {appointment.consultationNotes && (
                                <Button variant="ghost" className="w-full h-11 rounded-2xl text-indigo-600 font-bold italic text-[11px]">
                                    Read Notes
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
