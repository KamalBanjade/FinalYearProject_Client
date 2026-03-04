'use client';

import React, { useState, useEffect } from 'react';
import {
    ShieldAlert,
    Heart,
    User,
    Phone,
    Save,
    Eye,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Stethoscope,
    Info,
    RefreshCw,
    X,
    Users
} from 'lucide-react';
import { patientApi, EmergencySettingsDTO } from '@/lib/api/patient';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const emergencySchema = z.object({
    bloodType: z.string().min(1, 'Blood type is required'),
    allergies: z.string().optional(),
    currentMedications: z.string().optional(),
    chronicConditions: z.string().optional(),
    emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
    emergencyContactPhone: z.string().regex(/^\+977-\d{10}$/, 'Phone number must be +977-XXXXXXXXXX'),
    emergencyContactRelationship: z.string().min(2, 'Relationship is required'),
    emergencyNotesToResponders: z.string().max(500, 'Notes should be concise (max 500 chars)').optional(),
});

type EmergencyFormData = z.infer<typeof emergencySchema>;

export default function EmergencySettingsPage() {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<EmergencyFormData>({
        resolver: zodResolver(emergencySchema),
        defaultValues: {
            bloodType: '',
            allergies: '',
            currentMedications: '',
            chronicConditions: '',
            emergencyContactName: '',
            emergencyContactPhone: '+977-',
            emergencyContactRelationship: '',
            emergencyNotesToResponders: '',
        }
    });

    const formData = watch();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const res = await patientApi.getEmergencySettings();
                if (res.success && res.data) {
                    reset({
                        bloodType: res.data.bloodType || '',
                        allergies: res.data.allergies || '',
                        currentMedications: res.data.currentMedications || '',
                        chronicConditions: res.data.chronicConditions || '',
                        emergencyContactName: res.data.emergencyContactName || '',
                        emergencyContactPhone: res.data.emergencyContactPhone || '+977-',
                        emergencyContactRelationship: res.data.emergencyContactRelationship || '',
                        emergencyNotesToResponders: res.data.emergencyNotesToResponders || '',
                    });
                    setLastUpdated(res.data.lastUpdated || null);
                }
            } catch (error) {
                toast.error("Failed to load emergency settings");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [reset]);

    const onSubmit = async (data: EmergencyFormData) => {
        try {
            setIsSaving(true);
            const res = await patientApi.updateEmergencySettings(data as EmergencySettingsDTO);
            if (res.success) {
                toast.success("Emergency settings updated successfully");
                setLastUpdated(new Date().toISOString());
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="mt-4 text-slate-500 font-medium">Loading health vault...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Professional Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-rose-500" />
                        Emergency Health Vault
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Critical information for first responders. No authentication required to view these details via QR.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setShowPreview(true)}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Public View
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit(onSubmit)}
                        isLoading={isSaving}
                        disabled={!isDirty}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Vault
                    </Button>
                </div>
            </div>

            {/* Warning Alert - Integrated */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[13px] font-medium text-amber-800 dark:text-amber-200 leading-relaxed">
                    <b>Data Privacy Notice:</b> Information saved here is intentionally public to save your life. Do not include sensitive documents or non-critical medical history.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Medical Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
                            <Heart className="w-4 h-4 text-rose-500" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Medical Basics</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Blood Group"
                                required
                                options={[
                                    { value: '', label: 'Select Blood Type' },
                                    { value: 'A+', label: 'A+' },
                                    { value: 'A-', label: 'A-' },
                                    { value: 'B+', label: 'B+' },
                                    { value: 'B-', label: 'B-' },
                                    { value: 'AB+', label: 'AB+' },
                                    { value: 'AB-', label: 'AB-' },
                                    { value: 'O+', label: 'O+' },
                                    { value: 'O-', label: 'O-' },
                                ]}
                                {...register('bloodType')}
                                error={errors.bloodType?.message}
                            />

                            <Input
                                label="Major Allergies"
                                placeholder="e.g. Penicillin, Peanuts"
                                {...register('allergies')}
                                error={errors.allergies?.message}
                            />

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block px-1">
                                    Current Medications
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 text-sm font-medium resize-none h-24"
                                    placeholder="List meds critical for first responders to know..."
                                    {...register('currentMedications')}
                                />
                                {errors.currentMedications && <p className="text-[11px] font-bold text-rose-500 px-1">{errors.currentMedications.message}</p>}
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block px-1">
                                    Chronic Conditions
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 text-sm font-medium resize-none h-24"
                                    placeholder="e.g. Type 1 Diabetes, Epilepsy..."
                                    {...register('chronicConditions')}
                                />
                                {errors.chronicConditions && <p className="text-[11px] font-bold text-rose-500 px-1">{errors.chronicConditions.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Responder Notes - Professionalized */}
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-indigo-400" />
                                <h3 className="text-xs font-black text-white/70 uppercase tracking-widest">Crucial Notes to Responders</h3>
                            </div>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder:text-white/20 h-28 text-sm font-medium resize-none shadow-inner"
                                placeholder="E.g. Carry EpiPen in left pocket, do not restrict movement during seizure..."
                                {...register('emergencyNotesToResponders')}
                            />
                            {errors.emergencyNotesToResponders && <p className="text-[11px] font-bold text-rose-400 px-1">{errors.emergencyNotesToResponders.message}</p>}
                        </div>
                        <Stethoscope className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-white/5 rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-700" />
                    </div>
                </div>

                {/* Right Column: Contact & Metadata */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
                            <Users className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Direct Contact</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <Input
                                label="Contact Name"
                                required
                                placeholder="Legal Full Name"
                                {...register('emergencyContactName')}
                                error={errors.emergencyContactName?.message}
                            />
                            <Input
                                label="Phone Number"
                                required
                                placeholder="+977-98XXXXXXXX"
                                {...register('emergencyContactPhone', {
                                    onChange: (e) => {
                                        const value = e.target.value;
                                        if (!value.startsWith('+977-')) {
                                            setValue('emergencyContactPhone', '+977-', { shouldDirty: true, shouldValidate: true });
                                            return;
                                        }
                                        const suffix = value.slice(5).replace(/\D/g, '');
                                        setValue('emergencyContactPhone', '+977-' + suffix, { shouldDirty: true, shouldValidate: true });
                                    }
                                })}
                                error={errors.emergencyContactPhone?.message}
                            />
                            <Input
                                label="Relationship"
                                required
                                placeholder="e.g. Father, Spouse"
                                {...register('emergencyContactRelationship')}
                                error={errors.emergencyContactRelationship?.message}
                            />
                        </div>
                    </div>

                    {/* Status Info */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest">Last Sync</span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {lastUpdated ? format(new Date(lastUpdated), 'MMM dd, HH:mm') : 'Never'}
                                </span>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                            <Button
                                variant="outline"
                                className="w-full text-xs font-bold py-5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                onClick={() => reset()}
                                disabled={!isDirty || isSaving}
                            >
                                Discard Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setShowPreview(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-[#F8FAFC] rounded-[3rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-white"
                        >
                            <div className="absolute top-0 right-0 p-8">
                                <button onClick={() => setShowPreview(false)} className="p-3 bg-white/80 text-slate-400 hover:text-slate-900 rounded-full shadow-sm">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-10 pt-12 space-y-8">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-rose-200 mb-4 animate-pulse">
                                        <Heart className="w-8 h-8 fill-current" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">Life-Line View</h3>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Responder Preview</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Blood Type</span>
                                        <span className="text-2xl font-black text-rose-600">{formData.bloodType || '--'}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allergies</p>
                                                <p className="text-sm font-bold text-slate-700">{formData.allergies || 'None listed'}</p>
                                            </div>
                                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medications</p>
                                                <p className="text-sm font-bold text-slate-700 leading-relaxed">{formData.currentMedications || 'None listed'}</p>
                                            </div>
                                        </div>

                                        <div className="bg-rose-600 p-6 rounded-[2.5rem] shadow-xl shadow-rose-200 text-white space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Phone className="w-4 h-4 text-rose-200" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-200">Emergency Contact</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xl font-black">{formData.emergencyContactName || 'No Name Set'}</p>
                                                <p className="text-sm font-bold text-rose-100">{formData.emergencyContactPhone || 'No Phone Set'} · {formData.emergencyContactRelationship}</p>
                                            </div>
                                        </div>

                                        {formData.emergencyNotesToResponders && (
                                            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-2">
                                                <div className="flex items-center gap-2 text-amber-600">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Critical Responder Notes</p>
                                                </div>
                                                <p className="text-xs font-bold text-amber-800 leading-relaxed italic">
                                                    "{formData.emergencyNotesToResponders}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-center">
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="text-xs font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors"
                                    >
                                        Close Preview
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
