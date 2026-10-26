import fs from 'fs';
import { performance } from 'perf_hooks';

// Simulate appStorage class
const db = {
  exams: [],
  rooms: [],
  students: [],
  users: []
};

// Generate large dataset
console.log('Generating dataset...');
const NUM_EXAMS = 10;
const ROOMS_PER_EXAM = 50;
const STUDENTS_PER_ROOM = 40;

for (let i = 0; i < NUM_EXAMS; i++) {
  db.exams.push({ id: i, exam_date: '2023-10-01', sets_json: '[]' });
  for (let j = 0; j < ROOMS_PER_EXAM; j++) {
    db.rooms.push({ id: `r_${i}_${j}`, exam_id: i, room_number: `R${j}`, faculty_id: `u_${j}` });
    for (let k = 0; k < STUDENTS_PER_ROOM; k++) {
      db.students.push({
        id: `s_${i}_${j}_${k}`,
        exam_id: i,
        room_number: `R${j}`,
        status: k % 10 === 0 ? 'ABSENT' : 'PRESENT',
        is_late: k % 15 === 0
      });
    }
  }
}
for (let j = 0; j < ROOMS_PER_EXAM; j++) {
  db.users.push({ id: `u_${j}`, name: `User ${j}`, email: `user${j}@example.com` });
}
console.log(`Generated ${db.exams.length} exams, ${db.rooms.length} rooms, ${db.students.length} students, ${db.users.length} users.`);

// Original implementation
function getExamsByDateOriginal(date) {
  const exams = db.exams.filter(e => e.exam_date === date);

  const batchesWithRooms = exams.map(exam => {
    const sets = JSON.parse(exam.sets_json || '[]');
    const examRooms = db.rooms.filter(r => String(r.exam_id) === String(exam.id));
    const rooms = examRooms.map(r => {
      const u = db.users.find(usr => String(usr.id) === String(r.faculty_id));
      const roomStudents = db.students.filter(s => String(s.exam_id) === String(exam.id) && String(s.room_number) === String(r.room_number));
      const total = roomStudents.length;
      const present = roomStudents.filter(s => s.status === 'PRESENT').length;
      const absent = total - present;

      return {
        room_id: r.id,
        room_number: r.room_number,
        total_students: total,
        present_count: present,
        absent_count: absent
      };
    });
    return { id: exam.id, rooms };
  });
  return batchesWithRooms;
}

// Optimized implementation
function getExamsByDateOptimized(date) {
  const exams = db.exams.filter(e => e.exam_date === date);

  // OPTIMIZATION HERE: pre-filter and map
  const examIds = exams.map(e => String(e.id));
  const examStudents = db.students.filter(s => examIds.includes(String(s.exam_id)));

  const studentsByExamAndRoom = {};
  for (const s of examStudents) {
    const eId = String(s.exam_id);
    const rNum = String(s.room_number);
    if (!studentsByExamAndRoom[eId]) studentsByExamAndRoom[eId] = {};
    if (!studentsByExamAndRoom[eId][rNum]) studentsByExamAndRoom[eId][rNum] = [];
    studentsByExamAndRoom[eId][rNum].push(s);
  }

  // Pre-map users for faster lookup
  const usersById = {};
  for (const u of db.users) {
    usersById[String(u.id)] = u;
  }

  const batchesWithRooms = exams.map(exam => {
    const sets = JSON.parse(exam.sets_json || '[]');
    const examRooms = db.rooms.filter(r => String(r.exam_id) === String(exam.id));
    const rooms = examRooms.map(r => {
      const u = usersById[String(r.faculty_id)];
      const roomStudents = (studentsByExamAndRoom[String(exam.id)] || {})[String(r.room_number)] || [];
      const total = roomStudents.length;
      const present = roomStudents.filter(s => s.status === 'PRESENT').length;
      const absent = total - present;

      return {
        room_id: r.id,
        room_number: r.room_number,
        total_students: total,
        present_count: present,
        absent_count: absent
      };
    });
    return { id: exam.id, rooms };
  });
  return batchesWithRooms;
}


const t0 = performance.now();
getExamsByDateOriginal('2023-10-01');
const t1 = performance.now();
console.log(`Original took: ${t1 - t0} milliseconds.`);

const t2 = performance.now();
getExamsByDateOptimized('2023-10-01');
const t3 = performance.now();
console.log(`Optimized took: ${t3 - t2} milliseconds.`);
