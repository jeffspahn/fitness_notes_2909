'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { getSplits, saveTrainingExecution } from '@/lib/storage';
import { Split, TrainingExecution, WorkoutExercise, WorkoutSet, SplitExercise } from '@/types';
import { Play, Check, X, Plus } from 'lucide-react';

export default function TrainingExecutionPage() {
  const [splits, setSplits] = useState<Split[]>([]);
  const [selectedSplit, setSelectedSplit] = useState<Split | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<TrainingExecution | null>(null);

  useEffect(() => {
    const loadSplits = () => {
      const splitData = getSplits();
      setSplits(splitData);
      setIsLoading(false);
    };

    loadSplits();
  }, []);

  const startTraining = (split: Split) => {
    const execution: TrainingExecution = {
      id: Date.now().toString(),
      splitId: split.id,
      split: split,
      date: new Date().toISOString().split('T')[0],
      exercises: split.exercises.map((splitExercise: SplitExercise) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        exerciseId: splitExercise.exercise.id,
        exercise: splitExercise.exercise,
        sets: Array.from({ length: splitExercise.sets }, (_, index) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          weight: 0,
          reps: splitExercise.repetitions, // Vordefinierte Wiederholungen
          notes: ''
        })),
        notes: ''
      })),
      completed: false
    };

    setCurrentExecution(execution);
    setIsExecuting(true);
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => {
    if (!currentExecution) return;

    setCurrentExecution(prev => ({
      ...prev!,
      exercises: prev!.exercises.map(ex => 
        ex.id === exerciseId 
          ? {
              ...ex,
              sets: ex.sets.map(set => 
                set.id === setId ? { ...set, [field]: value } : set
              )
            }
          : ex
      )
    }));
  };

  const addSet = (exerciseId: string) => {
    if (!currentExecution) return;

    const newSet: WorkoutSet = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      weight: 0,
      reps: 0,
      notes: ''
    };

    setCurrentExecution(prev => ({
      ...prev!,
      exercises: prev!.exercises.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, sets: [...ex.sets, newSet] }
          : ex
      )
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    if (!currentExecution) return;

    setCurrentExecution(prev => ({
      ...prev!,
      exercises: prev!.exercises.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
          : ex
      )
    }));
  };

  const finishTraining = () => {
    if (!currentExecution) return;

    const completedExecution = {
      ...currentExecution,
      completed: true
    };

    saveTrainingExecution(completedExecution);
    setCurrentExecution(null);
    setIsExecuting(false);
  };

  const cancelTraining = () => {
    setCurrentExecution(null);
    setIsExecuting(false);
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

  if (isExecuting && currentExecution) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header currentPage="/training-execution" />
          
          <main className="max-w-4xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            <div className="py-4 sm:py-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {currentExecution.split.name}
                </h1>
                <div className="flex space-x-2">
                  <button
                    onClick={cancelTraining}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Abbrechen</span>
                  </button>
                  <button
                    onClick={finishTraining}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Check className="h-4 w-4" />
                    <span>Abschließen</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {currentExecution.exercises.map((exercise) => (
                  <div key={exercise.id} className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {exercise.exercise.name}
                    </h3>
                    
                    <div className="space-y-3">
                      {exercise.sets.map((set, index) => (
                        <div key={set.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                          <div className="text-sm text-gray-500 sm:col-span-1">
                            Satz {index + 1}
                          </div>
                          <input
                            type="number"
                            placeholder="Gewicht (kg)"
                            value={set.weight || ''}
                            onChange={(e) => updateSet(exercise.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                            className="input-field text-sm sm:col-span-1"
                          />
                          <input
                            type="number"
                            placeholder="Wiederholungen"
                            value={set.reps || ''}
                            onChange={(e) => updateSet(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                            className="input-field text-sm sm:col-span-1"
                          />
                          <div className="flex items-center space-x-2 sm:col-span-1">
                            <input
                              type="text"
                              placeholder="Notizen"
                              value={set.notes || ''}
                              onChange={(e) => updateSet(exercise.id, set.id, 'notes', e.target.value)}
                              className="input-field text-sm flex-1"
                            />
                            {exercise.sets.length > 1 && (
                              <button
                                onClick={() => removeSet(exercise.id, set.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => addSet(exercise.id)}
                        className="text-primary-600 hover:text-primary-800 text-sm flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Satz hinzufügen</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="/training-execution" />
        
        <main className="max-w-4xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
              Training ausführen
            </h1>
            
            {splits.length === 0 ? (
              <div className="text-center py-12">
                <Play className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Keine Splits verfügbar</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Lade zuerst einen Trainingsplan über die Trainingsplan-Seite hoch.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {splits.map((split) => (
                  <div key={split.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{split.name}</h3>
                      <Play className="h-5 w-5 text-primary-600" />
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-4">
                      {split.exercises.length} Übungen
                    </div>
                    
                    <div className="space-y-1 mb-4">
                      {split.exercises.slice(0, 3).map((splitExercise) => (
                        <div key={splitExercise.id} className="text-sm text-gray-600">
                          • {splitExercise.exercise.name} ({splitExercise.sets}×{splitExercise.repetitions})
                        </div>
                      ))}
                      {split.exercises.length > 3 && (
                        <div className="text-sm text-gray-400">
                          +{split.exercises.length - 3} weitere...
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => startTraining(split)}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <Play className="h-4 w-4" />
                      <span>Training starten</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}