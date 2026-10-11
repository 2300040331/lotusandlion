'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, Trash2, Check, AlertCircle, HelpCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface BulkImportCollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CollectionDraft {
  id: string; // client-side temp id
  name: string;
  slug: string;
  gender: string;
  status: 'pending' | 'publishing' | 'success' | 'error';
  errorMessage?: string;
}

export default function BulkImportCollectionsModal({ isOpen, onClose, onSuccess }: BulkImportCollectionsModalProps) {
  const [drafts, setDrafts] = useState<CollectionDraft[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [isPublishingAll, setIsPublishingAll] = useState(false);

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDraftField = (id: string, field: keyof CollectionDraft, value: any) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  // Robust CSV parser
  const parseCSV = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];

    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map((val) => val.replace(/^"|"$/g, ''));
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length < headers.length) continue;
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
    return data;
  };

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const dataFiles = acceptedFiles.filter(
        (f) => f.name.endsWith('.csv') || f.name.endsWith('.json')
      );

      for (const file of dataFiles) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            let parsedItems: any[] = [];

            if (file.name.endsWith('.json')) {
              const parsed = JSON.parse(content);
              parsedItems = Array.isArray(parsed) ? parsed : [parsed];
            } else {
              parsedItems = parseCSV(content);
            }

            const newDrafts: CollectionDraft[] = parsedItems.map((item) => {
              const name = item.name || item.title || '';
              const slug = item.slug || '';
              let gender = (item.gender || 'women').toLowerCase().trim();
              if (gender !== 'women' && gender !== 'men' && gender !== 'unisex') {
                gender = 'women';
              }

              return {
                id: Math.random().toString(36).substring(7),
                name,
                slug,
                gender,
                status: 'pending',
              };
            }).filter(d => d.name); // only keep drafts with a name

            setDrafts((prev) => [...prev, ...newDrafts]);
            toast.success(`Loaded ${newDrafts.length} collections from ${file.name}`);
          } catch (err) {
            toast.error(`Failed to parse file ${file.name}`);
          }
        };
        reader.readAsText(file);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
  });

  const handlePublishAll = async () => {
    const invalid = drafts.some((d) => !d.name.trim());
    if (invalid) {
      toast.error('All collections must have a name.');
      return;
    }

    setIsPublishingAll(true);
    let successCount = 0;

    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      if (draft.status === 'success') {
        successCount++;
        continue;
      }

      setDrafts((prev) =>
        prev.map((d) => (d.id === draft.id ? { ...d, status: 'publishing' } : d))
      );

      try {
        const payload = {
          name: draft.name,
          slug: draft.slug || undefined,
          hero: { gender: draft.gender }
        };

        await api.post('/admin/collections', payload);
        
        setDrafts((prev) =>
          prev.map((d) => (d.id === draft.id ? { ...d, status: 'success' } : d))
        );
        successCount++;
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.message || 'Create failed';
        setDrafts((prev) =>
          prev.map((d) => (d.id === draft.id ? { ...d, status: 'error', errorMessage: errMsg } : d))
        );
      }
    }

    setIsPublishingAll(false);

    if (successCount === drafts.length) {
      toast.success('All collections imported successfully!');
      onSuccess();
      onClose();
      setDrafts([]);
    } else if (successCount > 0) {
      toast.success(`Imported ${successCount} collections. Some failed.`);
    } else {
      toast.error('Failed to import collections. Check errors in table.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FEFFEF] border border-[#573B2D]/20 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col text-[#573B2D] shadow-2xl overflow-hidden animate-none">
        
        {/* Header */}
        <div className="border-b border-[#573B2D]/15 p-6 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#573B2D]">Bulk Collections Import</h2>
            <p className="text-[10px] uppercase text-[#573B2D]/70 tracking-wider mt-1">
              Import multiple collections in bulk using a CSV or JSON file.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-[#573B2D] hover:bg-[#573B2D]/10 transition-colors p-1.5 rounded-lg cursor-pointer animate-none"
              title="Show Schema Guidelines"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={onClose}
              disabled={isPublishingAll}
              className="p-1.5 rounded-lg text-[#573B2D] hover:bg-[#573B2D]/10 transition-all disabled:opacity-50 cursor-pointer animate-none"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Guidelines / Help */}
        {showHelp && (
          <div className="bg-white border-b border-[#573B2D]/15 p-6 text-xs text-[#573B2D] space-y-3">
            <p className="font-bold text-[#573B2D] uppercase tracking-wider">Spreadsheet Schema Guidelines</p>
            <p>Upload a `.csv` or `.json` containing the list of collections to create. The following column names are supported:</p>
            <div className="grid grid-cols-3 gap-4 bg-[#FEFFEF] p-4 rounded-xl border border-[#573B2D]/20">
              <div>
                <p className="font-bold text-[#573B2D] uppercase text-[10px]">name *</p>
                <p className="text-[9px] text-[#573B2D]/70">e.g. Summer Essentials</p>
              </div>
              <div>
                <p className="font-bold text-[#573B2D] uppercase text-[10px]">slug</p>
                <p className="text-[9px] text-[#573B2D]/70">e.g. summer-essentials</p>
              </div>
              <div>
                <p className="font-bold text-[#573B2D] uppercase text-[10px]">gender</p>
                <p className="text-[9px] text-[#573B2D]/70">women / men / unisex</p>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 ${
              isDragActive
                ? 'border-[#573B2D] bg-[#573B2D]/5'
                : 'border-[#573B2D]/30 hover:border-[#573B2D] bg-white'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-12 h-12 rounded-full bg-[#573B2D]/10 flex items-center justify-center text-[#573B2D]">
              <Upload size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#573B2D]">
                {isDragActive ? 'Drop file here' : 'Drop CSV or JSON file'}
              </p>
              <p className="text-[9px] uppercase text-[#573B2D]/70 tracking-widest mt-1">
                CSV or JSON spreadsheets of collections data
              </p>
            </div>
          </div>

          {/* Drafts list */}
          {drafts.length > 0 && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-[20vh]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#573B2D]">Collections Queue ({drafts.length})</h3>
                <button
                  onClick={() => setDrafts([])}
                  disabled={isPublishingAll}
                  className="text-[10px] uppercase font-bold tracking-wider text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors cursor-pointer animate-none"
                >
                  Clear All
                </button>
              </div>

              <div className="flex-1 overflow-auto border border-[#573B2D]/15 rounded-xl bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FEFFEF] text-[#573B2D] uppercase tracking-widest text-[9px] font-bold sticky top-0 z-10 border-b border-[#573B2D]/15">
                    <tr>
                      <th className="p-4 font-bold text-[#573B2D]">Collection Name</th>
                      <th className="p-4 font-bold text-[#573B2D]">Slug</th>
                      <th className="p-4 w-40 font-bold text-[#573B2D]">Target Gender</th>
                      <th className="p-4 w-28 text-center font-bold text-[#573B2D]">Status</th>
                      <th className="p-4 w-12 text-center font-bold text-[#573B2D]">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#573B2D]/10">
                    {drafts.map((draft) => {
                      const isPublishing = draft.status === 'publishing';
                      const isSuccess = draft.status === 'success';
                      const isError = draft.status === 'error';

                      return (
                        <tr key={draft.id} className="hover:bg-[#573B2D]/[0.02] transition-colors">
                          {/* Name */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={draft.name}
                              disabled={isSuccess || isPublishing}
                              onChange={(e) => updateDraftField(draft.id, 'name', e.target.value)}
                              className="w-full bg-[#FEFFEF] border border-[#573B2D]/20 rounded-lg p-2 text-[#573B2D] font-bold disabled:opacity-50 focus:border-[#573B2D] outline-none"
                              placeholder="Collection Name"
                            />
                          </td>

                          {/* Slug */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={draft.slug}
                              disabled={isSuccess || isPublishing}
                              onChange={(e) => updateDraftField(draft.id, 'slug', e.target.value)}
                              className="w-full bg-[#FEFFEF] border border-[#573B2D]/20 rounded-lg p-2 text-[#573B2D] font-mono disabled:opacity-50 focus:border-[#573B2D] outline-none text-xs"
                              placeholder="Auto-generated if empty"
                            />
                          </td>

                          {/* Target Gender */}
                          <td className="p-3">
                            <select
                              value={draft.gender}
                              disabled={isSuccess || isPublishing}
                              onChange={(e) => updateDraftField(draft.id, 'gender', e.target.value)}
                              className="w-full bg-white border border-[#573B2D]/20 rounded-lg p-2 text-[#573B2D] disabled:opacity-50 focus:border-[#573B2D] outline-none"
                            >
                              <option value="women">Women</option>
                              <option value="men">Men</option>
                              <option value="unisex">Unisex</option>
                            </select>
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider text-[9px]">
                              {isPublishing && (
                                <>
                                  <Loader2 size={12} className="animate-spin text-[#573B2D]" />
                                  <span className="text-[#573B2D]">Saving</span>
                                </>
                              )}
                              {isSuccess && (
                                <>
                                  <Check size={12} className="text-green-600" />
                                  <span className="text-green-600">Success</span>
                                </>
                              )}
                              {isError && (
                                <div className="flex items-center gap-1 cursor-help text-red-600" title={draft.errorMessage}>
                                  <AlertCircle size={12} />
                                  <span>Failed</span>
                                </div>
                              )}
                              {draft.status === 'pending' && (
                                <span className="text-[#573B2D]/70">Ready</span>
                              )}
                            </div>
                          </td>

                          {/* Delete */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => removeDraft(draft.id)}
                              disabled={isSuccess || isPublishing}
                              className="text-[#573B2D]/60 hover:text-red-600 disabled:opacity-30 transition-colors p-1 cursor-pointer animate-none"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#573B2D]/15 p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] uppercase tracking-wider text-[#573B2D] font-bold">
            {drafts.length > 0 ? (
              <>{drafts.filter(d => d.status === 'success').length} of {drafts.length} Created</>
            ) : (
              'No collections loaded'
            )}
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={isPublishingAll}
              className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#573B2D]/30 text-[#573B2D] hover:bg-[#573B2D]/10 transition-all cursor-pointer animate-none"
            >
              Cancel
            </button>
            <button
              onClick={handlePublishAll}
              disabled={drafts.length === 0 || isPublishingAll}
              className="admin-btn-primary bg-[#573B2D] text-[#FEFFEF] px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#573B2D]/90 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none animate-none"
            >
              {isPublishingAll ? <Loader2 className="animate-spin text-[#FEFFEF]" size={16} /> : <Check className="text-[#FEFFEF]" size={16} />}
              Import Collections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
