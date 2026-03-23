import { RefreshCw, PlusCircle } from 'lucide-react';

interface VisitTypeSelectorProps {
    lastDiagnosis?: string;
    daysSinceLastVisit: number;
    onContinue: () => void;
    onNewComplaint: () => void;
    selectedType: 'continue' | 'new';
}

export const VisitTypeSelector: React.FC<VisitTypeSelectorProps> = ({
    lastDiagnosis,
    daysSinceLastVisit,
    onContinue,
    onNewComplaint,
    selectedType
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <RefreshCw size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Follow-up Visit</h3>
                    <p className="text-[11px] font-bold text-blue-600/80 dark:text-blue-400">
                        Patient last seen {daysSinceLastVisit} days ago 
                        {lastDiagnosis && <span className="text-slate-400 font-medium ml-2">• Previous Diagnosis: {lastDiagnosis}</span>}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={onContinue}
                    className={`group p-6 rounded-3xl border transition-all text-left relative overflow-hidden backdrop-blur-sm ${
                        selectedType === 'continue' 
                            ? "border-blue-500 bg-blue-600/5 shadow-xl shadow-blue-500/10" 
                            : "border-slate-100 dark:border-slate-800 hover:border-blue-500/20 bg-white/50 dark:bg-slate-900/50"
                    }`}
                >
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                                selectedType === 'continue' ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}>
                                <RefreshCw size={20} />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">Continue Management</h4>
                            <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                                Review and update existing treatment plan. Pre-filled with previous structure.
                            </p>
                        </div>
                        {selectedType === 'continue' && (
                            <div className="absolute top-0 right-0 p-4">
                                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                            </div>
                        )}
                    </div>
                </button>

                <button
                    onClick={onNewComplaint}
                    className={`group p-6 rounded-3xl border transition-all text-left relative overflow-hidden backdrop-blur-sm ${
                        selectedType === 'new' 
                            ? "border-indigo-500 bg-indigo-600/5 shadow-xl shadow-indigo-500/10" 
                            : "border-slate-100 dark:border-slate-800 hover:border-indigo-500/20 bg-white/50 dark:bg-slate-900/50"
                    }`}
                >
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                                selectedType === 'new' ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}>
                                <PlusCircle size={20} />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">New Complaint</h4>
                            <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                                Different issue from last visit. Start fresh assessment while keeping height history.
                            </p>
                        </div>
                        {selectedType === 'new' && (
                            <div className="absolute top-0 right-0 p-4">
                                <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                            </div>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
};
