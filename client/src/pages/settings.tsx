import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Settings, Save, Trash2, Plus, RotateCcw, ChevronDown, ChevronUp, Check, Loader2, X } from "lucide-react";

const AGENT_BACKEND_URL = "https://fast-api-server-trading-agent-aidanpilon.replit.app";
const AGENT_API_KEY = "hippo_ak_7f3x9k2m4p8q1w5t";

interface Template {
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface SettingsData {
  standing_instructions: string;
  personal_profile: string;
  instruction_templates: Template[];
  profile_templates: Template[];
  active_instruction_template: string | null;
  active_profile_template: string | null;
  default_personal_profile: string;
  core_quant_dna: string;
}

async function fetchSettings(): Promise<SettingsData | null> {
  try {
    const res = await fetch(`${AGENT_BACKEND_URL}/api/settings`);
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function updateSettings(data: Record<string, unknown>): Promise<SettingsData | null> {
  try {
    const res = await fetch(`${AGENT_BACKEND_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-API-Key": AGENT_API_KEY },
      body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function saveTemplate(type: string, name: string, content: string): Promise<SettingsData | null> {
  try {
    const res = await fetch(`${AGENT_BACKEND_URL}/api/settings/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": AGENT_API_KEY },
      body: JSON.stringify({ type, name, content }),
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function deleteTemplate(type: string, name: string): Promise<SettingsData | null> {
  try {
    const res = await fetch(
      `${AGENT_BACKEND_URL}/api/settings/templates?template_type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`,
      { method: "DELETE", headers: { "X-API-Key": AGENT_API_KEY } },
    );
    if (res.ok) return res.json();
  } catch {}
  return null;
}

// ─── Template Chip Bar ──────────────────────────────────────────

function TemplateBar({
  templates,
  activeTemplate,
  onLoad,
  onDelete,
  onSave,
  label,
}: {
  templates: Template[];
  activeTemplate: string | null;
  onLoad: (t: Template) => void;
  onDelete: (name: string) => void;
  onSave: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
      <span className="text-[9px] text-white/25 uppercase tracking-wider font-semibold">{label}:</span>
      {templates.map((t) => (
        <div key={t.name} className="flex items-center gap-0">
          <button
            onClick={() => onLoad(t)}
            className={`text-[10px] px-2.5 py-1 rounded-l-md border transition-all ${
              activeTemplate === t.name
                ? "bg-blue-500/15 border-blue-500/30 text-blue-400 font-semibold"
                : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white/70"
            }`}
          >
            {activeTemplate === t.name && <Check className="w-2.5 h-2.5 inline mr-1" />}
            {t.name}
          </button>
          <button
            onClick={() => onDelete(t.name)}
            className="text-[10px] px-1.5 py-1 rounded-r-md border border-l-0 border-white/[0.08] bg-white/[0.02] text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
      <button
        onClick={onSave}
        className="text-[10px] px-2 py-1 rounded-md border border-dashed border-white/[0.1] text-white/30 hover:text-white/50 hover:border-white/20 transition-all flex items-center gap-1"
      >
        <Plus className="w-2.5 h-2.5" /> Save Template
      </button>
    </div>
  );
}

// ─── Save Template Modal ────────────────────────────────────────

function SaveTemplateModal({
  onSave,
  onClose,
}: {
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#0c0c0f] border border-white/10 rounded-xl p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-white mb-3">Save as Template</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name (e.g. Small Cap Aggressive)"
          maxLength={60}
          autoFocus
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/20 mb-3"
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSave(name.trim()); }}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-xs text-white/40 px-3 py-1.5 hover:text-white/60 transition-colors">Cancel</button>
          <Button
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim()}
            className="text-xs text-white px-3 py-1.5 rounded-lg disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ─────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showDNA, setShowDNA] = useState(false);

  // Form state
  const [instructions, setInstructions] = useState("");
  const [profile, setProfile] = useState("");
  const [activeInstrTemplate, setActiveInstrTemplate] = useState<string | null>(null);
  const [activeProfileTemplate, setActiveProfileTemplate] = useState<string | null>(null);

  // Template save modals
  const [saveInstrModal, setSaveInstrModal] = useState(false);
  const [saveProfileModal, setSaveProfileModal] = useState(false);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load settings on mount
  useEffect(() => {
    fetchSettings().then((data) => {
      if (data) {
        setSettings(data);
        setInstructions(data.standing_instructions || "");
        setProfile(data.personal_profile || "");
        setActiveInstrTemplate(data.active_instruction_template);
        setActiveProfileTemplate(data.active_profile_template);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateSettings({
      standing_instructions: instructions,
      personal_profile: profile,
      active_instruction_template: activeInstrTemplate,
      active_profile_template: activeProfileTemplate,
    });
    if (result) {
      setSettings((prev) => prev ? { ...prev, ...result } : prev);
      showToast("success", "Settings saved — takes effect on next query");
    } else {
      showToast("error", "Failed to save settings");
    }
    setSaving(false);
  };

  const handleSaveInstrTemplate = async (name: string) => {
    const result = await saveTemplate("instruction", name, instructions);
    if (result) {
      setSettings((prev) => prev ? { ...prev, instruction_templates: result.instruction_templates } : prev);
      setActiveInstrTemplate(name);
      showToast("success", `Template "${name}" saved`);
    }
    setSaveInstrModal(false);
  };

  const handleSaveProfileTemplate = async (name: string) => {
    const result = await saveTemplate("profile", name, profile);
    if (result) {
      setSettings((prev) => prev ? { ...prev, profile_templates: result.profile_templates } : prev);
      setActiveProfileTemplate(name);
      showToast("success", `Template "${name}" saved`);
    }
    setSaveProfileModal(false);
  };

  const handleDeleteInstrTemplate = async (name: string) => {
    const result = await deleteTemplate("instruction", name);
    if (result) {
      setSettings((prev) => prev ? { ...prev, instruction_templates: result.instruction_templates } : prev);
      if (activeInstrTemplate === name) setActiveInstrTemplate(null);
      showToast("success", `Template "${name}" deleted`);
    }
  };

  const handleDeleteProfileTemplate = async (name: string) => {
    const result = await deleteTemplate("profile", name);
    if (result) {
      setSettings((prev) => prev ? { ...prev, profile_templates: result.profile_templates } : prev);
      if (activeProfileTemplate === name) setActiveProfileTemplate(null);
      showToast("success", `Template "${name}" deleted`);
    }
  };

  const handleLoadInstrTemplate = (t: Template) => {
    setInstructions(t.content);
    setActiveInstrTemplate(t.name);
  };

  const handleLoadProfileTemplate = (t: Template) => {
    setProfile(t.content);
    setActiveProfileTemplate(t.name);
  };

  const handleClearInstructions = async () => {
    setInstructions("");
    setActiveInstrTemplate(null);
    const result = await updateSettings({ standing_instructions: "", active_instruction_template: "" });
    if (result) {
      setSettings((prev) => prev ? { ...prev, ...result } : prev);
      showToast("success", "Standing instructions cleared");
    }
  };

  const handleResetProfile = async () => {
    setProfile("");
    setActiveProfileTemplate(null);
    const result = await updateSettings({ personal_profile: "", active_profile_template: "" });
    if (result) {
      setSettings((prev) => prev ? { ...prev, ...result } : prev);
      showToast("success", "Profile reset to default (Core Quant DNA only)");
    }
  };

  const handleLoadDefaultProfile = () => {
    if (settings?.default_personal_profile) {
      setProfile(settings.default_personal_profile);
      setActiveProfileTemplate(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{background: 'linear-gradient(135deg, hsl(0, 0%, 0%) 0%, hsl(0, 0%, 10%) 50%, hsl(0, 0%, 0%) 100%)'}}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{background: 'linear-gradient(135deg, hsl(0, 0%, 0%) 0%, hsl(0, 0%, 10%) 50%, hsl(0, 0%, 0%) 100%)'}}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-[11px] text-white/40">Customize Caelyn's behavior with standing instructions and investment profiles</p>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-xs font-semibold border ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Standing Instructions */}
        <GlassCard className="p-5 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Standing Instructions</h2>
              <p className="text-[10px] text-white/30 mt-0.5">
                Persistent directives applied to every Caelyn query. Leave empty for default behavior.
              </p>
            </div>
            <button
              onClick={handleClearInstructions}
              disabled={!instructions.trim()}
              className="text-[10px] px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/15 disabled:opacity-20 transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>

          <TemplateBar
            templates={settings?.instruction_templates || []}
            activeTemplate={activeInstrTemplate}
            onLoad={handleLoadInstrTemplate}
            onDelete={handleDeleteInstrTemplate}
            onSave={() => setSaveInstrModal(true)}
            label="Saved Templates"
          />

          <textarea
            value={instructions}
            onChange={(e) => { setInstructions(e.target.value); setActiveInstrTemplate(null); }}
            placeholder={"e.g. \"Only show me stocks under $500M market cap. I'm looking for pre-earnings accumulation plays in energy and defense. Be more aggressive with conviction ratings.\""}
            rows={4}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-xs text-white placeholder-white/20 resize-y focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-white/20">{instructions.length}/5000</span>
            {activeInstrTemplate && (
              <span className="text-[9px] text-blue-400/60">Active: {activeInstrTemplate}</span>
            )}
          </div>
        </GlassCard>

        {/* Investment Profile */}
        <GlassCard className="p-5 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Investment Profile</h2>
              <p className="text-[10px] text-white/30 mt-0.5">
                Personal calibration layered on top of Caelyn's core quant frameworks. Capital, risk, sectors, holding periods.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleLoadDefaultProfile}
                className="text-[10px] px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/15 transition-all flex items-center gap-1"
              >
                Load Default
              </button>
              <button
                onClick={handleResetProfile}
                disabled={!profile.trim()}
                className="text-[10px] px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/15 disabled:opacity-20 transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          <TemplateBar
            templates={settings?.profile_templates || []}
            activeTemplate={activeProfileTemplate}
            onLoad={handleLoadProfileTemplate}
            onDelete={handleDeleteProfileTemplate}
            onSave={() => setSaveProfileModal(true)}
            label="Saved Profiles"
          />

          <textarea
            value={profile}
            onChange={(e) => { setProfile(e.target.value); setActiveProfileTemplate(null); }}
            placeholder="Enter your investment profile — capital range, risk tolerance, max positions, sectors, holding periods. Or click 'Load Default' to start from the built-in profile."
            rows={12}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-xs text-white placeholder-white/20 resize-y focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all font-mono leading-relaxed"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-white/20">{profile.length}/10000</span>
            <div className="flex items-center gap-3">
              {!profile.trim() && (
                <span className="text-[9px] text-yellow-400/50">No profile active — using Core Quant DNA only</span>
              )}
              {activeProfileTemplate && (
                <span className="text-[9px] text-blue-400/60">Active: {activeProfileTemplate}</span>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Core Quant DNA (read-only) */}
        <GlassCard className="p-5 mb-5">
          <button
            onClick={() => setShowDNA(!showDNA)}
            className="flex items-center justify-between w-full text-left"
          >
            <div>
              <h2 className="text-sm font-bold text-white/60">Core Quant DNA</h2>
              <p className="text-[10px] text-white/25 mt-0.5">
                Bottleneck Thesis &middot; EBITDA Turn &middot; Weinstein Stages &middot; Power Law &middot; Asymmetric Setups &middot; Sell Discipline
              </p>
            </div>
            {showDNA ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>
          {showDNA && (
            <div className="mt-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <p className="text-[9px] text-white/20 uppercase tracking-wider font-semibold mb-3">Read-only — these frameworks are always active</p>
              <pre className="text-[10px] text-white/40 whitespace-pre-wrap font-mono leading-relaxed">
                {settings?.core_quant_dna || "Loading..."}
              </pre>
            </div>
          )}
        </GlassCard>

        {/* Save button */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white/20">Changes take effect on the next Caelyn query</p>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="text-white text-sm px-5 py-2.5 rounded-lg transition-all disabled:opacity-40 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </Button>
        </div>
      </main>

      {/* Template save modals */}
      {saveInstrModal && (
        <SaveTemplateModal onSave={handleSaveInstrTemplate} onClose={() => setSaveInstrModal(false)} />
      )}
      {saveProfileModal && (
        <SaveTemplateModal onSave={handleSaveProfileTemplate} onClose={() => setSaveProfileModal(false)} />
      )}
    </div>
  );
}
