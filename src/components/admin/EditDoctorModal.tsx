'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    User,
    Stethoscope,
    BadgeCheck,
    Phone,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Doctor, UpdateDoctorRequest } from '@/types/admin';
import { departmentApi, Department as DeptEntity } from '@/lib/api/department';
import toast from 'react-hot-toast';

interface EditDoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRotateKeys?: () => void;
    doctor: Doctor | null;
    onSave: (id: string, data: UpdateDoctorRequest) => Promise<void>;
}

export const EditDoctorModal: React.FC<EditDoctorModalProps> = ({
    isOpen,
    onClose,
    doctor,
    onSave
}) => {
    const [formData, setFormData] = useState<UpdateDoctorRequest>({
        firstName: '',
        lastName: '',
        nmcLicense: '',
        department: '',
        specialization: '',
        qualificationDetails: '',
        isActive: true,
        phoneNumber: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [departments, setDepartments] = useState<DeptEntity[]>([]);
    const [isFetchingDepts, setIsFetchingDepts] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDepartments();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const fetchDepartments = async () => {
        try {
            setIsFetchingDepts(true);
            const res = await departmentApi.getAll();
            if (res.success) {
                setDepartments(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        } finally {
            setIsFetchingDepts(false);
        }
    };

    useEffect(() => {
        if (doctor) {
            setFormData({
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                nmcLicense: doctor.nmcLicense,
                department: doctor.department,
                specialization: doctor.specialization,
                qualificationDetails: doctor.qualificationDetails || '',
                isActive: doctor.isActive,
                phoneNumber: '' // We don't have this in the Doctor interface currently, but it's in UpdateDoctorRequest
            });
        }
    }, [doctor]);

    if (!isOpen || !doctor) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(doctor.userId, formData);
            toast.success('Practitioner details updated');
            onClose();
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update details');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden slide-in-from-bottom-4 animate-in duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Edit Practitioner</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Clinical Registry Update</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <Input
                                    required
                                    className="pl-9 bg-slate-50 border-slate-200 focus:border-slate-900 h-10 text-sm"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <Input
                                    required
                                    className="pl-9 bg-slate-50 border-slate-200 focus:border-slate-900 h-10 text-sm"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">NMC License</label>
                            <div className="relative">
                                <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <Input
                                    required
                                    className="pl-9 bg-slate-50 border-slate-200 focus:border-slate-900 h-10 text-sm"
                                    value={formData.nmcLicense}
                                    onChange={(e) => setFormData({ ...formData, nmcLicense: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
                            <div className="relative">
                                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                                <select
                                    required
                                    className="w-full pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all h-10 text-sm appearance-none flex items-center"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    disabled={isFetchingDepts}
                                >
                                    <option value="">Select Department</option>
                                    {departments.filter(d => d.isActive).map(dept => (
                                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Specialization</label>
                        <Input
                            className="bg-slate-50 border-slate-200 focus:border-slate-900 h-10 text-sm"
                            value={formData.specialization}
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Qualification Details</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-md p-3 text-sm min-h-[80px] outline-none transition-all"
                            value={formData.qualificationDetails}
                            onChange={(e) => setFormData({ ...formData, qualificationDetails: e.target.value })}
                            placeholder="Degrees, certifications, and experience..."
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-6 h-10 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"
                        >
                            {isSaving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
