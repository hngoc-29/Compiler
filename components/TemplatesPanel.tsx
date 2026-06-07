'use client';

/**
 * components/TemplatesPanel.tsx
 * Panel chọn code template CP — slide từ trái vào.
 */

import { useState, useMemo } from 'react';
import { X, Search, Code2, ChevronRight } from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByLang, type Template } from '@/lib/templates';
import { toast } from 'sonner';

interface TemplatesPanelProps {
  open:     boolean;
  onClose:  () => void;
  langId:   string;
  onInsert: (code: string) => void;
}

export default function TemplatesPanel({ open, onClose, langId, onInsert }: TemplatesPanelProps) {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState<string>('Tất cả');
  const [preview, setPreview]   = useState<Template | null>(null);

  const available = useMemo(() => getTemplatesByLang(langId), [langId]);

  const filtered = useMemo(() => {
    return available.filter(t => {
      const matchCat = category === 'Tất cả' || t.category === category;
      const matchQ   = !search || t.label.toLowerCase().includes(search.toLowerCase())
        || t.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchQ;
    });
  }, [available, search, category]);

  const categories = ['Tất cả', ...Array.from(new Set(available.map(t => t.category)))];

  const handleInsert = (t: Template) => {
    onInsert(t.code);
    toast.success(`Đã chèn template "${t.label}"`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 340, background: '#0e0e1a', borderRight: '1px solid #1f1f32' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Code2 size={15} className="text-indigo-400" />
            <span className="text-sm font-semibold text-gray-100">Templates</span>
            <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-mono">
              {available.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 shrink-0">
          <div className="flex items-center gap-2 bg-gray-800/60 rounded px-2 py-1.5">
            <Search size={12} className="text-gray-600 shrink-0" />
            <input
              type="text"
              placeholder="Tìm template..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-gray-300 outline-none w-full placeholder-gray-600"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-3 pb-2 shrink-0 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                category === cat
                  ? 'bg-indigo-600/70 text-indigo-200'
                  : 'bg-gray-800/60 text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {filtered.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-8">
              Không tìm thấy template phù hợp
            </p>
          )}
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => setPreview(preview?.id === t.id ? null : t)}
              className={`rounded cursor-pointer border transition-colors ${
                preview?.id === t.id
                  ? 'border-indigo-700/60 bg-indigo-950/30'
                  : 'border-transparent bg-gray-800/30 hover:bg-gray-800/60'
              }`}
            >
              <div className="flex items-center justify-between p-2.5">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-200 truncate">{t.label}</div>
                  <div className="text-[10px] text-gray-600 truncate mt-0.5">{t.description}</div>
                </div>
                <ChevronRight
                  size={12}
                  className={`text-gray-600 shrink-0 ml-2 transition-transform ${
                    preview?.id === t.id ? 'rotate-90' : ''
                  }`}
                />
              </div>

              {/* Expanded preview */}
              {preview?.id === t.id && (
                <div className="border-t border-border px-2.5 pb-2.5 pt-2" onClick={e => e.stopPropagation()}>
                  <pre className="text-[10px] text-gray-400 bg-gray-900/60 rounded p-2 overflow-x-auto max-h-48 whitespace-pre font-mono leading-relaxed">
                    {t.code.slice(0, 600)}{t.code.length > 600 ? '\n...' : ''}
                  </pre>
                  <button
                    onClick={() => handleInsert(t)}
                    className="mt-2 w-full py-1.5 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                  >
                    Chèn vào Editor
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border shrink-0">
          <p className="text-[10px] text-gray-700 text-center">
            {available.length} templates · {langId}
          </p>
        </div>
      </div>
    </>
  );
}
