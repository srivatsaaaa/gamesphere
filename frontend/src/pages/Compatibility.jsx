import { useEffect, useState } from "react";
import { getRig, saveRig, checkCompat, fetchDiscover } from "../lib/api";
import CompatibilityGauge from "../components/CompatibilityGauge";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

const RIG_BG =
    "https://images.unsplash.com/photo-1749284950212-9a4539b01a0a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwyfHxoaWdoJTIwZW5kJTIwZ2FtaW5nJTIwcGMlMjBkYXJrfGVufDB8fHx8MTc3NjcwMDQwNnww&ixlib=rb-4.1.0&q=85";

const Compatibility = () => {
    const [rig, setRig] = useState({ cpu: "", gpu: "", ram_gb: 16 });
    const [hasRig, setHasRig] = useState(false);
    const [gameQuery, setGameQuery] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [selected, setSelected] = useState(null);
    const [result, setResult] = useState(null);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        getRig().then((r) => {
            if (r) {
                setRig({ cpu: r.cpu, gpu: r.gpu, ram_gb: r.ram_gb });
                setHasRig(true);
            }
        });
    }, []);

    useEffect(() => {
        if (!gameQuery.trim()) {
            setCandidates([]);
            return;
        }
        const t = setTimeout(() => {
            fetchDiscover({ search: gameQuery, page_size: 6 }).then((d) => setCandidates(d.results || []));
        }, 350);
        return () => clearTimeout(t);
    }, [gameQuery]);

    const runCheck = async (g) => {
        if (!rig.cpu || !rig.gpu) {
            toast.error("Enter your CPU and GPU first");
            return;
        }
        setChecking(true);
        setSelected(g);
        try {
            await saveRig(rig);
            setHasRig(true);
            const res = await checkCompat({
                cpu: rig.cpu,
                gpu: rig.gpu,
                ram_gb: Number(rig.ram_gb),
                game_id: g.id,
            });
            setResult(res);
        } catch (e) {
            toast.error("Compatibility check failed");
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10" data-testid="compatibility-page">
            <div className="relative overflow-hidden rounded-lg border border-white/10 mb-10">
                <img src={RIG_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/30" />
                <div className="relative p-10">
                    <span className="gs-overline">// Hardware Intelligence</span>
                    <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter mt-3">
                        Can it run <span className="text-[var(--gs-accent)]">this game?</span>
                    </h1>
                    <p className="mt-3 text-[var(--gs-text-2)] max-w-xl">
                        Plug in your CPU, GPU and RAM. Pick a game. Get a verdict.
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* Left - Form */}
                <div className="lg:col-span-2 gs-card p-6" data-testid="rig-form-card">
                    <h2 className="gs-overline">// Your Rig</h2>
                    <div className="mt-4 space-y-3">
                        <label className="block">
                            <span className="text-xs uppercase tracking-widest text-[var(--gs-text-3)] font-mono">CPU</span>
                            <input
                                className="gs-input mt-1"
                                placeholder="e.g. Ryzen 5 5600X"
                                value={rig.cpu}
                                onChange={(e) => setRig({ ...rig, cpu: e.target.value })}
                                data-testid="rig-cpu-input"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs uppercase tracking-widest text-[var(--gs-text-3)] font-mono">GPU</span>
                            <input
                                className="gs-input mt-1"
                                placeholder="e.g. RTX 3060"
                                value={rig.gpu}
                                onChange={(e) => setRig({ ...rig, gpu: e.target.value })}
                                data-testid="rig-gpu-input"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs uppercase tracking-widest text-[var(--gs-text-3)] font-mono">RAM (GB)</span>
                            <input
                                type="number"
                                className="gs-input mt-1"
                                min={2}
                                max={256}
                                value={rig.ram_gb}
                                onChange={(e) => setRig({ ...rig, ram_gb: e.target.value })}
                                data-testid="rig-ram-input"
                            />
                        </label>
                    </div>

                    <div className="mt-6">
                        <span className="text-xs uppercase tracking-widest text-[var(--gs-text-3)] font-mono">Pick a game</span>
                        <input
                            className="gs-input mt-1"
                            placeholder="Search games..."
                            value={gameQuery}
                            onChange={(e) => setGameQuery(e.target.value)}
                            data-testid="compat-game-search"
                        />
                        {candidates.length > 0 && (
                            <div className="mt-2 space-y-1" data-testid="compat-candidates">
                                {candidates.map((g) => (
                                    <button
                                        key={g.id}
                                        onClick={() => runCheck(g)}
                                        className="w-full text-left flex items-center gap-3 p-2 rounded-sm hover:bg-white/5 transition-colors"
                                        data-testid={`compat-pick-${g.id}`}
                                    >
                                        <img src={g.background_image} alt="" className="w-10 h-10 object-cover rounded-sm" />
                                        <span className="text-sm">{g.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right - Result */}
                <div className="lg:col-span-3 gs-card p-6 min-h-[380px]" data-testid="compat-result-card">
                    {checking ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--gs-accent)]" />
                        </div>
                    ) : result ? (
                        <div className="flex flex-col items-center">
                            <span className="gs-overline">// Verdict for</span>
                            <h3 className="font-display font-bold text-xl mt-1 text-center" data-testid="compat-game-name">
                                {selected?.name}
                            </h3>
                            <div className="mt-6">
                                <CompatibilityGauge score={result.score} verdict={result.verdict} />
                            </div>
                            <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-lg">
                                {["cpu", "gpu", "ram"].map((k) => {
                                    const b = result.breakdown[k];
                                    return (
                                        <div key={k} className="text-center border border-white/5 rounded-sm p-3">
                                            <div className="gs-overline">{k}</div>
                                            <div className="font-mono text-xl mt-1 text-white">
                                                {k === "ram" ? `${b.user_gb} GB` : `T${b.user_tier}`}
                                            </div>
                                            <div className="text-[10px] text-[var(--gs-text-3)] font-mono mt-1">
                                                Min {k === "ram" ? `${b.min_gb}GB` : `T${b.min_tier}`} · Rec{" "}
                                                {k === "ram" ? `${b.rec_gb}GB` : `T${b.rec_tier}`}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-6 text-sm text-[var(--gs-text-2)]">
                                Primary bottleneck:{" "}
                                <span className="text-[var(--gs-magenta)] font-mono" data-testid="compat-bottleneck">
                                    {result.bottleneck}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-[var(--gs-text-2)]">
                            <Zap className="w-12 h-12 text-[var(--gs-accent)] mb-3" />
                            <p>Fill out your rig and pick a game to see the verdict.</p>
                            {hasRig && <p className="text-xs mt-2">Using saved rig.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Compatibility;
