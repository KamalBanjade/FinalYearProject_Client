'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const inviteSchema = z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    nmcLicense: z.string().min(1, 'NMC License is required'),
    department: z.string().min(1, 'Department is required'),
    specialization: z.string().min(1, 'Specialization is required'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    qualificationDetails: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function InviteDoctorPage() {
    const { inviteDoctor, isLoading } = useAuthStore();
    const [invitationResult, setInvitationResult] = useState<{ email: string; tempPass: string; invitationSent: boolean; message: string } | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
    });

    const onSubmit = async (data: InviteFormData) => {
        try {
            const response = await inviteDoctor(data);
            toast.success('Doctor invitation processed!');
            setInvitationResult({
                email: response.data.email,
                tempPass: response.data.temporaryPassword,
                invitationSent: response.data.invitationSent,
                message: response.data.message
            });
            reset();
        } catch (err) {
            toast.error('Failed to invite doctor. Please check the details.');
        }
    };

    if (invitationResult) {
        return (
            <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-emerald-100">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Invitation Processed!</h2>
                    <p className="text-slate-600">A doctor account has been created for <strong>{invitationResult.email}</strong>.</p>

                    <div className={`p-4 rounded-xl border flex items-start gap-3 text-left ${invitationResult.invitationSent ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                        {invitationResult.invitationSent ? (
                            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        <div>
                            <p className="text-sm font-bold">{invitationResult.invitationSent ? 'Email Sent Successfully' : 'Email Delivery Failed'}</p>
                            <p className="text-xs opacity-90">{invitationResult.message}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left mt-6">
                        <p className="text-sm font-medium text-slate-500 mb-1">Temporary Password</p>
                        <p className="text-2xl font-mono font-bold text-slate-900 tracking-wider break-all">{invitationResult.tempPass}</p>
                        <p className="text-xs text-rose-500 mt-3 font-medium">⚠️ IMPORTANT: Copy this password now. It will not be shown again.</p>
                    </div>

                    <Button
                        onClick={() => setInvitationResult(null)}
                        className="w-full mt-6"
                    >
                        Invite Another Doctor
                    </Button>
                </div>
            </div>
        );
    }

    return (

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-2xl shadow-md border border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="First Name"
                    required
                    {...register('firstName')}
                    error={errors.firstName?.message}
                />
                <Input
                    label="Last Name"
                    required
                    {...register('lastName')}
                    error={errors.lastName?.message}
                />
                <Input
                    label="Email Address"
                    type="email"
                    required
                    {...register('email')}
                    error={errors.email?.message}
                />
                <Input
                    label="Phone Number"
                    required
                    {...register('phoneNumber')}
                    error={errors.phoneNumber?.message}
                />
                <Input
                    label="NMC License Number"
                    required
                    placeholder="e.g. NMC-12345"
                    {...register('nmcLicense')}
                    error={errors.nmcLicense?.message}
                />
                <Input
                    label="Department"
                    required
                    placeholder="e.g. Cardiology"
                    {...register('department')}
                    error={errors.department?.message}
                />
                <Input
                    label="Specialization"
                    required
                    placeholder="e.g. Heart Surgeon"
                    {...register('specialization')}
                    error={errors.specialization?.message}
                />
                <Input
                    label="Qualification Details"
                    placeholder="e.g. MBBS, MD"
                    {...register('qualificationDetails')}
                    error={errors.qualificationDetails?.message}
                />
            </div>

            <div className="pt-6 border-t border-slate-100">
                <Button type="submit" className="w-full h-12 text-lg" isLoading={isLoading}>
                    Invite Doctor & Generate Password
                </Button>
            </div>
        </form>
        </div >
    );
}
