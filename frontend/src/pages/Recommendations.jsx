import { useEffect, useState } from "react";
import { fetchGenres, recRule, recAI } from "../lib/api";
import GameCard from "../components/GameCard";
import { Loader2, Sparkles, Sliders } from "lucide-react";

const Tab = ({ active, onClick, children, testId }) => (
    <button
        onClick={onClick}
        data-testid={testId}
        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            active
                ? "border-[var(--gs-accent)] text-white"
                : "border-transparent text-[var(--gs-text-2)] hover:text-white"
        }`}
    >
        {children}
    </button>
);

const Recommendations = () => {
    const [tab, setTab] = useState("rule");
    const [genres, setGenres] = useState([]);
    const [selGenres, setSelGenres] = useState([]);
    const [minRating, setMinRating] = useState(4);
    const [rulePicks, setRulePicks] = useState([]);
    const [ruleLoading, setRuleLoading] = useState(false);

    const [pref, setPref] = useState("I love open-world RPGs with rich stories and beautiful art.");
    const [faves, setFaves] = useState("The Witcher 3, Elden Ring");
    const [aiPicks, setAiPicks] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        fetchGenres().then(setGenres).catch(() => {});
    }, []);

    const toggleGenre = (slug) => {
        setSelGenres((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
    };

    const runRule = async () => {
        setRuleLoading(true);
        try {
            const r = await recRule({ genres: selGenres, min_rating: Number(minRating) });
            setRulePicks(r.picks || []);
        } finally {
            setRuleLoading(false);
        }
    };

    const runAI = async () => {
        setAiLoading(true);
        try {
            const r = await recAI({
                preferences: pref,
                favourite_games: faves.split(",").map((s) => s.trim()).filter(Boolean),
            });
            setAiPicks(r.picks || []);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10" data-testid="recommendations-page">
            <span className="gs-overline">// Curator</span>
            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter mt-2">
                Recommendations
            </h1>
            <p className="mt-2 text-[var(--gs-text-2)] max-w-lg">
                Rule-based picks match your filters. AI-powered picks analyze your taste.
            </p>

            <div className="mt-6 flex gap-2 border-b border-white/10">
                <Tab active={tab === "rule"} onClick={() => setTab("rule")} testId="tab-rule">
                    <Sliders className="w-4 h-4 inline mr-2" />
                    Rule-based
                </Tab>
                <Tab active={tab === "ai"} onClick={() => setTab("ai")} testId="tab-ai">
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    AI-powered
                </Tab>
            </div>

            {tab === "rule" ? (
                <div className="mt-6">
                    <div className="gs-card p-6 grid md:grid-cols-2 gap-6" data-testid="rule-form-card">
                        <div>
                            <h3 className="gs-overline">// Genres</h3>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {genres.map((g) => (
                                    <button
                                        key={g.id}
                                        onClick={() => toggleGenre(g.slug)}
                                        data-testid={`genre-chip-${g.slug}`}
                                        className={`px-3 py-1 text-xs rounded-sm border transition-colors ${
                                            selGenres.includes(g.slug)
                                                ? "bg-[var(--gs-accent)] text-black border-[var(--gs-accent)] font-bold"
                                                : "bg-transparent text-[var(--gs-text-2)] border-white/10 hover:border-white/30"
                                        }`}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="gs-overline">// Minimum Rating</h3>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.1"
                                value={minRating}
                                onChange={(e) => setMinRating(e.target.value)}
                                className="w-full mt-3"
                                data-testid="rule-min-rating"
                            />
                            <div className="font-mono text-2xl text-[var(--gs-accent)]">{minRating} ★</div>
                            <button
                                onClick={runRule}
                                className="gs-btn-primary mt-6"
                                data-testid="rule-run-btn"
                                disabled={ruleLoading}
                            >
                                {ruleLoading ? "Finding..." : "Get Picks"}
                            </button>
                        </div>
                    </div>
                    {ruleLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--gs-accent)]" />
                        </div>
                    ) : rulePicks.length > 0 ? (
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" data-testid="rule-picks">
                            {rulePicks.map((g, i) => (
                                <GameCard key={g.id} game={g} index={i} />
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="mt-6">
                    <div className="gs-card p-6 space-y-4" data-testid="ai-form-card">
                        <label className="block">
                            <span className="gs-overline">// Describe your taste</span>
                            <textarea
                                className="gs-input mt-2 min-h-[100px]"
                                value={pref}
                                onChange={(e) => setPref(e.target.value)}
                                data-testid="ai-pref-input"
                            />
                        </label>
                        <label className="block">
                            <span className="gs-overline">// Favourite games (comma separated)</span>
                            <input
                                className="gs-input mt-2"
                                value={faves}
                                onChange={(e) => setFaves(e.target.value)}
                                data-testid="ai-faves-input"
                            />
                        </label>
                        <button
                            onClick={runAI}
                            disabled={aiLoading}
                            className="gs-btn-primary"
                            data-testid="ai-run-btn"
                        >
                            <Sparkles className="w-4 h-4 inline mr-2" />
                            {aiLoading ? "Thinking..." : "Ask Claude"}
                        </button>
                    </div>
                    {aiLoading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--gs-accent)]" />
                        </div>
                    )}
                    {aiPicks.length > 0 && (
                        <div className="mt-8 space-y-4" data-testid="ai-picks">
                            {aiPicks.map((g, i) => (
                                <div key={g.id} className="gs-card p-4 flex flex-col md:flex-row gap-4">
                                    <img
                                        src={g.background_image}
                                        alt={g.name}
                                        className="w-full md:w-56 aspect-video object-cover rounded-sm"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-display font-bold text-lg">{g.name}</h3>
                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                            {(g.genres || []).slice(0, 3).map((gg) => (
                                                <span key={gg.id} className="gs-chip">
                                                    {gg.name}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="mt-3 text-sm text-[var(--gs-text-2)]">{g.ai_reason}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Recommendations;
