'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { doctorAvailabilityApi, DoctorAvailabilityDTO } from '@/lib/api/doctor-availability';
import { 
    Calendar, 
    Clock, 
    Plus, 
    Trash2, 
    Shield, 
    CalendarDays, 
    AlertCircle, 
    CheckCircle2, 
    Timer, 
    ArrowRight, 
    Activity, 
    XCircle,
    CalendarCheck,
    Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatDate, normalizeUTC } from '@/lib/utils/dateUtils';
import { addDays } from 'date-fns';

const DAYS = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
];

export default function AvailabilityPage() {
    const [schedule, setSchedule] = useState<DoctorAvailabilityDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // Weekly Schedule Form
    const [selectedDay, setSelectedDay] = useState(0);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [breakStartTime, setBreakStartTime] = useState('12:00');
    const [breakEndTime, setBreakEndTime] = useState('13:00');
    const [useBreak, setUseBreak] = useState(false);
    const [isSavingHours, setIsSavingHours] = useState(false);

    // Sync form with selected day's data
    const weeklyHours = schedule.filter(a => (a.recurrenceType === 1 || a.recurrenceType === 'Weekly'));
    const blockedTimes = schedule.filter(a => (a.recurrenceType === 0 || a.recurrenceType === 'OneTime') && !a.isAvailable);

    useEffect(() => {
        const dayShifts = weeklyHours.filter(h => h.dayOfWeek === selectedDay)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
            
        if (dayShifts.length > 0) {
            setStartTime(dayShifts[0].startTime.substring(0, 5));
            setEndTime(dayShifts[dayShifts.length - 1].endTime.substring(0, 5));
            
            if (dayShifts.length > 1) {
                setUseBreak(true);
                setBreakStartTime(dayShifts[0].endTime.substring(0, 5));
                setBreakEndTime(dayShifts[1].startTime.substring(0, 5));
            } else {
                setUseBreak(false);
            }
        } else {
            setStartTime('09:00');
            setEndTime('17:00');
            setUseBreak(false);
        }
    }, [selectedDay, schedule]);

    // Block Time Form
    const [blockStart, setBlockStart] = useState('');
    const [blockEnd, setBlockEnd] = useState('');
    const [blockReason, setBlockReason] = useState('');

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const start = new Date();
            const end = new Date();
            end.setMonth(end.getMonth() + 3);

            const res = await doctorAvailabilityApi.getSchedule(
                start.toISOString(),
                end.toISOString()
            );

            if (res.success) {
                setSchedule(res.data);
            }
        } catch (error) {
            toast.error('Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    const handleSetWorkingHours = async () => {
        // Validate break times
        if (useBreak) {
            if (breakStartTime <= startTime) {
                toast.error('Break start must be after shift start time');
                return;
            }
            if (breakEndTime >= endTime) {
                toast.error('Break end must be before shift end time');
                return;
            }
            if (breakStartTime >= breakEndTime) {
                toast.error('Break end must be after break start');
                return;
            }
        }

        try {
            setIsSavingHours(true);
            const res = await doctorAvailabilityApi.setWorkingHours({
                dayOfWeek: selectedDay,
                startTime,
                endTime,
                breakStartTime: useBreak ? breakStartTime : undefined,
                breakEndTime: useBreak ? breakEndTime : undefined
            });

            if (res.success) {
                toast.success(`Working hours for ${DAYS.find(d => d.value === selectedDay.toString())?.label} updated`);
                fetchSchedule();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error('Failed to update working hours');
        } finally {
            setIsSavingHours(false);
        }
    };

    const handleBlockTime = async () => {
        if (!blockStart || !blockEnd || !blockReason) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            const res = await doctorAvailabilityApi.blockTime({
                startDateTime: normalizeUTC(blockStart),
                endDateTime: normalizeUTC(blockEnd),
                reason: blockReason
            });

            if (res.success) {
                toast.success('Time period blocked successfully');
                setBlockStart('');
                setBlockEnd('');
                setBlockReason('');
                fetchSchedule();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error('Failed to block time');
        }
    };

    const handleUnblock = async (id: string) => {
        try {
            const res = await doctorAvailabilityApi.unblockTime(id);
            if (res.success) {
                toast.success('Schedule item removed');
                fetchSchedule();
            }
        } catch (error) {
            toast.error('Failed to remove item');
        }
    };


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    } as const;

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    } as const;

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto space-y-10 pb-24 px-4 sm:px-6"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Weekly Schedule */}
                <div className="lg:col-span-8 space-y-10">
                    <motion.section variants={itemVariants} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-8 sm:p-10 border border-slate-200/60 dark:border-slate-800 shadow-premium relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-secondary/10 rounded-3xl flex items-center justify-center text-secondary">
                                        <Timer className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-sans">Recurring Shifts</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Weekly Working Hours</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="px-4 py-2 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                                            {weeklyHours.length} <span className="opacity-50">/ 7</span> Active
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 font-sans">Effective Day</label>
                                    <Select
                                        value={selectedDay.toString()}
                                        onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                                        options={DAYS}
                                        className="rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 font-bold font-sans"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 font-sans">Start Time</label>
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 font-sans">End Time</label>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 font-mono font-bold"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button 
                                        onClick={handleSetWorkingHours}
                                        disabled={isSavingHours}
                                        className="w-full h-12 rounded-2xl bg-secondary hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all font-sans disabled:opacity-50"
                                    >
                                        {isSavingHours ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Updating...</span>
                                            </div>
                                        ) : 'Update Hours'}
                                    </Button>
                                </div>
                            </div>

                            <div className="mb-10 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                            <Coffee className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight font-sans">Custom Break Time</h3>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-sans">Optional midday pause</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setUseBreak(!useBreak)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${useBreak ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useBreak ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {useBreak && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Break Start</label>
                                                    <Input
                                                        type="time"
                                                        value={breakStartTime}
                                                        onChange={(e) => setBreakStartTime(e.target.value)}
                                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-10 font-mono font-bold text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Break End</label>
                                                    <Input
                                                        type="time"
                                                        value={breakEndTime}
                                                        onChange={(e) => setBreakEndTime(e.target.value)}
                                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-10 font-mono font-bold text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {DAYS.map((day) => {
                                    // Collect ALL shifts for this day (supports multiple after lunch break split)
                                    const dayShifts = weeklyHours
                                        .filter(h => h.dayOfWeek?.toString() === day.value)
                                        .sort((a, b) => a.startTime.localeCompare(b.startTime));

                                    // Derive the displayed schedule:
                                    // If 2 shifts → doctor set a break: show "start–end / Break: s2start–s1end"
                                    // If 1 shift  → no break: show "start–end"
                                    const hasSchedule = dayShifts.length > 0;
                                    const displayStart  = dayShifts[0]?.startTime.substring(0, 5);
                                    const displayEnd    = dayShifts[dayShifts.length - 1]?.endTime.substring(0, 5);
                                    const hasBreak      = dayShifts.length > 1;
                                    const breakStart    = dayShifts[0]?.endTime.substring(0, 5);    // end of first shift
                                    const breakEnd      = dayShifts[1]?.startTime.substring(0, 5);  // start of second shift

                                    return (
                                        <motion.div
                                            key={day.value}
                                            whileHover={{ y: -5 }}
                                            className={`group relative p-6 rounded-[2rem] border transition-all duration-300 ${
                                                hasSchedule
                                                ? 'bg-white dark:bg-slate-800 border-secondary/30 shadow-md'
                                                : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${hasSchedule ? 'bg-secondary' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">{day.label}</span>
                                                </div>
                                                {hasSchedule && (
                                                    <button
                                                        onClick={() => Promise.all(dayShifts.map(s => handleUnblock(s.id)))}
                                                        title="Remove all shifts for this day"
                                                        className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {hasSchedule ? (
                                                <div className="space-y-2">
                                                    {/* Main working range */}
                                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 font-mono text-sm">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 font-sans">Start</span>
                                                            <span className="font-bold text-slate-900 dark:text-white uppercase leading-none">{displayStart}</span>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-slate-300" />
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 font-sans">End</span>
                                                            <span className="font-bold text-slate-900 dark:text-white uppercase leading-none">{displayEnd}</span>
                                                        </div>
                                                    </div>

                                                    {/* Break indicator */}
                                                    {hasBreak && (
                                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
                                                            <Coffee className="w-3 h-3 text-orange-500 shrink-0" />
                                                            <span className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest font-sans">
                                                                Break {breakStart}–{breakEnd}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-2 text-center">
                                                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] font-sans">Not Scheduled</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.section>
                </div>

                {/* Right Column: Time Blocks */}
                <div className="lg:col-span-4 space-y-10">
                    <motion.section variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 sm:p-10 text-slate-900 dark:text-white shadow-premium border border-slate-200/60 dark:border-slate-800 relative overflow-hidden group transition-colors duration-300">
                        <div className="absolute inset-0 bg-medical-pattern opacity-[0.03] dark:opacity-10 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl -ml-24 -mb-24 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-rose-500/10 dark:bg-rose-500/20 rounded-3xl flex items-center justify-center text-rose-500 dark:text-rose-400">
                                        <XCircle className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight font-sans">Add Absence</h2>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-rose-400/60 uppercase tracking-widest font-sans">Block Your Time</p>
                                    </div>
                                </div>
                                <div className="bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-2">
                                    <Coffee className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/80">{blockedTimes.length} Planned</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 font-sans">Date & Time Start</label>
                                    <Input
                                        type="datetime-local"
                                        value={blockStart}
                                        onChange={(e) => setBlockStart(e.target.value)}
                                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl h-14 font-mono text-xs focus:ring-rose-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 font-sans">Date & Time End</label>
                                    <Input
                                        type="datetime-local"
                                        value={blockEnd}
                                        onChange={(e) => setBlockEnd(e.target.value)}
                                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl h-14 font-mono text-xs focus:ring-rose-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1 font-sans">Reason</label>
                                    <Input
                                        placeholder="Vacation, Lunch Break, etc."
                                        value={blockReason}
                                        onChange={(e) => setBlockReason(e.target.value)}
                                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl h-14 placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold text-xs focus:ring-rose-500/20 font-sans"
                                    />
                                </div>
                                <Button 
                                    onClick={handleBlockTime}
                                    className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-[0.2em] text-[10px] mt-4 shadow-lg shadow-rose-500/20 active:scale-95 transition-all font-sans"
                                >
                                    Confirm Absence
                                </Button>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200/60 dark:border-slate-800 p-8 sm:p-10 shadow-premium">
                        <div className="flex items-center gap-3 mb-8">
                            <Clock className="w-5 h-5 text-secondary" />
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Upcoming Blocks</h3>
                        </div>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {blockedTimes.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12 px-6 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800"
                                    >
                                        <CalendarDays className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fully Clear Roster</p>
                                    </motion.div>
                                ) : (
                                    blockedTimes.map((block) => (
                                        <motion.div 
                                            key={block.id}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: 20, opacity: 0 }}
                                            whileHover={{ scale: 1.02 }}
                                            className="p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group relative overflow-hidden"
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em]">
                                                        {formatDate(block.specificDate || '')}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleUnblock(block.id)}
                                                        className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <div className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-tight truncate">{block.reason}</div>
                                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold font-mono">
                                                    <span>{block.startTime.substring(0, 5)}</span>
                                                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1 mx-3" />
                                                    <span>{block.endTime.substring(0, 5)}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.section>
                </div>
            </div>
        </motion.div>
    );
}
