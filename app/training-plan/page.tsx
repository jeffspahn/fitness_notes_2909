'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import CSVUpload from '@/components/CSVUpload';
import { getExercises, getSplits } from '@/lib/storage';
import { Exercise, Split } from '@/types';
import { FileText, Trash2, Edit } from 'lucide-react';

export default function TrainingPlanPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const exerciseData = getExercises();
      const splitData = getSplits();
      setExercises(exerciseData);
      setSplits(splitData);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleUploadComplete = () => {
    const exerciseData = getExercises();
    const splitData = getSplits();
    setExercises(exerciseData);
    setSplits(splitData);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="/training-plan" />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Trainingsplan</h1>
            
            <CSVUpload onUploadComplete={handleUploadComplete} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}