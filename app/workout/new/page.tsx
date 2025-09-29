'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import WorkoutForm from '@/components/WorkoutForm';
import { Workout } from '@/types';

export default function NewWorkoutPage() {
  const router = useRouter();

  const handleSave = (workout: Workout) => {
    router.push('/dashboard');
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="/workout/new" />
        <WorkoutForm
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </ProtectedRoute>
  );
}