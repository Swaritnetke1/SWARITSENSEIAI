/**
 * SwaritSensei.ai - Enhanced IndexedDB Database Layer V2
 * Now supports dynamic subjects, tuition hours, sleep hours, and full customization
 */

export interface DailyEntry {
  id?: number;
  date: string; // ISO date string (YYYY-MM-DD)
  selfStudyHours: number;
  tuitionHours: number;
  sleepHours: number;
  timepassHours: number;
  goalCompleted: boolean;
  energyRating: number; // 1-5 scale
  subjects: { [subjectId: string]: number }; // Dynamic subject hours
  notes?: string;
  timestamp: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  order: number;
  enabled: boolean;
}

export interface PeerCompetitor {
  id?: number;
  name: string;
  dailyStudyHours: number;
  color: string;
  enabled: boolean;
}

export interface AppSettings {
  id: number;
  isOnboardingComplete: boolean;
  minimumDailyHours: number;
  targetDailyHours: number;
  burnoutThreshold: number;
  maxStudyHoursPerDay: number;
  streakStartDate?: string;
  currentStreak: number;
  subjects: Subject[];
}

const DB_NAME = 'SwaritSenseiDB';
const DB_VERSION = 2; // Incremented version

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'physics', name: 'Physics', color: '#8b5cf6', order: 0, enabled: true },
  { id: 'chemistry', name: 'Chemistry', color: '#3b82f6', order: 1, enabled: true },
  { id: 'maths', name: 'Mathematics', color: '#10b981', order: 2, enabled: true },
  { id: 'biology', name: 'Biology', color: '#f59e0b', order: 3, enabled: true },
  { id: 'cs', name: 'Computer Science', color: '#ef4444', order: 4, enabled: true },
];

class DatabaseV2 {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Daily entries store
        if (!db.objectStoreNames.contains('dailyEntries')) {
          const entryStore = db.createObjectStore('dailyEntries', {
            keyPath: 'id',
            autoIncrement: true,
          });
          entryStore.createIndex('date', 'date', { unique: true });
          entryStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Competitors store
        if (!db.objectStoreNames.contains('competitors')) {
          db.createObjectStore('competitors', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', {
            keyPath: 'id',
          });

          // Initialize default settings
          settingsStore.add({
            id: 1,
            isOnboardingComplete: false,
            minimumDailyHours: 4,
            targetDailyHours: 8,
            burnoutThreshold: 10,
            maxStudyHoursPerDay: 14,
            currentStreak: 0,
            subjects: DEFAULT_SUBJECTS,
          });
        } else if (oldVersion < 2) {
          // Migration: Update existing settings to include new fields
          const transaction = (event.target as IDBOpenDBRequest).transaction!;
          const settingsStore = transaction.objectStore('settings');
          const getRequest = settingsStore.get(1);

          getRequest.onsuccess = () => {
            const settings = getRequest.result;
            if (settings && !settings.subjects) {
              settings.subjects = DEFAULT_SUBJECTS;
              settingsStore.put(settings);
            }
          };
        }
      };
    });
  }

  // ============= DAILY ENTRIES =============

  async addEntry(entry: Omit<DailyEntry, 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['dailyEntries'], 'readwrite');
      const store = transaction.objectStore('dailyEntries');
      const request = store.add(entry);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateEntry(entry: DailyEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['dailyEntries'], 'readwrite');
      const store = transaction.objectStore('dailyEntries');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEntry(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['dailyEntries'], 'readwrite');
      const request = transaction.objectStore('dailyEntries').delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEntryByDate(date: string): Promise<DailyEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['dailyEntries'], 'readonly');
      const store = transaction.objectStore('dailyEntries');
      const index = store.index('date');
      const request = index.get(date);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEntries(): Promise<DailyEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['dailyEntries'], 'readonly');
      const store = transaction.objectStore('dailyEntries');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getEntriesInRange(startDate: string, endDate: string): Promise<DailyEntry[]> {
    const allEntries = await this.getAllEntries();
    return allEntries
      .filter((e) => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ============= COMPETITORS =============

  async addCompetitor(competitor: Omit<PeerCompetitor, 'id'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['competitors'], 'readwrite');
      const store = transaction.objectStore('competitors');
      const request = store.add(competitor);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCompetitor(competitor: PeerCompetitor): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['competitors'], 'readwrite');
      const store = transaction.objectStore('competitors');
      const request = store.put(competitor);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCompetitor(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['competitors'], 'readwrite');
      const store = transaction.objectStore('competitors');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCompetitors(): Promise<PeerCompetitor[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['competitors'], 'readonly');
      const store = transaction.objectStore('competitors');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============= SETTINGS =============

  async getSettings(): Promise<AppSettings> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(1);

      request.onsuccess = () => {
        const settings = request.result;
        // Ensure subjects exist (migration safety — never resets isOnboardingComplete)
        if (settings && !settings.subjects) {
          settings.subjects = DEFAULT_SUBJECTS;
        }
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put(settings);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============= SUBJECT MANAGEMENT =============

  async addSubject(subject: Subject): Promise<void> {
    const settings = await this.getSettings();
    settings.subjects.push(subject);
    await this.updateSettings(settings);
  }

  async updateSubject(subjectId: string, updates: Partial<Subject>): Promise<void> {
    const settings = await this.getSettings();
    const subjectIndex = settings.subjects.findIndex((s) => s.id === subjectId);
    if (subjectIndex !== -1) {
      settings.subjects[subjectIndex] = { ...settings.subjects[subjectIndex], ...updates };
      await this.updateSettings(settings);
    }
  }

  async deleteSubject(subjectId: string): Promise<void> {
    const settings = await this.getSettings();
    settings.subjects = settings.subjects.filter((s) => s.id !== subjectId);
    await this.updateSettings(settings);
  }

  async reorderSubjects(subjects: Subject[]): Promise<void> {
    const settings = await this.getSettings();
    settings.subjects = subjects;
    await this.updateSettings(settings);
  }

  async resetAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['dailyEntries', 'competitors'], 'readwrite');
      transaction.objectStore('dailyEntries').clear();
      transaction.objectStore('competitors').clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    const settings = await this.getSettings();
    await this.updateSettings({ ...settings, currentStreak: 0, streakStartDate: undefined });
  }
}

// Singleton instance
export const dbV2 = new DatabaseV2();
