'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, CreateAppointmentDTO } from '@/lib/api/appointments';
import { patientApi, DoctorSuggestionItem, SmartDoctorSuggestionDTO } from '@/lib/api/patient';
import { 
    Calendar, 
    Clock, 
    User, 
    Stethoscope, 
    ChevronRight, 
    ArrowLeft,
    CheckCircle2,
    Sparkles,
    CalendarDays,
    Info,
    AlertCircle,
    Heart,
    Brain,
    Activity,
    Droplets,
    Droplet,
    Flame,
    Zap,
    ChevronLeft
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate, formatTime, formatDateTime, normalizeUTC, formatLocalTime } from '@/lib/utils/dateUtils';
import { addMinutes } from 'date-fns';

// Custom debounce helper
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

export default function BookAppointmentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    
    // Form state
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
    const [appointmentDate, setAppointmentDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [appointmentTime, setAppointmentTime] = useState<string>('');
    const [reasonForVisit, setReasonForVisit] = useState<string>('');
    const [duration, setDuration] = useState<number>(30);
    const [department, setDepartment] = useState<string>('');

    // UI state
    const [isChangingDoctor, setIsChangingDoctor] = useState(false);
    const [reasonBasedSuggestions, setReasonBasedSuggestions] = useState<DoctorSuggestionItem[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Initial load effects
    useEffect(() => {
        const doctorIdParam = searchParams.get('doctorId');
        const reasonParam = searchParams.get('reason');
        
        if (doctorIdParam) {
            setSelectedDoctorId(doctorIdParam);
            setIsChangingDoctor(false);
        }
        if (reasonParam) {
            setReasonForVisit(reasonParam);
        }
    }, [searchParams]);

    // Data Queries
    const { data: suggestionsResponse } = useQuery({
        queryKey: ['smart-suggestions'],
        queryFn: () => appointmentsApi.getSmartSuggestions(),
        staleTime: 60000,
    });

    const suggestions = suggestionsResponse?.data as SmartDoctorSuggestionDTO;

    const { data: doctorsResponse, isLoading: doctorsLoading } = useQuery({
        queryKey: ['doctors-by-dept', department],
        queryFn: () => patientApi.getDoctorsByDepartment(department),
        enabled: !!department,
    });

    const doctors = doctorsResponse?.data || [];

    // Fetch Availability Slots
    const { data: slotsResponse, isLoading: slotsLoading } = useQuery({
        queryKey: ['doctor-slots', selectedDoctorId, appointmentDate, duration],
        queryFn: () => appointmentsApi.getAvailability(selectedDoctorId, appointmentDate, duration),
        enabled: !!selectedDoctorId && !!appointmentDate,
    });

    const availableSlots = slotsResponse?.data || [];

    // Pre-selection logic
    useEffect(() => {
        if (suggestions?.recommendedDoctor && !selectedDoctorId && !searchParams.get('doctorId')) {
            setSelectedDoctorId(suggestions.recommendedDoctor.id);
        }
    }, [suggestions, selectedDoctorId, searchParams]);

    // Reset time when date, doctor, or duration changes
    useEffect(() => {
        setAppointmentTime('');
    }, [appointmentDate, selectedDoctorId, duration]);

    // Mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateAppointmentDTO) => appointmentsApi.requestAppointment(data),
        onSuccess: () => {
            toast.success('Appointment confirmed instantly!', {
                icon: '⚡',
                duration: 5000
            });
            queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
            queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
            router.push('/appointments');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to book appointment');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctorId || !appointmentDate || !appointmentTime || !reasonForVisit) {
            toast.error('Please fill in all required fields');
            return;
        }

        createMutation.mutate({
            doctorId: selectedDoctorId,
            appointmentDate: normalizeUTC(appointmentTime), // Ensure UTC indicator
            duration: duration,
            reasonForVisit: reasonForVisit
        });
    };

    const selectedDoctor = 
        [suggestions?.recommendedDoctor, suggestions?.primaryDoctor, ...suggestions?.recentDoctors || [], ...reasonBasedSuggestions]
        .find(d => d?.id === selectedDoctorId) || 
        doctors.find(d => d.id === selectedDoctorId);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/appointments">
                        <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0 hover:bg-slate-100">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Instant Booking</h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                            Definitive scheduling • Zero wait tests
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column: Doctor & Reason (2/5) */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">1. Your Doctor</h2>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-indigo-600 text-[9px] font-black uppercase tracking-widest h-7"
                                    onClick={(e) => { e.preventDefault(); setIsChangingDoctor(!isChangingDoctor); }}
                                >
                                    {isChangingDoctor ? 'Cancel' : 'Change'}
                                </Button>
                            </div>

                            {!isChangingDoctor ? (
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4 transition-all">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
                                        {selectedDoctor?.fullName?.split(' ').pop()?.[0] || 'D'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{selectedDoctor?.fullName || 'Select a doctor'}</p>
                                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                        </div>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest truncate">
                                            {selectedDoctor?.department || 'Department'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commonly Consulted</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {suggestions?.primaryDoctor && (
                                            <button
                                                key={suggestions.primaryDoctor.id}
                                                onClick={() => { setSelectedDoctorId(suggestions.primaryDoctor!.id); setIsChangingDoctor(false); }}
                                                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50 transition-all text-left"
                                            >
                                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                                    {suggestions.primaryDoctor.fullName[4]}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[11px] font-black text-slate-900 uppercase">{suggestions.primaryDoctor.fullName}</p>
                                                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tight">{suggestions.primaryDoctor.department}</p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="pt-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Search by Department</label>
                                        <select 
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-xl h-10 px-3 text-xs font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">Choose Clinical Dept</option>
                                            <option value="Cardiology">Cardiology</option>
                                            <option value="Neurology">Neurology</option>
                                            <option value="Orthopedics">Orthopedics</option>
                                            <option value="Gastroenterology">Gastroenterology</option>
                                            <option value="Dermatology">Dermatology</option>
                                        </select>
                                    </div>

                                    {department && (
                                        <div className="space-y-1">
                                            {doctors.map(d => (
                                                <button
                                                    key={d.id}
                                                    type="button"
                                                    onClick={() => { setSelectedDoctorId(d.id); setIsChangingDoctor(false); }}
                                                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-slate-50 transition-all text-left"
                                                >
                                                    <span className="text-xs font-bold text-slate-900 uppercase">Dr. {d.firstName} {d.lastName}</span>
                                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">2. Reason for Visit</label>
                                <textarea
                                    value={reasonForVisit}
                                    onChange={(e) => setReasonForVisit(e.target.value)}
                                    placeholder="Briefly describe what you're feeling..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-28 resize-none shadow-inner"
                                    required
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Date & Slot Selection (3/5) */}
                <div className="lg:col-span-3 space-y-6">
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                        {/* Duration Picker */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">3. Appointment Duration</h2>
                            <div className="grid grid-cols-4 gap-2">
                                {[15, 30, 45, 60].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDuration(d)}
                                        className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${
                                            duration === d
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none scale-105'
                                                : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300 hover:bg-indigo-50'
                                        }`}
                                    >
                                        {d} min
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Picker (Horizontal) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">4. Select Date</h2>
                                <Input 
                                    type="date" 
                                    className="w-[150px] h-8 text-[10px] rounded-lg border-none bg-slate-50"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {[0, 1, 2, 3, 4, 5, 6].map(i => {
                                    const d = addDays(new Date(), i);
                                    const dateStr = format(d, 'yyyy-MM-dd');
                                    const active = appointmentDate === dateStr;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setAppointmentDate(dateStr)}
                                            className={`flex flex-col items-center min-w-[70px] p-3 rounded-2xl border transition-all ${
                                                active 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none scale-105' 
                                                    : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-800 text-slate-600 hover:border-indigo-100'
                                            }`}
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${active ? 'text-white/70' : 'text-slate-400'}`}>
                                                {format(d, 'EEE')}
                                            </span>
                                            <span className="text-sm font-black mt-1">
                                                {format(d, 'dd')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Slot Picker */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">5. Available Slots</h2>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                                    Each slot: {duration} min
                                </span>
                            </div>
                            
                            {slotsLoading ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-10 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {availableSlots.map((slot: TimeSlot) => {
                                    const startTime = formatTime(slot.startTime);
                                    const endTime = formatTime(slot.endTime);
                                    const active = appointmentTime === slot.startTime;
                                    const isBooked = !slot.isAvailable;
                                    
                                    return (
                                        <button
                                            key={slot.startTime}
                                            type="button"
                                            onClick={() => !isBooked && setAppointmentTime(slot.startTime)}
                                            disabled={isBooked}
                                            className={`py-3 px-3 rounded-xl border text-left transition-all group relative overflow-hidden ${
                                                active
                                                    ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100'
                                                    : isBooked
                                                        ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                                        : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-indigo-50 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className={`text-xs font-black uppercase tracking-tighter leading-none ${
                                                active ? 'text-white' : isBooked ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'
                                            }`}>
                                                {startTime}
                                            </div>
                                            <div className={`text-[9px] font-bold mt-0.5 ${
                                                active ? 'text-white/70' : 'text-slate-400'
                                            }`}>
                                                → {endTime}
                                            </div>
                                            {isBooked && (
                                                <div className="absolute top-1 right-2">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter bg-white/50 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-md">Booked</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                                </div>
                            ) : (
                                <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                                        <CalendarDays className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">No Slots Available</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Try another date or doctor</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Summary & Submit */}
                        <div className="pt-8 border-t border-slate-50 dark:border-slate-800 space-y-6">
                            {appointmentTime && (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4 animate-in zoom-in-95 duration-300">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100 dark:shadow-none shrink-0">
                                        <Zap className="w-5 h-5 fill-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Instant Confirmation Ready</p>
                                        <p className="text-sm font-black text-emerald-900 dark:text-emerald-300 mt-0.5">
                                            {formatDate(appointmentTime)}
                                        </p>
                                        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                            {formatTime(appointmentTime)} – {formatTime(addMinutes(new Date(normalizeUTC(appointmentTime)), duration).toISOString())}
                                            <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full text-[9px] font-black uppercase">{duration} min</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                size="lg" 
                                className="w-full h-16 rounded-[1.5rem] text-lg font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none group relative overflow-hidden active:scale-95 transition-all"
                                disabled={createMutation.isPending || !appointmentTime}
                            >
                                <div className="flex items-center justify-center gap-3 relative z-10">
                                    {createMutation.isPending ? 'Processing...' : (
                                        <>
                                            <span>Confirm Booking</span>
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                            </Button>

                            <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                By clicking confirm, your appointment is instantly booked into the system.
                            </p>
                        </div>
                    </section>
                </div>
            </form>
        </div>
    );
}
