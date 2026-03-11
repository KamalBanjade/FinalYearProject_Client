import axiosInstance from '../utils/axios';

export interface CreateHealthRecordRequest {
    patientId: string;
    appointmentId?: string;
    vitals: {
        bloodPressureSystolic: number;
        bloodPressureDiastolic: number;
        heartRate: number;
        temperature: number;
        weight: number;
        height: number;
        spO2: number;
    };
    sections: {
        sectionName: string;
        attributes: {
            name: string;
            value: string;
        }[];
    }[];
    diagnosis: string;
    treatmentPlan: string;
    doctorNotes?: string;
}

export const healthRecordApi = {
    createRecord: async (data: CreateHealthRecordRequest) => {
        const response = await axiosInstance.post('health-records', data);
        return response.data;
    },

    getRecord: async (id: string) => {
        const response = await axiosInstance.get(`health-records/${id}`);
        return response.data;
    },

    getPatientRecords: async (patientId: string) => {
        const response = await axiosInstance.get(`health-records/patient/${patientId}`);
        return response.data;
    }
};
