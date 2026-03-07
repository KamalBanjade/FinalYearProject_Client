'use client';

import React, { useEffect, useState } from 'react';
import { doctorApi, DoctorProfileData, UpdateDoctorProfileRequest } from '@/lib/api/doctor';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    User,
    Mail,
    BadgeCheck,
    Stethoscope,
    Building2,
    Phone,
    ShieldCheck,
    Save,
    Calendar,
    Loader2,
    Hospital,
    Award
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorProfilePage() {
    const [profile, setProfile] = useState<DoctorProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<UpdateDoctorProfileRequest>({
        department: '',
        specialization: '',
        hospitalAffiliation: '',
        contactNumber: ''
    });

    const fetchProfile = async () => {
        try {
            const response = await doctorApi.getProfile();
            setProfile(response.data);
            setFormData({
                department: response.data.department || '',
                specialization: response.data.specialization || '',
                hospitalAffiliation: response.data.hospitalAffiliation || '',
                contactNumber: response.data.contactNumber || ''
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            toast.error('Failed to load professional profile');
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
            await doctorApi.updateProfile(formData);
            toast.success('Professional profile updated successfully');
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
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            {/* Header / Intro */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Quick View */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-5 uppercase tracking-widest flex items-center gap-2">
                            <Award size={18} className="text-emerald-600" />
                            Clinical Identity
                        </h3>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Department</span>
                                <span className="text-sm font-semibold text-slate-700">{profile?.department || 'Not Specified'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specialization</span>
                                <span className="text-sm font-semibold text-slate-700">{profile?.specialization || 'Not Specified'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Affiliation</span>
                                <span className="text-sm font-semibold text-slate-700">{profile?.hospitalAffiliation || 'Not Specified'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck size={120} />
                        </div>
                        <h3 className="text-sm font-bold mb-4 uppercase tracking-widest relative z-10">Security Account</h3>
                        <div className="space-y-3 relative z-10">
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                Your digital identity is protected by end-to-end RSA encryption. Every record you certify is cryptographically signed.
                            </p>
                            <div className="pt-2">
                                <Button variant="outline" className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 text-xs h-9">
                                    Manage Security Keys
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edit Profile */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Professional Profile</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Edit functional details</p>
                            </div>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-11 text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Changes
                            </Button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <Input
                                            className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            placeholder="e.g., Cardiology"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Clinical Specialization</label>
                                    <div className="relative">
                                        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <Input
                                            className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
                                            value={formData.specialization}
                                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                            placeholder="e.g., Interventional Cardiology"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Affiliation</label>
                                    <div className="relative">
                                        <Hospital className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <Input
                                            className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
                                            value={formData.hospitalAffiliation}
                                            onChange={(e) => setFormData({ ...formData, hospitalAffiliation: e.target.value })}
                                            placeholder="e.g., General City Hospital"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Contact Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <Input
                                            className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
                                            value={formData.contactNumber}
                                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-50 flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                    <Calendar className="text-amber-600" size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900">Professional Note</h4>
                                    <p className="text-xs text-amber-700 leading-relaxed font-medium mt-1">
                                        Changes to your professional details will be reflected on all medical records you certify after the update.
                                        Please ensure your Hospital Affiliation and NMC license details are always up to date.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
