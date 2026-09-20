const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../server/exam_attendance.db');
const db = new Database(dbPath);

console.log('--- Purging all examination, student, room, and log data ---');

db.exec(`
  DELETE FROM attendance_logs;
  DELETE FROM students;
  DELETE FROM rooms;
  DELETE FROM exams;
  VACUUM;
`);

const examsCount = db.prepare('SELECT COUNT(*) as count FROM exams').get().count;
const studentsCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
const roomsCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
const logsCount = db.prepare('SELECT COUNT(*) as count FROM attendance_logs').get().count;
const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

console.log(`Database Status After Clean Wipe:`);
console.log(`  - Exams: ${examsCount}`);
console.log(`  - Students: ${studentsCount}`);
console.log(`  - Rooms: ${roomsCount}`);
console.log(`  - Attendance Logs: ${logsCount}`);
console.log(`  - Active User Accounts (Admin/Faculty): ${usersCount}`);
console.log('✓ All application data has been completely removed!');
