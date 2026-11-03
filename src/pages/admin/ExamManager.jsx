import React, { useState, useEffect } from 'react';
import { appStorage, standardizeDate } from '../../services/appStorage';
import {
  Award,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock,
  BookOpen,
  Layers,
  Sparkles,
  Info,
  Check,
  Search
} from 'lucide-react';

export default function ExamManager({ onExamUpdated }) {
  const [examsList, setExamsList] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isNewBatchMode, setIsNewBatchMode] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);
  const [sets, setSets] = useState(['Set A', 'Set B', 'Set C', 'Set D']);
  const [newSetInput, setNewSetInput] = useState('');

  useEffect(() => {
    fetchExamsList();
  }, []);

  const fetchExamsList = (targetDate = null, preferredId = null) => {
    setLoading(true);
    try {
      const list = appStorage.getExams();
      setExamsList(list);

      if (list.length > 0) {
        const active = list.find(e => e.status === 'ACTIVE');
        const initialDate = targetDate || active?.exam_date || list[0].exam_date || new Date().toISOString().split('T')[0];
        
        applyDateLookup(initialDate, list, preferredId);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        setExamDate(today);
        setName('Batch 1 - Assessment');
        setSessionTime('09:00 AM - 12:00 PM');
        setIsNewBatchMode(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Look for batches matching the entered date
  const applyDateLookup = (dateStr, allExams = examsList, preferredId = null) => {
    if (!dateStr) return;
    const cleanDate = standardizeDate(dateStr);
    setSelectedDate(cleanDate);
    setExamDate(cleanDate);

    const matchingBatches = allExams.filter(e => e.exam_date === cleanDate);

    if (matchingBatches.length > 0) {
      setIsNewBatchMode(false);
      let toSelect;
      if (preferredId) {
        toSelect = matchingBatches.find(b => String(b.id) === String(preferredId)) || matchingBatches[0];
      } else {
        const activeOnDate = matchingBatches.find(b => b.status === 'ACTIVE');
        toSelect = activeOnDate || matchingBatches[0];
      }
      loadExamDetails(toSelect);
    } else {
      // No batches exist for this entered date
      setSelectedExamId('');
      setName(`Batch 1 - ${cleanDate} Session`);
      setSessionTime('09:00 AM - 12:00 PM');
      setGracePeriodMinutes(15);
      setSets(['Set A', 'Set B', 'Set C', 'Set D']);
      setIsNewBatchMode(true);
      setStatusMsg({
        type: 'info',
        text: `No batches found for ${cleanDate}. Configure question paper sets and click "Save & Create Batch" to add one!`
      });
    }
  };

  const handleDateChange = (newDate) => {
    if (!newDate) return;
    const cleanDate = standardizeDate(newDate);
    setStatusMsg(null);
    applyDateLookup(cleanDate, examsList);
  };

  const loadExamDetails = (examObj) => {
    if (!examObj) return;
    setSelectedExamId(examObj.id);
    setName(examObj.name || '');
    setExamDate(examObj.exam_date || '');
    setSelectedDate(examObj.exam_date || '');
    setSessionTime(examObj.session_time || '');
    setGracePeriodMinutes(examObj.grace_period_minutes || 15);
    setSets(Array.isArray(examObj.sets) && examObj.sets.length > 0 ? examObj.sets : ['Set A', 'Set B', 'Set C', 'Set D']);
    setIsNewBatchMode(false);
  };

  const handleBatchSelect = (batch) => {
    loadExamDetails(batch);
    setStatusMsg(null);
  };

  const handleCreateNewBatchForDate = () => {
    setSelectedExamId('');
    const batchesOnDate = examsList.filter(e => e.exam_date === selectedDate);
    const nextBatchNum = batchesOnDate.length + 1;
    setName(`Batch ${nextBatchNum} - ${selectedDate} Session`);
    setSessionTime('02:00 PM - 05:00 PM');
    setGracePeriodMinutes(15);
    setSets(['Set A', 'Set B', 'Set C', 'Set D']);
    setIsNewBatchMode(true);
    setStatusMsg({
      type: 'info',
      text: `Creating new batch for ${selectedDate}. Fill details and click "Save & Create Batch".`
    });
  };

  const handleSetActiveBatch = () => {
    if (!selectedExamId) return;
    const res = appStorage.switchActiveExam(selectedExamId);
    if (res.success) {
      setStatusMsg({ type: 'success', text: `Batch marked as ACTIVE for examination hall logins!` });
      fetchExamsList(selectedDate, selectedExamId);
      if (onExamUpdated) onExamUpdated();
    }
  };

  const handleAddSet = () => {
    const trimmed = newSetInput.trim();
    if (!trimmed) return;
    if (sets.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      alert('Paper set name already exists!');
      return;
    }
    setSets([...sets, trimmed]);
    setNewSetInput('');
  };

  const handleRemoveSet = (indexToRemove) => {
    if (sets.length <= 1) {
      alert('You must keep at least 1 set.');
      return;
    }
    setSets(sets.filter((_, i) => i !== indexToRemove));
  };

  const handleApplyPreset = (presetSets) => {
    setSets(presetSets);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const cleanDate = standardizeDate(examDate || selectedDate);
      if (!selectedExamId || isNewBatchMode) {
        // Create new batch for this date
        const res = appStorage.createExam({
          name: name.trim(),
          exam_date: cleanDate,
          session_time: sessionTime.trim(),
          grace_period_minutes: Number(gracePeriodMinutes || 15),
          sets
        });

        if (res.success) {
          setStatusMsg({ type: 'success', text: `New batch "${name}" for date ${cleanDate} created and paper sets configured!` });
          fetchExamsList(cleanDate, res.exam_id);
          if (onExamUpdated) onExamUpdated();
        } else {
          setStatusMsg({ type: 'error', text: res.error || 'Failed to create batch' });
        }
      } else {
        // Update existing batch
        const res = appStorage.updateExam(selectedExamId, {
          name: name.trim(),
          exam_date: cleanDate,
          session_time: sessionTime.trim(),
          grace_period_minutes: Number(gracePeriodMinutes || 15),
          sets
        });

        if (res.success) {
          setStatusMsg({ type: 'success', text: `Paper sets and assessment config for "${name}" updated successfully!` });
          fetchExamsList(cleanDate, selectedExamId);
          if (onExamUpdated) onExamUpdated();
        } else {
          setStatusMsg({ type: 'error', text: res.error || 'Failed to update settings' });
        }
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Batches matching currently selected date
  const batchesForSelectedDate = examsList.filter(e => e.exam_date === selectedDate);

  // All unique dates in database for quick navigation chips
  const uniqueDates = Array.from(new Set(examsList.map(e => e.exam_date).filter(Boolean))).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const currentBatch = examsList.find(e => String(e.id) === String(selectedExamId));
  const isCurrentBatchActive = currentBatch?.status === 'ACTIVE';

  if (loading && examsList.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400 font-sans">
        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#00a86b]" />
        <p className="text-xs font-semibold text-slate-600">Loading Exam & Set Configuration...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5 font-sans min-w-0 max-w-full">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#00a86b] text-xs font-bold mb-2 border border-emerald-200">
            <Award size={14} className="text-[#00a86b]" />
            <span>Paper Set Rotation Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Exams & Set Configurator
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Look up batches by examination date to configure question paper sets, rotation sequence, and session rules.
          </p>
        </div>

        <button
          onClick={() => fetchExamsList(selectedDate, selectedExamId)}
          className="touch-target px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200 shrink-0 self-start sm:self-auto active:scale-95"
          title="Reload Batches"
        >
          <RefreshCw size={13} className="text-slate-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Date Lookup & Batch Filter Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00a86b] flex items-center justify-center font-bold">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Look Up Batches by Exam Date
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Changing the date will automatically search and load all batches for that day.
              </p>
            </div>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 outline-none focus:border-[#00a86b] focus:bg-white transition shadow-sm"
            />
          </div>
        </div>

        {/* Quick Date Chips Bar */}
        {uniqueDates.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Select Existing Exam Dates:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {uniqueDates.map((d) => {
                const count = examsList.filter(e => e.exam_date === d).length;
                const isSelected = selectedDate === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDateChange(d)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition border flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-[#00a86b] text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>📅 {d}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-emerald-700/60 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {count} {count === 1 ? 'batch' : 'batches'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Batches for Selected Date Strip */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              Batches on <span className="font-mono text-[#00a86b]">{selectedDate || 'Selected Date'}</span>:
            </span>
            <button
              type="button"
              onClick={handleCreateNewBatchForDate}
              className="text-[11px] font-bold text-[#00a86b] hover:text-emerald-700 flex items-center gap-1 transition"
            >
              <Plus size={13} />
              <span>Add Another Batch for this Date</span>
            </button>
          </div>

          {batchesForSelectedDate.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>
                No batches found for <b>{selectedDate}</b>. You can configure and save this as a new batch below.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {batchesForSelectedDate.map((b) => {
                const isSelected = !isNewBatchMode && String(selectedExamId) === String(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleBatchSelect(b)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border active:scale-95 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Layers size={13} className={isSelected ? 'text-[#00a86b]' : 'text-slate-400'} />
                    <span>{b.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({b.session_time || 'Time unset'})
                    </span>
                    {b.status === 'ACTIVE' && (
                      <span className="px-1.5 py-0.2 rounded-md bg-[#00a86b] text-white text-[9px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status Message Notification */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
              : statusMsg.type === 'info'
              ? 'bg-blue-50 text-blue-950 border border-blue-200'
              : 'bg-rose-50 text-rose-950 border border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 size={16} className="text-[#00a86b] shrink-0" />
          ) : statusMsg.type === 'info' ? (
            <Info size={16} className="text-blue-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Configuration Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Active Batch Banner & Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Configuring: <span className="font-black text-[#00a86b]">{name || 'Batch'}</span>
                </h4>
                {isCurrentBatchActive ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#00a86b] border border-emerald-200">
                    🟢 Active Session for Hall Check-In
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                    ⚪ Scheduled / Inactive
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Date: <b>{examDate || selectedDate}</b> &bull; Time: <b>{sessionTime || 'Not set'}</b>
              </p>
            </div>

            {selectedExamId && !isCurrentBatchActive && !isNewBatchMode && (
              <button
                type="button"
                onClick={handleSetActiveBatch}
                className="touch-target px-3 py-1.5 rounded-xl bg-[#00a86b] hover:bg-[#00925d] text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto active:scale-95"
                title="Set this batch as ACTIVE so faculty room logins authenticate against it"
              >
                <Check size={14} />
                <span>Make Batch ACTIVE</span>
              </button>
            )}
          </div>

          {/* Assessment Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen size={14} className="text-[#00a86b]" /> Assessment Title / Batch Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Batch 1 (8-10) - Regular Session"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#00a86b] focus:bg-white focus:outline-none text-xs font-bold text-slate-900 bg-slate-50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-[#00a86b]" /> Exam Date (Triggers Batch Lookup)
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#00a86b] focus:bg-white focus:outline-none text-xs font-bold text-slate-900 bg-slate-50 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} className="text-[#00a86b]" /> Assessment Session Time
              </label>
              <input
                type="text"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                placeholder="e.g. 08:00 AM - 10:00 AM"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#00a86b] focus:bg-white focus:outline-none text-xs font-semibold text-slate-900 bg-slate-50 transition font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-500" /> Attendance Grace Window (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(e.target.value)}
                placeholder="e.g. 15"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#00a86b] focus:bg-white focus:outline-none text-xs font-bold text-slate-900 bg-slate-50 transition font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Students checking in after this window are flagged as Late Gate Arrivals in the live monitor.
              </p>
            </div>
          </div>

          {/* Sets Configuration Section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Award size={16} className="text-[#00a86b]" />
                  Question Paper Sets in Rotation ({sets.length} Sets)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Sequentially assigned to students in each hall upon attendance mark.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(['Set A', 'Set B', 'Set C', 'Set D'])}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
                >
                  4 Sets (A-D)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(['Set A', 'Set B', 'Set C'])}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
                >
                  3 Sets (A-C)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(['Set 1', 'Set 2', 'Set 3', 'Set 4'])}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
                >
                  Numeric (1-4)
                </button>
              </div>
            </div>

            {/* Current Sets Badges */}
            <div className="flex flex-wrap gap-2.5">
              {sets.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl font-bold text-xs shadow-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-[#00a86b] text-white flex items-center justify-center text-[10px] font-mono font-bold shadow-xs">
                    {idx + 1}
                  </span>
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSet(idx)}
                    className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Remove set"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Rotation Preview Ribbon */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                Rotation Cycle:
              </span>
              <div className="flex items-center gap-1 font-mono font-bold text-[11px] text-[#00a86b]">
                {sets.map((s, i) => (
                  <React.Fragment key={i}>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                      {s}
                    </span>
                    <span>→</span>
                  </React.Fragment>
                ))}
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[#00a86b]">
                  {sets[0]} (Repeat)
                </span>
              </div>
            </div>

            {/* Add New Set Input */}
            <div className="flex items-center gap-2 max-w-md pt-1">
              <input
                type="text"
                value={newSetInput}
                onChange={(e) => setNewSetInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSet(); } }}
                placeholder="Type new set name (e.g. Set E)..."
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#00a86b] focus:bg-white focus:outline-none text-xs font-medium text-slate-900 bg-slate-50 transition"
              />
              <button
                type="button"
                onClick={handleAddSet}
                className="touch-target px-4 py-2.5 bg-[#00a86b] hover:bg-[#00925d] text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <Plus size={14} />
                <span>Add Set</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 font-medium">
              {isNewBatchMode
                ? 'Creating a new batch entry for this date.'
                : `Updating configuration for ${name}.`}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="touch-target px-5 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs rounded-2xl flex items-center gap-2 transition shadow-sm active:scale-95"
            >
              <Save size={15} />
              <span>{saving ? 'Saving...' : isNewBatchMode ? 'Save & Create Batch' : 'Save Set Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
