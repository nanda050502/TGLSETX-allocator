import React, { useState, useEffect } from 'react';
import { appStorage } from '../services/appStorage';
import { X, Copy, Check, ExternalLink, RefreshCw, Sparkles, Sheet } from 'lucide-react';

export default function GoogleSheetSetupModal({ exam, onClose, onUpdated }) {
  const [webhookUrl, setWebhookUrl] = useState(exam?.google_sheet_webhook_url || '');
  const [sheetUrl, setSheetUrl] = useState(exam?.google_sheet_url || '');
  const [scriptCode, setScriptCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    try {
      const code = appStorage.getGoogleScriptCode();
      setScriptCode(code);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrls = () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = appStorage.updateExam(exam.id, {
        google_sheet_webhook_url: webhookUrl,
        google_sheet_url: sheetUrl
      });
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Google Sheet settings saved successfully!' });
        if (onUpdated) onUpdated();
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to save settings.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncAllNow = async () => {
    setSyncing(true);
    setStatusMsg(null);
    try {
      const res = await appStorage.syncAllToGoogleSheet(exam.id);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `Successfully pushed all ${res.count} students to Google Sheet!` });
      } else {
        setStatusMsg({ type: 'error', text: res.reason || 'Sync failed. Please check the Webhook URL.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error connecting to webhook.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white rounded-2xl shadow-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/90">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-subtle">
              <Sheet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">Live Google Sheets Real-Time Sync</h3>
              <p className="text-xs text-slate-500 font-medium">Auto-updates attendance, assigned sets & timestamps live</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition focus-ring"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {statusMsg && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                  : 'bg-rose-50 text-rose-950 border border-rose-200'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Easy 2-Minute Google Sheet Setup
            </h4>
            <ol className="space-y-1.5 text-xs text-slate-600 list-decimal list-inside font-medium leading-relaxed">
              <li>Open your Google Sheet (or create a blank one).</li>
              <li>Click <b className="text-slate-900 font-bold">Extensions</b> &gt; <b className="text-slate-900 font-bold">Apps Script</b> in Google Sheets.</li>
              <li>Delete any code there and paste the script below.</li>
              <li>Click <b className="text-slate-900 font-bold">Deploy</b> &gt; <b className="text-slate-900 font-bold">New deployment</b> &gt; Select Type: <b className="text-slate-900 font-bold">Web app</b>.</li>
              <li>Set <i>Execute as:</i> <b className="text-slate-900 font-bold">Me</b> and <i>Who has access:</i> <b className="text-slate-900 font-bold">Anyone</b> &gt; Click <b className="text-slate-900 font-bold">Deploy</b>.</li>
              <li>Copy the generated <b className="text-slate-900 font-bold">Web App URL</b> and paste it in the box below!</li>
            </ol>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                1. Google Apps Script Code
              </label>
              <button
                type="button"
                onClick={handleCopyScript}
                className="touch-target text-xs font-bold px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl flex items-center gap-1.5 transition shadow-subtle focus-ring"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Script'}
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-2xl max-h-36 overflow-y-auto border border-slate-800 leading-relaxed shadow-inner">
              {scriptCode}
            </pre>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                2. Deployed Google Sheet Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 font-mono text-xs text-slate-900 transition focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Google Sheet View Link (Optional bookmark)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 text-xs text-slate-900 transition focus-ring"
                />
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="touch-target px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-200 focus-ring"
                  >
                    <ExternalLink size={14} /> Open
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSyncAllNow}
              disabled={syncing || !webhookUrl}
              className="touch-target px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition border border-slate-200 focus-ring"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Pushing Data...' : 'Test & Push All Data Now'}
            </button>

            <button
              type="button"
              onClick={handleSaveUrls}
              disabled={saving}
              className="touch-target px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs rounded-xl transition shadow-subtle focus-ring"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
