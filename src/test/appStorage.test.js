import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBatchSessionStatus, parseSessionTimeWindow, standardizeDate, appStorage, generateId } from '../services/appStorage';

describe('appStorage utilities', () => {
  describe('generateId', () => {
    let originalCrypto;

    beforeEach(() => {
      originalCrypto = global.crypto;
    });

    afterEach(() => {
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        configurable: true,
      });
    });

    it('uses crypto.randomUUID when available', () => {
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
      Object.defineProperty(global, 'crypto', {
        value: {
          randomUUID: vi.fn().mockReturnValue(mockUUID),
        },
        configurable: true,
      });

      const result = generateId();

      expect(global.crypto.randomUUID).toHaveBeenCalled();
      expect(result).toBe(mockUUID);
    });

    it('falls back to Math.random implementation when crypto is undefined', () => {
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        configurable: true,
      });

      const result = generateId();

      // Basic UUID format validation regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result).toMatch(uuidRegex);
    });

    it('falls back to Math.random implementation when crypto.randomUUID is undefined', () => {
      Object.defineProperty(global, 'crypto', {
        value: {}, // crypto exists, but no randomUUID
        configurable: true,
      });

      const result = generateId();

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result).toMatch(uuidRegex);
    });

    it('generates unique ids using fallback', () => {
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        configurable: true,
      });

      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
    });
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('parseSessionTimeWindow', () => {
    it('parses valid session time correctly', () => {
      const window = parseSessionTimeWindow('09:00 AM - 12:00 PM');
      expect(window).toEqual({ startMins: 540, endMins: 720 });
    });

    it('returns null for empty string', () => {
      expect(parseSessionTimeWindow('')).toBeNull();
    });

    it('handles implicit AM/PM', () => {
      const window = parseSessionTimeWindow('9:00 - 10:00');
      // 9:00 AM to 10:00 AM
      expect(window).toEqual({ startMins: 540, endMins: 600 });
    });

    it('handles afternoon times without AM/PM', () => {
      const window = parseSessionTimeWindow('1:00 - 3:00');
      // 1 PM to 3 PM
      expect(window).toEqual({ startMins: 780, endMins: 900 });
    });
  });

  describe('getBatchSessionStatus', () => {
    it('returns ACTIVE if isManuallyActive is true', () => {
      expect(getBatchSessionStatus('2023-01-01', '09:00 AM - 12:00 PM', true)).toBe('ACTIVE');
    });

    it('returns UPCOMING for future dates', () => {
      vi.setSystemTime(new Date('2023-01-01T10:00:00'));
      expect(getBatchSessionStatus('2023-01-02', '09:00 AM - 12:00 PM')).toBe('UPCOMING');
    });

    it('returns COMPLETED for past dates', () => {
      vi.setSystemTime(new Date('2023-01-02T10:00:00'));
      expect(getBatchSessionStatus('2023-01-01', '09:00 AM - 12:00 PM')).toBe('COMPLETED');
    });

    it('returns ACTIVE for current date within window', () => {
      vi.setSystemTime(new Date('2023-01-01T10:00:00'));
      expect(getBatchSessionStatus('2023-01-01', '09:00 AM - 12:00 PM')).toBe('ACTIVE');
    });
  });

  describe('standardizeDate', () => {
    it('standardizes YYYY-MM-DD', () => {
      expect(standardizeDate('2023-01-01')).toBe('2023-01-01');
    });

    it('standardizes MM/DD/YYYY', () => {
      expect(standardizeDate('01/02/2023')).toBe('2023-01-02');
    });

    it('standardizes DD/MM/YYYY if first is > 12', () => {
      expect(standardizeDate('15/01/2023')).toBe('2023-01-15');
    });
  });
});

describe('AppStorage Class', () => {
  beforeEach(() => {
    appStorage.db = {
      exams: [],
      rooms: [],
      students: [],
      attendance_logs: [],
      users: []
    };
    appStorage.active_exam_id = null;
    vi.spyOn(appStorage, 'save').mockImplementation(() => {});
    vi.spyOn(appStorage, 'pushToCloud').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createExam', () => {
    it('creates a new exam', () => {
      const result = appStorage.createExam({ name: 'Test Exam' });
      expect(result.success).toBe(true);
      expect(appStorage.db.exams.length).toBe(1);
      expect(appStorage.db.exams[0].name).toBe('Test Exam');
    });
  });

  describe('updateExam', () => {
    it('updates an existing exam', () => {
      const createRes = appStorage.createExam({ name: 'Old Name' });
      const examId = createRes.exam_id;

      const updateRes = appStorage.updateExam(examId, { name: 'New Name' });
      expect(updateRes.success).toBe(true);
      expect(appStorage.db.exams[0].name).toBe('New Name');
    });

    it('returns error if exam not found', () => {
      const updateRes = appStorage.updateExam('invalid_id', { name: 'New Name' });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toBe('Exam not found');
    });
  });

  describe('getActiveExam', () => {
    it('returns null if no exam is active', () => {
      expect(appStorage.getActiveExam()).toBeNull();
    });

    it('returns the active exam', () => {
      appStorage.db.exams.push({ id: '1', status: 'ACTIVE' });
      expect(appStorage.getActiveExam().id).toBe('1');
    });
  });

  describe('login', () => {
    it('returns error for invalid login', () => {
      const result = appStorage.login('invalid', 'invalid');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid username or password');
    });
  });

  describe('roomPinLogin', () => {
    it('returns error if room not found', () => {
      appStorage.db.exams.push({ id: 'active_exam', status: 'ACTIVE' });
      const result = appStorage.roomPinLogin('999', '0000', 'Prof. John');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid PIN for Room 999');
    });
  });
});
