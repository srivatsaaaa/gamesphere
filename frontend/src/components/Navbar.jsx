import { NavLink, Link } from "react-router-dom";
import { Gamepad2, Cpu, Sparkles, Library as LibraryIcon, Compass, Wrench } from "lucide-react";

const links = [
    { to: "/", label: "Discover", icon: Compass, end: true },
    { to: "/recommendations", label: "Recommendations", icon: Sparkles },
    { to: "/compatibility", label: "Compatibility", icon: Cpu },
    { to: "/library", label: "Library", icon: LibraryIcon },
];

export const Navbar = () => {
    return (
        <header className="sticky top-0 z-50 gs-glass" data-testid="main-navbar">
            <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group" data-testid="brand-link">
                    <div className="w-8 h-8 rounded-sm bg-[var(--gs-accent)] flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-black" strokeWidth={2.5} />
                    </div>
                    <span className="font-display font-black text-lg tracking-tighter">
                        GAME<span className="text-[var(--gs-accent)]">SPHERE</span>
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {links.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            data-testid={`nav-${label.toLowerCase()}`}
                            className={({ isActive }) =>
                                `px-3 py-2 text-sm font-medium flex items-center gap-2 rounded-sm transition-colors ${
                                    isActive
                                        ? "text-[var(--gs-accent)]"
                                        : "text-[var(--gs-text-2)] hover:text-white"
                                }`
                            }
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <Link
                    to="/my-rig"
                    data-testid="nav-my-rig"
                    className="gs-btn-primary flex items-center gap-2 text-sm"
                >
                    <Wrench className="w-4 h-4" />
                    My Rig
                </Link>
            </div>
        </header>
    );
};

export default Navbar;
