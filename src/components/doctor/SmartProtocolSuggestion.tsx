'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, ArrowRight, ClipboardList, 
    Clock, Star, ChevronRight, Activity, Clipboard, Search
} from 'lucide-react';
import { templatesApi } from '@/lib/api/templatesApi';
import { useQuery } from '@tanstack/react-query';

interface SmartProtocolSuggestionProps {
    chiefComplaint: string;
    patientId: string;
    onSelect: (templateId: string) => void;
    onStartBlank: () => void;
}

export const SmartProtocolSuggestion: React.FC<SmartProtocolSuggestionProps> = ({
    chiefComplaint,
    patientId,
    onSelect,
    onStartBlank
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isExploringAll, setIsExploringAll] = React.useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['templates', 'suggest', chiefComplaint, patientId],
        queryFn: () => templatesApi.suggestTemplates({ chiefComplaint, patientId }),
        staleTime: 1000 * 60 * 5,
    });

    const allSuggestions = data?.data || [];
    const filteredSuggestions = allSuggestions.filter((s: any) => 
        s.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const suggestionsToShow = isExploringAll ? filteredSuggestions : filteredSuggestions.slice(0, 2);
    const hasMore = filteredSuggestions.length > 2;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 backdrop-blur-sm">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Suggested Protocols</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Clinical assessment structures</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input 
                            type="text"
                            placeholder="Search protocols..."
                            className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500/50 transition-all w-64 backdrop-blur-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {!isLoading && (
                        <button 
                            onClick={onStartBlank}
                            className="h-[42px] px-6 bg-slate-900 dark:bg-blue-600/10 hover:bg-slate-800 dark:hover:bg-blue-600 text-slate-400 dark:text-blue-400 hover:text-white border border-slate-800 dark:border-blue-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-lg shadow-blue-500/5"
                        >
                            Skip to Blank Form <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        [1, 2].map(i => (
                            <div key={i} className="h-28 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />
                        ))
                    ) : (
                        suggestionsToShow.map((template: any, index: number) => (
                            <motion.button
                                key={template.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSelect(template.id)}
                                className="group relative p-6 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-100 dark:border-slate-800/50 hover:border-blue-500/50 rounded-3xl text-left transition-all hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)]"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                                        <ClipboardList size={22} />
                                    </div>
                                    {template.usageCount > 10 && (
                                        <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-tight">
                                            <Star size={10} fill="currentColor" /> Popular Choice
                                        </div>
                                    )}
                                </div>
                                
                                <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                                    {template.templateName}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-bold mb-4 uppercase tracking-wide opacity-60">
                                    {template.description || 'Predefined clinical assessment structure'}
                                </p>

                                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg">
                                        <Clock size={12} className="text-blue-500" /> {template.averageEntryTimeSeconds ? `${Math.round(template.averageEntryTimeSeconds / 60)} min` : '5 min'}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg">
                                        <Activity size={12} className="text-emerald-500" /> {template.schema?.sections?.length || 0} Sections
                                    </div>
                                </div>

                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-blue-500">
                                    <ChevronRight size={24} />
                                </div>
                            </motion.button>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {!isLoading && hasMore && (
                <div className="flex justify-center mt-4">
                    <button 
                        onClick={() => setIsExploringAll(!isExploringAll)}
                        className="px-8 py-3 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 hover:border-blue-500/30 transition-all flex items-center gap-2"
                    >
                        {isExploringAll ? "Show Suggested" : `Explore All Protocols (${filteredSuggestions.length})`}
                        <ChevronRight className={`transition-transform duration-300 ${isExploringAll ? '-rotate-90' : 'rotate-90'}`} size={16} />
                    </button>
                </div>
            )}

            {!isLoading && allSuggestions.length === 0 && (
                <div className="p-8 bg-slate-950/30 rounded-2xl border border-dotted border-slate-800 flex flex-col items-center justify-center text-center">
                    <p className="text-slate-500 text-sm font-medium mb-4">No specific protocols match this chief complaint.</p>
                    <button 
                        onClick={onStartBlank}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        Use Regular Form
                    </button>
                </div>
            )}
        </div>
    );
};
