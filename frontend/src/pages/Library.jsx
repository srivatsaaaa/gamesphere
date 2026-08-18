import { useEffect, useState } from "react";
import { listLibrary, patchLibrary, deleteLibrary } from "../lib/api";
import { Link } from "react-router-dom";
import { Trash2, Loader2, Library as LibraryIcon } from "lucide-react";
import { toast } from "sonner";

const STATUSES = [
    { key: "playing", label: "Playing" },
    { key: "completed", label: "Completed" },
    { key: "wishlist", label: "Wishlist" },
    { key: "backlog", label: "Backlog" },
];

const Library = () => {
    const [all, setAll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("playing");

    const load = async () => {
        setLoading(true);
        try {
            const data = await listLibrary();
            setAll(data);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
    }, []);

    const countFor = (s) => all.filter((i) => i.status === s).length;

    const items = all.filter((i) => i.status === tab);

    const changeStatus = async (id, status) => {
        await patchLibrary(id, { status });
        toast.success(`Moved to ${status}`);
        load();
    };
    const remove = async (id) => {
        await deleteLibrary(id);
        toast.success("Removed");
        load();
    };

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10" data-testid="library-page">
            <span className="gs-overline">// Collection</span>
            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter mt-2">My Library</h1>

            <div className="mt-6 flex gap-1 border-b border-white/10 overflow-x-auto">
                {STATUSES.map((s) => (
                    <button
                        key={s.key}
                        onClick={() => setTab(s.key)}
                        data-testid={`library-tab-${s.key}`}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                            tab === s.key
                                ? "border-[var(--gs-accent)] text-white"
                                : "border-transparent text-[var(--gs-text-2)] hover:text-white"
                        }`}
                    >
                        {s.label}
                        <span className="gs-chip">{countFor(s.key)}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--gs-accent)]" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 text-[var(--gs-text-2)]" data-testid="library-empty">
                    <LibraryIcon className="w-12 h-12 mx-auto text-[var(--gs-text-3)] mb-3" />
                    Nothing in {tab} yet.
                    <div className="mt-3">
                        <Link to="/" className="text-[var(--gs-accent)] underline">
                            Discover games →
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="library-grid">
                    {items.map((it) => (
                        <div key={it.id} className="gs-card overflow-hidden flex" data-testid={`library-item-${it.id}`}>
                            <Link to={`/game/${it.game_id}`} className="w-32 h-28 shrink-0">
                                <img
                                    src={it.background_image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </Link>
                            <div className="flex-1 p-3 min-w-0">
                                <Link to={`/game/${it.game_id}`}>
                                    <h3 className="font-display font-bold text-sm leading-tight truncate">{it.name}</h3>
                                </Link>
                                <div className="text-[10px] text-[var(--gs-text-3)] font-mono mt-1">{it.released || "—"}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <select
                                        value={it.status}
                                        onChange={(e) => changeStatus(it.id, e.target.value)}
                                        className="gs-input text-xs"
                                        style={{ padding: "4px 6px", width: "auto" }}
                                        data-testid={`library-status-${it.id}`}
                                    >
                                        {STATUSES.map((s) => (
                                            <option key={s.key} value={s.key}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => remove(it.id)}
                                        className="text-[var(--gs-text-3)] hover:text-[var(--gs-magenta)] transition-colors"
                                        data-testid={`library-delete-${it.id}`}
                                        aria-label="Remove"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Library;
