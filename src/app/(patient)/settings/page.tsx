'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheckIcon, IdentificationIcon, ExclamationTriangleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function SettingsHubPage() {
    const settingsOptions = [
        {
            title: 'Security Settings',
            description: 'Manage your password, two-factor authentication, and trusted devices.',
            icon: ShieldCheckIcon,
            href: '/settings/security',
            bgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            borderColor: 'border-indigo-100 dark:border-indigo-500/20'
        },
        {
            title: 'My Profile',
            description: 'Update your personal information, contact details, and preferences.',
            icon: IdentificationIcon,
            href: '/profile',
            bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            borderColor: 'border-emerald-100 dark:border-emerald-500/20'
        },
        {
            title: 'Emergency Settings',
            description: 'Configure critical health information and preferred emergency contacts.',
            icon: ExclamationTriangleIcon,
            href: '/emergency-settings',
            bgColor: 'bg-rose-50 dark:bg-rose-500/10',
            iconColor: 'text-rose-600 dark:text-rose-400',
            borderColor: 'border-rose-100 dark:border-rose-500/20'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingsOptions.map((option, idx) => (
                    <Link href={option.href} key={idx} className="block group">
                        <div className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border ${option.borderColor} shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden h-full flex flex-col`}>
                            {/* Decorative background circle */}
                            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${option.bgColor} opacity-50 group-hover:scale-150 transition-transform duration-500 pointer-events-none`} />

                            <div className={`w-12 h-12 rounded-xl ${option.bgColor} flex items-center justify-center mb-6 relative z-10`}>
                                <option.icon className={`w-6 h-6 ${option.iconColor}`} />
                            </div>

                            <div className="relative z-10 flex-1">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-primary transition-colors">
                                    {option.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    {option.description}
                                </p>
                            </div>

                            <div className="mt-6 flex items-center text-sm font-semibold text-primary dark:text-primary-light opacity-80 group-hover:opacity-100 transition-opacity">
                                Configure
                                <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
