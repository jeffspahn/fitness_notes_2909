'use client';

import { useState, useEffect } from 'react';
import { Workout, WorkoutExercise, WorkoutSet, Exercise } from '@/types';
import { getExercises, saveWorkout } from '@/lib/storage';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface WorkoutFormProps {
  workout?: Workout;
  onSave: (workout: Workout) => void;
  onCancel: () => void;
}

export default function WorkoutForm({ workout, onSave, onCancel }: WorkoutFormProps) {
  const [workoutData, setWorkoutData] = useState<Workout>({
    id: workout?.id || '',
    date: workout?.date || new Date().toISOString().split('T')[0],
    name: workout?.name || '',
    exercises: workout?.exercises || [],
    notes: workout?.notes || '',
    duration: workout?.duration || 0
  });

  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExercises = () => {
      const exercises = getExercises();
      setAvailableExercises(exercises);
      setIsLoading(false);
    };

    loadExercises();
  }, []);

  const handleInputChange = (field: keyof Workout, value: any) => {
    setWorkoutData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addExercise = () => {
    if (availableExercises.length === 0) {
      alert('Bitte füge zuerst Übungen über den Trainingsplan hinzu.');
      return;
    }

    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseId: availableExercises[0].id,
      exercise: availableExercises[0],
      sets: [{
        id: Date.now().toString(),
        weight: 0,
        reps: 0,
        notes: ''
      }],
      notes: ''
    };

    setWorkoutData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }));
  };

  const updateExercise = (exerciseId: string, field: keyof WorkoutExercise, value: any) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const updateExerciseSelection = (exerciseId: string, selectedExerciseId: string) => {
    const selectedExercise = availableExercises.find(ex => ex.id === selectedExerciseId);
    if (selectedExercise) {
      updateExercise(exerciseId, 'exerciseId', selectedExerciseId);
      updateExercise(exerciseId, 'exercise', selectedExercise);
    }
  };

  const addSet = (exerciseId: string) => {
    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      weight: 0,
      reps: 0,
      notes: ''
    };

    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, sets: [...ex.sets, newSet] }
          : ex
      )
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
          : ex
      )
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
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

  const handleSave = () => {
    if (!workoutData.name.trim()) {
      alert('Bitte gib einen Namen für das Workout ein.');
      return;
    }

    if (workoutData.exercises.length === 0) {
      alert('Bitte füge mindestens eine Übung hinzu.');
      return;
    }

    const workoutToSave: Workout = {
      ...workoutData,
      id: workoutData.id || Date.now().toString()
    };

    saveWorkout(workoutToSave);
    onSave(workoutToSave);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {workout ? 'Workout bearbeiten' : 'Neues Workout'}
          </h1>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workout Name
            </label>
            <input
              type="text"
              value={workoutData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="input-field"
              placeholder="z.B. Oberkörper Training"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum
            </label>
            <input
              type="date"
              value={workoutData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dauer (Minuten)
            </label>
            <input
              type="number"
              value={workoutData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
              className="input-field"
              placeholder="60"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notizen
          </label>
          <textarea
            value={workoutData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="input-field"
            rows={3}
            placeholder="Notizen zum Workout..."
          />
        </div>

        {/* Exercises */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Übungen</h2>
            <button
              onClick={addExercise}
              className="btn-primary flex items-center space-x-1 sm:space-x-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Übung hinzufügen</span>
              <span className="sm:hidden">Hinzufügen</span>
            </button>
          </div>

          {workoutData.exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Keine Übungen hinzugefügt. Klicke auf "Übung hinzufügen" um zu beginnen.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {workoutData.exercises.map((exercise) => (
                <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <select
                        value={exercise.exerciseId}
                        onChange={(e) => updateExerciseSelection(exercise.id, e.target.value)}
                        className="input-field"
                      >
                        {availableExercises.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => removeExercise(exercise.id)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700">Sätze</h4>
                      <button
                        onClick={() => addSet(exercise.id)}
                        className="text-primary-600 hover:text-primary-800 text-sm flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Satz hinzufügen</span>
                      </button>
                    </div>

                    {exercise.sets.map((set, index) => (
                      <div key={set.id} className="space-y-2 sm:space-y-0">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                          <div className="text-sm text-gray-500 sm:col-span-1">Satz {index + 1}</div>
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
                          {exercise.sets.length > 1 && (
                            <button
                              onClick={() => removeSet(exercise.id, set.id)}
                              className="text-red-600 hover:text-red-800 sm:col-span-1 flex items-center justify-center sm:justify-end"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="sm:hidden">
                          <input
                            type="text"
                            placeholder="Notizen..."
                            value={set.notes || ''}
                            onChange={(e) => updateSet(exercise.id, set.id, 'notes', e.target.value)}
                            className="input-field text-sm w-full"
                          />
                        </div>
                        <div className="hidden sm:block sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Notizen..."
                            value={set.notes || ''}
                            onChange={(e) => updateSet(exercise.id, set.id, 'notes', e.target.value)}
                            className="input-field text-sm w-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Exercise Notes */}
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Übungsnotizen..."
                      value={exercise.notes || ''}
                      onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
}