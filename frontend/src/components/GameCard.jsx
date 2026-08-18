import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export const GameCard = ({ game, index = 0 }) => {
    const bg =
        game.background_image ||
        "https://images.pexels.com/photos/28583190/pexels-photo-28583190.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
    return (
        <Link
            to={`/game/${game.id}`}
            data-testid={`game-card-${game.id}`}
            className="gs-card overflow-hidden gs-fade-in group block"
            style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
        >
            <div className="relative aspect-[16/10] overflow-hidden">
                <img
                    src={bg}
                    alt={game.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                {game.metacritic && (
                    <span
                        className="absolute top-3 right-3 font-mono text-[11px] px-2 py-0.5 rounded-sm"
                        style={{
                            background: "rgba(0,0,0,0.6)",
                            border: "1px solid rgba(0,255,102,0.4)",
                            color: "var(--gs-accent)",
                        }}
                    >
                        {game.metacritic}
                    </span>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-display font-bold text-base leading-tight line-clamp-1">{game.name}</h3>
                <div className="mt-2 flex items-center justify-between text-xs">
                    <div className="flex gap-1.5 flex-wrap">
                        {(game.genres || []).slice(0, 2).map((g) => (
                            <span key={g.id} className="gs-chip">
                                {g.name}
                            </span>
                        ))}
                    </div>
                    {game.rating ? (
                        <div className="flex items-center gap-1 text-[var(--gs-text-2)] font-mono">
                            <Star className="w-3 h-3 fill-[var(--gs-accent)] text-[var(--gs-accent)]" />
                            {game.rating.toFixed(1)}
                        </div>
                    ) : null}
                </div>
            </div>
        </Link>
    );
};

export default GameCard;
