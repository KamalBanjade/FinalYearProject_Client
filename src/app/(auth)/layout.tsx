import React from 'react';
import { GlobalFooter } from '@/components/layout/GlobalFooter';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-medical-gradient relative overflow-hidden flex flex-col py-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-medical-pattern pointer-events-none opacity-50" />

            <div className="flex-1 relative z-10 w-full flex items-center justify-center py-10">
                {children}
            </div>

            <GlobalFooter />
        </div>
    );
}
