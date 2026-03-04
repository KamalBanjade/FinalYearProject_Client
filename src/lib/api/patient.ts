import axiosInstance from '../utils/axios';

export interface PatientProfileData {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    bloodType: string;
    address: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    allergies: string;
    chronicConditions: string;
}

export interface DoctorBasicInfo {
    id: string;
    firstName: string;
    lastName: string;
}

export interface DoctorSuggestionItem {
    id: string;
    fullName: string;
    department: string;
    suggestionType: 'Appointment' | 'Primary' | 'Recent';
    suggestionLabel?: string;
}

export interface SmartDoctorSuggestionDTO {
    recommendedDoctor: DoctorSuggestionItem | null;
    upcomingAppointmentDoctor: DoctorSuggestionItem | null;
    primaryDoctor: DoctorSuggestionItem | null;
    recentDoctors: DoctorSuggestionItem[];
}

export interface UpdatePatientProfileRequest {
    bloodType?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    allergies?: string;
    chronicConditions?: string;
}

export interface EmergencySettingsDTO {
    bloodType?: string;
    allergies?: string;
    currentMedications?: string;
    chronicConditions?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    emergencyNotesToResponders?: string;
    lastUpdated?: string;
}

export const patientApi = {
    getProfile: async () => {
        const response = await axiosInstance.get('patient/profile');
        return response.data;
    },

    updateProfile: async (data: UpdatePatientProfileRequest) => {
        const response = await axiosInstance.put('patient/profile', data);
        return response.data;
    },

    getDepartments: async (): Promise<{ success: boolean; message: string; data: string[] }> => {
        const response = await axiosInstance.get('patient/doctors/departments');
        return response.data;
    },

    getDoctorsByDepartment: async (department: string): Promise<{ success: boolean; message: string; data: DoctorBasicInfo[] }> => {
        const response = await axiosInstance.get(`patient/doctors?department=${encodeURIComponent(department)}`);
        return response.data;
    },

    getSmartDoctorSuggestions: async (): Promise<{ success: boolean; message: string; data: SmartDoctorSuggestionDTO }> => {
        const response = await axiosInstance.get('medical-records/smart-doctor-suggestions');
        return response.data;
    },

    setPrimaryDoctor: async (doctorId: string): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.put('patient/set-primary-doctor', { doctorId });
        return response.data;
    },

    getEmergencySettings: async (): Promise<{ success: boolean; message: string; data: EmergencySettingsDTO }> => {
        const response = await axiosInstance.get('patient/emergency-settings');
        return response.data;
    },

    updateEmergencySettings: async (data: EmergencySettingsDTO): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.put('patient/emergency-settings', data);
        return response.data;
    },
};
