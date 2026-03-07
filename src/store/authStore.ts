import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axiosInstance from '../lib/utils/axios';
import { User, AuthResponse } from '../types/auth';
import fpPromise from '@fingerprintjs/fingerprintjs';

// Helper to get device fingerprint
const getDeviceFingerprint = async () => {
    try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        return {
            browser: 'value' in (result.components.vendor || {}) ? (result.components.vendor as any).value : 'Unknown',
            os: 'value' in (result.components.platform || {}) ? (result.components.platform as any).value : 'Unknown',
            screenResolution: 'value' in (result.components.screenResolution || {}) ? `${(result.components.screenResolution as any).value[0]}x${(result.components.screenResolution as any).value[1]}` : 'Unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
            language: navigator.language || 'Unknown'
        };
    } catch (e) {
        console.error("Failed to generate fingerprint", e);
        return null; // Fallback
    }
};

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasChecked: boolean; // Tracks if the initial session check completed
    requiresTwoFactor: boolean;
    error: string | null;
    rememberedEmail: string | null;

    // Actions
    login: (credentials: any) => Promise<void>;
    loginWithTwoFactor: (data: { email: string; password: string; twoFactorCode: string; rememberDevice?: boolean }) => Promise<void>;
    register: (userData: any) => Promise<any>;
    resendVerificationEmail: (email: string) => Promise<void>;
    inviteDoctor: (doctorData: any) => Promise<any>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
    checkAuth: () => Promise<void>;
    clearError: () => void;
    getDashboardUrl: (user: User | null) => string;

    // Trusted Devices
    getUserDevices: () => Promise<any[]>;
    revokeDevice: (deviceToken: string) => Promise<void>;
    revokeAllDevices: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false, // Start as false so checkAuth can be triggered
            hasChecked: false,
            requiresTwoFactor: false,
            error: null,
            rememberedEmail: null,

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            clearError: () => set({ error: null }),

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    // Inject device fingerprint and token
                    const fingerprint = await getDeviceFingerprint();
                    const emailKey = credentials.email.toLowerCase();
                    const deviceToken = localStorage.getItem(`device_token_${emailKey}`) || localStorage.getItem('device_token');

                    const loginPayload = {
                        ...credentials,
                        fingerprint,
                        deviceToken
                    };

                    const response = await axiosInstance.post(`auth/login`, loginPayload);
                    const data: AuthResponse = response.data.data;

                    if (data.requiresTwoFactor) {
                        set({ requiresTwoFactor: true, isLoading: false });
                        return;
                    }

                    // Token is now in HTTP-only cookie, not handleable here
                    if (data.userId) {
                        // Handle Remember Email
                        if (credentials.rememberMe !== undefined) {
                            if (credentials.rememberMe) {
                                set({ rememberedEmail: credentials.email });
                            } else {
                                set({ rememberedEmail: null });
                            }
                        } else if (credentials.rememberDevice !== undefined) {
                            if (credentials.rememberDevice) {
                                set({ rememberedEmail: credentials.email });
                            } else {
                                set({ rememberedEmail: null });
                            }
                        }

                        // Handle Device Token (if returned, usually won't be in initial login)
                        if (data.deviceToken) {
                            localStorage.setItem(`device_token_${emailKey}`, data.deviceToken);
                        }

                        set({
                            user: {
                                id: data.userId,
                                email: data.email,
                                firstName: data.firstName,
                                lastName: data.lastName,
                                role: data.role,
                                twoFactorEnabled: data.twoFactorEnabled ?? false,
                                totpSetupCompleted: data.totpSetupCompleted ?? false,
                                requiresPasswordChange: data.requiresPasswordChange,
                                dateOfBirth: data.dateOfBirth,
                                bloodType: data.bloodType,
                            },
                            isAuthenticated: true,
                            hasChecked: true, // Mark as checked after login too
                            requiresTwoFactor: false,
                            isLoading: false,
                        });

                        if (data.requiresSetup) {
                            sessionStorage.setItem('registrationSetupData', JSON.stringify({
                                totpQRData: data.totpSetupQRData,
                                totpSecretManual: data.totpSecretManual,
                                medicalAccessURL: data.medicalAccessURL,
                                medicalAccessToken: data.medicalAccessToken,
                                expiresAt: data.medicalAccessExpiresAt
                            }));
                            window.location.href = get().getDashboardUrl(get().user);
                            return;
                        }

                        if (data.requiresPasswordChange) {
                            window.location.href = '/reset-password';
                        } else {
                            window.location.href = get().getDashboardUrl(get().user);
                        }
                    }
                } catch (err: any) {
                    const message = err.response?.data?.message || err.response?.data?.Message || 'Login failed. Please check your credentials.';
                    set({ error: message, isLoading: false });
                    throw err;
                }
            },

            loginWithTwoFactor: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const fingerprint = await getDeviceFingerprint();
                    const emailKey = data.email.toLowerCase();
                    const deviceToken = localStorage.getItem(`device_token_${emailKey}`) || localStorage.getItem('device_token');

                    const loginPayload = {
                        ...data,
                        fingerprint,
                        deviceToken
                    };

                    const response = await axiosInstance.post(`auth/login`, loginPayload);
                    const resData: AuthResponse = response.data.data;

                    if (resData.userId) {
                        // Handle Device Token
                        if (data.rememberDevice) {
                            if (resData.deviceToken) {
                                localStorage.setItem(`device_token_${emailKey}`, resData.deviceToken);
                            }
                        } else {
                            localStorage.removeItem(`device_token_${emailKey}`);
                            localStorage.removeItem('device_token'); // Clean up legacy token
                        }

                        set({
                            user: {
                                id: resData.userId,
                                email: resData.email,
                                firstName: resData.firstName,
                                lastName: resData.lastName,
                                role: resData.role,
                                twoFactorEnabled: resData.twoFactorEnabled ?? false,
                                totpSetupCompleted: resData.totpSetupCompleted ?? false,
                                requiresPasswordChange: resData.requiresPasswordChange,
                                dateOfBirth: resData.dateOfBirth,
                                bloodType: resData.bloodType,
                            },
                            isAuthenticated: true,
                            hasChecked: true,
                            requiresTwoFactor: false,
                            isLoading: false,
                        });

                        if (resData.requiresPasswordChange) {
                            window.location.href = '/reset-password';
                        } else {
                            window.location.href = get().getDashboardUrl(get().user);
                        }
                    }
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Invalid two-factor code.';
                    set({ error: message, isLoading: false });
                    throw err;
                }
            },

            register: async (userData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axiosInstance.post(`auth/register`, userData);
                    set({ isLoading: false });
                    return response.data;
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Registration failed.';
                    set({ error: message, isLoading: false });
                    throw err;
                }
            },

            resendVerificationEmail: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    await axiosInstance.post(`auth/resend-verification`, null, {
                        params: { email }
                    });
                    set({ isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to resend verification email.';
                    set({ error: message, isLoading: false });
                    throw err;
                }
            },

            inviteDoctor: async (doctorData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axiosInstance.post(`admin/doctors/invite`, doctorData);
                    set({ isLoading: false });
                    return response.data;
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to invite doctor.';
                    set({ error: message, isLoading: false });
                    throw err;
                }
            },

            logout: async () => {
                try {
                    await axiosInstance.post('auth/logout');
                } catch (err) {
                    console.error('Logout failed', err);
                } finally {
                    // Do not clear device_token here, it's tied to "Remember This Device"
                    // It should only be cleared on explicit revocation or if user unchecks "Remember me" on next login
                    set({
                        user: null,
                        isAuthenticated: false,
                        hasChecked: true, // Still marked as checked
                        requiresTwoFactor: false,
                        error: null,
                    });
                    // Do NOT call window.location.href here.
                    // ProtectedRoute detects isAuthenticated=false and handles
                    // the redirect via router.push — a single clean Next.js navigation.
                }
            },

            checkAuth: async () => {
                set({ isLoading: true });
                try {
                    const response = await axiosInstance.get(`auth/user`);
                    const userData = response.data.data;

                    set({
                        user: {
                            id: userData.id,
                            email: userData.email,
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            role: userData.role,
                            twoFactorEnabled: userData.twoFactorEnabled,
                            totpSetupCompleted: userData.totpSetupCompleted,
                            dateOfBirth: userData.dateOfBirth,
                            bloodType: userData.bloodType,
                        },
                        isAuthenticated: true,
                        isLoading: false,
                        hasChecked: true,
                    });
                } catch (err) {
                    set({ user: null, isAuthenticated: false, isLoading: false, hasChecked: true });
                }
            },

            getDashboardUrl: (user) => {
                if (!user) return '/login';
                switch (user.role) {
                    case 'Admin': return '/admin/dashboard';
                    case 'Doctor': return '/doctor/dashboard';
                    case 'Patient': return '/dashboard';
                    default: return '/dashboard';
                }
            },

            getUserDevices: async () => {
                try {
                    const response = await axiosInstance.get(`auth/trusted-devices`);
                    return response.data.data;
                } catch (err: any) {
                    console.error('Failed to get user devices', err);
                    throw err;
                }
            },

            revokeDevice: async (deviceId) => {
                try {
                    await axiosInstance.delete(`auth/trusted-devices/${deviceId}`);
                    // If revoking the current device, clear local storage matched keys
                    const keysToRemove: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('device_token')) {
                            const val = localStorage.getItem(key);
                            if (val === deviceId || val?.includes(deviceId)) {
                                keysToRemove.push(key);
                            }
                        }
                    }
                    keysToRemove.forEach(k => localStorage.removeItem(k));
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to revoke device.';
                    throw new Error(message);
                }
            },

            revokeAllDevices: async () => {
                try {
                    await axiosInstance.post(`auth/trusted-devices/revoke-all`);
                    const keysToRemove: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('device_token')) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(k => localStorage.removeItem(k));
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Failed to revoke all devices.';
                    throw new Error(message);
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                rememberedEmail: state.rememberedEmail
            }), // Only persist rememberedEmail in localStorage
        }
    )
);
