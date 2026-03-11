import axiosInstance from '../utils/axios';

// ── Section Types ──────────────────────────────────────────────────────────
export interface DoctorProfileSection {
    title: string;
    institution?: string;
    startYear?: string;
    endYear?: string;
    description?: string;
}

export interface DoctorCertificationItem {
    name: string;
    issuingBody?: string;
    year?: string;
    description?: string;
}

export interface DoctorCustomAttribute {
    key: string;
    value: string;
}

// ── Full Profile Read Model ────────────────────────────────────────────────
export interface DoctorExtendedProfile {
    doctorId: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    nmcLicense: string;
    departmentId: string;
    departmentName: string;
    specialization: string;
    hospitalAffiliation?: string;
    contactNumber?: string;
    biography?: string;
    yearsOfExperience?: number;
    consultationFee?: string;
    consultationHours?: string;
    consultationLocation?: string;
    acceptsNewPatients?: boolean;
    education: DoctorProfileSection[];
    experience: DoctorProfileSection[];
    professionalCertifications: DoctorCertificationItem[];
    awards: DoctorProfileSection[];
    procedures: string[];
    languages: string[];
    customAttributes: DoctorCustomAttribute[];
    profileCompletionScore: number;
    missingProfileFields: string[];
}

// ── Update Request ─────────────────────────────────────────────────────────
export interface UpdateDoctorExtendedProfileRequest {
    specialization?: string;
    hospitalAffiliation?: string;
    contactNumber?: string;
    biography?: string;
    yearsOfExperience?: number;
    consultationFee?: string;
    consultationHours?: string;
    consultationLocation?: string;
    acceptsNewPatients?: boolean;
    education?: DoctorProfileSection[];
    experience?: DoctorProfileSection[];
    professionalCertifications?: DoctorCertificationItem[];
    awards?: DoctorProfileSection[];
    procedures?: string[];
    languages?: string[];
    customAttributes?: DoctorCustomAttribute[];
}

// Legacy minimal interface kept for compatibility
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

// ── API Functions ──────────────────────────────────────────────────────────
export const doctorApi = {
    getProfile: async (): Promise<{ data: DoctorExtendedProfile }> => {
        const response = await axiosInstance.get('doctor/profile');
        return response.data;
    },

    updateProfile: async (data: UpdateDoctorExtendedProfileRequest): Promise<{ data: DoctorExtendedProfile }> => {
        const response = await axiosInstance.put('doctor/profile', data);
        return response.data;
    },

    getCertifiedRecords: async () => {
        const response = await axiosInstance.get('doctor/certified-records');
        return response.data;
    },

    getPatientInfo: async (patientId: string) => {
        const response = await axiosInstance.get(`doctor/patients/${patientId}`);
        return response.data;
    }
};
