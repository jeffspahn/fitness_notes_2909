# Fitness Tracker

Eine einfache, persönliche Fitness-Tracking Webapp für Vercel.

## Features

- 🔐 Einfache Anmeldung mit hardcodierten Credentials
- 💪 Workout-Erfassung mit Gewicht und Wiederholungen
- 📅 Trainingstage dokumentieren
- 📊 Dashboard mit Statistiken
- 📁 CSV-Upload für Trainingsplan-Erstellung
- 💾 Lokale Datenspeicherung mit localStorage

## Setup

### Lokale Entwicklung

1. Repository klonen
2. Dependencies installieren:
   ```bash
   npm install
   ```

3. Environment-Variablen setzen:
   ```bash
   # .env.local erstellen
   NEXT_PUBLIC_USERNAME=admin
   NEXT_PUBLIC_PASSWORD=fitness2024
   ```

4. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

5. App öffnen: http://localhost:3000

### Vercel Deployment

1. Repository zu GitHub/GitLab pushen
2. Bei Vercel anmelden und neues Projekt erstellen
3. Repository verbinden
4. Environment-Variablen in Vercel setzen:
   - `NEXT_PUBLIC_USERNAME`: Dein gewünschter Benutzername
   - `NEXT_PUBLIC_PASSWORD`: Dein gewünschtes Passwort
5. Deploy starten

## Verwendung

### Login
- Standard-Credentials: `admin` / `fitness2024`
- Oder eigene Credentials über Environment-Variablen

### Trainingsplan erstellen
1. Gehe zu "Trainingsplan"
2. CSV-Datei hochladen mit folgendem Format:
   ```csv
   name,category,description
   Bankdrücken,Brust,Klassische Brustübung
   Kniebeugen,Beine,Übung für die Beinmuskulatur
   ```
3. CSV-Vorlage herunterladen für korrektes Format

### Workout erfassen
1. Gehe zu "Neues Workout"
2. Workout-Name und Datum eingeben
3. Übungen aus der Liste auswählen
4. Gewicht und Wiederholungen für jeden Satz eingeben
5. Speichern

### Dashboard
- Übersicht über alle Workouts
- Statistiken (Gesamt-Workouts, diese Woche, etc.)
- Letzte Workouts anzeigen

## Technologie-Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **CSV-Parsing**: Papa Parse
- **Storage**: localStorage
- **Deployment**: Vercel

## Sicherheit

- Einfache Authentifizierung für Single-User
- Alle Daten werden lokal im Browser gespeichert
- Keine Server-seitige Datenspeicherung
- Environment-Variablen für Credentials

## CSV-Format

Die CSV-Datei für den Trainingsplan sollte folgende Spalten enthalten:

| Spalte | Beschreibung | Erforderlich |
|--------|--------------|--------------|
| name | Name der Übung | ✅ |
| category | Kategorie (z.B. Brust, Beine) | ❌ |
| description | Beschreibung der Übung | ❌ |

Beispiel:
```csv
name,category,description
Bankdrücken,Brust,Klassische Brustübung
Kniebeugen,Beine,Übung für die Beinmuskulatur
Klimmzüge,Rücken,Übung für den Rücken
```

## Lizenz

MIT License - Für persönliche Nutzung.