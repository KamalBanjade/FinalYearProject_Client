'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { MedicalLoader } from '@/components/ui/MedicalLoader';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, hasChecked, checkAuth, getDashboardUrl } = useAuthStore();

  useEffect(() => {
    if (!hasChecked) {
      checkAuth();
      return;
    }

    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      router.replace(getDashboardUrl(user));
    }
  }, [isAuthenticated, user, isLoading, hasChecked, checkAuth, router, getDashboardUrl]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl z-[9999]">
      <MedicalLoader />
    </div>
  );
}
