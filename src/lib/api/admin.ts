import axiosInstance from '../utils/axios';
import { Doctor, UpdateDoctorRequest } from '../../types/admin';

export const adminApi = {
    getAllDoctors: async (params: {
        page?: number;
        pageSize?: number;
        searchTerm?: string;
        department?: string;
        isActive?: boolean
    } = {}) => {
        const response = await axiosInstance.get('admin/doctors', { params });
        return response.data;
    },

    getDoctorDetails: async (id: string) => {
        const response = await axiosInstance.get(`admin/doctors/${id}`);
        return response.data;
    },

    updateDoctor: async (id: string, data: UpdateDoctorRequest) => {
        const response = await axiosInstance.put(`admin/doctors/${id}`, data);
        return response.data;
    },

    deleteDoctor: async (id: string) => {
        const response = await axiosInstance.delete(`admin/doctors/${id}`);
        return response.data;
    },

    regenerateKeys: async (id: string) => {
        const response = await axiosInstance.post(`admin/doctors/${id}/regenerate-keys`);
        return response.data;
    },

    // User Management
    getUsers: async (params: {
        page?: number;
        pageSize?: number;
        searchTerm?: string;
        role?: string;
        isActive?: boolean
    } = {}) => {
        const response = await axiosInstance.get('admin/users', { params });
        return response.data;
    },

    updateUserStatus: async (id: string, isActive: boolean) => {
        const response = await axiosInstance.put(`admin/users/${id}/status`, isActive);
        return response.data;
    },

    updateUser: async (id: string, data: any) => {
        const response = await axiosInstance.put(`admin/users/${id}`, data);
        return response.data;
    }
};
