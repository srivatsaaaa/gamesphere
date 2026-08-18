import { useEffect, useState } from "react";
import { fetchDiscover, fetchGenres } from "../lib/api";
import GameCard from "../components/GameCard";
import { Search, Filter, Loader2 } from "lucide-react";

const HERO_IMG =
    "https://images.pexels.com/photos/34552788/pexels-photo-34552788.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const Discover = () => {
    const [games, setGames] = useState([]);
    const [genres, setGenres] = useState([]);
    const [search, setSearch] = useState("");
    const [genre, setGenre] = useState("");
    const [ordering, setOrdering] = useState("-rating");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGenres().then(setGenres).catch(() => {});
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchDiscover({ search, genre, ordering, page_size: 24 });
            setGames(data.results || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(load, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, genre, ordering]);

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10" data-testid="discover-page">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-lg border border-white/10 mb-10">
                <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
                <div className="relative p-10 md:p-16 max-w-2xl">
                    <span className="gs-overline">// Game Intelligence Platform</span>
                    <h1 className="font-display font-black text-5xl sm:text-6xl tracking-tighter mt-4 leading-[0.95]">
                        Discover. <br />
                        <span className="text-[var(--gs-accent)]">Evaluate.</span>
                        <br />
                        Dominate.
                    </h1>
                    <p className="mt-5 text-[var(--gs-text-2)] text-base sm:text-lg max-w-md">
                        Browse thousands of titles. Check if your rig can run them. Build the library you
                        actually play.
                    </p>
                </div>
            </section>

            {/* Filter bar */}
            <div className="gs-card p-4 mb-8 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center flex-1 gap-2">
                    <Search className="w-4 h-4 text-[var(--gs-text-2)]" />
                    <input
                        type="text"
                        placeholder="Search games..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent outline-none w-full text-sm placeholder:text-[var(--gs-text-3)]"
                        data-testid="discover-search-input"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[var(--gs-text-2)]" />
                    <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="gs-input text-sm"
                        data-testid="discover-genre-filter"
                        style={{ width: "auto", padding: "6px 10px" }}
                    >
                        <option value="">All genres</option>
                        {genres.map((g) => (
                            <option key={g.id} value={g.slug}>
                                {g.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={ordering}
                        onChange={(e) => setOrdering(e.target.value)}
                        className="gs-input text-sm"
                        data-testid="discover-sort"
                        style={{ width: "auto", padding: "6px 10px" }}
                    >
                        <option value="-rating">Top rated</option>
                        <option value="-released">Newest</option>
                        <option value="-metacritic">Metacritic</option>
                        <option value="name">A to Z</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20" data-testid="discover-loading">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--gs-accent)]" />
                </div>
            ) : (
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                    data-testid="discover-grid"
                >
                    {games.map((g, i) => (
                        <GameCard key={g.id} game={g} index={i} />
                    ))}
                </div>
            )}
            {!loading && games.length === 0 && (
                <div className="text-center py-20 text-[var(--gs-text-2)]" data-testid="discover-empty">
                    No games found. Try a different search.
                </div>
            )}
        </div>
    );
};

export default Discover;
