export interface Exercise {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  date: string; // ISO date string
  name: string;
  exercises: WorkoutExercise[];
  notes?: string;
  duration?: number; // in minutes
}

export interface SplitExercise {
  id: string;
  exercise: Exercise;
  sets: number;
  repetitions: number;
}

export interface Split {
  id: string;
  name: string;
  exercises: SplitExercise[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  description?: string;
  splits: Split[];
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  isAuthenticated: boolean;
}

export interface CSVExercise {
  split: string;
  exercise: string;
  sets: number;
  repetitions: number;
}

export interface TrainingExecution {
  id: string;
  splitId: string;
  split: Split;
  date: string;
  exercises: WorkoutExercise[];
  completed: boolean;
}