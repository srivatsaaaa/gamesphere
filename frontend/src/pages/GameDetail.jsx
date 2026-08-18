import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchGame, addLibrary, getRig, checkCompat } from "../lib/api";
import CompatibilityGauge from "../components/CompatibilityGauge";
import { ArrowLeft, Loader2, Calendar, Building2, Globe, Plus, Cpu, MonitorCog, MemoryStick } from "lucide-react";
import { toast } from "sonner";

const Row = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-white/5 font-mono text-xs">
        <span className="text-[var(--gs-text-3)] uppercase tracking-widest">{label}</span>
        <span className="text-white">{value}</span>
    </div>
);

const GameDetail = () => {
    const { id } = useParams();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rig, setRig] = useState(null);
    const [compat, setCompat] = useState(null);
    const [addingStatus, setAddingStatus] = useState("");

    useEffect(() => {
        setLoading(true);
        fetchGame(id)
            .then(setGame)
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
        getRig().then(setRig).catch(() => {});
    }, [id]);

    useEffect(() => {
        if (rig && game) {
            checkCompat({ cpu: rig.cpu, gpu: rig.gpu, ram_gb: rig.ram_gb, game_id: game.id })
                .then(setCompat)
                .catch(() => {});
        }
    }, [rig, game]);

    const handleAdd = async (status) => {
        if (!game) return;
        setAddingStatus(status);
        try {
            await addLibrary({
                game_id: game.id,
                name: game.name,
                background_image: game.background_image,
                status,
                rating: game.rating,
                released: game.released,
            });
            toast.success(`Added to ${status}`);
        } catch (e) {
            toast.error("Could not add to library");
        } finally {
            setAddingStatus("");
        }
    };

    if (loading)
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--gs-accent)]" />
            </div>
        );
    if (!game) return null;

    const req = game.requirements || {};

    return (
        <div data-testid="game-detail-page">
            {/* Hero */}
            <div className="relative h-[360px] md:h-[440px] overflow-hidden">
                <img src={game.background_image} alt={game.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
                <div className="relative max-w-7xl mx-auto px-6 md:px-10 h-full flex flex-col justify-end pb-8">
                    <Link to="/" className="gs-btn-secondary self-start mb-4 text-xs" data-testid="back-to-discover">
                        <ArrowLeft className="w-3 h-3 inline mr-1" />
                        Back
                    </Link>
                    <span className="gs-overline">// {(game.genres || []).map((g) => g.name).join(" · ")}</span>
                    <h1 className="font-display font-black text-4xl md:text-6xl tracking-tighter mt-3" data-testid="game-title">
                        {game.name}
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2" data-testid="library-actions">
                        {[
                            { key: "playing", label: "Add to Playing" },
                            { key: "wishlist", label: "Wishlist" },
                            { key: "backlog", label: "Backlog" },
                            { key: "completed", label: "Completed" },
                        ].map((b) => (
                            <button
                                key={b.key}
                                onClick={() => handleAdd(b.key)}
                                disabled={!!addingStatus}
                                className={b.key === "playing" ? "gs-btn-primary text-sm" : "gs-btn-secondary text-sm"}
                                data-testid={`add-to-${b.key}-btn`}
                            >
                                <Plus className="w-4 h-4 inline mr-1" />
                                {addingStatus === b.key ? "Adding..." : b.label}
                            </button>
                        ))}
                    </div>

                    {/* Description */}
                    <section>
                        <h2 className="gs-overline">// Overview</h2>
                        <p className="mt-3 text-[var(--gs-text-2)] leading-relaxed whitespace-pre-line">
                            {game.description || "No description available."}
                        </p>
                    </section>

                    {/* Screenshots */}
                    {game.screenshots?.length > 0 && (
                        <section>
                            <h2 className="gs-overline">// Screenshots</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                {game.screenshots.slice(0, 6).map((s) => (
                                    <img
                                        key={s.id}
                                        src={s.image}
                                        alt=""
                                        className="rounded-sm border border-white/10 aspect-video object-cover"
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Requirements */}
                    <section className="gs-card p-6" data-testid="system-requirements-card">
                        <h2 className="gs-overline">// System Requirements (est.)</h2>
                        <div className="grid md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <h3 className="font-display font-bold mb-2">Minimum</h3>
                                <Row label="CPU tier" value={`T${req.min_cpu_tier || "?"}`} />
                                <Row label="GPU tier" value={`T${req.min_gpu_tier || "?"}`} />
                                <Row label="RAM" value={`${req.min_ram_gb || "?"} GB`} />
                            </div>
                            <div>
                                <h3 className="font-display font-bold mb-2">Recommended</h3>
                                <Row label="CPU tier" value={`T${req.rec_cpu_tier || "?"}`} />
                                <Row label="GPU tier" value={`T${req.rec_gpu_tier || "?"}`} />
                                <Row label="RAM" value={`${req.rec_ram_gb || "?"} GB`} />
                            </div>
                        </div>
                        {req.raw_minimum && (
                            <details className="mt-6 text-xs text-[var(--gs-text-2)]">
                                <summary className="cursor-pointer text-[var(--gs-accent)]">Show raw RAWG specs</summary>
                                <pre className="mt-2 whitespace-pre-wrap font-mono">{req.raw_minimum}</pre>
                                {req.raw_recommended && <pre className="mt-2 whitespace-pre-wrap font-mono">{req.raw_recommended}</pre>}
                            </details>
                        )}
                    </section>
                </div>

                {/* Sidebar */}
                <aside className="space-y-6">
                    <div className="gs-card p-6">
                        <h3 className="gs-overline">// Facts</h3>
                        <div className="mt-3 space-y-1">
                            <Row label="Released" value={game.released || "—"} />
                            <Row label="Rating" value={game.rating ? game.rating.toFixed(1) : "—"} />
                            <Row label="Metacritic" value={game.metacritic || "—"} />
                            <Row label="Developers" value={(game.developers || []).join(", ") || "—"} />
                            <Row label="Publishers" value={(game.publishers || []).join(", ") || "—"} />
                        </div>
                    </div>

                    <div className="gs-card p-6" data-testid="compat-sidebar">
                        <h3 className="gs-overline">// Your Rig vs This Game</h3>
                        {!rig ? (
                            <div className="mt-4 text-sm text-[var(--gs-text-2)]">
                                Set up your rig first.
                                <Link to="/my-rig" className="ml-2 text-[var(--gs-accent)] underline">
                                    Go to My Rig →
                                </Link>
                            </div>
                        ) : compat ? (
                            <div className="mt-4 flex flex-col items-center">
                                <CompatibilityGauge score={compat.score} verdict={compat.verdict} />
                                <div className="mt-4 grid grid-cols-3 gap-2 w-full text-center text-[10px] font-mono">
                                    <div>
                                        <Cpu className="w-4 h-4 mx-auto text-[var(--gs-text-2)]" />
                                        <div className="mt-1">CPU {compat.breakdown.cpu.user_tier}/{compat.breakdown.cpu.rec_tier}</div>
                                    </div>
                                    <div>
                                        <MonitorCog className="w-4 h-4 mx-auto text-[var(--gs-text-2)]" />
                                        <div className="mt-1">GPU {compat.breakdown.gpu.user_tier}/{compat.breakdown.gpu.rec_tier}</div>
                                    </div>
                                    <div>
                                        <MemoryStick className="w-4 h-4 mx-auto text-[var(--gs-text-2)]" />
                                        <div className="mt-1">RAM {compat.breakdown.ram.user_gb}/{compat.breakdown.ram.rec_gb}</div>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-[var(--gs-text-2)] text-center">
                                    Bottleneck: <span className="text-[var(--gs-magenta)] font-mono">{compat.bottleneck}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 text-sm text-[var(--gs-text-2)]">Checking...</div>
                        )}
                    </div>

                    {game.website && (
                        <a
                            href={game.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gs-btn-secondary text-sm flex items-center justify-center gap-2"
                            data-testid="game-website-link"
                        >
                            <Globe className="w-4 h-4" />
                            Official Website
                        </a>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default GameDetail;
