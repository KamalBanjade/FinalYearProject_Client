import axiosInstance from "../utils/axios";

export interface PatientListResponseDTO {
    id: string; // Patient ID
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string; // ISO String
    gender: string;
    bloodType?: string;
    allergies?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    sharedRecordsCount: number;
    latestSharedRecordDate?: string;
}

export const doctorPatientsApi = {
    /**
     * Gets all patients who have assigned/shared records with the authenticated doctor
     */
    getDoctorPatients: async (): Promise<PatientListResponseDTO[]> => {
        const response = await axiosInstance.get('/doctor/patients');
        return response.data.data;
    }
};
