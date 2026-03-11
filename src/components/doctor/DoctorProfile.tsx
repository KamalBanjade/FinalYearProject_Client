import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/utils/axios';

interface DoctorProfileData {
    department: string;
    specialization: string;
    hospitalAffiliation: string;
    contactNumber: string;
}

export const DoctorProfile: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const { register, handleSubmit, reset } = useForm<DoctorProfileData>();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axiosInstance.get('/doctor/profile');
                reset({
                    department: response.data.data.department || '',
                    specialization: response.data.data.specialization || '',
                    hospitalAffiliation: response.data.data.hospitalAffiliation || '',
                    contactNumber: response.data.data.contactNumber || '',
                });
            } catch (err: any) {
                setProfileError('Failed to load profile details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [reset]);

    const onSubmit = async (data: DoctorProfileData) => {
        setIsSaving(true);
        try {
            await axiosInstance.put('/doctor/profile', data);
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="animate-pulse bg-slate-100 rounded-3xl h-64 w-full"></div>;
    }

    if (profileError) {
        return (
            <div className="bg-rose-50 text-rose-600 p-6 rounded-3xl border border-rose-100 text-sm font-semibold">
                {profileError}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Professional Details</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Department"
                        placeholder="e.g. Cardiology"
                        {...register('department')}
                    />
                    <Input
                        label="Specialization"
                        placeholder="e.g. Pediatric Surgery"
                        {...register('specialization')}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Hospital Affiliation"
                        placeholder="e.g. City General Hospital"
                        {...register('hospitalAffiliation')}
                    />
                    <Input
                        label="Contact Number"
                        placeholder="+1 234 567 8900"
                        {...register('contactNumber')}
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <Button type="submit" isLoading={isSaving}>
                        Save Details
                    </Button>
                </div>
            </form>
        </div>
    );
};
