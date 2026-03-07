'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    appointmentsApi, 
    AppointmentDTO, 
    CompleteAppointmentDTO, 
    LinkRecordDTO 
} from '@/lib/api/appointments';
import { 
    medicalRecordsApi,
    MedicalRecordResponseDTO
} from '@/lib/api/medicalRecords';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    User, 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    Play, 
    CheckCircle2, 
    X,
    MessageSquare,
    Link as LinkIcon,
    FileText,
    MoreHorizontal,
    Plus,
    RefreshCw,
    History,
    FilePlus,
    Check
} from 'lucide-react';
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { LinkRecordsModal } from '@/components/doctor/LinkRecordsModal';
import { useConfirm } from '@/context/ConfirmContext';
import { formatDate, formatTime, getRelativeTimeString, normalizeUTC, formatLocalTime } from '@/lib/utils/dateUtils';

export default function DoctorAppointmentsDashboard() {
    const queryClient = useQueryClient();
    const { confirm } = useConfirm();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeFilter, setActiveFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('today');
    
    // UI State for Modals
    const [consultingAppointment, setConsultingAppointment] = useState<AppointmentDTO | null>(null);
    const [linkingAppointment, setLinkingAppointment] = useState<AppointmentDTO | null>(null);

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');

    const { data: appointmentsResponse, isLoading, refetch } = useQuery({
        queryKey: ['doctor-appointments', formattedDate],
        queryFn: () => appointmentsApi.getDoctorAppointments(formattedDate),
    });

    const appointments = appointmentsResponse?.data || [];

    // Grouping logic
    const morningApps = appointments.filter((a: AppointmentDTO) => new Date(normalizeUTC(a.appointmentDate)).getHours() < 12);
    const afternoonApps = appointments.filter((a: AppointmentDTO) => new Date(normalizeUTC(a.appointmentDate)).getHours() >= 12);

    const handleFilterChange = (filter: typeof activeFilter) => {
        setActiveFilter(filter);
        if (filter === 'today') setSelectedDate(new Date());
        else if (filter === 'tomorrow') setSelectedDate(addDays(new Date(), 1));
    };

    const handleConfirm = async (id: string) => {
        try {
            await appointmentsApi.confirmAppointment(id);
            toast.success('Appointment confirmed');
            queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
        } catch (err) {
            toast.error('Failed to confirm appointment');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Daily Roster</h1>
                    <p className="text-slate-500 font-medium">Manage your consultations and patient records for today</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <button 
                        onClick={() => handleFilterChange('today')}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'today' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Today
                    </button>
                    <button 
                        onClick={() => handleFilterChange('tomorrow')}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'tomorrow' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Tomorrow
                    </button>
                    <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 hidden sm:block" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <CalendarIcon className="w-4 h-4 text-indigo-500" />
                        <input 
                            type="date" 
                            className="bg-transparent border-none text-xs font-black text-slate-700 dark:text-slate-200 outline-none uppercase"
                            value={formattedDate}
                            onChange={(e) => {
                                setSelectedDate(new Date(e.target.value));
                                setActiveFilter('all');
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            {isLoading ? (
                <div className="py-32 flex flex-col items-center">
                    <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                    <span className="mt-4 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Syncing Calendar...</span>
                </div>
            ) : appointments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-12">
                        {morningApps.length > 0 && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                    <h2 className="text-sm font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Morning Sessions
                                    </h2>
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {morningApps.map((app: AppointmentDTO) => (
                                        <DoctorAppointmentCard 
                                            key={app.id} 
                                            appointment={app} 
                                            onStart={() => setConsultingAppointment(app)}
                                            onLink={() => setLinkingAppointment(app)}
                                            onConfirm={() => handleConfirm(app.id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {afternoonApps.length > 0 && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                    <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4" /> Afternoon Sessions
                                    </h2>
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {afternoonApps.map((app: AppointmentDTO) => (
                                        <DoctorAppointmentCard 
                                            key={app.id} 
                                            appointment={app} 
                                            onStart={() => setConsultingAppointment(app)}
                                            onLink={() => setLinkingAppointment(app)}
                                            onConfirm={() => handleConfirm(app.id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -mr-12 -mt-12 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                            <h3 className="text-2xl font-black uppercase leading-tight relative">Daily<br/>Summary</h3>
                            <div className="mt-8 grid grid-cols-2 gap-4 relative">
                                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <span className="block text-2xl font-black">{appointments.length}</span>
                                    <span className="text-[10px] font-bold uppercase opacity-70">Total</span>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                                    <span className="block text-2xl font-black">{appointments.filter((a: AppointmentDTO) => a.status === 'Completed').length}</span>
                                    <span className="text-[10px] font-bold uppercase opacity-70">Seen</span>
                                </div>
                            </div>
                            <p className="mt-6 text-sm font-medium opacity-80 leading-relaxed">You have {appointments.filter((a: AppointmentDTO) => a.status === 'Scheduled').length} appointments waiting for confirmation.</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Upcoming Highlight</h4>
                             {appointments.find((a: AppointmentDTO) => a.status === 'Confirmed') ? (
                                 <div className="space-y-4">
                                      <div className="flex items-start gap-4">
                                           <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-lg">
                                               {formatLocalTime(appointments.find((a: AppointmentDTO) => a.status === 'Confirmed')!.appointmentDate, 'HH')}
                                           </div>
                                           <div>
                                               <p className="font-black text-slate-900 dark:text-white">{appointments.find((a: AppointmentDTO) => a.status === 'Confirmed')!.patientName}</p>
                                               <p className="text-xs font-bold text-slate-500 truncate max-w-[150px]">{appointments.find((a: AppointmentDTO) => a.status === 'Confirmed')!.reasonForVisit}</p>
                                           </div>
                                      </div>
                                 </div>
                             ) : (
                                 <p className="text-sm font-medium text-slate-400">No confirmed appointments next.</p>
                             )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-40 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-100 dark:border-slate-800">
                     <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                         <CalendarIcon className="w-10 h-10 text-slate-300" />
                     </div>
                     <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Empty Roster</h2>
                     <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">No appointments scheduled for {format(selectedDate, 'MMMM dd, yyyy')}. Take some rest!</p>
                </div>
            )}

            {/* Modals */}
            {consultingAppointment && (
                <ConsultationModal 
                   appointment={consultingAppointment} 
                   onClose={() => setConsultingAppointment(null)} 
                   onComplete={() => {
                       setConsultingAppointment(null);
                       queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
                   }}
                />
            )}

            {linkingAppointment && (
                <LinkRecordsModal 
                   appointmentId={linkingAppointment.id}
                   patientId={linkingAppointment.patientId}
                   alreadyLinkedItemIds={linkingAppointment.linkedRecords.map(r => r.recordId)}
                   onClose={() => setLinkingAppointment(null)}
                   onSuccess={() => {
                        setLinkingAppointment(null);
                        queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
                   }}
                />
            )}
        </div>
    );
}

function DoctorAppointmentCard({ appointment, onStart, onLink, onConfirm }: { appointment: AppointmentDTO; onStart: () => void; onLink: () => void; onConfirm: () => void }) {
    const rawDate = appointment.appointmentDate;
    
    return (
        <div className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row gap-6 hover:shadow-2xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-500 relative">
            <div className={`absolute top-0 right-10 px-4 py-1.5 rounded-b-2xl text-[10px] font-black uppercase tracking-widest ${
                appointment.status === 'Confirmed' ? 'bg-emerald-500 text-white' :
                appointment.status === 'Scheduled' ? 'bg-indigo-500 text-white' :
                appointment.status === 'Completed' ? 'bg-slate-200 text-slate-600' :
                'bg-rose-500 text-white'
            }`}>
                {appointment.status}
            </div>

            <div className="flex flex-col items-center justify-center md:w-32 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                 <span className="text-lg font-black text-slate-900 dark:text-white">{formatLocalTime(rawDate, 'h:mm')}</span>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatLocalTime(rawDate, 'a')}</span>
                 <div className="w-1 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-full my-2" />
                 <span className="text-xs font-bold text-slate-500">{appointment.duration}min</span>
            </div>

            <div className="flex-1 space-y-4">
                 <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{appointment.patientName}</h3>
                      <p className="text-sm font-bold text-indigo-500 mt-1 italic">{appointment.reasonForVisit}</p>
                 </div>

                 {appointment.linkedRecordsCount > 0 && (
                     <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {appointment.linkedRecords.slice(0, 3).map((rec, i) => (
                              <div key={i} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-600">
                                   <FileText className="w-3 h-3 text-indigo-400" />
                                   <span className="truncate max-w-[100px]">{rec.recordFileName}</span>
                              </div>
                          ))}
                          {appointment.linkedRecordsCount > 3 && (
                              <span className="text-[10px] font-black text-slate-400">+{appointment.linkedRecordsCount - 3} More</span>
                          )}
                     </div>
                 )}
            </div>

            <div className="flex flex-row md:flex-col gap-3 justify-end md:w-48">
                 {appointment.status === 'Scheduled' && (
                     <Button variant="primary" size="sm" className="flex-1 h-12 rounded-2xl shadow-lg shadow-indigo-100" onClick={onConfirm}>
                         Confirm
                     </Button>
                 )}
                 {appointment.status === 'Confirmed' && (
                     <Button variant="primary" size="sm" className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-none" onClick={onStart}>
                         <Play className="w-4 h-4 mr-2" /> Start Now
                     </Button>
                 )}
                 <Button variant="outline" size="sm" className="flex-1 h-12 rounded-2xl" onClick={onLink}>
                     <LinkIcon className="w-4 h-4 mr-2" /> Link Files
                 </Button>
            </div>
        </div>
    );
}

// Sub-components: Modals
function ConsultationModal({ appointment, onClose, onComplete }: { appointment: AppointmentDTO; onClose: () => void; onComplete: () => void }) {
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!notes) return toast.error('Please enter consultation notes');
        setIsSubmitting(true);
        try {
            await appointmentsApi.completeAppointment(appointment.id, { consultationNotes: notes });
            toast.success('Consultation completed successfully');
            onComplete();
        } catch (err) {
            toast.error('Failed to complete consultation');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
             <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                       <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                 <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Consultation</h3>
                                 <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{appointment.patientName} • {appointment.reasonForVisit}</p>
                            </div>
                       </div>
                       <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <X className="w-6 h-6" />
                       </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                       <div className="lg:col-span-4 space-y-8">
                            <section className="space-y-4">
                                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                     <History className="w-3.5 h-3.5" /> Patient Context
                                 </h4>
                                 <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] space-y-4">
                                      <div className="flex justify-between items-center">
                                           <span className="text-[10px] font-bold text-slate-500 uppercase">Linked Records</span>
                                           <span className="text-xs font-black text-indigo-600">{appointment.linkedRecordsCount}</span>
                                      </div>
                                      <div className="space-y-2">
                                           {appointment.linkedRecords.map((rec, i) => (
                                               <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
                                                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                    <span className="text-xs font-bold truncate flex-1">{rec.recordFileName}</span>
                                               </div>
                                           ))}
                                      </div>
                                 </div>
                            </section>
                       </div>

                       <div className="lg:col-span-8 flex flex-col gap-6">
                            <section className="flex-1 flex flex-col gap-3">
                                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Consultation Notes & Observations</h4>
                                 <textarea 
                                    className="flex-1 w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-6 rounded-[2.5rem] font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800/80 transition-all resize-none shadow-inner"
                                    placeholder="Start typing patient observations, diagnosis, and recommended actions..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                 />
                            </section>
                       </div>
                  </div>

                  <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                       <Button variant="outline" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px]" onClick={onClose}>
                            Hold Session
                       </Button>
                       <Button className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 dark:shadow-none" onClick={handleSubmit} isLoading={isSubmitting}>
                            Complete Consultation
                       </Button>
                  </div>
             </div>
        </div>
    );
}

