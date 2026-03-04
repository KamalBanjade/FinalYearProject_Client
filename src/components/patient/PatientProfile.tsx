import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/utils/axios';
import { patientApi } from '@/lib/api/patient';
import { TrustedDevicesList } from '@/components/auth/TrustedDevicesList';

interface PatientProfileData {
    bloodType: string;
    address: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    allergies: string;
    chronicConditions: string;
}

export const PatientProfile: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const { register, handleSubmit, reset } = useForm<PatientProfileData>();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await patientApi.getProfile();
                const data = response.data;
                reset({
                    bloodType: data.bloodType || '',
                    address: data.address || '',
                    emergencyContactName: data.emergencyContactName || '',
                    emergencyContactPhone: data.emergencyContactPhone || '',
                    allergies: data.allergies || '',
                    chronicConditions: data.chronicConditions || '',
                });
            } catch (err: any) {
                setProfileError('Failed to load profile details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [reset]);

    const onSubmit = async (data: PatientProfileData) => {
        setIsSaving(true);
        try {
            await patientApi.updateProfile(data);
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl h-[28rem] w-full"></div>;
    }

    if (profileError) {
        return (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-6 rounded-3xl border border-rose-100 dark:border-rose-800/50 text-sm font-semibold">
                {profileError}
            </div>
        );
    }

    return (
        <div className="bg-white/40 dark:bg-white/5 rounded-3xl p-8 border border-white/10 dark:border-white/5 shadow-sm relative overflow-hidden backdrop-blur-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Medical Profile</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Blood Type"
                        placeholder="e.g. O+"
                        {...register('bloodType')}
                    />
                    <Input
                        label="Address"
                        placeholder="Residential Address"
                        {...register('address')}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Emergency Contact Name"
                        placeholder="Name of relative/friend"
                        {...register('emergencyContactName')}
                    />
                    <Input
                        label="Emergency Contact Phone"
                        placeholder="Contact number"
                        {...register('emergencyContactPhone')}
                    />
                </div>

                <Input
                    label="Known Allergies"
                    placeholder="List any drug or food allergies"
                    {...register('allergies')}
                />

                <Input
                    label="Chronic Conditions"
                    placeholder="e.g. Hypertension, Diabetes"
                    {...register('chronicConditions')}
                />

                <div className="pt-4 flex justify-end">
                    <Button type="submit" isLoading={isSaving}>
                        Update Profile
                    </Button>
                </div>
            </form>

            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>

            {/* Trusted Devices Section */}
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Trusted Devices</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Devices listed here will skip Two-Factor Authentication for 30 days. Revoke access if a device is lost or compromised.
                    </p>
                </div>
                <TrustedDevicesList />
            </div>
        </div>
    );
};
