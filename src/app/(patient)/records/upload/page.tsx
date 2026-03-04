'use client';

import React from 'react';
import { RecordUpload } from '@/components/patient/RecordUpload';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function UploadRecordPage() {
    const router = useRouter();

    return (
        <div className="w-full px-6 py-4 animate-in fade-in duration-500">
            {/* Header - Absolute Left and Top alignment within the content area */}
            <div className="pt-2 pb-8 text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Upload New Record
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Add a new medical document to your secure vault.</p>
            </div>

            {/* Form - Centered and Spacious */}
            <div className="mx-auto max-w-2xl px-2 pb-20">
                <RecordUpload
                    onUploadSuccess={() => router.push('/records')}
                />
            </div>
        </div>
    );
}
