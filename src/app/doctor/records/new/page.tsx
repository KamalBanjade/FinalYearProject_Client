'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doctorApi } from '@/lib/api/doctor';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Heart, Activity, Thermometer, Weight, Ruler, Droplets,
  Search, ScanLine, FileText, CheckCircle, AlertTriangle, Plus,
  Layout, BookOpen, Save, ChevronRight, X, Sparkles
} from 'lucide-react';
import { UserGroupIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';
import { AddCustomFieldModal } from '@/components/doctor/AddCustomFieldModal';
import { TemplateBrowserModal } from '@/components/doctor/TemplateBrowserModal';
import toast from 'react-hot-toast';
import { healthRecordApi } from '@/lib/api/healthRecordApi';
import { templatesApi, VisibilityLevel } from '@/lib/api/templatesApi';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PatientInfo {
  id: string;
  name: string;
  age: number;
}

interface TemplateSection {
  section_name: string;
  display_order: number;
  fields: TemplateField[];
}

interface TemplateField {
  field_name: string;
  field_label: string;
  field_type: string;
  unit?: string;
  normal_range_min?: number;
  normal_range_max?: number;
  is_required: boolean;
  dropdown_options?: string[];
}

interface BaseVitalsForm {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  spO2: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

// ─── Vital Input Sub-Component ────────────────────────────────────────────

const vitalStatus = (type: string, value: string) => {
  if (!value) return null;
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  switch (type) {
    case 'systolic': return n > 140 ? 'high' : n > 120 ? 'elevated' : 'normal';
    case 'diastolic': return n > 90 ? 'high' : n > 80 ? 'elevated' : 'normal';
    case 'hr': return n < 60 ? 'low' : n > 100 ? 'high' : 'normal';
    case 'temp': return n > 100.4 ? 'high' : n < 96.8 ? 'low' : 'normal';
    case 'spo2': return n < 95 ? 'low' : 'normal';
    default: return null;
  }
};

const VitalInput = ({ label, field, icon: Icon, type, unit, value, onChange }: {
  label: string, field: keyof BaseVitalsForm, icon: any, type: string, unit: string, value: string, onChange: (field: keyof BaseVitalsForm, value: string) => void
}) => {
  const status = vitalStatus(type, value);
  const statusColors: Record<string, string> = {
    high: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    elevated: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    low: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    normal: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  };
  return (
    <div className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${status && status !== 'normal'
        ? 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/10'
        : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30'
      }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status === 'high' ? 'bg-red-100 text-red-500' :
          status === 'low' ? 'bg-blue-100 text-blue-500' :
            'bg-white dark:bg-gray-800 text-blue-500 shadow-sm'
        }`}>
        <Icon size={18} />
      </div>
      <div className="flex-grow min-w-0">
        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">{label}</label>
        <div className="flex items-baseline gap-1">
          <input
            type="number"
            className="bg-transparent text-2xl font-black text-gray-900 dark:text-white outline-none w-20 placeholder:text-gray-300"
            placeholder="—"
            value={value}
            onChange={e => onChange(field, e.target.value)}
          />
          {unit && <span className="text-xs text-gray-400 font-medium">{unit}</span>}
        </div>
      </div>
      {status && (
        <div className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${statusColors[status]}`}>
          {status}
        </div>
      )}
    </div>
  );
};

