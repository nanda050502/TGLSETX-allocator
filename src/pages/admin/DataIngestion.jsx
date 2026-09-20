import React, { useState, useRef } from 'react';
import { appStorage } from '../../services/appStorage';
import * as xlsx from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  Sheet,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Info
} from 'lucide-react';

export default function DataIngestion({ onIngestionSuccess }) {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [ingestMode, setIngestMode] = useState('FILE');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const normalizeMasterRow = (row) => {
    const normalized = {};
    for (const key of Object.keys(row)) {
      const k = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const val = String(row[key] !== undefined && row[key] !== null ? row[key] : '').trim();

      if (k.includes('date')) {
        if (!normalized.date) normalized.date = val;
      } else if (k.includes('batch') || k.includes('slot') || k.includes('shift')) {
        if (!normalized.batch) normalized.batch = val;
      } else if (k.includes('assess') || k.includes('time') || k.includes('session') || k.includes('slot')) {
        if (!normalized.assessment_time) normalized.assessment_time = val;
      } else if (k.includes('room') || k.includes('hall')) {
        if (!normalized.room_number) normalized.room_number = val;
      } else if (k.includes('reg') || k.includes('roll') || (k.includes('id') && !k.includes('mail'))) {
        if (!normalized.roll_number) normalized.roll_number = val;
      } else if (k.includes('name') || k.includes('student')) {
        if (!normalized.name) normalized.name = val;
      } else if (k.includes('mail') || k.includes('email')) {
        if (!normalized.email) normalized.email = val;
      } else if (k.includes('dept') || k.includes('branch') || k.includes('course')) {
        if (!normalized.department) normalized.department = val;
      }
    }
    return normalized;
  };

  // Handle Master File Upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const workbook = xlsx.read(bstr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

          const normalizedRows = rawData.map(normalizeMasterRow);
          const res = appStorage.ingestMasterRows(normalizedRows);

          setResult({
            type: 'success',
            message: `Successfully ingested ${res.added} students across ${res.batchesCount} batches and ${res.roomsCount} examination halls!`,
            count: res.added,
            batchesCount: res.batchesCount,
            roomsCount: res.roomsCount,
            dates: res.dates
          });
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (onIngestionSuccess) onIngestionSuccess();
        } catch (err) {
          setError(err.message || 'Failed to process spreadsheet format');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setError(err.message || 'File reading error');
      setUploading(false);
    }
  };

  // Handle Google Sheet Link
  const handleGoogleSheetImport = async (e) => {
    e.preventDefault();
    if (!googleSheetUrl) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      let csvUrl = googleSheetUrl;
      if (googleSheetUrl.includes('docs.google.com/spreadsheets/d/')) {
        const match = googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
      }

      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Could not fetch sheet data. Ensure sheet is set to "Anyone with link can view".');
      }

      const csvText = await response.text();
      const workbook = xlsx.read(csvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const normalizedRows = rawData.map(normalizeMasterRow);
      const res = appStorage.ingestMasterRows(normalizedRows);

      setResult({
        type: 'success',
        message: `Successfully imported ${res.added} students across ${res.batchesCount} batches from Google Sheet!`,
        count: res.added,
        batchesCount: res.batchesCount,
        roomsCount: res.roomsCount,
        dates: res.dates
      });

      if (onIngestionSuccess) onIngestionSuccess();
    } catch (err) {
      setError(err.message || 'Error fetching Google Sheet');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans min-w-0 max-w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2 border border-slate-200">
            <Layers size={14} className="text-slate-900" />
            <span>Multi-Batch Ingestion Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Master Examination Data Ingestion</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Upload single master sheet containing all dates, batches, and examination halls.
          </p>
        </div>

        <button
          onClick={() => appStorage.downloadSampleTemplate()}
          className="touch-target px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition self-start sm:self-auto shadow-subtle shrink-0 focus-ring"
        >
          <Download size={15} />
          <span>Download Sample Template (.xlsx)</span>
        </button>
      </div>

      {/* Schema Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-subtle space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Info size={15} className="text-slate-900" />
            Standardized Master Sheet Headers (7 Columns)
          </h2>
          <span className="text-[11px] text-slate-500 font-semibold">Automatic Batch & Hall Detection</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {[
            { label: 'Date', desc: 'e.g. 2026-09-20' },
            { label: 'Batch', desc: 'e.g. Batch 1 (8-10)' },
            { label: 'Assessment Time', desc: 'e.g. 08:00 AM - 10:00 AM' },
            { label: 'Room number', desc: 'e.g. 901 to 904, 101' },
            { label: 'Name', desc: 'Student full name' },
            { label: 'Regnumber', desc: 'e.g. RA2111003010001' },
            { label: 'Email', desc: 'Institutional email' }
          ].map((col, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center flex flex-col justify-between"
            >
              <span className="font-mono text-xs font-bold text-slate-900">{col.label}</span>
              <span className="text-[10px] text-slate-500 mt-1 font-medium">{col.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-md border border-slate-200">
        <button
          onClick={() => setIngestMode('FILE')}
          className={`touch-target flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 focus-ring ${
            ingestMode === 'FILE'
              ? 'bg-white text-slate-900 shadow-subtle'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet size={15} />
          <span>Upload Excel / CSV</span>
        </button>
        <button
          onClick={() => setIngestMode('GOOGLE_SHEET')}
          className={`touch-target flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 focus-ring ${
            ingestMode === 'GOOGLE_SHEET'
              ? 'bg-white text-emerald-800 shadow-subtle'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sheet size={15} />
          <span>Live Google Sheet Link</span>
        </button>
      </div>

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-950 flex items-start gap-3.5 animate-fade-in">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-sm text-emerald-950">Master Ingestion Completed Successfully</h3>
            <p className="font-medium text-emerald-900">{result.message}</p>
            {result.dates && result.dates.length > 0 && (
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700">Scheduled Dates:</span>
                {result.dates.map((d) => (
                  <span key={d} className="px-2.5 py-0.5 rounded-md bg-white font-mono font-bold text-slate-900 border border-emerald-200">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-900 flex items-start gap-3.5 animate-fade-in">
          <AlertCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h3 className="font-bold text-sm text-rose-950">Ingestion Error</h3>
            <p className="mt-0.5 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-subtle">
        {ingestMode === 'FILE' ? (
          <form onSubmit={handleFileUpload} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Master Excel (.xlsx) or CSV File
              </label>

              <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-8 sm:p-10 text-center bg-slate-50/50 transition">
                <UploadCloud size={40} className="mx-auto text-slate-400 mb-3" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer focus-ring"
                />
                <p className="text-[11px] text-slate-400 mt-3 font-medium">
                  Supports multi-batch schedule rows across 24+ halls in a single spreadsheet.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="touch-target w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-subtle flex items-center justify-center gap-2 focus-ring"
            >
              {uploading && <RefreshCw size={15} className="animate-spin" />}
              {uploading ? 'Processing Master Ingestion...' : 'Upload & Provision All Batches & Halls'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleGoogleSheetImport} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Google Sheets Public Link
              </label>
              <input
                type="url"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none text-xs text-slate-900 font-mono focus-ring transition"
              />
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Ensure the Google Sheet is shared with <b>"Anyone with the link can view"</b>.
              </p>
            </div>

            <button
              type="submit"
              disabled={!googleSheetUrl || uploading}
              className="touch-target w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-subtle flex items-center justify-center gap-2 focus-ring"
            >
              {uploading && <RefreshCw size={15} className="animate-spin" />}
              {uploading ? 'Fetching & Provisioning...' : 'Sync Master Data from Google Sheet'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
