import React, { useState, useEffect } from 'react';
import { Search, FileText, Clock, Check, Loader2, X, Trash2, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((t) => (
                <div 
                  key={t.id}
                  onClick={() => onSelect(t)}
                  className="group p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900 bg-white dark:bg-gray-900 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer relative"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-tight">{t.templateName}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{t.description || "System standard clinical framework."}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span className="flex items-center gap-1"><Check size={12} className="text-emerald-500" /> {t.schema.sections.length} Sections</span>
                        <span className="flex items-center gap-1 font-bold">Used {t.usageCount} Times</span>
                      </div>

                      {t.lastUsedAt && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 italic">
                          <Clock size={10} /> Last used {new Date(t.lastUsedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 shrink-0 self-end md:self-auto">
                      <button 
                        onClick={(e) => handleDeleteClick(e, t.id)}
                        className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-100 dark:border-red-900/30"
                        title="Delete Protocol"
                      >
                        <Trash2 size={14} />
                      </button>
                      <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-lg border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50">
                        USE PROTOCOL
                      </Button>
                    </div>
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
