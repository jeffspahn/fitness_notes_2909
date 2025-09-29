'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { getWorkouts, getTrainingExecutions } from '@/lib/storage';
import { Workout, TrainingExecution } from '@/types';
import Papa from 'papaparse';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, TrendingUp, Calendar, Activity, Target } from 'lucide-react';

export default function AnalyticsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [trainingExecutions, setTrainingExecutions] = useState<TrainingExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const workoutData = getWorkouts();
      const executionData = getTrainingExecutions();
      setWorkouts(workoutData);
      setTrainingExecutions(executionData);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Prepare data for charts
  const prepareWorkoutData = () => {
    const workoutCountByDate = workouts.reduce((acc, workout) => {
      const date = new Date(workout.date).toLocaleDateString('de-DE');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(workoutCountByDate)
      .map(([date, count]) => ({ date, workouts: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const prepareExerciseData = () => {
    const exerciseCount = workouts.reduce((acc, workout) => {
      workout.exercises.forEach(exercise => {
        const name = exercise.exercise.name;
        acc[name] = (acc[name] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(exerciseCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 exercises
  };

  const prepareWeightData = () => {
    const weightData: Record<string, number[]> = {};
    
    workouts.forEach(workout => {
      const date = new Date(workout.date).toLocaleDateString('de-DE');
      workout.exercises.forEach(exercise => {
        const exerciseName = exercise.exercise.name;
        const key = `${exerciseName}`;
        
        if (!weightData[key]) {
          weightData[key] = [];
        }
        
        exercise.sets.forEach(set => {
          if (set.weight > 0) {
            weightData[key].push({
              date,
              weight: set.weight,
              reps: set.reps
            });
          }
        });
      });
    });

    // Get average weight per exercise per date
    const averagedData: Record<string, Record<string, number>> = {};
    Object.entries(weightData).forEach(([exercise, data]) => {
      const byDate = data.reduce((acc, item) => {
        if (!acc[item.date]) {
          acc[item.date] = [];
        }
        acc[item.date].push(item.weight);
        return acc;
      }, {} as Record<string, number[]>);

      Object.entries(byDate).forEach(([date, weights]) => {
        const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;
        if (!averagedData[exercise]) {
          averagedData[exercise] = {};
        }
        averagedData[exercise][date] = avgWeight;
      });
    });

    return averagedData;
  };

  const prepareSplitData = () => {
    const splitCount = trainingExecutions.reduce((acc, execution) => {
      const splitName = execution.split.name;
      acc[splitName] = (acc[splitName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(splitCount).map(([name, count]) => ({ name, count }));
  };

  const exportToCSV = () => {
    const csvData = workouts.map(workout => ({
      Datum: workout.date,
      'Workout Name': workout.name,
      'Anzahl Übungen': workout.exercises.length,
      'Dauer (Min)': workout.duration || 0,
      'Notizen': workout.notes || '',
      'Übungen': workout.exercises.map(ex => ex.exercise.name).join('; ')
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportTrainingExecutionsToCSV = () => {
    const csvData = trainingExecutions.map(execution => ({
      Datum: execution.date,
      'Split': execution.split.name,
      'Abgeschlossen': execution.completed ? 'Ja' : 'Nein',
      'Anzahl Übungen': execution.exercises.length,
      'Übungen': execution.exercises.map(ex => ex.exercise.name).join('; ')
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training_executions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  const workoutData = prepareWorkoutData();
  const exerciseData = prepareExerciseData();
  const splitData = prepareSplitData();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="/analytics" />
        
        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Auswertung & Analytics
              </h1>
              <div className="flex space-x-2">
                <button
                  onClick={exportToCSV}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Workouts CSV</span>
                </button>
                <button
                  onClick={exportTrainingExecutionsToCSV}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Trainings CSV</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Gesamt Workouts</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{workouts.length}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Trainings ausgeführt</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{trainingExecutions.length}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Beliebteste Übung</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                      {exerciseData[0]?.name || 'Keine'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Aktive Tage</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{workoutData.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Workout Frequency Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout-Häufigkeit</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="workouts" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Exercise Popularity Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Beliebteste Übungen</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={exerciseData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Split Distribution Chart */}
              {splitData.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Split-Verteilung</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={splitData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {splitData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Workout Timeline */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout-Timeline</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={workoutData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="workouts" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Workouts Table */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Letzte Workouts</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workout
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Übungen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dauer
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workouts.slice(0, 10).map((workout) => (
                      <tr key={workout.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(workout.date).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {workout.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {workout.exercises.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {workout.duration ? `${workout.duration} Min` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}