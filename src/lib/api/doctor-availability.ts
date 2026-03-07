import { ApiResponse } from '../types';

export interface DoctorAvailabilityDTO {
  id: string;
  doctorId: string;
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string; // "HH:mm:ss"
  endTime: string;
  isAvailable: boolean;
  recurrenceType: number;
  reason?: string;
}

export interface SetWorkingHoursRequest {
  dayOfWeek: number;
  startTime: string; // "HH:mm"
  endTime: string;
}

export interface BlockTimeRequest {
  startDateTime: string;
  endDateTime: string;
  reason: string;
}

export const doctorAvailabilityApi = {
  getSchedule: async (startDate: string, endDate: string): Promise<ApiResponse<DoctorAvailabilityDTO[]>> => {
    const response = await fetch(`/api/doctor/availability/schedule?startDate=${startDate}&endDate=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.json();
  },

  setWorkingHours: async (data: SetWorkingHoursRequest): Promise<ApiResponse<any>> => {
    const response = await fetch('/api/doctor/availability/working-hours', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  blockTime: async (data: BlockTimeRequest): Promise<ApiResponse<any>> => {
    const response = await fetch('/api/doctor/availability/block', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  unblockTime: async (id: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`/api/doctor/availability/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    return response.json();
  },

  getSlots: async (doctorId: string, date: string): Promise<ApiResponse<string[]>> => {
    const response = await fetch(`/api/doctor/availability/slots/${doctorId}?date=${date}`);
    return response.json();
  }
};