export default function StructuredRecordEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // — Modal States
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [activeSectionForCustomField, setActiveSectionForCustomField] = useState<string | null>(null);
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  // — Patient & Context
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [entrySource, setEntrySource] = useState<'qr' | 'directory' | 'appointment' | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // — Template State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);
  const [localSections, setLocalSections] = useState<TemplateSection[]>([]);

  // — Field Data (flattened key: `${sectionName}_${fieldName}`)
  const [templateData, setTemplateData] = useState<Record<string, string>>({});

  // — Vitals
  const [baseVitals, setBaseVitals] = useState<BaseVitalsForm>({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    spO2: ''
  });

  // — Notes & Saving
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [lastSavedRecordId, setLastSavedRecordId] = useState<string | null>(null);
  const [hasStructureChanges, setHasStructureChanges] = useState(false);

  // ─── Query Params ─────────────────────────────────────────────────────────

  useEffect(() => {
    const pId = searchParams.get('patientId');
    const source = searchParams.get('source');
    const apptId = searchParams.get('appointmentId');
    const fromQR = searchParams.get('fromQR');

    if (source) setEntrySource(source as any);
    else if (fromQR === 'true') setEntrySource('qr');
    if (apptId) setAppointmentId(apptId);
    if (pId) loadPatientData(pId);
  }, [searchParams]);

  // ─── Data Loading ─────────────────────────────────────────────────────────

  async function loadPatientData(pId: string) {
    try {
      setIsLoading(true);
      const res = await doctorApi.getPatientInfo(pId);
      if (res.success && res.data) {
        setPatient({
          id: res.data.id,
          name: `${res.data.firstName} ${res.data.lastName}`,
          age: calculateAge(res.data.dateOfBirth)
        });
      }
    } catch {
      toast.error('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  }

  const calculateAge = (dobString: string) => {
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  // ─── Computed ─────────────────────────────────────────────────────────────

  const bmi = React.useMemo(() => {
    const w = parseFloat(baseVitals.weight);
    const h = parseFloat(baseVitals.height) / 100;
    if (!w || !h) return null;
    return (w / (h * h)).toFixed(1);
  }, [baseVitals.weight, baseVitals.height]);

  const bmiCategory = React.useMemo(() => {
    if (!bmi) return null;
    const v = parseFloat(bmi);
    if (v < 18.5) return { label: 'Underweight', color: 'text-yellow-500' };
    if (v < 25) return { label: 'Normal', color: 'text-green-500' };
    if (v < 30) return { label: 'Overweight', color: 'text-amber-500' };
    return { label: 'Obese', color: 'text-red-500' };
  }, [bmi]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleVitalsChange = (field: keyof BaseVitalsForm, value: string) =>
    setBaseVitals(prev => ({ ...prev, [field]: value }));

  const handleFieldChange = (section: string, field: string, value: string) =>
    setTemplateData(prev => ({ ...prev, [`${section}_${field}`]: value }));

  const handleUseTemplate = (t: any) => {
    setSelectedTemplateName(t.templateName);
    setLocalSections(t.schema?.sections || []);
    setTemplateData({});
    setHasStructureChanges(false);
    setIsTemplateBrowserOpen(false);
    toast.success(`Protocol "${t.templateName}" loaded!`);
    // Scroll to sections
    setTimeout(() => {
      document.getElementById('clinical-sections')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartFromScratch = () => {
    setSelectedTemplateName(null);
    setLocalSections([{ section_name: 'General Assessment', display_order: 1, fields: [] }]);
    setTemplateData({});
    setHasStructureChanges(false);
    setTimeout(() => {
      document.getElementById('clinical-sections')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const openAddCustomField = (sectionName?: string) => {
    setActiveSectionForCustomField(sectionName || null);
    setIsCustomFieldModalOpen(true);
  };

  const handleAddCustomField = (field: TemplateField, sectionName: string) => {
    setHasStructureChanges(true);
    setLocalSections(prev => {
      const existing = prev.find(s => s.section_name === sectionName);
      if (existing) {
        return prev.map(s => s.section_name === sectionName
          ? { ...s, fields: [...s.fields, field] }
          : s
        );
      }
      return [...prev, { section_name: sectionName, display_order: prev.length + 1, fields: [field] }];
    });
  };

  const handleCompleteAndSave = async () => {
    if (!patient) return;
    setIsSaving(true);
    try {
      const formattedSections = localSections.map(s => ({
        sectionName: s.section_name,
        attributes: s.fields.map(f => ({
          name: f.field_name,
          value: templateData[`${s.section_name}_${f.field_name}`] || ''
        }))
      }));

      const res = await healthRecordApi.createRecord({
        patientId: patient.id,
        appointmentId: appointmentId || undefined,
        vitals: {
          bloodPressureSystolic: parseInt(baseVitals.bloodPressureSystolic) || 0,
          bloodPressureDiastolic: parseInt(baseVitals.bloodPressureDiastolic) || 0,
          heartRate: parseInt(baseVitals.heartRate) || 0,
          temperature: parseFloat(baseVitals.temperature) || 0,
          weight: parseFloat(baseVitals.weight) || 0,
          height: parseFloat(baseVitals.height) || 0,
          spO2: parseInt(baseVitals.spO2) || 0
        },
        sections: formattedSections,
        diagnosis,
        treatmentPlan,
        doctorNotes
      });

      if (res.success) {
        setLastSavedRecordId(res.data.id);
        // ONLY prompt to save as template if meaningful structural changes were made
        if (hasStructureChanges) {
          setShowSaveTemplateModal(true);
        } else {
          toast.success('Record saved successfully!');
          router.push('/doctor/dashboard');
        }
      }
    } catch {
      toast.error('Failed to save health record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) { toast.error('Please enter a protocol name'); return; }
    setIsSavingTemplate(true);
    try {
      let res;
      if (lastSavedRecordId) {
        // Save from record (post-save flow)
        res = await templatesApi.createTemplateFromRecord(lastSavedRecordId, {
          templateName: newTemplateName,
          visibility: VisibilityLevel.Private
        });
      } else {
        // Direct save (from Structure Builder)
        res = await templatesApi.createTemplate({
          templateName: newTemplateName,
          description: `Custom protocol: ${newTemplateName}`,
          visibility: VisibilityLevel.Private,
          schema: {
            sections: localSections.map((s, i) => ({
              section_name: s.section_name,
              display_order: i + 1,
              fields: s.fields.map((f, j) => ({ ...f, display_order: j + 1 }))
            }))
          }
        });
      }
      if (res.success) {
        toast.success(`Protocol "${newTemplateName}" saved to your library!`);
        setShowSaveTemplateModal(false);
        setNewTemplateName('');
        if (lastSavedRecordId) router.push('/doctor/dashboard');
      }
    } catch {
      toast.error('Failed to save protocol');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto pb-24">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 mb-4 sm:mb-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-lg shadow-gray-200/30 dark:shadow-none px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileText size={20} className="text-indigo-500" /> New Health Record
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              {patient ? (
                <span className="text-xs sm:text-sm text-gray-500 flex items-center flex-wrap gap-1">
                  Patient: <strong className="text-gray-800 dark:text-gray-200">{patient.name}</strong>
                  <span className="hidden xs:inline text-gray-400">·</span>
                  <span className="text-gray-400">Age {patient.age}</span>
                  {selectedTemplateName && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide">
                      {selectedTemplateName}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-xs sm:text-sm text-gray-400 italic">Select a patient to begin</span>
              )}
              {entrySource === 'qr' && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><ScanLine size={10} /> QR Verified</span>}
              {entrySource === 'directory' && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><UserGroupIcon className="w-2.5 h-2.5" /> Directory</span>}
              {entrySource === 'appointment' && <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><CalendarDaysIcon className="w-2.5 h-2.5" /> Appt Linked</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={() => router.push('/doctor/dashboard')} disabled={isSaving} className="hidden xs:flex flex-1 sm:flex-none rounded-xl font-bold text-gray-500 hover:text-red-500 hover:bg-red-50">
              Cancel
            </Button>
            <Button size="sm" disabled={!patient || isSaving} onClick={handleCompleteAndSave} isLoading={isSaving} className="flex-1 sm:flex-none rounded-xl bg-primary hover:bg-indigo-700 font-bold px-5 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4),0_0_20px_rgba(255,255,255,0.3)] dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.2)]">
              {isSaving ? 'Saving...' : 'Save Record'} <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── SECTION 1: Patient + Protocol Selection ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-indigo-900/40 flex items-center justify-center text-primary text-xs font-black">1</div>
            <h2 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest">Patient & Protocol</h2>
          </div>
          <div className="p-6 space-y-6">

            {/* Patient Search */}
            {!patient && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex items-center justify-center gap-2 shrink-0 rounded-xl border-dashed h-12 sm:h-auto" onClick={() => setPatient({ id: 'P-DEMO', name: 'Demo Patient', age: 45 })}>
                  <ScanLine size={16} /> Scan QR
                </Button>
                <div className="relative flex-grow">
                  <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
                  <input
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Search patient by name, ID, or phone..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Patient confirmed UI */}
            {patient && (
              <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-primary/10 dark:border-indigo-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-sm">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{patient.name}</p>
                    <p className="text-xs text-gray-500">Age {patient.age} · {patient.id}</p>
                  </div>
                </div>
                <button onClick={() => setPatient(null)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-white rounded-lg transition">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Chief Complaint */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Chief Complaint</label>
              <div className="flex gap-2">
                <input
                  className="flex-grow border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 sm:py-2.5 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-gray-400"
                  placeholder="e.g. chronic kidney disease, hypertension follow-up..."
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                />
              </div>
            </div>

            {/* Protocol Selection - Only show selection triggers if no protocol is active */}
            {!localSections.length && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Clinical Protocol</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Browse Library */}
                  <button
                    onClick={() => setIsTemplateBrowserOpen(true)}
                    className="group flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border border-primary/10 dark:border-indigo-800/40 rounded-2xl hover:shadow-md hover:shadow-indigo-200/50 dark:hover:shadow-none transition-all duration-200 text-left"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-primary">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">Browse Protocol Library</p>
                      <p className="text-xs text-gray-500 mt-0.5">Pick from your library</p>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Start from Scratch */}
                  <button
                    onClick={handleStartFromScratch}
                    className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all duration-200 text-left"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-gray-500 dark:text-gray-400">
                      <Plus size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">Build from Scratch</p>
                      <p className="text-xs text-gray-500 mt-0.5">Add custom sections manually</p>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            )}

            {/* Active protocol badge */}
            {localSections.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-primary/10 dark:border-indigo-800/40">
                <CheckCircle size={16} className="text-indigo-500 shrink-0" />
                <span className="text-sm text-indigo-700 dark:text-indigo-400 font-semibold">
                  {selectedTemplateName ? (
                    <>Protocol active: <strong>{selectedTemplateName}</strong></>
                  ) : (
                    <>Custom Structure: <strong>Manual Entry</strong></>
                  )}
                </span>
                <button
                  onClick={() => setIsTemplateBrowserOpen(true)}
                  className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary dark:text-indigo-400 hover:opacity-80 transition-all px-2 py-1 bg-white dark:bg-gray-800 rounded-lg border border-primary/10 dark:border-indigo-800/40"
                >
                  <BookOpen size={12} /> Browse Library
                </button>
                <button
                  onClick={() => { setSelectedTemplateName(null); setLocalSections([]); setTemplateData({}); }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Reset Protocol"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 2: Base Vital Signs ── */}
        <div id="base-vitals" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 text-xs font-black">2</div>
              <h2 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest">Vital Signs</h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg">Always Required</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

              {/* Blood Pressure — spans 2 cols */}
              <div className="sm:col-span-2 lg:col-span-2 relative flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-sm text-rose-500">
                  <Activity size={18} />
                </div>
                <div className="flex-grow">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Blood Pressure</label>
                  <div className="flex items-baseline gap-2">
                    <input type="number" className="bg-transparent text-2xl font-black text-gray-900 dark:text-white outline-none w-16 placeholder:text-gray-300" placeholder="SYS" value={baseVitals.bloodPressureSystolic} onChange={e => handleVitalsChange('bloodPressureSystolic', e.target.value)} />
                    <span className="text-gray-300 text-xl">/</span>
                    <input type="number" className="bg-transparent text-2xl font-black text-gray-900 dark:text-white outline-none w-16 placeholder:text-gray-300" placeholder="DIA" value={baseVitals.bloodPressureDiastolic} onChange={e => handleVitalsChange('bloodPressureDiastolic', e.target.value)} />
                    <span className="text-xs text-gray-400 font-medium">mmHg</span>
                  </div>
                </div>
                {(vitalStatus('systolic', baseVitals.bloodPressureSystolic) === 'high') && (
                  <div className="shrink-0 flex items-center gap-1 text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg uppercase tracking-widest">
                    <AlertTriangle size={10} /> High
                  </div>
                )}
              </div>

              <VitalInput label="Heart Rate" field="heartRate" icon={Heart} type="hr" unit="bpm" value={baseVitals.heartRate} onChange={handleVitalsChange} />
              <VitalInput label="Temperature" field="temperature" icon={Thermometer} type="temp" unit="°F" value={baseVitals.temperature} onChange={handleVitalsChange} />
              <VitalInput label="Weight" field="weight" icon={Weight} type="none" unit="kg" value={baseVitals.weight} onChange={handleVitalsChange} />
              <VitalInput label="Height" field="height" icon={Ruler} type="none" unit="cm" value={baseVitals.height} onChange={handleVitalsChange} />

              {/* BMI Display */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/40">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">BMI</span>
                <span className="text-3xl font-black text-gray-900 dark:text-white">{bmi ?? '—'}</span>
                {bmiCategory && <span className={`text-xs font-bold mt-1 ${bmiCategory.color}`}>{bmiCategory.label}</span>}
              </div>

              <VitalInput label="SpO₂" field="spO2" icon={Droplets} type="spo2" unit="%" value={baseVitals.spO2} onChange={handleVitalsChange} />
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Dynamic Protocol Sections ── */}
        <div id="clinical-sections">
          {localSections.length > 0 && (
            <div className="space-y-4">
              {localSections.map((section, sIdx) => (
                <div key={`${section.section_name}-${sIdx}`} className="bg-white dark:bg-gray-900 rounded-2xl border border-violet-100 dark:border-violet-900/40 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-violet-50 dark:border-violet-900/30 bg-gradient-to-r from-violet-50/50 to-transparent dark:from-violet-900/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 text-xs font-black">{sIdx + 3}</div>
                      <h2 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest">{section.section_name}</h2>
                      <span className="text-[10px] font-black text-violet-500 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-lg uppercase tracking-widest">Protocol Section</span>
                    </div>

                    <button
                      onClick={() => setIsTemplateBrowserOpen(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[0_8px_25px_-5px_rgba(255,255,255,0.8),0_0_15px_rgba(255,255,255,0.4)] dark:shadow-[0_8px_30px_-8px_rgba(255,255,255,0.2)] border border-emerald-100 dark:border-emerald-900/50 hover:scale-105 active:scale-95 transition-all group/btn"
                    >
                      <Sparkles size={12} className="group-hover/btn:rotate-12 transition-transform" />
                      Choose Template
                    </button>
                  </div>
                    <div className="p-4 sm:p-6">
                    {section.fields.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6">
                        {section.fields.map(field => {
                          const value = templateData[`${section.section_name}_${field.field_name}`] || '';
                          const numValue = parseFloat(value);
                          const isAbnormal = field.field_type === 'Number' && value && field.normal_range_min !== undefined && field.normal_range_max !== undefined
                            && !isNaN(numValue) && (numValue < field.normal_range_min || numValue > field.normal_range_max);

                          return (
                            <div key={field.field_name} className="flex flex-col">
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center justify-between">
                                <span>{field.field_label}{field.is_required && <span className="text-red-500 ml-0.5">*</span>}</span>
                                {isAbnormal && (
                                  <span className="flex items-center gap-0.5 text-red-500 text-[10px] font-black uppercase tracking-wide">
                                    <AlertTriangle size={10} /> Abnormal
                                  </span>
                                )}
                              </label>

                              {field.field_type === 'Dropdown' && field.dropdown_options ? (
                                <select
                                  className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                  value={value}
                                  onChange={e => handleFieldChange(section.section_name, field.field_name, e.target.value)}
                                >
                                  <option value="">Select...</option>
                                  {field.dropdown_options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : field.field_type === 'Text' ? (
                                <textarea
                                  rows={2}
                                  className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
                                  placeholder={`Enter ${field.field_label.toLowerCase()}...`}
                                  value={value}
                                  onChange={e => handleFieldChange(section.section_name, field.field_name, e.target.value)}
                                />
                              ) : (
                                <div className="relative">
                                  <input
                                    type="number"
                                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${isAbnormal
                                        ? 'border-red-300 bg-red-50 dark:bg-red-900/10 focus:ring-red-400'
                                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-violet-500'
                                      } ${field.unit ? 'pr-14' : ''}`}
                                    placeholder="—"
                                    value={value}
                                    onChange={e => handleFieldChange(section.section_name, field.field_name, e.target.value)}
                                  />
                                  {field.unit && (
                                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">{field.unit}</span>
                                  )}
                                </div>
                              )}
                              {field.normal_range_min !== undefined && field.normal_range_max !== undefined && (
                                <span className="text-[10px] text-gray-400 mt-1">Normal: {field.normal_range_min}–{field.normal_range_max} {field.unit}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic mb-4">No fields yet. Add some below.</p>
                    )}

                    <button
                      onClick={() => openAddCustomField(section.section_name)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800/30 hover:border-violet-200"
                    >
                      <Plus size={12} /> Add Field to This Section
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Discrete Structure Actions ── */}
          {localSections.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => openAddCustomField()}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-all px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"
                >
                  <Plus size={12} /> Add New Section
                </button>
                {hasStructureChanges && (
                  <button
                    onClick={() => { setShowSaveTemplateModal(true); setLastSavedRecordId(null); }}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-all px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                  >
                    <Save size={12} /> Capture as Template
                  </button>
                )}
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic opacity-50">
                End of framework
              </p>
            </div>
          )}

          {/* ── Structure Builder (Empty State Only) ── */}
          {localSections.length === 0 && (
            <div className="mt-4 p-5 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Structure Builder</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Browse a protocol or build custom sections below
                </p>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={() => openAddCustomField()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
                >
                  <Plus size={13} /> Add Section
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 4: Clinical Notes ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 text-xs font-black">
              {localSections.length + 3}
            </div>
            <h2 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest">Clinical Notes</h2>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Diagnosis</label>
              <textarea
                rows={4}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-none placeholder:text-gray-400"
                placeholder="e.g. Chronic Kidney Disease Stage 3, Hypertension..."
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Treatment Plan</label>
              <textarea
                rows={4}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm font-mono bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-none placeholder:text-gray-400"
                placeholder={"1. Continue ACEI therapy\n2. Low-sodium diet\n3. Follow-up in 4 weeks"}
                value={treatmentPlan}
                onChange={e => setTreatmentPlan(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Private Doctor Notes</label>
              <textarea
                rows={3}
                className="w-full border border-yellow-200 dark:border-yellow-800/40 rounded-xl p-4 text-sm bg-yellow-50/50 dark:bg-yellow-900/10 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition resize-none placeholder:text-gray-400"
                placeholder="Patient seems anxious about results. Consider referral to nephrology..."
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Bottom spacer for sticky footer padding if needed, but we consolidated to header */}
        <div className="h-4" />
      </div>

      {/* ═══ Modals ═══ */}

      {/* Template Browser */}
      <TemplateBrowserModal
        isOpen={isTemplateBrowserOpen}
        onClose={() => setIsTemplateBrowserOpen(false)}
        onSelect={handleUseTemplate}
      />

      {/* Save as Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSaveTemplateModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-300/30 dark:shadow-none">
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Save as Protocol</h2>
              <p className="text-sm text-gray-500 mt-2 mb-6 max-w-xs mx-auto">
                This clinical structure will be saved to your library and available for any future patient with the same needs.
              </p>
              <div className="text-left mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Protocol Name</label>
                <input
                  autoFocus
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-semibold"
                  placeholder="e.g. Renal Function Profile, Diabetes Checkup..."
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowSaveTemplateModal(false); if (lastSavedRecordId) router.push('/doctor/dashboard'); }} disabled={isSavingTemplate}>
                  {lastSavedRecordId ? 'Skip & Done' : 'Cancel'}
                </Button>
                <Button className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold border-0 shadow-md shadow-emerald-300/30 dark:shadow-none" onClick={handleSaveTemplate} isLoading={isSavingTemplate}>
                  Save Protocol
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Field */}
      <AddCustomFieldModal
        isOpen={isCustomFieldModalOpen}
        onClose={() => setIsCustomFieldModalOpen(false)}
        onAdd={handleAddCustomField}
        existingSections={localSections.map(s => s.section_name)}
      />
    </div>
  );
}
