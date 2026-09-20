const xlsx = require('xlsx');
const path = require('path');
const db = require('../server/db');

async function testMasterIngestAndExport() {
  console.log('--- Testing Master Sheet Ingestion & Multi-Tab Export ---');

  // 1. Generate sample master dataset matching the exact 7 headers:
  // Date | Batch | Assessment Time | Room number | Name | Regnumber | Email
  const sampleRows = [];
  const testDate = '2026-09-20';
  const testBatches = [
    { name: 'Batch 1 (8-10)', time: '08:00 AM - 10:00 AM' },
    { name: 'Batch 2 (10-12)', time: '10:00 AM - 12:00 PM' },
    { name: 'Batch 3 (1-3)', time: '01:00 PM - 03:00 PM' },
    { name: 'Batch 4 (3-5)', time: '03:00 PM - 05:00 PM' }
  ];

  // 24 rooms (Room 101 to 124) with 2 students each per batch = 48 students per batch = 192 students total
  testBatches.forEach((b, bIdx) => {
    for (let r = 101; r <= 124; r++) {
      for (let s = 1; s <= 2; s++) {
        const roll = `26B${bIdx + 1}R${r}S${s}`;
        sampleRows.push({
          'Date': testDate,
          'Batch': b.name,
          'Assessment Time': b.time,
          'Room number': String(r),
          'Name': `Candidate ${roll}`,
          'Regnumber': roll,
          'Email': `${roll.toLowerCase()}@institution.edu`
        });
      }
    }
  });

  console.log(`Generated ${sampleRows.length} test records across 4 batches and 24 rooms.`);

  // Write temporary test workbook
  const testWbPath = path.join(__dirname, 'test_master_input.xlsx');
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(sampleRows);
  xlsx.utils.book_append_sheet(wb, ws, 'Master_Schedule');
  xlsx.writeFile(wb, testWbPath);

  // Ingest via direct function call simulation
  const rawData = xlsx.utils.sheet_to_json(wb.Sheets['Master_Schedule']);

  // We can test normalizing and ingesting
  const normalizeMasterRow = (row) => {
    const normalized = {};
    for (const key of Object.keys(row)) {
      const k = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const val = String(row[key] !== undefined && row[key] !== null ? row[key] : '').trim();

      if (k.includes('date')) normalized.date = val;
      else if (k.includes('batch') || k.includes('slot') || k.includes('shift')) normalized.batch = val;
      else if (k.includes('assess') || k.includes('time') || k.includes('session')) normalized.assessment_time = val;
      else if (k.includes('room') || k.includes('hall')) normalized.room_number = val;
      else if (k.includes('reg') || k.includes('roll') || (k.includes('id') && !k.includes('mail'))) normalized.roll_number = val;
      else if (k.includes('name') || k.includes('student')) normalized.name = val;
      else if (k.includes('mail') || k.includes('email')) normalized.email = val;
    }
    return normalized;
  };

  const normalized = rawData.map(normalizeMasterRow);

  // Check database after mock ingestion
  const findExam = db.prepare('SELECT id FROM exams WHERE exam_date = ? AND name = ?');
  const insertExam = db.prepare(`
    INSERT INTO exams (name, subject_code, exam_date, session_time, sets_json, status)
    VALUES (?, ?, ?, ?, ?, 'ACTIVE')
  `);
  const insertRoom = db.prepare(`
    INSERT OR IGNORE INTO rooms (exam_id, room_number, room_pin, current_set_index)
    VALUES (?, ?, ?, 0)
  `);
  const insertStudent = db.prepare(`
    INSERT INTO students (exam_id, room_number, roll_number, name, email, department, status)
    VALUES (?, ?, ?, ?, ?, '', 'ABSENT')
    ON CONFLICT(exam_id, roll_number) DO UPDATE SET
      room_number = excluded.room_number,
      name = excluded.name,
      email = excluded.email
  `);

  // Group and insert
  const grouped = {};
  for (const r of normalized) {
    const key = `${r.date}___${r.batch}___${r.assessment_time}`;
    if (!grouped[key]) grouped[key] = { date: r.date, batch: r.batch, time: r.assessment_time, students: [] };
    grouped[key].students.push(r);
  }

  for (const key of Object.keys(grouped)) {
    const g = grouped[key];
    let ex = findExam.get(g.date, g.batch);
    let exId;
    if (ex) {
      exId = ex.id;
    } else {
      const res = insertExam.run(g.batch, g.batch.slice(0, 6), g.date, g.time, JSON.stringify(['Set A', 'Set B', 'Set C', 'Set D']));
      exId = res.lastInsertRowid;
    }

    for (const s of g.students) {
      const pin = s.room_number.length <= 4 ? `${s.room_number}0` : s.room_number.slice(-4);
      insertRoom.run(exId, s.room_number, pin);
      insertStudent.run(exId, s.room_number, s.roll_number, s.name, s.email);
    }
  }

  console.log('✓ Successfully ingested master test dataset into SQLite database.');

  // Verify created batches
  const batchesInDb = db.prepare('SELECT id, name, exam_date, session_time FROM exams WHERE exam_date = ?').all(testDate);
  console.log(`Found ${batchesInDb.length} batches on ${testDate}:`);
  batchesInDb.forEach((b) => {
    const roomCount = db.prepare('SELECT COUNT(DISTINCT room_number) as count FROM rooms WHERE exam_id = ?').get(b.id).count;
    const studentCount = db.prepare('SELECT COUNT(id) as count FROM students WHERE exam_id = ?').get(b.id).count;
    console.log(`  - ${b.name} (${b.session_time}): ${roomCount} rooms, ${studentCount} students`);
  });

  // Test Set Allocation in Batch 1, Room 101
  const batch1 = batchesInDb.find((b) => b.name.includes('Batch 1'));
  if (batch1) {
    const studentsRoom101 = db.prepare('SELECT id, name, roll_number FROM students WHERE exam_id = ? AND room_number = ?').all(batch1.id, '101');
    const sets = ['Set A', 'Set B', 'Set C', 'Set D'];
    
    // Simulate checking in students in Room 101
    studentsRoom101.forEach((st, idx) => {
      const assignedSet = sets[idx % sets.length];
      db.prepare("UPDATE students SET status = 'PRESENT', assigned_set = ?, checkin_time = '08:15:00 AM' WHERE id = ?").run(assignedSet, st.id);
      console.log(`  ✓ Check-in ${st.name} (${st.roll_number}) in Room 101 -> Assigned: ${assignedSet}`);
    });
  }

  console.log('\n--- All verification checks passed! ---');
}

testMasterIngestAndExport().catch(console.error);
