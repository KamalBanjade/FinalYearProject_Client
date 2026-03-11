'use client';

import React from 'react';
import { RecordUpload } from '@/components/patient/RecordUpload';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function UploadRecordPage() {
    const router = useRouter();

    return (
        <div className="w-full px-1 sm:px-6 py-4 animate-in fade-in duration-500">

            {/* Form - Centered and Spacious */}
            <div className="mx-auto max-w-7xl px-0 pb-20">
                <RecordUpload
                    onUploadSuccess={() => router.push('/records')}
                />
            </div>
        </div>
    );
}
