import { Workout, Exercise, TrainingPlan, Split, TrainingExecution } from '@/types';

const STORAGE_KEYS = {
  WORKOUTS: 'fitness_tracker_workouts',
  EXERCISES: 'fitness_tracker_exercises',
  TRAINING_PLANS: 'fitness_tracker_training_plans',
  SPLITS: 'fitness_tracker_splits',
  TRAINING_EXECUTIONS: 'fitness_tracker_training_executions',
  USER: 'fitness_tracker_user'
} as const;

// Generic storage functions
function getFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Workout functions
export function getWorkouts(): Workout[] {
  return getFromStorage<Workout[]>(STORAGE_KEYS.WORKOUTS) || [];
}

export function saveWorkout(workout: Workout): void {
  const workouts = getWorkouts();
  const existingIndex = workouts.findIndex(w => w.id === workout.id);
  
  if (existingIndex >= 0) {
    workouts[existingIndex] = workout;
  } else {
    workouts.push(workout);
  }
  
  saveToStorage(STORAGE_KEYS.WORKOUTS, workouts);
}

export function deleteWorkout(workoutId: string): void {
  const workouts = getWorkouts();
  const filteredWorkouts = workouts.filter(w => w.id !== workoutId);
  saveToStorage(STORAGE_KEYS.WORKOUTS, filteredWorkouts);
}

// Exercise functions
export function getExercises(): Exercise[] {
  return getFromStorage<Exercise[]>(STORAGE_KEYS.EXERCISES) || [];
}

export function saveExercise(exercise: Exercise): void {
  const exercises = getExercises();
  const existingIndex = exercises.findIndex(e => e.id === exercise.id);
  
  if (existingIndex >= 0) {
    exercises[existingIndex] = exercise;
  } else {
    exercises.push(exercise);
  }
  
  saveToStorage(STORAGE_KEYS.EXERCISES, exercises);
}

export function deleteExercise(exerciseId: string): void {
  const exercises = getExercises();
  const filteredExercises = exercises.filter(e => e.id !== exerciseId);
  saveToStorage(STORAGE_KEYS.EXERCISES, filteredExercises);
}

// Training plan functions
export function getTrainingPlans(): TrainingPlan[] {
  return getFromStorage<TrainingPlan[]>(STORAGE_KEYS.TRAINING_PLANS) || [];
}

export function saveTrainingPlan(plan: TrainingPlan): void {
  const plans = getTrainingPlans();
  const existingIndex = plans.findIndex(p => p.id === plan.id);
  
  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }
  
  saveToStorage(STORAGE_KEYS.TRAINING_PLANS, plans);
}

export function deleteTrainingPlan(planId: string): void {
  const plans = getTrainingPlans();
  const filteredPlans = plans.filter(p => p.id !== planId);
  saveToStorage(STORAGE_KEYS.TRAINING_PLANS, filteredPlans);
}

// User functions
export function getUser(): { isAuthenticated: boolean } | null {
  return getFromStorage<{ isAuthenticated: boolean }>(STORAGE_KEYS.USER);
}

export function setUserAuthenticated(authenticated: boolean): void {
  saveToStorage(STORAGE_KEYS.USER, { isAuthenticated: authenticated });
}

// Split functions
export function getSplits(): Split[] {
  return getFromStorage<Split[]>(STORAGE_KEYS.SPLITS) || [];
}

export function saveSplit(split: Split): void {
  const splits = getSplits();
  const existingIndex = splits.findIndex(s => s.id === split.id);
  
  if (existingIndex >= 0) {
    splits[existingIndex] = split;
  } else {
    splits.push(split);
  }
  
  saveToStorage(STORAGE_KEYS.SPLITS, splits);
}

export function deleteSplit(splitId: string): void {
  const splits = getSplits();
  const filteredSplits = splits.filter(s => s.id !== splitId);
  saveToStorage(STORAGE_KEYS.SPLITS, filteredSplits);
}

// Training Execution functions
export function getTrainingExecutions(): TrainingExecution[] {
  return getFromStorage<TrainingExecution[]>(STORAGE_KEYS.TRAINING_EXECUTIONS) || [];
}

export function saveTrainingExecution(execution: TrainingExecution): void {
  const executions = getTrainingExecutions();
  const existingIndex = executions.findIndex(e => e.id === execution.id);
  
  if (existingIndex >= 0) {
    executions[existingIndex] = execution;
  } else {
    executions.push(execution);
  }
  
  saveToStorage(STORAGE_KEYS.TRAINING_EXECUTIONS, executions);
}

export function deleteTrainingExecution(executionId: string): void {
  const executions = getTrainingExecutions();
  const filteredExecutions = executions.filter(e => e.id !== executionId);
  saveToStorage(STORAGE_KEYS.TRAINING_EXECUTIONS, filteredExecutions);
}

export function clearAllSplits(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.SPLITS);
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.USER);
}