import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import {
    UserIcon,
    IdentificationIcon,
    BuildingOffice2Icon,
    XMarkIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { departmentApi, Department as DeptEntity } from '@/lib/api/department';

const inviteDoctorSchema = z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    nmcLicense: z.string().min(5, 'NMC License is required'),
    department: z.string().min(2, 'Department is required'),
    specialization: z.string().min(2, 'Specialization is required'),
    phoneNumber: z.string().min(7, 'Phone number is required'),
    qualificationDetails: z.string().optional(),
});

type InviteDoctorFormData = z.infer<typeof inviteDoctorSchema>;

interface InviteDoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const STEPS = [
    { id: 1, label: 'Personal Info', icon: UserIcon },
    { id: 2, label: 'Credentials', icon: IdentificationIcon },
    { id: 3, label: 'Department', icon: BuildingOffice2Icon },
];

export const InviteDoctorModal: React.FC<InviteDoctorModalProps> = ({ isOpen, onClose }) => {
    const { inviteDoctor } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [departments, setDepartments] = useState<DeptEntity[]>([]);
    const [isFetchingDepts, setIsFetchingDepts] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            fetchDepartments();
        }
    }, [isOpen]);

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

    const {
        register,
        handleSubmit,
        trigger,
        reset,
        formState: { errors },
    } = useForm<InviteDoctorFormData>({
        resolver: zodResolver(inviteDoctorSchema),
        mode: 'onTouched',
    });

    if (!isOpen) return null;

    const handleClose = () => {
        reset();
        setStep(1);
        onClose();
    };

    const goToNext = async () => {
        const fieldsToValidate: (keyof InviteDoctorFormData)[][] = [
            ['email', 'firstName', 'lastName'],
            ['nmcLicense', 'phoneNumber'],
            ['department', 'specialization'],
        ];
        const valid = await trigger(fieldsToValidate[step - 1]);
        if (valid) setStep((s) => s + 1);
    };

    const onSubmit = async (data: InviteDoctorFormData) => {
        setIsLoading(true);
        try {
            await inviteDoctor(data);
            toast.success('Doctor invited successfully! An email has been sent to them.');
            handleClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to invite doctor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-8 pt-8 pb-6">
                    <button
                        onClick={handleClose}
                        className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                    <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Admin Action</p>
                    <h2 className="text-2xl font-extrabold text-white">Onboard New Doctor</h2>
                    <p className="text-slate-400 text-sm mt-1">Complete all steps to send the invitation.</p>

                    {/* Step Progress */}
                    <div className="flex items-center mt-6 gap-2">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isDone = step > s.id;
                            return (
                                <React.Fragment key={s.id}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${isDone ? 'bg-emerald-500 border-emerald-500' :
                                            isActive ? 'bg-white border-white' :
                                                'bg-transparent border-white/30'
                                            }`}>
                                            {isDone
                                                ? <CheckCircleIcon className="w-4 h-4 text-white" />
                                                : <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-white/40'}`} />
                                            }
                                        </div>
                                        <span className={`text-xs font-bold hidden sm:block ${isActive ? 'text-white' : isDone ? 'text-emerald-400' : 'text-white/40'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`flex-1 h-0.5 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-white/20'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="px-8 py-7 space-y-4 min-h-[220px]">

                        {/* Step 1: Personal Info */}
                        {step === 1 && (
                            <>
                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="doctor@hospital.com"
                                    {...register('email')}
                                    error={errors.email?.message}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="First Name"
                                        placeholder="John"
                                        {...register('firstName')}
                                        error={errors.firstName?.message}
                                    />
                                    <Input
                                        label="Last Name"
                                        placeholder="Doe"
                                        {...register('lastName')}
                                        error={errors.lastName?.message}
                                    />
                                </div>
                            </>
                        )}

                        {/* Step 2: Credentials */}
                        {step === 2 && (
                            <>
                                <Input
                                    label="NMC License Number"
                                    placeholder="e.g. NMC-12345"
                                    {...register('nmcLicense')}
                                    error={errors.nmcLicense?.message}
                                />
                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="+977-9800000000"
                                    {...register('phoneNumber')}
                                    error={errors.phoneNumber?.message}
                                />
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Qualification Details <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="e.g. MBBS, MD (Cardiology) — Tribhuvan University"
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                                        {...register('qualificationDetails')}
                                    />
                                </div>
                            </>
                        )}

                        {/* Step 3: Department */}
                        {step === 3 && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700 ml-1">
                                        Department
                                    </label>
                                    <select
                                        {...register('department')}
                                        className={`w-full px-4 py-3 rounded-2xl border ${errors.department ? 'border-red-500' : 'border-slate-200'} text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none bg-white`}
                                        disabled={isFetchingDepts}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.filter(d => d.isActive).map(dept => (
                                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                                        ))}
                                    </select>
                                    {errors.department && (
                                        <p className="text-xs text-red-500 ml-1">{errors.department.message as string}</p>
                                    )}
                                </div>
                                <Input
                                    label="Specialization"
                                    placeholder="e.g. Interventional Cardiologist"
                                    {...register('specialization')}
                                    error={errors.specialization?.message}
                                />
                                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                                    <p className="text-xs text-indigo-700 font-semibold">
                                        ✉️ An invitation email with login credentials will be sent to the doctor upon submission. They will be prompted to change their password on first login.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 pb-7 flex items-center gap-3">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep((s) => s - 1)}
                                className="px-5 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleClose}
                            className={`px-5 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all ${step > 1 ? 'hidden' : ''}`}
                        >
                            Cancel
                        </button>

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={goToNext}
                                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg"
                            >
                                Continue →
                            </button>
                        ) : (
                            <Button
                                type="submit"
                                className="flex-1"
                                isLoading={isLoading}
                            >
                                Send Invitation
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
