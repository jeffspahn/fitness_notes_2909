'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/storage';
import LoginForm from '@/components/LoginForm';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user?.isAuthenticated) {
      router.push('/dashboard');
    }
  }, [router]);

  return <LoginForm />;
}