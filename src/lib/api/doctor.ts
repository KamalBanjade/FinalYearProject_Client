import axiosInstance from '../utils/axios';

export interface DoctorProfileData {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    nmcLicense: string;
    department: string;
    specialization: string;
    hospitalAffiliation: string;
    contactNumber: string;
}

export interface UpdateDoctorProfileRequest {
    department?: string;
    specialization?: string;
    hospitalAffiliation?: string;
    contactNumber?: string;
}

export const doctorApi = {
    getProfile: async () => {
        const response = await axiosInstance.get('doctor/profile');
        return response.data;
    },

    updateProfile: async (data: UpdateDoctorProfileRequest) => {
        const response = await axiosInstance.put('doctor/profile', data);
        return response.data;
    },

    getCertifiedRecords: async () => {
        const response = await axiosInstance.get('doctor/certified-records');
        return response.data;
    }
};
