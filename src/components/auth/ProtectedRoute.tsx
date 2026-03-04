'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    requireTwoFactor?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole,
    requireTwoFactor = false
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        // Initial auth check if not already loaded
        if (!isAuthenticated) {
            checkAuth();
        }
    }, [isAuthenticated, checkAuth]);

    useEffect(() => {
        if (isLoading) return;

        // 1. Check Authentication
        if (!isAuthenticated) {
            // Don't redirect if we are already on login or register or public pages
            if (pathname !== '/login' && pathname !== '/register') {
                const returnUrl = encodeURIComponent(pathname);
                router.push(`/login?returnUrl=${returnUrl}`);
            }
            return;
        }

        // 2. Check Role Authorization
        if (requiredRole && user?.role !== requiredRole) {
            router.push('/unauthorized');
            return;
        }

        // 3. Check Two-Factor Enforcement
        if (requireTwoFactor && !user?.twoFactorEnabled) {
            router.push('/setup-2fa');
            return;
        }
    }, [isAuthenticated, isLoading, user, requiredRole, requireTwoFactor, router, pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    // If we are authenticated and meet requirements, or if we are checking
    // but haven't redirected yet, we show nothing or children.
    // Actually, we should only show children if authenticated.
    if (!isAuthenticated && pathname !== '/login' && pathname !== '/register') {
        return null;
    }

    // If role check fails, don't show children while redirecting
    if (requiredRole && user?.role !== requiredRole) {
        return null;
    }

    // If 2FA mandatory but not enabled
    if (requireTwoFactor && !user?.twoFactorEnabled) {
        return null;
    }

    return <>{children}</>;
};
