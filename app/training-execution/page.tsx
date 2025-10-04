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
          weight: splitExercise.weight || 0,
          reps: splitExercise.repetitions,
          notes: ''
        })),
        notes: ''
      })),
      completed: false
    };

    setCurrentExecution(execution);
    setIsExecuting(true);
  };

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'notes', value: number | string) => {
    if (!currentExecution) return;

    setCurrentExecution(prev => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map(ex => {
        if (ex.id === exerciseId) {
          const updatedSets = ex.sets.map(set => {
            if (set.id === setId) {
              return { ...set, [field]: value };
            }
            return set;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      });
      return { ...prev, exercises: updatedExercises };
    });
  };

  const addSet = (exerciseId: string) => {
    if (!currentExecution) return;

    setCurrentExecution(prev => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map(ex => {
        if (ex.id === exerciseId) {
          const newSet: WorkoutSet = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            weight: 0,
            reps: 0,
            notes: ''
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      });
      return { ...prev, exercises: updatedExercises };
    });
  };

  const removeSet = (exerciseId: string, setId: string) => {
    if (!currentExecution) return;

    setCurrentExecution(prev => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map(ex => {
        if (ex.id === exerciseId) {
          const filteredSets = ex.sets.filter(set => set.id !== setId);
          return { ...ex, sets: filteredSets };
        }
        return ex;
      });
      return { ...prev, exercises: updatedExercises };
    });
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
          
          <main className="max-w-6xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            <div className="py-4 sm:py-6">
              {/* Split Header with Metadata */}
              <div className="card mb-6">
                <div className="flex items-center justify-between mb-4">
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
                
                {/* Split Metadata */}
                {(currentExecution.split.description || currentExecution.split.focus || currentExecution.split.difficulty || currentExecution.split.duration) && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    {currentExecution.split.description && (
                      <p className="text-sm text-gray-700 mb-3">{currentExecution.split.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {currentExecution.split.focus && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {currentExecution.split.focus}
                        </span>
                      )}
                      {currentExecution.split.difficulty && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          currentExecution.split.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                          currentExecution.split.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {currentExecution.split.difficulty}
                        </span>
                      )}
                      {currentExecution.split.duration && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {currentExecution.split.duration} min
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {currentExecution.exercises.map((exercise, exerciseIndex) => {
                  // Find the corresponding SplitExercise to get template data
                  const splitExercise = currentExecution.split.exercises.find(se => se.exercise.id === exercise.exerciseId);
                  
                  return (
                    <div key={exercise.id} className="card">
                      {/* Exercise Header with Template Info */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {exercise.exercise.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {splitExercise?.category && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                {splitExercise.category}
                              </span>
                            )}
                            {splitExercise?.difficulty && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                splitExercise.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                splitExercise.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {splitExercise.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Template Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Template:</span>
                            <span>{splitExercise?.sets || 0} Sätze × {splitExercise?.repetitions || 0} Wdh</span>
                          </div>
                          {splitExercise?.weight && splitExercise.weight > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Startgewicht:</span>
                              <span>{splitExercise.weight} kg</span>
                            </div>
                          )}
                          {splitExercise?.restTime && (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Pause:</span>
                              <span>{splitExercise.restTime} Sek</span>
                            </div>
                          )}
                        </div>
                        
                        {splitExercise?.notes && (
                          <div className="p-3 bg-blue-50 rounded-lg mb-4">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Hinweis:</span> {splitExercise.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Sets Input */}
                      <div className="space-y-3">
                        {exercise.sets.map((set, index) => (
                          <div key={set.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-700 sm:col-span-1">
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
                            <input
                              type="text"
                              placeholder="Notizen"
                              value={set.notes || ''}
                              onChange={(e) => updateSet(exercise.id, set.id, 'notes', e.target.value)}
                              className="input-field text-sm sm:col-span-1"
                            />
                            <div className="flex items-center justify-center sm:col-span-1">
                              {exercise.sets.length > 1 && (
                                <button
                                  onClick={() => removeSet(exercise.id, set.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => addSet(exercise.id)}
                          className="text-primary-600 hover:text-primary-800 text-sm flex items-center space-x-1 mt-2"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Satz hinzufügen</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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
              <div className="space-y-8">
                {/* Group splits by training day */}
                {(() => {
                  // Group splits by day (extract day number from name)
                  const groupedSplits = splits.reduce((groups, split) => {
                    console.log('Processing split:', split.name); // Debug log
                    
                    // Check if split name starts with "Tag" followed by a number
                    const dayMatch = split.name.match(/^Tag (\d+)/i);
                    const dayKey = dayMatch ? `Tag ${dayMatch[1]}` : 'Andere';
                    console.log('Day key:', dayKey); // Debug log
                    
                    if (!groups[dayKey]) {
                      groups[dayKey] = [];
                    }
                    groups[dayKey].push(split);
                    return groups;
                  }, {} as Record<string, typeof splits>);
                  
                  console.log('Grouped splits:', groupedSplits); // Debug log

                  // Sort days numerically
                  const sortedDays = Object.keys(groupedSplits).sort((a, b) => {
                    if (a === 'Andere') return 1;
                    if (b === 'Andere') return -1;
                    const aNum = parseInt(a.replace('Tag ', ''));
                    const bNum = parseInt(b.replace('Tag ', ''));
                    return aNum - bNum;
                  });

                  return sortedDays.map((dayName) => {
                    const daySplits = groupedSplits[dayName];
                    return (
                    <div key={dayName} className="space-y-4">
                      <h2 className="text-xl font-bold text-gray-900 border-b-2 border-primary-200 pb-2">
                        {dayName}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {daySplits.map((split) => (
                          <div key={split.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">{dayName}</h3>
                              <Play className="h-5 w-5 text-primary-600" />
                            </div>
                            
                            {/* Split Metadata */}
                            {(split.description || split.focus || split.difficulty || split.duration) && (
                              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                                {split.description && (
                                  <p className="text-xs text-gray-600 mb-1">{split.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {split.focus && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                      {split.focus}
                                    </span>
                                  )}
                                  {split.difficulty && (
                                    <span className={`px-2 py-1 rounded ${
                                      split.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                                      split.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {split.difficulty}
                                    </span>
                                  )}
                                  {split.duration && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                                      {split.duration} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="text-sm text-gray-500 mb-4">
                              {split.exercises.length} Übungen
                            </div>
                            
                            <div className="space-y-1 mb-4">
                              {split.exercises.slice(0, 3).map((splitExercise) => (
                                <div key={splitExercise.id} className="text-sm text-gray-600">
                                  • {splitExercise.exercise.name} ({splitExercise.sets}×{splitExercise.repetitions})
                                  {splitExercise.weight && (
                                    <span className="text-gray-400 ml-1">@ {splitExercise.weight}kg</span>
                                  )}
                                  {splitExercise.difficulty && (
                                    <span className={`ml-2 px-1 py-0.5 text-xs rounded ${
                                      splitExercise.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                      splitExercise.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {splitExercise.difficulty}
                                    </span>
                                  )}
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
                    </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}