'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import { CSVExercise, Split, Exercise, SplitExercise } from '@/types';
import { saveExercise, getExercises, getSplits, saveSplit, clearAllSplits } from '@/lib/storage';

interface CSVUploadProps {
  onUploadComplete: () => void;
}

export default function CSVUpload({ onUploadComplete }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [splits, setSplits] = useState<Split[]>([]);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replaceMode, setReplaceMode] = useState<'replace' | 'add'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => 
      file.type === 'text/csv' || 
      file.name.endsWith('.csv') || 
      file.type === 'text/plain' || 
      file.name.endsWith('.txt')
    );
    
    if (csvFile) {
      processFile(csvFile);
    } else {
      setUploadStatus('error');
      setErrorMessage('Bitte wähle eine CSV- oder TXT-Datei aus.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Check if there are existing splits
    const existingSplits = getSplits();
    if (existingSplits.length > 0) {
      setPendingFile(file);
      setShowReplaceDialog(true);
      return;
    }

    processFileInternal(file);
  };

  const processFileInternal = (file: File) => {
    setIsProcessing(true);
    setUploadStatus('idle');
    setErrorMessage('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          console.log('Raw CSV data:', results.data);
          console.log('CSV errors:', results.errors);
          
          const csvData = results.data as any[];
          console.log('Parsed CSV data:', csvData);
          
          // Debug: Log the first few rows
          if (csvData.length > 0) {
            console.log('First row:', csvData[0]);
            console.log('First row keys:', Object.keys(csvData[0]));
          }
          
          // Normalize column names (handle different encodings and variations)
          const normalizedData = csvData.map(row => {
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
              const normalizedKey = key.toLowerCase()
                .replace(/[^\w]/g, '') // Remove special characters
                .replace(/ü/g, 'u')
                .replace(/ä/g, 'a')
                .replace(/ö/g, 'o')
                .replace(/ß/g, 'ss')
                .replace(/e/g, 'e'); // Handle umlauts
              
              // More flexible matching
              if (normalizedKey.includes('split') || key.toLowerCase().includes('split')) {
                normalizedRow.split = row[key];
              } else if (normalizedKey.includes('ubung') || normalizedKey.includes('exercise') || 
                        key.toLowerCase().includes('übung') || key.toLowerCase().includes('exercise')) {
                normalizedRow.exercise = row[key];
              } else if (normalizedKey.includes('satze') || normalizedKey.includes('sets') || 
                        key.toLowerCase().includes('sätze') || key.toLowerCase().includes('sets')) {
                normalizedRow.sets = row[key];
              } else if (normalizedKey.includes('wiederholungen') || normalizedKey.includes('repetitions') || 
                        normalizedKey.includes('reps') || key.toLowerCase().includes('wiederholungen')) {
                normalizedRow.repetitions = row[key];
              }
            });
            return normalizedRow;
          });
          
          console.log('Normalized data:', normalizedData);
          
          const validRows = normalizedData.filter(row => 
            row.split && row.exercise && row.sets && row.repetitions &&
            row.split.toString().trim() !== '' && row.exercise.toString().trim() !== ''
          );

          console.log('Valid rows:', validRows.length);
          console.log('Valid rows data:', validRows);

          if (validRows.length === 0) {
            setUploadStatus('error');
            setErrorMessage(`Keine gültigen Zeilen gefunden. Gefundene Spalten: ${csvData.length > 0 ? Object.keys(csvData[0]).join(', ') : 'Keine'}. Erwartet: Split, Übung, Sätze, Wiederholungen`);
            setIsProcessing(false);
            return;
          }

          // Group exercises by split
          const splitMap = new Map<string, SplitExercise[]>();
          const existingExercises = getExercises();
          let newExerciseCount = 0;

          validRows.forEach(row => {
            const splitName = row.split.toString().trim();
            const exerciseName = row.exercise.toString().trim();
            const sets = parseInt(row.sets.toString()) || 3;
            const repetitions = parseInt(row.repetitions.toString()) || 10;
            
            // Find or create exercise
            let exercise = existingExercises.find(ex => 
              ex.name.toLowerCase() === exerciseName.toLowerCase()
            );

            if (!exercise) {
              exercise = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: exerciseName,
                category: 'Allgemein',
                description: ''
              };
              saveExercise(exercise);
              newExerciseCount++;
            }

            // Create SplitExercise
            const splitExercise: SplitExercise = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              exercise: exercise,
              sets: sets,
              repetitions: repetitions
            };

            // Add to split
            if (!splitMap.has(splitName)) {
              splitMap.set(splitName, []);
            }
            splitMap.get(splitName)!.push(splitExercise);
          });

          // Create splits
          const existingSplits = getSplits();
          let newSplitCount = 0;

          splitMap.forEach((splitExercises, splitName) => {
            // Check if split already exists
            const existingSplit = existingSplits.find(s => s.name === splitName);
            
            if (!existingSplit) {
              const newSplit: Split = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: splitName,
                exercises: splitExercises
              };
              saveSplit(newSplit);
              newSplitCount++;
            }
          });

          setUploadedCount(newSplitCount);
          setUploadStatus('success');
          onUploadComplete();
        } catch (error) {
          setUploadStatus('error');
          setErrorMessage('Fehler beim Verarbeiten der Datei.');
        }
        
        setIsProcessing(false);
      },
      error: (error) => {
        setUploadStatus('error');
        setErrorMessage('Fehler beim Lesen der Datei: ' + error.message);
        setIsProcessing(false);
      }
    });
  };

  const handleReplaceConfirm = () => {
    if (pendingFile) {
      if (replaceMode === 'replace') {
        // Clear existing splits
        clearAllSplits();
      }
      // If 'add' mode, keep existing splits and add new ones
      
      setShowReplaceDialog(false);
      processFileInternal(pendingFile);
      setPendingFile(null);
    }
  };

  const handleReplaceCancel = () => {
    setShowReplaceDialog(false);
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setErrorMessage('');
    setUploadedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = 'Split,Übung,Sätze,Wiederholungen\nTag 1,Bankdrücken,3,10\nTag 1,Kniebeugen,4,12\nTag 1,Klimmzüge,3,8\nTag 2,Schulterdrücken,3,10\nTag 2,Latziehen,4,12\nTag 2,Beinpresse,3,15';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trainingsplan_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      {/* Replace Confirmation Dialog */}
      {showReplaceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Trainingsplan ersetzen?
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                Es ist bereits ein Trainingsplan vorhanden mit <strong>{splits.length} Splits</strong>.
              </p>
              <p className="text-gray-600 mb-4">
                Wie möchtest du vorgehen?
              </p>
              
              {splits.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Vorhandene Splits:</p>
                  <div className="text-sm text-gray-600">
                    {splits.slice(0, 3).map(split => (
                      <div key={split.id}>• {split.name}</div>
                    ))}
                    {splits.length > 3 && (
                      <div>• ... und {splits.length - 3} weitere</div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-3 mb-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="replaceMode"
                    value="replace"
                    checked={replaceMode === 'replace'}
                    onChange={(e) => setReplaceMode(e.target.value as 'replace' | 'add')}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>Ersetzen:</strong> Alten Trainingsplan löschen und durch neuen ersetzen
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="replaceMode"
                    value="add"
                    checked={replaceMode === 'add'}
                    onChange={(e) => setReplaceMode(e.target.value as 'replace' | 'add')}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>Hinzufügen:</strong> Neuen Trainingsplan zu den vorhandenen hinzufügen
                  </span>
                </label>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleReplaceCancel}
                  className="flex-1 btn-secondary"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleReplaceConfirm}
                  className="flex-1 btn-primary"
                >
                  {replaceMode === 'replace' ? 'Ersetzen' : 'Hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Trainingsplan hochladen</h2>
        
        {/* Instructions */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">CSV/TXT-Format</h3>
          <p className="text-sm text-blue-700 mb-2">
            Die Datei (CSV oder TXT) sollte folgende Spalten enthalten:
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li><strong>Split:</strong> Trainingstag (z.B. "Tag 1", "Oberkörper", "Push")</li>
            <li><strong>Übung:</strong> Name der Übung (z.B. "Bankdrücken", "Kniebeugen")</li>
            <li><strong>Sätze:</strong> Anzahl der Sätze (z.B. 3, 4, 5)</li>
            <li><strong>Wiederholungen:</strong> Anzahl der Wiederholungen pro Satz (z.B. 10, 12, 15)</li>
          </ul>
          <button
            onClick={downloadTemplate}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            CSV-Vorlage herunterladen
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : uploadStatus === 'success'
              ? 'border-green-500 bg-green-50'
              : uploadStatus === 'error'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600">Verarbeite Datei...</p>
            </div>
          ) : uploadStatus === 'success' ? (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <p className="text-green-700 font-medium">
                  {uploadedCount} neue Übungen erfolgreich hochgeladen!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Du kannst jetzt Workouts mit diesen Übungen erstellen.
                </p>
              </div>
              <button
                onClick={resetUpload}
                className="btn-primary"
              >
                Weitere Datei hochladen
              </button>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <p className="text-red-700 font-medium">Upload fehlgeschlagen</p>
                <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
              </div>
              <button
                onClick={resetUpload}
                className="btn-primary"
              >
                Erneut versuchen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">CSV/TXT-Datei hier ablegen</span> oder klicken zum Auswählen
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Unterstützte Formate: .csv, .txt
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                Datei auswählen
              </button>
            </div>
          )}
        </div>

        {/* Current Splits */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Aktuelle Splits ({splits.length})
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {splits.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Noch keine Splits vorhanden. Lade eine CSV-Datei hoch, um zu beginnen.
              </p>
            ) : (
              splits.map((split) => (
                <div key={split.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{split.name}</h4>
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-500">
                    {split.exercises.length} Übungen
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {split.exercises.map(ex => `${ex.exercise.name} (${ex.sets}×${ex.repetitions})`).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}