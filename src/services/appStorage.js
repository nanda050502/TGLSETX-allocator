import * as xlsx from 'xlsx';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'EXAMSET_PRO_DB_FRESH_V11';

/**
 * Format timestamp: HH:MM:SS
 */
function getTimestampString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Standardize date to YYYY-MM-DD
 */
function calculateLateStatus(checkinTimeStr, sessionTimeStr, graceMins = 15) {
  if (!checkinTimeStr || !sessionTimeStr) return { is_late: false, late_minutes: 0 };
  const startTimePart = sessionTimeStr.split('-')[0].trim();
  const match = startTimePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { is_late: false, late_minutes: 0 };

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  const startMins = hours * 60 + minutes;
  const cutoffMins = startMins + Number(graceMins || 15);

  const timeParts = checkinTimeStr.split(':').map(Number);
  if (timeParts.length < 2) return { is_late: false, late_minutes: 0 };
  const checkinMins = timeParts[0] * 60 + timeParts[1];

  if (checkinMins > cutoffMins) {
    return { is_late: true, late_minutes: checkinMins - startMins };
  }
  return { is_late: false, late_minutes: 0 };
}

function isCurrentTimeInSessionSlot(examDateStr, sessionTimeStr) {
  if (!examDateStr || !sessionTimeStr) return false;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (examDateStr !== todayStr) return false;

  const parts = sessionTimeStr.split('-').map(s => s.trim());
  const parseTimeToMins = (timeStr) => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hrs = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hrs < 12) hrs += 12;
    if (ampm === 'AM' && hrs === 12) hrs = 0;
    return hrs * 60 + mins;
  };

  const startMins = parseTimeToMins(parts[0]);
  if (startMins === null) return false;

  const endMins = parts[1] ? parseTimeToMins(parts[1]) : startMins + 120;
  if (endMins === null) return false;

  const currentMins = now.getHours() * 60 + now.getMinutes();
  return currentMins >= startMins && currentMins <= endMins;
}

