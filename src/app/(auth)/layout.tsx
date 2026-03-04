'use client';

import React from 'react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-medical-gradient relative overflow-hidden flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-medical-pattern pointer-events-none opacity-50" />

            {/* Theme Toggle for Auth Pages */}
            <div className="absolute top-6 right-8 z-50">
                <ThemeToggle />
            </div>

            <div className="relative z-10 w-full flex justify-center">
                {children}
            </div>
        </div>
    );
}
