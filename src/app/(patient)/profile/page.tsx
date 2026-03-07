'use client';

import React, { useEffect, useState } from 'react';
import { patientApi, PatientProfileData, UpdatePatientProfileRequest } from '@/lib/api/patient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    User,
    Mail,
    Calendar,
    MapPin,
    Phone,
    Droplets,
    AlertCircle,
    Activity,
    Heart,
    Save,
    Loader2,
    ShieldCheck,
    Smartphone,
    UserCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function PatientProfilePage() {
    const [profile, setProfile] = useState<PatientProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<UpdatePatientProfileRequest>({
        bloodType: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        allergies: '',
        chronicConditions: ''
    });

    const fetchProfile = async () => {
        try {
            const response = await patientApi.getProfile();
            setProfile(response.data);
            setFormData({
                bloodType: response.data.bloodType || '',
                address: response.data.address || '',
                emergencyContactName: response.data.emergencyContactName || '',
                emergencyContactPhone: response.data.emergencyContactPhone || '',
                allergies: response.data.allergies || '',
                chronicConditions: response.data.chronicConditions || ''
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            toast.error('Failed to load your profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await patientApi.updateProfile(formData);
            toast.success('Profile updated successfully');
            fetchProfile();
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update profile details');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Minimalist Tab-like Navigation Header */}
            <div className="flex items-center justify-end mb-2">
                <div className="flex gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 h-11 text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Profile
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Summary Cards */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Identity Card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl font-bold border-2 border-white shadow-md">
                                    {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 text-lg leading-tight">{profile?.firstName} {profile?.lastName}</h2>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{profile?.gender || 'Patient'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Mail size={16} className="text-slate-300" />
                                    <span className="text-sm font-medium">{profile?.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Calendar size={16} className="text-slate-300" />
                                    <span className="text-sm font-medium">
                                        {profile?.dateOfBirth ? format(new Date(profile.dateOfBirth), 'dd MMM yyyy') : 'Birth date not set'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Droplets size={16} className="text-slate-300" />
                                    <span className="text-sm font-bold text-rose-600">
                                        Type {profile?.bloodType || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldCheck size={14} className="text-indigo-500" />
                            Data Encryption
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                            Your medical profile is protected by AES-256 standards. Only you and authorized clinical partners can decrypt these details.
                        </p>
                    </div>

                    {/* Emergency Box */}
                    <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100">
                        <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Heart size={14} fill="currentColor" className="fill-rose-300 opacity-50" />
                            Emergency Protocol
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-rose-900">{profile?.emergencyContactName || 'No nominee assigned'}</p>
                                <p className="text-xs font-medium text-rose-600 mt-0.5">{profile?.emergencyContactPhone || 'Add phone number'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Detailed Forms */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Residential Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <Input
                                        className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="City, Street, House No."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Blood Registry</label>
                                <div className="relative">
                                    <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <select
                                        className="w-full pl-10 pr-4 h-12 bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:ring-0 focus:bg-white transition-all text-sm font-medium rounded-lg appearance-none"
                                        value={formData.bloodType}
                                        onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Emergency Nominee</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <Input
                                        className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
                                        value={formData.emergencyContactName}
                                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                        placeholder="Legal Full Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Nominee Phone</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <Input
                                        className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
                                        value={formData.emergencyContactPhone}
                                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                                        placeholder="+1..."
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 ml-1">Critical Allergies</label>
                                <div className="relative">
                                    <AlertCircle className="absolute left-3 top-4 text-rose-200" size={16} />
                                    <textarea
                                        className="w-full pl-10 pr-4 py-3 min-h-[100px] bg-slate-50 border border-slate-100 focus:border-rose-400 focus:ring-0 focus:bg-white transition-all text-sm font-medium rounded-xl resize-none"
                                        value={formData.allergies}
                                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                        placeholder="None documented"
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Chronic Conditions</label>
                                <div className="relative">
                                    <Activity className="absolute left-3 top-4 text-indigo-200" size={16} />
                                    <textarea
                                        className="w-full pl-10 pr-4 py-3 min-h-[100px] bg-slate-50 border border-slate-100 focus:border-indigo-400 focus:ring-0 focus:bg-white transition-all text-sm font-medium rounded-xl resize-none"
                                        value={formData.chronicConditions}
                                        onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                                        placeholder="None reported"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