function standardizeDate(rawDate) {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  if (typeof rawDate === 'number') {
    const dateObj = new Date((rawDate - (25567 + 2)) * 86400 * 1000);
    return dateObj.toISOString().split('T')[0];
  }
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    const day = String(ddmmyyyy[1]).padStart(2, '0');
    const month = String(ddmmyyyy[2]).padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

const SEED_ADMIN_USERS = [
  { id: 1, username: 'admin', password: 'password', name: 'Super Admin', role: 'ADMIN', email: 'admin@tgl2026.edu' },
  { id: 2, username: 'mayank', password: 'mayank@tgl2026', name: 'Mayank', role: 'ADMIN', email: 'mayank@tgl2026.edu' },
  { id: 3, username: 'yahya', password: 'yahya@tgl2026', name: 'Yahya', role: 'ADMIN', email: 'yahya@tgl2026.edu' },
  { id: 4, username: 'nanda', password: 'nanda@tgl2026', name: 'Nanda', role: 'ADMIN', email: 'nanda@tgl2026.edu' },
  { id: 5, username: 'subramanian', password: 'CEO@tgl2026', name: 'Subramanian (CEO)', role: 'ADMIN', email: 'subramanian@tgl2026.edu' }
];

/**
 * Generate fresh empty database (0 mock data)
 */
function generateSeedData() {
  return {
    users: [...SEED_ADMIN_USERS],
    exams: [],
    rooms: [],
    students: [],
    attendance_logs: []
  };
}

class AppStorage {
  constructor() {
    this.init();
  }

  init() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      this.db = generateSeedData();
      this.save();
    } else {
      try {
        this.db = JSON.parse(existing);
        this.ensureAdminUsers();
      } catch (e) {
        this.db = generateSeedData();
        this.save();
      }
    }
  }

  ensureAdminUsers() {
    if (!this.db.users) this.db.users = [];
    SEED_ADMIN_USERS.forEach(adminUser => {
      const idx = this.db.users.findIndex(u => u.username === adminUser.username);
      if (idx >= 0) {
        this.db.users[idx] = { ...this.db.users[idx], ...adminUser };
      } else {
        this.db.users.push(adminUser);
      }
    });
    this.save();
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
  }

  resetToDefaults() {
    this.db = generateSeedData();
    this.save();
    return this.db;
  }

  // Auth Methods
  login(username, password) {
    const user = this.db.users.find(u => u.username === username && u.password === password);
    if (!user) return { success: false, error: 'Invalid username or password' };
    
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        room_number: user.room_number || '901'
      }
    };
  }

  roomPinLogin(roomNumber, roomPin, staffName) {
    const activeExam = this.getActiveExam();
    if (!activeExam) return { success: false, error: 'No active exam session' };

    const room = this.db.rooms.find(r => r.exam_id === activeExam.id && r.room_number === String(roomNumber));
    if (!room || String(room.room_pin) !== String(roomPin)) {
      return { success: false, error: `Invalid PIN for Room ${roomNumber}` };
    }

    let facultyName = staffName?.trim() || room.faculty_name;
    if (!facultyName) {
      facultyName = `Invigilator (Room ${roomNumber})`;
    } else if (staffName?.trim()) {
      room.faculty_name = staffName.trim();
      this.save();
    }

    let faculty = this.db.users.find(u => u.id === room.faculty_id);
    if (!faculty) {
      faculty = { id: 999, name: facultyName, username: `invigilator_${roomNumber}`, role: 'FACULTY', email: `room${roomNumber}@university.edu` };
    }

    const token = `mock-room-pin-token-${roomNumber}-${Date.now()}`;
    return {
      success: true,
      token,
      user: {
        id: faculty.id,
        username: faculty.username,
        name: facultyName,
        role: 'FACULTY',
        room_number: roomNumber
      }
    };
  }

  getAvailableRooms() {
    const activeExam = this.getActiveExam();
    if (!activeExam) return [];

    const examRooms = this.db.rooms.filter(r => r.exam_id === activeExam.id);
    return examRooms.map(r => {
      const f = this.db.users.find(u => u.id === r.faculty_id);
      return {
        room_number: r.room_number,
        faculty_name: f ? f.name : 'Unassigned',
        has_pin: true
      };
    }).sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
  }

  // Exam Methods
  getActiveExam() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Auto-detect batch whose session_time matches current time
    const timeMatchingExam = this.db.exams.find(e => e.exam_date === todayStr && isCurrentTimeInSessionSlot(e.exam_date, e.session_time));
    if (timeMatchingExam) {
      if (timeMatchingExam.status !== 'ACTIVE') {
        this.db.exams.forEach(e => {
          if (e.id === timeMatchingExam.id) e.status = 'ACTIVE';
          else if (e.status === 'ACTIVE') e.status = 'COMPLETED';
        });
        this.save();
      }
      return { ...timeMatchingExam, sets: JSON.parse(timeMatchingExam.sets_json || '["Set A","Set B","Set C","Set D"]') };
    }

    let exam = this.db.exams.find(e => e.status === 'ACTIVE');
    if (!exam && this.db.exams.length > 0) {
      exam = this.db.exams[this.db.exams.length - 1];
    }
    return exam ? { ...exam, sets: JSON.parse(exam.sets_json || '["Set A","Set B","Set C","Set D"]') } : null;
  }

  getExams() {
    return this.db.exams.map(e => ({
      ...e,
      sets: JSON.parse(e.sets_json || '["Set A","Set B","Set C","Set D"]')
    })).sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
  }

  switchActiveExam(examId) {
    this.db.exams.forEach(e => {
      if (e.id === Number(examId)) e.status = 'ACTIVE';
      else if (e.status === 'ACTIVE') e.status = 'COMPLETED';
    });
    this.save();
    return { success: true, message: `Exam #${examId} is now ACTIVE` };
  }

  createExam(data) {
    const { name, subject_code, exam_date, session_time, sets, google_sheet_url, google_sheet_webhook_url } = data;
    const validSets = Array.isArray(sets) && sets.length > 0 ? sets : ['Set A', 'Set B', 'Set C', 'Set D'];

    this.db.exams.forEach(e => { if (e.status === 'ACTIVE') e.status = 'COMPLETED'; });

    const newId = this.db.exams.length > 0 ? Math.max(...this.db.exams.map(e => e.id)) + 1 : 1;
    const newExam = {
      id: newId,
      name,
      subject_code,
      exam_date: exam_date || new Date().toISOString().split('T')[0],
      session_time: session_time || '09:00 AM',
      sets_json: JSON.stringify(validSets),
      google_sheet_url: google_sheet_url || '',
      google_sheet_webhook_url: google_sheet_webhook_url || '',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    this.db.exams.push(newExam);
    this.save();
    return { success: true, exam_id: newId, message: 'Exam session created successfully' };
  }

  updateExam(id, data) {
    const exam = this.db.exams.find(e => e.id === Number(id));
    if (!exam) return { success: false, error: 'Exam not found' };

    if (data.name) exam.name = data.name;
    if (data.subject_code) exam.subject_code = data.subject_code;
    if (data.exam_date) exam.exam_date = data.exam_date;
    if (data.session_time) exam.session_time = data.session_time;
    if (data.sets) exam.sets_json = JSON.stringify(data.sets);
    if (data.google_sheet_url !== undefined) exam.google_sheet_url = data.google_sheet_url;
    if (data.google_sheet_webhook_url !== undefined) exam.google_sheet_webhook_url = data.google_sheet_webhook_url;
    if (data.status) exam.status = data.status;

    this.save();
    return { success: true, message: 'Exam updated successfully' };
  }

  // Room & Attendance Operations
  getRoomAttendance(roomNumber, examId) {
    let exam;
    if (examId) exam = this.db.exams.find(e => e.id === Number(examId));
    else exam = this.getActiveExam();

    if (!exam) return { error: 'No active exam found' };

    let room = this.db.rooms.find(r => r.exam_id === exam.id && r.room_number === String(roomNumber));
    if (!room) {
      const newRoomId = this.db.rooms.length > 0 ? Math.max(...this.db.rooms.map(r => r.id)) + 1 : 1;
      room = {
        id: newRoomId,
        exam_id: exam.id,
        room_number: String(roomNumber),
        faculty_id: null,
        room_pin: '1234',
        current_set_index: 0,
        room_finalized: false,
        finalized_at: null,
        draft_counter: 0
      };
      this.db.rooms.push(room);
      this.save();
    }

    const sets = JSON.parse(exam.sets_json || '["Set A","Set B","Set C","Set D"]');
    const students = this.db.students.filter(s => s.exam_id === exam.id && String(s.room_number) === String(roomNumber));

    const total = students.length;
    const present = students.filter(s => s.status === 'PRESENT').length;
    const lateCount = students.filter(s => s.status === 'PRESENT' && s.is_late).length;
    const absent = total - present;

    const setsCount = {};
    sets.forEach(setLabel => {
      setsCount[setLabel] = students.filter(s => s.status === 'PRESENT' && s.assigned_set === setLabel).length;
    });

    const orderedStudents = students.map(s => ({
      ...s,
      draft_status: s.draft_status || (s.status === 'PRESENT' ? (room.room_finalized ? 'FINAL_PRESENT' : 'DRAFT_PRESENT') : 'ABSENT'),
      is_late: Boolean(s.is_late),
      late_minutes: s.late_minutes || 0
    })).sort((a, b) => {
      if (a.status === 'PRESENT' && b.status === 'PRESENT') {
        return (a.draft_order || 0) - (b.draft_order || 0);
      }
      return a.roll_number.localeCompare(b.roll_number);
    });

    return {
      exam: {
        id: exam.id,
        name: exam.name,
        subject_code: exam.subject_code,
        exam_date: exam.exam_date,
        session_time: exam.session_time,
        grace_period_minutes: exam.grace_period_minutes || 15,
        sets
      },
      room: {
        room_number: room.room_number,
        current_set_index: room.current_set_index,
        room_finalized: Boolean(room.room_finalized),
        finalized_at: room.finalized_at || null
      },
      stats: {
        total,
        present,
        absent,
        lateCount,
        setsCount
      },
      students: orderedStudents
    };
  }

  markAttendance({ student_id, roll_number, room_number, exam_id, marked_by_user_id }) {
    let student;
    if (student_id) student = this.db.students.find(s => s.id === Number(student_id));
    else if (roll_number && exam_id) student = this.db.students.find(s => s.roll_number === roll_number && s.exam_id === Number(exam_id));

    if (!student) return { error: 'Student not found' };

    if (room_number && String(student.room_number) !== String(room_number)) {
      return {
        error: 'WRONG_ROOM',
        message: `Student ${student.name} (${student.roll_number}) is assigned to Room ${student.room_number}, not Room ${room_number}!`,
        assigned_room: student.room_number,
        student
      };
    }

    const exam = this.db.exams.find(e => e.id === student.exam_id);
    let room = this.db.rooms.find(r => r.exam_id === student.exam_id && String(r.room_number) === String(student.room_number));
    if (!room) {
      const newRoomId = this.db.rooms.length > 0 ? Math.max(...this.db.rooms.map(r => r.id)) + 1 : 1;
      room = { id: newRoomId, exam_id: student.exam_id, room_number: String(student.room_number), faculty_id: null, room_pin: '1234', current_set_index: 0, room_finalized: false, draft_counter: 0 };
      this.db.rooms.push(room);
    }

    if (room.room_finalized) {
      return {
        error: 'ROOM_FINALIZED',
        message: `Room ${student.room_number} attendance has already been finalized and locked. Ask an admin to re-open if changes are required.`,
        student
      };
    }

    if (student.status === 'PRESENT' || student.draft_status === 'DRAFT_PRESENT') {
      return {
        error: 'ALREADY_MARKED',
        message: `${student.name} (${student.roll_number}) is already marked PRESENT`,
        student
      };
    }

    const checkinTime = getTimestampString();
    const isLateArrival = Boolean(exam?.gate_closed);

    room.draft_counter = (room.draft_counter || 0) + 1;

    student.status = 'PRESENT';
    student.draft_status = 'DRAFT_PRESENT';
    student.assigned_set = null; // Paper sets remain hidden / unassigned until headcount finalization!
    student.checkin_time = checkinTime;
    student.is_late = isLateArrival;
    student.late_minutes = isLateArrival ? 'Gate Closed' : 0;
    student.draft_order = room.draft_counter;
    student.marked_by_user_id = marked_by_user_id || null;

    const logId = this.db.attendance_logs.length > 0 ? Math.max(...this.db.attendance_logs.map(l => l.id)) + 1 : 1;
    this.db.attendance_logs.push({
      id: logId,
      exam_id: student.exam_id,
      student_id: student.id,
      room_number: student.room_number,
      roll_number: student.roll_number,
      action: isLateArrival ? 'MARK_LATE_PRESENT' : 'MARK_DRAFT_PRESENT',
      assigned_set: 'PENDING_FINALIZATION',
      timestamp: checkinTime,
      marked_by_user_id: marked_by_user_id || null,
      created_at: new Date().toISOString()
    });

    this.save();

    return {
      success: true,
      message: `${student.name} marked present (${isLateArrival ? 'Late Gate Arrival' : 'On Time'})`,
      student,
      checkin_time: checkinTime,
      is_late: isLateArrival
    };
  }

  toggleExamGate(examId) {
    const exam = this.db.exams.find(e => e.id === Number(examId));
    if (!exam) return { success: false, error: 'Exam not found' };

    exam.gate_closed = !Boolean(exam.gate_closed);
    if (exam.gate_closed) {
      exam.gate_closed_at = getTimestampString();
    } else {
      exam.gate_closed_at = null;
    }

    const logId = this.db.attendance_logs.length > 0 ? Math.max(...this.db.attendance_logs.map(l => l.id)) + 1 : 1;
    this.db.attendance_logs.push({
      id: logId,
      exam_id: exam.id,
      student_id: null,
      room_number: 'ALL',
      roll_number: 'N/A',
      action: exam.gate_closed ? 'CLOSE_GATE' : 'REOPEN_GATE',
      assigned_set: exam.gate_closed ? `Gate Closed at ${exam.gate_closed_at}` : 'Gate Re-opened',
      timestamp: getTimestampString(),
      marked_by_user_id: null,
      created_at: new Date().toISOString()
    });

    this.save();
    return {
      success: true,
      gate_closed: exam.gate_closed,
      message: exam.gate_closed ? `Attendance gate closed by Admin at ${exam.gate_closed_at}` : 'Gate re-opened for on-time attendance'
    };
  }

  undoAttendance({ student_id, marked_by_user_id }) {
    const student = this.db.students.find(s => s.id === Number(student_id));
    if (!student) return { error: 'Student not found' };
    if (student.status !== 'PRESENT') return { error: 'Student is not marked as PRESENT' };

    let room = this.db.rooms.find(r => r.exam_id === student.exam_id && String(r.room_number) === String(student.room_number));
    if (room && room.room_finalized) {
      return { error: 'ROOM_FINALIZED', message: `Cannot undo attendance because Room ${student.room_number} is finalized and locked.` };
    }

    const previousSet = student.assigned_set;
    const undoTime = getTimestampString();

    student.status = 'ABSENT';
    student.draft_status = 'ABSENT';
    student.assigned_set = null;
    student.checkin_time = null;
    student.is_late = false;
    student.late_minutes = 0;
    student.draft_order = null;

    const logId = this.db.attendance_logs.length > 0 ? Math.max(...this.db.attendance_logs.map(l => l.id)) + 1 : 1;
    this.db.attendance_logs.push({
      id: logId,
      exam_id: student.exam_id,
      student_id: student.id,
      room_number: student.room_number,
      roll_number: student.roll_number,
      action: 'UNDO_ABSENT',
      assigned_set: previousSet || 'N/A',
      timestamp: undoTime,
      marked_by_user_id: marked_by_user_id || null,
      created_at: new Date().toISOString()
    });

    this.save();

    return {
      success: true,
      message: `Unmarked attendance for ${student.name} (${student.roll_number})`,
      student
    };
  }

  finalizeRoomAttendance({ room_number, exam_id, marked_by_user_id }) {
    let exam;
    if (exam_id) exam = this.db.exams.find(e => e.id === Number(exam_id));
    else exam = this.getActiveExam();

    if (!exam) return { success: false, error: 'No active exam found' };

    let room = this.db.rooms.find(r => r.exam_id === exam.id && String(r.room_number) === String(room_number));
    if (!room) return { success: false, error: `Room ${room_number} not found` };

    const sets = JSON.parse(exam.sets_json || '["Set A","Set B","Set C","Set D"]');
    const roomStudents = this.db.students.filter(s => s.exam_id === exam.id && String(s.room_number) === String(room_number));
    const presentStudents = roomStudents
      .filter(s => s.status === 'PRESENT')
      .sort((a, b) => (a.draft_order || 0) - (b.draft_order || 0));

    presentStudents.forEach((student, index) => {
      student.assigned_set = sets[index % sets.length];
      student.draft_status = 'FINAL_PRESENT';
      this.triggerSheetSync(student.id);
    });

    room.room_finalized = true;
    room.finalized_at = getTimestampString();

    const logId = this.db.attendance_logs.length > 0 ? Math.max(...this.db.attendance_logs.map(l => l.id)) + 1 : 1;
    this.db.attendance_logs.push({
      id: logId,
      exam_id: exam.id,
      student_id: null,
      room_number: String(room_number),
      roll_number: 'N/A',
      action: 'FINALIZE_ROOM',
      assigned_set: `${presentStudents.length} Students Finalized`,
      timestamp: room.finalized_at,
      marked_by_user_id: marked_by_user_id || null,
      created_at: new Date().toISOString()
    });

    this.save();

    return {
      success: true,
      message: `Successfully finalized and locked Room ${room_number} (${presentStudents.length} candidates confirmed)`,
      finalizedCount: presentStudents.length
    };
  }

  reopenRoomAttendance({ room_number, exam_id }) {
    let exam;
    if (exam_id) exam = this.db.exams.find(e => e.id === Number(exam_id));
    else exam = this.getActiveExam();

    if (!exam) return { success: false, error: 'No active exam found' };

    let room = this.db.rooms.find(r => r.exam_id === exam.id && String(r.room_number) === String(room_number));
    if (!room) return { success: false, error: `Room ${room_number} not found` };

    room.room_finalized = false;
    room.finalized_at = null;

    const logId = this.db.attendance_logs.length > 0 ? Math.max(...this.db.attendance_logs.map(l => l.id)) + 1 : 1;
    this.db.attendance_logs.push({
      id: logId,
      exam_id: exam.id,
      student_id: null,
      room_number: String(room_number),
      roll_number: 'N/A',
      action: 'REOPEN_ROOM',
      assigned_set: 'Room Re-opened by Admin',
      timestamp: getTimestampString(),
      marked_by_user_id: null,
      created_at: new Date().toISOString()
    });

    this.save();
    return { success: true, message: `Room ${room_number} unlocked for attendance changes` };
  }

  getLatePresentees(examId) {
    let exam;
    if (examId) exam = this.db.exams.find(e => e.id === Number(examId));
    else exam = this.getActiveExam();

    if (!exam) return [];

    return this.db.students
      .filter(s => s.exam_id === exam.id && s.status === 'PRESENT' && s.is_late)
      .map(s => ({
        ...s,
        session_time: exam.session_time
      }));
  }

  searchGlobalStudents(query, examId) {
    if (!query || query.trim().length < 2) return [];

    let exam;
    if (examId) exam = this.db.exams.find(e => e.id === Number(examId));
    else exam = this.getActiveExam();

    if (!exam) return [];

    const q = query.trim().toLowerCase();
    return this.db.students.filter(s =>
      s.exam_id === exam.id &&
      (s.roll_number.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    ).slice(0, 10);
  }

  getMasterDirectory(date, batchId) {
    let filtered = [...this.db.students];

    if (date) {
      filtered = filtered.filter(s => {
        const e = this.db.exams.find(ex => ex.id === s.exam_id);
        return e && e.exam_date === date;
      });
    }

    if (batchId && batchId !== 'ALL') {
      filtered = filtered.filter(s => s.exam_id === Number(batchId));
    }

    const students = filtered.map(s => {
      const e = this.db.exams.find(ex => ex.id === s.exam_id);
      return {
        ...s,
        batch_name: s.batch_name || e?.name || '',
        assessment_time: s.assessment_time || e?.session_time || '',
        exam_date: s.exam_date || e?.exam_date || '',
        subject_code: e?.subject_code || ''
      };
    });

    const batches = this.db.exams.map(e => ({
      id: e.id,
      name: e.name,
      subject_code: e.subject_code,
      exam_date: e.exam_date,
      session_time: e.session_time
    }));

    return { students, batches };
  }

  getCalendarSummary() {
    const datesMap = {};

    this.db.exams.forEach(exam => {
      const d = exam.exam_date;
      if (!datesMap[d]) {
        datesMap[d] = {
          exam_date: d,
          batch_count: 0,
          room_count: 0,
          total_students: 0,
          present_count: 0,
          absent_count: 0,
          examIds: new Set()
        };
      }
      datesMap[d].batch_count += 1;
      datesMap[d].examIds.add(exam.id);
    });

    Object.keys(datesMap).forEach(d => {
      const eIds = Array.from(datesMap[d].examIds);

      const rooms = this.db.rooms.filter(r => eIds.includes(r.exam_id));
      datesMap[d].room_count = new Set(rooms.map(r => `${r.exam_id}_${r.room_number}`)).size;

      const students = this.db.students.filter(s => eIds.includes(s.exam_id));
      datesMap[d].total_students = students.length;
      datesMap[d].present_count = students.filter(s => s.status === 'PRESENT').length;
      datesMap[d].absent_count = students.filter(s => s.status === 'ABSENT').length;
    });

    return Object.values(datesMap).sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
  }

  getExamsByDate(date) {
    const exams = this.db.exams.filter(e => e.exam_date === date);

    const batchesWithRooms = exams.map(exam => {
      const sets = JSON.parse(exam.sets_json || '[]');

      const examRooms = this.db.rooms.filter(r => r.exam_id === exam.id);
      const rooms = examRooms.map(r => {
        const u = this.db.users.find(usr => usr.id === r.faculty_id);
        const roomStudents = this.db.students.filter(s => s.exam_id === exam.id && String(s.room_number) === String(r.room_number));
        const total = roomStudents.length;
        const present = roomStudents.filter(s => s.status === 'PRESENT').length;
        const absent = total - present;

        return {
          room_id: r.id,
          room_number: r.room_number,
          room_pin: r.room_pin,
          faculty_name: u ? u.name : 'Unassigned',
          faculty_email: u ? u.email : '',
          faculty_username: u ? u.username : '',
          total_students: total,
          present_count: present,
          absent_count: absent
        };
      }).sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));

      const total = rooms.reduce((acc, r) => acc + r.total_students, 0);
      const present = rooms.reduce((acc, r) => acc + r.present_count, 0);
      const absent = rooms.reduce((acc, r) => acc + r.absent_count, 0);

      return {
        ...exam,
        sets,
        total,
        present,
        absent,
        rooms
      };
    });

    return { date, batches: batchesWithRooms };
  }

  getLiveOverview(examId) {
    const exam = this.db.exams.find(e => e.id === Number(examId));
    if (!exam) return { error: 'Exam not found' };

    const sets = JSON.parse(exam.sets_json || '[]');
    const examRooms = this.db.rooms.filter(r => r.exam_id === exam.id);

    const rooms = examRooms.map(r => {
      const u = this.db.users.find(usr => usr.id === r.faculty_id);
      const roomStudents = this.db.students.filter(s => s.exam_id === exam.id && String(s.room_number) === String(r.room_number));
      const total = roomStudents.length;
      const present = roomStudents.filter(s => s.status === 'PRESENT').length;
      const lateCount = roomStudents.filter(s => s.status === 'PRESENT' && s.is_late).length;

      return {
        room_number: r.room_number,
        room_pin: r.room_pin,
        faculty_name: u ? u.name : 'Unassigned',
        faculty_email: u ? u.email : '',
        total_students: total,
        present_count: present,
        absent_count: total - present,
        late_count: lateCount,
        room_finalized: Boolean(r.room_finalized),
        finalized_at: r.finalized_at || null
      };
    }).sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));

    const students = this.db.students.filter(s => s.exam_id === exam.id);
    const total = students.length;
    const present = students.filter(s => s.status === 'PRESENT').length;
    const lateStudents = students.filter(s => s.status === 'PRESENT' && s.is_late).map(s => ({
      ...s,
      session_time: exam.session_time
    }));

    const setCounts = {};
    sets.forEach(s => {
      setCounts[s] = students.filter(st => st.status === 'PRESENT' && st.assigned_set === s).length;
    });

    const recentLogs = this.db.attendance_logs
      .filter(l => l.exam_id === exam.id)
      .sort((a, b) => b.id - a.id)
      .slice(0, 10)
      .map(l => {
        const s = this.db.students.find(st => st.id === l.student_id);
        return {
          ...l,
          student_name: s ? s.name : `Student #${l.student_id}`
        };
      });

    return {
      exam: {
        ...exam,
        sets
      },
      overall: {
        total,
        present,
        absent: total - present,
        lateCount: lateStudents.length,
        lateStudents,
        setCounts
      },
      rooms,
      recentLogs
    };
  }

  // Faculty Management
  getFacultyList() {
    return this.db.users.filter(u => u.role === 'FACULTY');
  }

  assignRoomFaculty(roomNumber, facultyId, roomPin) {
    const activeExam = this.getActiveExam();
    if (!activeExam) return { success: false, error: 'No active exam found' };

    let room = this.db.rooms.find(r => r.exam_id === activeExam.id && String(r.room_number) === String(roomNumber));
    if (!room) {
      const newRoomId = this.db.rooms.length > 0 ? Math.max(...this.db.rooms.map(r => r.id)) + 1 : 1;
      room = { id: newRoomId, exam_id: activeExam.id, room_number: String(roomNumber), faculty_id: facultyId, room_pin: roomPin || '1234', current_set_index: 0 };
      this.db.rooms.push(room);
    } else {
      room.faculty_id = facultyId ? Number(facultyId) : null;
      if (roomPin) room.room_pin = roomPin;
    }

    if (facultyId) {
      const f = this.db.users.find(u => u.id === Number(facultyId));
      if (f) f.room_number = roomNumber;
    }

    this.save();
    return { success: true, message: `Room ${roomNumber} assigned successfully` };
  }

  // File Ingestion (Client Side Excel/CSV)
  ingestMasterRows(rows, fallbackExamId) {
    let totalAdded = 0;
    const uniqueDates = new Set();
    const groupedBatches = {};

    for (const r of rows) {
      if (!r.roll_number || !r.room_number) continue;
      const dateKey = r.date || new Date().toISOString().split('T')[0];
      const batchKey = r.batch || 'Batch 1';
      const timeKey = r.assessment_time || '08:00 AM - 10:00 AM';
      const groupKey = `${dateKey}___${batchKey}___${timeKey}`;

      if (!groupedBatches[groupKey]) {
        groupedBatches[groupKey] = {
          date: dateKey,
          batch: batchKey,
          assessment_time: timeKey,
          students: []
        };
      }
      groupedBatches[groupKey].students.push(r);
    }

    const provisionedRooms = new Set();

    if (Object.keys(groupedBatches).length === 0 && fallbackExamId) {
      const fallbackExam = this.db.exams.find(e => e.id === Number(fallbackExamId));
      const fBatch = fallbackExam?.name || 'Default Batch';
      const fTime = fallbackExam?.session_time || '08:00 AM - 10:00 AM';
      const fDate = fallbackExam?.exam_date || new Date().toISOString().split('T')[0];

      for (const r of rows) {
        if (!r.roll_number || !r.room_number) continue;
        const roomNo = String(r.room_number);
        const rollNo = String(r.roll_number);

        let room = this.db.rooms.find(rm => rm.exam_id === Number(fallbackExamId) && rm.room_number === roomNo);
        if (!room) {
          const pin = roomNo.length <= 4 ? `${roomNo}0` : roomNo.slice(-4);
          const newRoomId = this.db.rooms.length > 0 ? Math.max(...this.db.rooms.map(rm => rm.id)) + 1 : 1;
          room = { id: newRoomId, exam_id: Number(fallbackExamId), room_number: roomNo, faculty_id: null, room_pin: pin, current_set_index: 0 };
          this.db.rooms.push(room);
        }

        let student = this.db.students.find(s => s.exam_id === Number(fallbackExamId) && s.roll_number === rollNo);
        if (!student) {
          const newStudentId = this.db.students.length > 0 ? Math.max(...this.db.students.map(s => s.id)) + 1 : 1;
          this.db.students.push({
            id: newStudentId,
            exam_id: Number(fallbackExamId),
            room_number: roomNo,
            roll_number: rollNo,
            name: r.name || `Student ${rollNo}`,
            email: r.email || '',
            department: r.department || '',
            batch_name: fBatch,
            assessment_time: fTime,
            exam_date: fDate,
            status: 'ABSENT',
            assigned_set: null,
            checkin_time: null,
            synced_to_sheet: 0
          });
        } else {
          student.room_number = roomNo;
          student.name = r.name || student.name;
          student.email = r.email || student.email;
          student.department = r.department || student.department;
        }

        provisionedRooms.add(roomNo);
        totalAdded++;
      }
    } else {
      for (const groupKey of Object.keys(groupedBatches)) {
        const g = groupedBatches[groupKey];
        uniqueDates.add(g.date);

        let exam = this.db.exams.find(e => e.exam_date === g.date && e.name === g.batch);
        let examId;

        if (exam) {
          examId = exam.id;
          exam.session_time = g.assessment_time;
        } else {
          const newExamId = this.db.exams.length > 0 ? Math.max(...this.db.exams.map(e => e.id)) + 1 : 1;
          const subjectCode = g.batch.length <= 8 ? g.batch.toUpperCase() : g.batch.slice(0, 6).toUpperCase();
          exam = {
            id: newExamId,
            name: g.batch,
            subject_code: subjectCode,
            exam_date: g.date,
            session_time: g.assessment_time,
            sets_json: JSON.stringify(['Set A', 'Set B', 'Set C', 'Set D']),
            google_sheet_url: '',
            google_sheet_webhook_url: '',
            status: 'ACTIVE',
            created_at: new Date().toISOString()
          };
          this.db.exams.push(exam);
          examId = newExamId;
        }

        for (const s of g.students) {
          const roomNo = String(s.room_number);
          const rollNo = String(s.roll_number);

          let room = this.db.rooms.find(rm => rm.exam_id === examId && rm.room_number === roomNo);
          if (!room) {
            const pin = roomNo.length <= 4 ? `${roomNo}0` : roomNo.slice(-4);
            const newRoomId = this.db.rooms.length > 0 ? Math.max(...this.db.rooms.map(rm => rm.id)) + 1 : 1;
            room = { id: newRoomId, exam_id: examId, room_number: roomNo, faculty_id: null, room_pin: pin, current_set_index: 0 };
            this.db.rooms.push(room);
          }

          let student = this.db.students.find(st => st.exam_id === examId && st.roll_number === rollNo);
          if (!student) {
            const newStudentId = this.db.students.length > 0 ? Math.max(...this.db.students.map(st => st.id)) + 1 : 1;
            this.db.students.push({
              id: newStudentId,
              exam_id: examId,
              room_number: roomNo,
              roll_number: rollNo,
              name: s.name || `Student ${rollNo}`,
              email: s.email || '',
              department: s.department || '',
              batch_name: g.batch,
              assessment_time: g.assessment_time,
              exam_date: g.date,
              status: 'ABSENT',
              assigned_set: null,
              checkin_time: null,
              synced_to_sheet: 0
            });
          } else {
            student.room_number = roomNo;
            student.name = s.name || student.name;
            student.email = s.email || student.email;
            student.department = s.department || student.department;
          }

          provisionedRooms.add(`Room ${roomNo} [${g.batch}]`);
          totalAdded++;
        }
      }
    }

    this.save();
    return {
      added: totalAdded,
      dates: Array.from(uniqueDates),
      batchesCount: Object.keys(groupedBatches).length || 1,
      roomsCount: provisionedRooms.size
    };
  }

  // Client side Excel exports
  downloadDayWorkbook(date) {
    const exams = this.db.exams.filter(e => e.exam_date === date);
    if (!exams || exams.length === 0) return { error: `No exam sessions found for date ${date}` };

    const wb = xlsx.utils.book_new();

    // Summary Sheet
    const summaryRows = [];
    let dayTotal = 0, dayPresent = 0, dayAbsent = 0;

    exams.forEach(exam => {
      const sets = JSON.parse(exam.sets_json || '["Set A","Set B","Set C","Set D"]');
      const roomsCount = new Set(this.db.rooms.filter(r => r.exam_id === exam.id).map(r => r.room_number)).size;
      const students = this.db.students.filter(s => s.exam_id === exam.id);
      const total = students.length;
      const present = students.filter(s => s.status === 'PRESENT').length;
      const absent = total - present;

      dayTotal += total;
      dayPresent += present;
      dayAbsent += absent;

      const rowObj = {
        'Batch Name': exam.name,
        'Assessment Time': exam.session_time || 'N/A',
        'Total Rooms': roomsCount,
        'Total Enrolled': total,
        'Present Count': present,
        'Absent Count': absent,
        'Turnout %': total > 0 ? `${Math.round((present / total) * 100)}%` : '0%'
      };

      sets.forEach(setName => {
        const setCount = students.filter(s => s.status === 'PRESENT' && s.assigned_set === setName).length;
        rowObj[`${setName} Distributed`] = setCount;
      });

      summaryRows.push(rowObj);
    });

    summaryRows.push({
      'Batch Name': '--- GRAND TOTAL ---',
      'Assessment Time': `${exams.length} Total Batches`,
      'Total Rooms': '-',
      'Total Enrolled': dayTotal,
      'Present Count': dayPresent,
      'Absent Count': dayAbsent,
      'Turnout %': dayTotal > 0 ? `${Math.round((dayPresent / dayTotal) * 100)}%` : '0%'
    });

    const wsSummary = xlsx.utils.json_to_sheet(summaryRows);
    xlsx.utils.book_append_sheet(wb, wsSummary, 'Executive_Summary');

    // Individual Batch Sheets
    exams.forEach((exam, idx) => {
      const students = this.db.students.filter(s => s.exam_id === exam.id).sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }) || a.roll_number.localeCompare(b.roll_number));
      const sheetData = students.map(s => ({
        'Reg Number': s.roll_number,
        'Student Name': s.name,
        'Room Number': s.room_number,
        'Attendance Status': s.status,
        'Assigned Set': s.assigned_set || 'Unassigned',
        'Check-in Time': s.checkin_time || 'N/A',
        'Email': s.email || '',
        'Department': s.department || ''
      }));

      const wsBatch = xlsx.utils.json_to_sheet(sheetData);
      const safeSheetName = (exam.name || `Batch_${idx + 1}`).replace(/[\/\?\*\\:\[\]]/g, '_').slice(0, 31);
      xlsx.utils.book_append_sheet(wb, wsBatch, safeSheetName);
    });

    xlsx.writeFile(wb, `Attendance_Master_${date}.xlsx`);
    return { success: true };
  }

  downloadSampleTemplate() {
    const sampleRows = [];
    const batches = [
      { name: 'Batch 1 (8-10)', time: '08:00 AM - 10:00 AM' },
      { name: 'Batch 2 (10-12)', time: '10:00 AM - 12:00 PM' },
      { name: 'Batch 3 (1-3)', time: '01:00 PM - 03:00 PM' },
      { name: 'Batch 4 (3-5)', time: '03:00 PM - 05:00 PM' }
    ];
    const date = '2026-09-20';

    batches.forEach((b, bIdx) => {
      for (let r = 101; r <= 104; r++) {
        for (let s = 1; s <= 3; s++) {
          const roll = `RA21${bIdx + 1}${r}${String(s).padStart(2, '0')}`;
          sampleRows.push({
            'Date': date,
            'Batch': b.name,
            'Assessment Time': b.time,
            'Room number': String(r),
            'Name': `Student ${roll}`,
            'Regnumber': roll,
            'Email': `student.${roll.toLowerCase()}@university.edu`
          });
        }
      }
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(sampleRows);
    xlsx.utils.book_append_sheet(wb, ws, 'Master_Exam_Schedule');
    xlsx.writeFile(wb, 'Master_Exam_Attendance_Template.xlsx');
    return { success: true };
  }

  // Google Sheet Sync Webhook (Client Side Direct Fetch)
  async triggerSheetSync(studentId) {
    try {
      const student = this.db.students.find(s => s.id === Number(studentId));
      if (!student) return;

      const exam = this.db.exams.find(e => e.id === student.exam_id);
      if (!exam || !exam.google_sheet_webhook_url) return;

      const payload = {
        action: 'UPDATE_ATTENDANCE',
        roll_number: student.roll_number,
        name: student.name,
        email: student.email,
        room_number: student.room_number,
        department: student.department || '',
        status: student.status,
        assigned_set: student.assigned_set || '',
        checkin_time: student.checkin_time || '',
        exam_name: exam.name,
        subject_code: exam.subject_code,
        timestamp: new Date().toISOString()
      };

      const res = await fetch(exam.google_sheet_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      if (res.ok) {
        student.synced_to_sheet = 1;
        this.save();
      }
    } catch (e) {
      console.warn('Google Sheet background sync warning:', e.message);
    }
  }

  async syncAllToGoogleSheet(examId) {
    const exam = this.db.exams.find(e => e.id === Number(examId));
    if (!exam || !exam.google_sheet_webhook_url) {
      return { success: false, reason: 'No Webhook URL configured. Please paste your Google Apps Script Web App URL first.' };
    }

    const students = this.db.students.filter(s => s.exam_id === Number(examId));
    const payload = {
      action: 'SYNC_ALL',
      exam_name: exam.name,
      subject_code: exam.subject_code,
      students: students.map(s => ({
        roll_number: s.roll_number,
        name: s.name,
        email: s.email,
        room_number: s.room_number,
        department: s.department,
        status: s.status,
        assigned_set: s.assigned_set,
        checkin_time: s.checkin_time
      })),
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch(exam.google_sheet_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      if (res.ok) {
        students.forEach(s => s.synced_to_sheet = 1);
        this.save();
        return { success: true, count: students.length };
      } else {
        return { success: false, status: res.status };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  getGoogleScriptCode() {
    return `/**
 * Google Apps Script for Live Exam Attendance & Set Allocation Sync
 */
function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Roll Number", "Student Name", "Email ID", "Room Number", "Department", "Status", "Assigned Set", "Check-in Time", "Last Updated"]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#1E293B").setFontColor("#FFFFFF").setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    if (data.action === "UPDATE_ATTENDANCE") {
      var rollNumber = String(data.roll_number).trim();
      var dataRange = sheet.getDataRange().getValues();
      var foundRow = -1;
      
      for (var i = 1; i < dataRange.length; i++) {
        if (String(dataRange[i][0]).trim().toUpperCase() === rollNumber.toUpperCase()) {
          foundRow = i + 1;
          break;
        }
      }
      
      var nowStr = new Date().toLocaleTimeString();
      if (foundRow > 0) {
        sheet.getRange(foundRow, 6).setValue(data.status);
        sheet.getRange(foundRow, 7).setValue(data.assigned_set || "");
        sheet.getRange(foundRow, 8).setValue(data.checkin_time || "");
        sheet.getRange(foundRow, 9).setValue(nowStr);
        if (data.status === "PRESENT") {
          sheet.getRange(foundRow, 6).setBackground("#DCFCE7").setFontColor("#15803D").setFontWeight("bold");
          sheet.getRange(foundRow, 7).setBackground("#E0E7FF").setFontColor("#3730A3").setFontWeight("bold");
        } else {
          sheet.getRange(foundRow, 6).setBackground("#FEE2E2").setFontColor("#B91C1C").setFontWeight("normal");
          sheet.getRange(foundRow, 7).setBackground(null).setFontColor("#000000").setFontWeight("normal");
          sheet.getRange(foundRow, 8).setValue("");
        }
      } else {
        sheet.appendRow([data.roll_number, data.name, data.email || "", data.room_number, data.department || "", data.status, data.assigned_set || "", data.checkin_time || "", nowStr]);
        var newRow = sheet.getLastRow();
        if (data.status === "PRESENT") {
          sheet.getRange(newRow, 6).setBackground("#DCFCE7").setFontColor("#15803D").setFontWeight("bold");
          sheet.getRange(newRow, 7).setBackground("#E0E7FF").setFontColor("#3730A3").setFontWeight("bold");
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", roll: rollNumber })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "ignored" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
  }
}

export const appStorage = new AppStorage();
export { standardizeDate };
