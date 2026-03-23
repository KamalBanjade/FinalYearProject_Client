import React, { useState, useEffect } from 'react';
import { Search, FileText, Clock, Check, Loader2, X, Trash2, AlertTriangle, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { templatesApi } from '@/lib/api/templatesApi';
import { TemplateDTO } from '@/lib/api/templates';
import toast from 'react-hot-toast';

interface TemplateBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: TemplateDTO) => void;
}

export const TemplateBrowserModal: React.FC<TemplateBrowserModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<TemplateDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [previewTemplate, setPreviewTemplate] = useState<TemplateDTO | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    } else {
      setPreviewTemplate(null);
    }
  }, [isOpen, activeTab]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await templatesApi.getMyTemplates(activeTab === 'all');
      if (res.success) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setDeleteConfirm(templateId);
  };

  const confirmDeletion = async () => {
    if (!deleteConfirm) return;
    
    try {
      const res = await templatesApi.deleteTemplate(deleteConfirm);
      if (res.success) {
        toast.success('Protocol deleted successfully');
        setTemplates(prev => prev.filter(t => t.id !== deleteConfirm));
        if (previewTemplate?.id === deleteConfirm) setPreviewTemplate(null);
        setDeleteConfirm(null);
      } else {
        toast.error(res.message || 'Failed to delete protocol');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete protocol');
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 transition-all ${previewTemplate ? 'max-w-6xl h-[90vh]' : 'max-w-4xl max-h-[85vh]'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="text-indigo-500" /> Browse Protocols
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a clinical structure to apply to the current record.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-grow overflow-hidden">
          {/* Main List Area */}
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                <button 
                  onClick={() => setActiveTab('my')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'my' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                >
                  My Protocols
                </button>
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Public Pooled
                </button>
              </div>
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <Input 
                  placeholder="Search by name, disease, or tag..." 
                  className="pl-10 h-10 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* List Content */}
            <div className="flex-grow overflow-y-auto p-6">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3 py-20">
                  <Loader2 className="text-indigo-500 animate-spin" size={40} />
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fetching Knowledge Base...</p>
                </div>
              ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredTemplates.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => setPreviewTemplate(t)}
                      className={`group p-5 rounded-2xl border transition-all cursor-pointer relative ${
                        previewTemplate?.id === t.id 
                          ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10 shadow-lg' 
                          : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            previewTemplate?.id === t.id ? 'bg-indigo-500 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-tight">{t.templateName}</h3>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">{t.description || "System standard clinical framework."}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {t.usageCount > 10 && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-[9px] font-black uppercase rounded-full">POPULAR</span>}
                           <div className={`p-1.5 rounded-lg transition-colors ${previewTemplate?.id === t.id ? 'text-indigo-600' : 'text-gray-300'}`}>
                             <ChevronRight size={18} />
                           </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          <span className="flex items-center gap-1 font-bold">{t.schema.sections.length} Sections</span>
                          <span className="flex items-center gap-1 font-bold">{t.usageCount} Usages</span>
                        </div>
                        <button 
                            onClick={(e) => handleDeleteClick(e, t.id)}
                            className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Search size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No protocols found</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">Try refining your search or create a new protocols from scratch.</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          {previewTemplate && (
            <div className="w-[400px] border-l border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 flex flex-col animate-in slide-in-from-right-10 duration-300">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg uppercase tracking-widest">Protocol Structure</span>
                  <button onClick={() => setPreviewTemplate(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{previewTemplate.templateName}</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{previewTemplate.description || "Standardized structure for clinical data collection."}</p>
                
                <Button 
                    onClick={() => onSelect(previewTemplate)}
                    className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold py-6 group"
                >
                    Apply Protocol <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {previewTemplate.schema.sections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-center justify-center text-xs font-bold text-gray-400">
                        {sIdx + 1}
                      </div>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">{section.section_name}</h4>
                    </div>
                    <div className="ml-8 space-y-1.5">
                      {section.fields.map((field, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-gray-500 py-1 transition-colors hover:text-indigo-500">
                          <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                          <span>{field.field_label}</span>
                          <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase tracking-tighter ml-auto">
                            {field.field_type}
                          </span>
                        </div>
                      ))}
                      {section.fields.length === 0 && (
                        <p className="text-[10px] text-gray-400 italic">No static fields defined.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl font-bold px-6">Cancel</Button>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Delete Protocol?</h3>
              <p className="text-sm text-gray-500">This action cannot be undone. Are you sure you want to permanently remove this clinical protocol?</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white border-0" onClick={confirmDeletion}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
