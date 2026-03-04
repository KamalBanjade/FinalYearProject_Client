import api from '../utils/axios';
import toast from 'react-hot-toast';

export interface UploadMedicalRecordDTO {
    file: File;
    recordType: string;
    description?: string;
    recordDate?: string;
    assignedDoctorId?: string;
}

export interface MedicalRecordResponseDTO {
    id: string;
    patientId: string;
    originalFileName: string;
    recordType: string;
    description?: string;
    recordDate?: string;
    fileSize: number;
    fileSizeFormatted: string;
    mimeType: string;
    state: number; // 0=Draft, 1=Pending, 2=Certified, 3=Emergency, 4=Archived
    stateLabel: string; // Human-readable: 'Draft', 'Awaiting Review', 'Certified', etc.
    rejectionReason?: string; // Populated when state is Draft after rejection
    uploadedAt: string;
    uploadedBy?: string;
    patientName?: string;
    assignedDoctorName?: string;
    assignedDepartment?: string;
    isCertified: boolean;
    certifiedBy?: string;
    certifiedAt?: string;
    version: number;
    canDownload: boolean;
}

export interface UpdateMedicalRecordMetadataDTO {
    recordType?: string;
    description?: string;
    recordDate?: string;
}

const MEDICAL_RECORDS_API = 'patient/records';

export const medicalRecordsApi = {
    // Upload a new medical record
    uploadRecord: async (data: UploadMedicalRecordDTO): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const formData = new FormData();
        formData.append('File', data.file);
        formData.append('RecordType', data.recordType);
        if (data.description) formData.append('Description', data.description);
        if (data.recordDate) formData.append('RecordDate', data.recordDate);
        if (data.assignedDoctorId) formData.append('AssignedDoctorId', data.assignedDoctorId);

        const response = await api.post(`${MEDICAL_RECORDS_API}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60s timeout for large files
        });
        return response.data;
    },

    // Get all patient records
    getMyRecords: async (): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO[] }> => {
        const response = await api.get(MEDICAL_RECORDS_API);
        return response.data; // The current API returns the list directly or wrapped?
        // According to the prompt, all responses are wrapped in { success, message, data }
    },

    // Get record details
    getRecordDetails: async (id: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const response = await api.get(`${MEDICAL_RECORDS_API}/${id}`);
        return response.data;
    },

    // Update record metadata
    updateRecordMetadata: async (id: string, data: UpdateMedicalRecordMetadataDTO): Promise<{ success: boolean; message: string }> => {
        const response = await api.put(`${MEDICAL_RECORDS_API}/${id}/metadata`, data);
        return response.data;
    },

    // Delete/Soft-delete a record
    deleteRecord: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`${MEDICAL_RECORDS_API}/${id}`);
        return response.data;
    },

    // Download a record (handles the Blob response to decrypt and download)
    downloadRecord: async (id: string): Promise<void> => {
        try {
            const response = await api.get(`${MEDICAL_RECORDS_API}/${id}/download`, {
                responseType: 'blob', // crucial for handling binary data stream
            });

            // Get filename from Content-Disposition header if available
            let filename = 'downloaded_record';
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Create a Blob from the response data
            const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading record:', error);
            throw error;
        }
    },

    // FSM: Submit a Draft record for doctor review
    submitForReview: async (id: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const response = await api.post(`${MEDICAL_RECORDS_API}/${id}/submit`);
        return response.data;
    },

    // FSM: Archive a Certified record
    archiveRecord: async (id: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const response = await api.post(`${MEDICAL_RECORDS_API}/${id}/archive`);
        return response.data;
    },

    // FSM: Doctor certifies a record
    certifyRecord: async (id: string, notes?: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const response = await api.post(`doctor/records/${id}/certify`, { certificationNotes: notes });
        return response.data;
    },

    // FSM: Doctor rejects a record
    rejectRecord: async (id: string, reason: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const response = await api.post(`doctor/records/${id}/reject`, { rejectionReason: reason });
        return response.data;
    },

    // Get all pending records for doctor review
    getPendingRecords: async (): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO[] }> => {
        const response = await api.get('doctor/pending-records');
        return response.data;
    },

    // Download a record for doctor review
    downloadRecordForDoctor: async (id: string): Promise<void> => {
        try {
            const response = await api.get(`doctor/records/${id}/download`, {
                responseType: 'blob',
            });

            let filename = 'downloaded_record';
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading record:', error);
            throw error;
        }
    },

    // Preview a record in a new tab
    previewRecordForDoctor: async (id: string): Promise<void> => {
        try {
            const response = await api.get(`doctor/records/${id}/download`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);

            // Open in new tab
            window.open(url, '_blank');

            // Note: We can't easily revokeObjectURL for a new tab without keeping the current page state 
            // but for a single session preview it's acceptable.
        } catch (error) {
            console.error('Error previewing record:', error);
            toast.error('Failed to preview document');
        }
    },
    // Verify digital signature integrity
    verifySignature: async (id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            isValid: boolean;
            message: string;
            isCertified: boolean;
            certifiedBy: string;
            certifiedAt: string;
            recordHash: string;
            signature: string;
            hashMatchesCurrentFile: boolean;
            integrityStatus: string;
        }
    }> => {
        const response = await api.post(`medical-records/${id}/verify-signature`);
        return response.data;
    },
};
