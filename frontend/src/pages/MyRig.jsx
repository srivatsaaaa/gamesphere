import { useEffect, useState } from "react";
import { getRig, saveRig } from "../lib/api";
import { Cpu, MonitorCog, MemoryStick, Save, HardDrive, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const RIG_BG =
    "https://images.pexels.com/photos/33693626/pexels-photo-33693626.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const tierLabel = (t) => {
    if (t >= 9) return "Elite";
    if (t >= 7) return "High";
    if (t >= 5) return "Mid";
    if (t >= 3) return "Budget";
    return "Entry";
};

const MyRig = () => {
    const [rig, setRig] = useState({ cpu: "", gpu: "", ram_gb: 16, storage_gb: 500, notes: "" });
    const [saved, setSaved] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getRig()
            .then((r) => {
                if (r) {
                    setRig({
                        cpu: r.cpu || "",
                        gpu: r.gpu || "",
                        ram_gb: r.ram_gb || 16,
                        storage_gb: r.storage_gb || 500,
                        notes: r.notes || "",
                    });
                    setSaved(r);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        if (!rig.cpu || !rig.gpu) {
            toast.error("CPU and GPU are required");
            return;
        }
        setSaving(true);
        try {
            const r = await saveRig({ ...rig, ram_gb: Number(rig.ram_gb), storage_gb: Number(rig.storage_gb) });
            setSaved(r);
            toast.success("Rig saved");
        } catch {
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--gs-accent)]" />
            </div>
        );

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10" data-testid="my-rig-page">
            <div className="relative overflow-hidden rounded-lg border border-white/10 mb-8">
                <img src={RIG_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/40" />
                <div className="relative p-10">
                    <span className="gs-overline">// Rig Profile</span>
                    <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter mt-3">
                        My <span className="text-[var(--gs-accent)]">Rig</span>
                    </h1>
                    <p className="mt-3 text-[var(--gs-text-2)] max-w-xl">
                        Save your specs once and we'll auto-check compatibility for every game you open.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-5 gap-6">
                <div className="md:col-span-3 gs-card p-6" data-testid="rig-edit-card">
                    <h2 className="gs-overline">// Specs</h2>
                    <div className="mt-4 space-y-4">
                        <label className="block">
                            <span className="text-xs uppercase tracking-widest text-[var(--gs-text-3)] font-mono">CPU</span>
                            <input
                                className="gs-input mt-1"
                                placeholder="e.g. Intel i7-12700K"
                                value={rig.cpu}
                                onChange={(e) => setRig({ ...rig, cpu: e.target.value })}
                                data-testid="myrig-cpu-input"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs uppercase tracking-widest text-[var(--gs-text-3)] font-mono">GPU</span>
                            <input
                                className="gs-input mt-1"
                                placeholder="e.g. NVIDIA RTX 4070"
                                value={rig.gpu}
                                onChange={(e) => setRig({ ...rig, gpu: e.target.value })}
                                data-testid="myrig-gpu-input"
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-xs uppercase tracking-widest text-[var(--gs-text-3)] font-mono">RAM (GB)</span>
                                <input
                                    type="number"
                                    min={2}
                                    max={256}
                                    className="gs-input mt-1"
                                    value={rig.ram_gb}
                                    onChange={(e) => setRig({ ...rig, ram_gb: e.target.value })}
                                    data-testid="myrig-ram-input"
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs uppercase tracking-widest text-[var(--gs-text-3)] font-mono">Storage (GB)</span>
                                <input
                                    type="number"
                                    min={0}
                                    className="gs-input mt-1"
                                    value={rig.storage_gb}
                                    onChange={(e) => setRig({ ...rig, storage_gb: e.target.value })}
                                    data-testid="myrig-storage-input"
                                />
                            </label>
                        </div>
                        <label className="block">
                            <span className="text-xs uppercase tracking-widest text-[var(--gs-text-3)] font-mono">Notes</span>
                            <textarea
                                className="gs-input mt-1 min-h-[70px]"
                                placeholder="Cooling, monitor, peripherals..."
                                value={rig.notes}
                                onChange={(e) => setRig({ ...rig, notes: e.target.value })}
                                data-testid="myrig-notes-input"
                            />
                        </label>
                    </div>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="gs-btn-primary mt-6 flex items-center gap-2"
                        data-testid="myrig-save-btn"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : "Save Rig"}
                    </button>
                </div>

                {/* Summary */}
                <div className="md:col-span-2 gs-card p-6" data-testid="rig-summary-card">
                    <h2 className="gs-overline">// Status</h2>
                    {saved ? (
                        <div className="mt-4 space-y-4">
                            <div className="flex items-center gap-2 text-[var(--gs-accent)] text-sm font-mono">
                                <CheckCircle2 className="w-4 h-4" />
                                Rig locked in
                            </div>
                            <Summary icon={<Cpu className="w-5 h-5" />} label="CPU" value={saved.cpu} tier={saved.cpu_tier} />
                            <Summary icon={<MonitorCog className="w-5 h-5" />} label="GPU" value={saved.gpu} tier={saved.gpu_tier} />
                            <Summary icon={<MemoryStick className="w-5 h-5" />} label="RAM" value={`${saved.ram_gb} GB`} />
                            {saved.storage_gb ? (
                                <Summary icon={<HardDrive className="w-5 h-5" />} label="Storage" value={`${saved.storage_gb} GB`} />
                            ) : null}
                            {saved.notes && (
                                <div className="text-xs text-[var(--gs-text-2)] italic border-t border-white/5 pt-3">
                                    "{saved.notes}"
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--gs-text-2)] mt-3">No rig saved yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const Summary = ({ icon, label, value, tier }) => (
    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
        <div className="text-[var(--gs-accent)]">{icon}</div>
        <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--gs-text-3)]">{label}</div>
            <div className="text-sm truncate">{value}</div>
        </div>
        {typeof tier === "number" && (
            <span className="gs-chip" style={{ color: "var(--gs-accent)", borderColor: "rgba(0,255,102,0.3)" }}>
                T{tier} · {tierLabel(tier)}
            </span>
        )}
    </div>
);

export default MyRig;
