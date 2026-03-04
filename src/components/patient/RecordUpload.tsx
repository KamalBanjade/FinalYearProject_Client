import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle, Sparkles, Calendar, Star, Clock } from 'lucide-react';
import { medicalRecordsApi, UploadMedicalRecordDTO } from '@/lib/api/medicalRecords';
import { patientApi, DoctorBasicInfo, DoctorSuggestionItem, SmartDoctorSuggestionDTO } from '@/lib/api/patient';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/dicom'];

interface RecordUploadProps {
    onUploadSuccess?: () => void;
    /** Fires immediately when the upload succeeds — use to refresh data in the background */
    onRecordUploaded?: () => void;
}

function SuggestionBadge({ type }: { type: 'Appointment' | 'Primary' | 'Recent' }) {
    const config = {
        Appointment: { icon: <Calendar className="w-3 h-3" />, label: 'Appointment', className: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800/50' },
        Primary: { icon: <Star className="w-3 h-3" />, label: 'Primary', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' },
        Recent: { icon: <Clock className="w-3 h-3" />, label: 'Recent', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50' },
    }[type];

    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.className}`}>
            {config.icon}
            {config.label}
        </span>
    );
}

function SuggestionChip({
    suggestion,
    isSelected,
    onClick,
}: {
    suggestion: DoctorSuggestionItem;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl border transition-all duration-200 group
                ${isSelected
                    ? 'border-primary/40 bg-primary/5 shadow-sm dark:border-primary/50 dark:bg-primary/5'
                    : 'border-slate-100 bg-white hover:border-primary/30 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-primary/30 dark:hover:bg-primary/5'
                }`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-colors
                ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                {suggestion.fullName.split(' ').find(w => w !== 'Dr.')?.charAt(0) ?? 'D'}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{suggestion.fullName}</span>
                    <SuggestionBadge type={suggestion.suggestionType} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 truncate">{suggestion.department} · {suggestion.suggestionLabel}</p>
            </div>
            {isSelected && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
        </button>
    );
}

export function RecordUpload({ onUploadSuccess, onRecordUploaded }: RecordUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [recordType, setRecordType] = useState('Lab Report');
    const [description, setDescription] = useState('');
    const [recordDate, setRecordDate] = useState('');

    // Smart suggestion state
    const [suggestions, setSuggestions] = useState<SmartDoctorSuggestionDTO | null>(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    // Manual override state
    const [showManualOverride, setShowManualOverride] = useState(false);
    const [departments, setDepartments] = useState<string[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [doctors, setDoctors] = useState<DoctorBasicInfo[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    // Selected doctor (the actual value sent on upload)
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedDoctorName, setSelectedDoctorName] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Post-upload primary doctor prompt
    const [primarySuggestion, setPrimarySuggestion] = useState<{
        doctorId: string;
        doctorName: string;
    } | null>(null);
    const [settingPrimary, setSettingPrimary] = useState(false);
    const [primarySetConfirmed, setPrimarySetConfirmed] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load smart suggestions on mount
    useEffect(() => {
        setLoadingSuggestions(true);
        patientApi.getSmartDoctorSuggestions()
            .then(res => {
                if (res.success && res.data) {
                    setSuggestions(res.data);
                    // Auto-select recommended doctor
                    if (res.data.recommendedDoctor) {
                        setSelectedDoctorId(res.data.recommendedDoctor.id);
                        setSelectedDoctorName(res.data.recommendedDoctor.fullName);
                    }
                }
            })
            .catch(() => setSuggestions(null))
            .finally(() => setLoadingSuggestions(false));
    }, []);

    // Fetch departments for manual override
    useEffect(() => {
        if (showManualOverride && departments.length === 0) {
            patientApi.getDepartments().then(res => {
                if (res.success && res.data) setDepartments(res.data);
            });
        }
    }, [showManualOverride]);

    // Fetch doctors when department selected in override
    useEffect(() => {
        if (!selectedDepartment) { setDoctors([]); return; }
        setLoadingDoctors(true);
        patientApi.getDoctorsByDepartment(selectedDepartment)
            .then(res => { if (res.success && res.data) setDoctors(res.data); })
            .finally(() => setLoadingDoctors(false));
    }, [selectedDepartment]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
    };

    const validateAndSetFile = (selectedFile: File) => {
        setError(null); setSuccess(false);
        if (selectedFile.size > MAX_FILE_SIZE) { setError('File size must be less than 10MB'); return; }
        if (!ALLOWED_TYPES.includes(selectedFile.type) && !selectedFile.name.endsWith('.dcm')) {
            setError('Invalid file type. Allowed: PDF, JPG, PNG, DCM'); return;
        }
        setFile(selectedFile);
    };

    const removeFile = () => { setFile(null); setError(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

    const selectSuggestion = (doc: DoctorSuggestionItem) => {
        setSelectedDoctorId(doc.id);
        setSelectedDoctorName(doc.fullName);
        setShowManualOverride(false);
        setSelectedDepartment('');
    };

    const handleManualDoctorSelect = (doctorId: string) => {
        const doc = doctors.find(d => d.id === doctorId);
        setSelectedDoctorId(doctorId);
        setSelectedDoctorName(doc ? `Dr. ${doc.firstName} ${doc.lastName}` : '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) { setError('Please select a file to upload'); return; }
        if (!selectedDoctorId) { setError('Please assign a doctor for review.'); return; }

        setIsUploading(true); setError(null); setUploadProgress(10);

        try {
            const data: UploadMedicalRecordDTO = {
                file, recordType, description,
                recordDate: recordDate || undefined,
                assignedDoctorId: selectedDoctorId,
            };
            setUploadProgress(50);
            setUploadProgress(100);
            setSuccess(true);
            toast.success('Medical record uploaded and encrypted successfully!');

            // Fire background refresh immediately — does NOT redirect
            onRecordUploaded?.();

            // Post-upload: suggest setting primary doctor if not already set
            const hasPrimary = suggestions?.primaryDoctor !== null;
            if (!hasPrimary && selectedDoctorId && selectedDoctorName) {
                setPrimarySuggestion({ doctorId: selectedDoctorId, doctorName: selectedDoctorName });
            } else {
                // No prompt needed — auto-dismiss after short delay
                setTimeout(() => {
                    setFile(null); setRecordType('Lab Report'); setDescription('');
                    setRecordDate(''); setUploadProgress(0); setSuccess(false);
                    onUploadSuccess?.();
                }, 2000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload record. Please try again.');
            setUploadProgress(0);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSetPrimary = async () => {
        if (!primarySuggestion) return;
        setSettingPrimary(true);
        try {
            await patientApi.setPrimaryDoctor(primarySuggestion.doctorId);
            setPrimarySetConfirmed(true);
            toast.success(`${primarySuggestion.doctorName} is now your primary doctor.`);
            // Refresh suggestions so next upload sees the primary
            setSuggestions(prev => prev ? {
                ...prev, primaryDoctor: {
                    id: primarySuggestion.doctorId,
                    fullName: primarySuggestion.doctorName,
                    department: '',
                    suggestionType: 'Primary',
                    suggestionLabel: 'Your primary doctor',
                }
            } : prev);
        } catch {
            // Silent fail — not critical
        } finally {
            setSettingPrimary(false);
            setTimeout(() => {
                setSuccess(false); setPrimarySuggestion(null); setPrimarySetConfirmed(false);
                onUploadSuccess?.();
            }, 1800);
        }
    };

    const dismissPrimarySuggestion = () => {
        setPrimarySuggestion(null);
        setSuccess(false);
        onUploadSuccess?.();
    };

    // Collect all unique suggestions to display
    const allSuggestions: DoctorSuggestionItem[] = (() => {
        if (!suggestions) return [];
        const seen = new Set<string>();
        const items: DoctorSuggestionItem[] = [];
        const add = (item: DoctorSuggestionItem | null | undefined) => {
            if (item && !seen.has(item.id)) { seen.add(item.id); items.push(item); }
        };
        add(suggestions.upcomingAppointmentDoctor);
        add(suggestions.primaryDoctor);
        suggestions.recentDoctors.forEach(add);
        return items;
    })();

    return (
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-premium border border-slate-200 dark:border-slate-800 w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">

                <div
                    className={`border-2 border-dashed rounded-3xl p-10 text-center transition-colors
                        ${file ? 'border-primary/30 bg-primary/5 dark:border-primary/20 dark:bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary/50 cursor-pointer'}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !file && fileInputRef.current?.click()}
                    role="button" tabIndex={0}
                >
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.dcm" />
                    {!file ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="p-4 bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl shadow-sm"><UploadCloud className="h-8 w-8" /></div>
                            <p className="text-base font-bold text-slate-700 dark:text-slate-300">Click or drag your file here to upload</p>
                            <p className="text-sm text-slate-500 dark:text-slate-500 font-medium tracking-tight">Supported formats: PDF, JPG, PNG or DICOM (Max 10MB)</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/30 w-full">
                            <div className="flex items-center space-x-4 min-w-0">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-500 dark:text-indigo-400 flex-shrink-0"><FileIcon className="h-5 w-5" /></div>
                                <div className="truncate min-w-0 text-left">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-4 flex-shrink-0">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Record Type <span className="text-rose-500">*</span></label>
                        <select value={recordType} onChange={(e) => setRecordType(e.target.value)}
                            className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-5 text-[15px] font-bold text-slate-700 dark:text-white focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none shadow-sm" required>
                            <option value="Lab Report">Lab Report</option>
                            <option value="Prescription">Prescription</option>
                            <option value="X-Ray">X-Ray</option>
                            <option value="CT Scan">CT Scan</option>
                            <option value="MRI">MRI</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Record Date</label>
                        <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)}
                            className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-5 text-[15px] font-bold text-slate-700 dark:text-white focus:outline-none focus:border-primary transition-all shadow-sm" />
                    </div>
                </div>

                {/* ===== SMART DOCTOR ASSIGNMENT ===== */}
                <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assign Reviewed Doctor</h3>
                        {selectedDoctorId && (
                            <span className="ml-auto text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-1 rounded-full truncate max-w-[180px] border border-indigo-200 dark:border-indigo-800">
                                {selectedDoctorName}
                            </span>
                        )}
                    </div>

                    <div className="p-5 space-y-3 bg-white dark:bg-slate-900">
                        {/* Loading state */}
                        {loadingSuggestions && (
                            <div className="flex items-center gap-3 text-sm text-gray-400 animate-pulse py-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
                                    <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
                                </div>
                            </div>
                        )}

                        {/* Suggestion chips */}
                        {!loadingSuggestions && allSuggestions.length > 0 && (
                            <div className="space-y-2">
                                {allSuggestions.map((doc) => (
                                    <SuggestionChip
                                        key={doc.id}
                                        suggestion={doc}
                                        isSelected={selectedDoctorId === doc.id}
                                        onClick={() => selectSuggestion(doc)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* No suggestions */}
                        {!loadingSuggestions && allSuggestions.length === 0 && !showManualOverride && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-2">No previous doctors found. Please select manually below.</p>
                        )}

                        {/* Toggle for manual override */}
                        <button
                            type="button"
                            onClick={() => { setShowManualOverride(v => !v); setSelectedDepartment(''); setSelectedDoctorId(''); setSelectedDoctorName(''); }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors pt-1"
                        >
                            <span>{showManualOverride ? '↑ Hide' : (allSuggestions.length > 0 ? '↓ Choose a different doctor' : '↓ Select a doctor')}</span>
                        </button>

                        {/* Manual override dropdowns */}
                        {showManualOverride && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-indigo-100 dark:border-indigo-900/30">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department <span className="text-rose-500">*</span></label>
                                    <select value={selectedDepartment} onChange={(e) => { setSelectedDepartment(e.target.value); setSelectedDoctorId(''); setSelectedDoctorName(''); }}
                                        className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/80 px-5 text-[15px] font-bold text-slate-700 dark:text-white focus:outline-none focus:border-primary transition-all appearance-none shadow-sm">
                                        <option value="" disabled>Select Department</option>
                                        {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Doctor <span className="text-rose-500">*</span></label>
                                    <select value={selectedDoctorId} onChange={(e) => handleManualDoctorSelect(e.target.value)}
                                        disabled={!selectedDepartment || loadingDoctors}
                                        className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/80 px-5 text-[15px] font-bold text-slate-700 dark:text-white focus:outline-none focus:border-primary transition-all disabled:opacity-50 appearance-none shadow-sm">
                                        <option value="" disabled>
                                            {loadingDoctors ? 'Loading...' : selectedDepartment ? 'Select Doctor' : 'Select Department First'}
                                        </option>
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>Dr. {doc.firstName} {doc.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2 text-left">
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-4 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:border-primary transition-colors shadow-sm resize-none h-32"
                        placeholder="Add clinical details..." />
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-800">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* === POST-UPLOAD SUCCESS + PRIMARY DOCTOR PROMPT === */}
                {success && (
                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 overflow-hidden">
                        {/* Success header */}
                        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-100/70 dark:bg-emerald-900/30">
                            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <div className="text-left">
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Record uploaded successfully!</p>
                                {selectedDoctorName && (
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                        Assigned to <span className="font-semibold">{selectedDoctorName}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Primary doctor prompt — only shown if no primary yet */}
                        {primarySuggestion && !primarySetConfirmed && (
                            <div className="px-4 py-3 border-t border-emerald-200 dark:border-emerald-800">
                                <p className="text-sm font-semibold text-gray-800 dark:text-white mb-2.5">
                                    Would you like to set <span className="text-indigo-600 dark:text-indigo-400 font-bold">{primarySuggestion.doctorName}</span> as your Primary Doctor?
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                                    Your primary doctor will be pre-selected on future uploads, saving you time.
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSetPrimary}
                                        disabled={settingPrimary}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-60"
                                    >
                                        {settingPrimary ? (
                                            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : <Star className="w-3.5 h-3.5" />}
                                        Yes, Set as Primary
                                    </button>
                                    <button
                                        type="button"
                                        onClick={dismissPrimarySuggestion}
                                        className="px-4 py-2 rounded-xl text-gray-500 dark:text-slate-400 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        No Thanks
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirmed state */}
                        {primarySetConfirmed && (
                            <div className="flex items-center gap-2 px-4 py-3 border-t border-emerald-200 dark:border-emerald-800">
                                <Star className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                                    {primarySuggestion?.doctorName} is now your Primary Doctor. 🎉
                                </p>
                            </div>
                        )}
                    </div>
                )}
                {isUploading && (
                    <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                    </div>
                )}

                {/* Submit */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={!file || isUploading}
                        className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-sm flex items-center gap-2 transition-all
                            ${!file || isUploading ? 'bg-indigo-300 dark:bg-indigo-900/50 dark:text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]'}`}
                    >
                        {isUploading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Encrypting & Uploading...
                            </>
                        ) : 'Upload Record'}
                    </button>
                </div>

            </form>
        </div>
    );
}
