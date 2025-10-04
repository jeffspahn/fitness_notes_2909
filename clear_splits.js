// Clear all splits from localStorage
if (typeof window !== 'undefined') {
  localStorage.removeItem('fitness_tracker_splits');
  console.log('All splits cleared from localStorage');
}