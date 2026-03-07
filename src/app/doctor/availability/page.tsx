'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { doctorAvailabilityApi, DoctorAvailabilityDTO } from '@/lib/api/doctor-availability';
import { Calendar, Clock, Plus, Trash2, Shield, CalendarDays, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatTime, normalizeUTC, formatLocalTime } from '@/lib/utils/dateUtils';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<DoctorAvailabilityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Weekly Schedule Form
  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  
  // Block Time Form
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 3); // Look 3 months ahead
      
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
    try {
      const res = await doctorAvailabilityApi.setWorkingHours({
        dayOfWeek: selectedDay,
        startTime,
        endTime
      });
      
      if (res.success) {
        toast.success(`Working hours for ${DAYS.find(d => d.value === selectedDay)?.label} updated`);
        fetchSchedule();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Failed to update working hours');
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

  const weeklyHours = schedule.filter(a => a.recurrenceType === 1); // Weekly
  const blockedTimes = schedule.filter(a => a.recurrenceType === 0 && !a.isAvailable); // OneTime Blocks

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            Manage My Availability
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Define your working hours and block off time for vacations or breaks.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <Shield className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Secure Scheduling</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Schedule Settings */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Weekly Working Hours</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl mb-8 border border-white dark:border-slate-800 shadow-inner">
              <div className="md:col-span-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Day</label>
                <Select
                  value={selectedDay.toString()}
                  onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                  options={DAYS}
                  className="rounded-2xl border-none shadow-sm h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">From</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-2xl border-none shadow-sm h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">To</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-2xl border-none shadow-sm h-12"
                />
              </div>
              <Button 
                onClick={handleSetWorkingHours}
                className="rounded-2xl h-12 bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-wider text-xs shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                Update Hours
              </Button>
            </div>

            <div className="space-y-3">
              {DAYS.map((day) => {
                const hourRecord = weeklyHours.find(h => h.dayOfWeek === day.value);
                return (
                  <div key={day.value} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${hourRecord ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[100px]">{day.label}</span>
                    </div>
                    
                          <div className="flex items-center gap-6">
                           {hourRecord ? (
                             <>
                               <div className="flex items-center gap-2 font-mono text-sm bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                 <span className="text-slate-900 dark:text-white font-bold">{hourRecord.startTime.substring(0, 5)}</span>
                                 <span className="text-slate-300">—</span>
                                 <span className="text-slate-900 dark:text-white font-bold">{hourRecord.endTime.substring(0, 5)}</span>
                               </div>
                          <button 
                            onClick={() => handleUnblock(hourRecord.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Not Working</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Block Time Settings */}
        <div className="space-y-8">
          <section className="bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200 dark:shadow-none border border-slate-800 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors duration-700" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400">
                  <Plus className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Block Specific Time</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="bg-slate-800 border-none text-white rounded-2xl h-12"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="bg-slate-800 border-none text-white rounded-2xl h-12"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</label>
                  <Input
                    placeholder="e.g., Vacation, Lunch Break"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="bg-slate-800 border-none text-white rounded-2xl h-12 placeholder:text-slate-600"
                  />
                </div>
                <Button 
                  onClick={handleBlockTime}
                  className="w-full h-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-xs mt-4"
                >
                  Create Time Block
                </Button>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Upcoming Time Blocks</h3>
            
            <div className="space-y-4">
              {blockedTimes.length === 0 ? (
                <div className="text-center py-10 px-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <CalendarDays className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active blocks</p>
                </div>
              ) : (
                blockedTimes.map((block) => (
                  <div key={block.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group relative">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                          {formatDate(block.specificDate || '')}
                        </span>
                        <button 
                          onClick={() => handleUnblock(block.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-slate-900 dark:text-white font-black text-sm">{block.reason}</div>
                      <div className="text-xs text-slate-500 font-medium font-mono uppercase">
                        {block.startTime.substring(0, 5)} — {block.endTime.substring(0, 5)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
