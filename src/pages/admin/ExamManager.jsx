import React, { useState, useEffect } from 'react';
import { appStorage } from '../../services/appStorage';
import { Award, Plus, Trash2, Save, CheckCircle2, AlertCircle, RefreshCw, Calendar, Clock, BookOpen, Layers } from 'lucide-react';

export default function ExamManager({ onExamUpdated }) {
  const [examsList, setExamsList] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

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

  const fetchExamsList = () => {
    setLoading(true);
    try {
      const list = appStorage.getExams();
      setExamsList(list);
      if (list.length > 0) {
        const active = list.find(e => e.status === 'ACTIVE') || list[0];
        loadExamDetails(active);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadExamDetails = (examObj) => {
    if (!examObj) return;
    setSelectedExamId(examObj.id);
    setName(examObj.name || '');
    setExamDate(examObj.exam_date || '');
    setSessionTime(examObj.session_time || '');
    setGracePeriodMinutes(examObj.grace_period_minutes || 15);
    setSets(examObj.sets || ['Set A', 'Set B', 'Set C', 'Set D']);
  };

  const handleBatchSelectChange = (e) => {
    const examId = Number(e.target.value);
    const selected = examsList.find(ex => ex.id === examId);
    if (selected) {
      loadExamDetails(selected);
      setStatusMsg(null);
    }
  };

  const handleAddSet = () => {
    const trimmed = newSetInput.trim();
    if (!trimmed) return;
    if (sets.includes(trimmed)) {
      alert('Set name already exists!');
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

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedExamId) return;

    setSaving(true);
    setStatusMsg(null);

    try {
      const res = appStorage.updateExam(selectedExamId, {
        name,
        exam_date: examDate,
        session_time: sessionTime,
        grace_period_minutes: Number(gracePeriodMinutes || 15),
        sets
      });

      if (res.success) {
        setStatusMsg({ type: 'success', text: `Paper sets and assessment config for batch updated successfully!` });
        fetchExamsList();
        if (onExamUpdated) onExamUpdated();
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to update settings' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-sans">
        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-900" />
        <p className="text-xs font-semibold">Loading Exam & Set Configuration...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans min-w-0 max-w-full">
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold mb-2 border border-amber-200">
              <Award size={14} className="text-amber-600" />
              <span>Paper Set Rotation Engine</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Exams & Set Configurator</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Select a batch created from master roster to assign and configure question paper sets.
            </p>
          </div>

          <button
            onClick={fetchExamsList}
            className="touch-target p-2 px-3.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200/80 shrink-0 self-start sm:self-auto focus-ring"
          >
            <RefreshCw size={14} />
            <span>Refresh Batches</span>
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-2.5 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                : 'bg-rose-50 text-rose-950 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-rose-600 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Batch Selector Dropdown */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Layers size={15} className="text-slate-900" /> Select Batch to Configure Sets
            </label>
            <select
              value={selectedExamId}
              onChange={handleBatchSelectChange}
              className="touch-target w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-slate-900 shadow-subtle focus-ring"
            >
              {examsList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — ({b.exam_date || 'No Date'} | {b.session_time || 'No Time'}) {b.status === 'ACTIVE' ? '⭐ ACTIVE' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen size={15} className="text-slate-500" /> Assessment Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Batch 1 (8-10) - Data Structures Assessment"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none text-xs font-bold text-slate-900 bg-slate-50 focus-ring transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar size={15} className="text-slate-500" /> Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none text-xs font-semibold text-slate-900 bg-slate-50 focus-ring transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock size={15} className="text-slate-500" /> Assessment Time / Session
              </label>
              <input
                type="text"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                placeholder="e.g. 08:00 AM - 10:00 AM"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none text-xs font-semibold text-slate-900 bg-slate-50 focus-ring transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock size={15} className="text-amber-600" /> Attendance Grace Window (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(e.target.value)}
                placeholder="e.g. 15"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none text-xs font-bold text-slate-900 bg-slate-50 focus-ring transition"
              />
            </div>
          </div>

          {/* Sets Configuration Section */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Award size={16} className="text-slate-900" />
                  Assigned Question Paper Sets ({sets.length} Sets in Rotation)
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Chronological round-robin order: <span className="font-mono font-bold text-slate-900">{sets.join(' → ')} → {sets[0]}</span>
                </p>
              </div>
            </div>

            {/* Existing Sets Chips */}
            <div className="flex flex-wrap gap-2.5 mb-4">
              {sets.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl font-bold text-xs shadow-xs"
                >
                  <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-mono font-bold">
                    {idx + 1}
                  </span>
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSet(idx)}
                    className="p-1 hover:bg-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition focus-ring"
                    title="Remove set"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Set Input */}
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={newSetInput}
                onChange={(e) => setNewSetInput(e.target.value)}
                placeholder="e.g. Set E..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none text-xs font-medium text-slate-900 bg-slate-50 focus-ring transition"
              />
              <button
                type="button"
                onClick={handleAddSet}
                className="touch-target px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition shadow-subtle focus-ring"
              >
                <Plus size={15} /> Add Set
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="touch-target px-5 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-subtle focus-ring"
            >
              <Save size={15} />
              <span>{saving ? 'Saving Config...' : 'Save Set Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
