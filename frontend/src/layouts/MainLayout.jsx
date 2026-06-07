import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import ServerStatus from "../components/ServerStatus";

const authNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/journal", label: "Journal", icon: BookOpen },
];

const unauthNavLinks = [
  { href: "/#home", label: "Home", icon: Activity },
  { href: "/#features", label: "Features", icon: Activity },
  { href: "/#workflow", label: "How It Works", icon: Activity },
  { href: "/#team", label: "Team", icon: Activity },
  {
    href: "mailto:reassureai.support@gmail.com",
    label: "Contact",
    icon: Activity,
  },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactHover, setContactHover] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleScrollTop = (e) => {
    // Smoothly scroll to top of page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)", transition: "background 0.3s" }}
    >
      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: scrolled ? "var(--nav-bg-scrolled)" : "var(--nav-bg)",
          borderBottom: `1px solid ${scrolled ? "var(--border-subtle)" : "transparent"}`,
          backdropFilter: "blur(20px)",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link
              to="/"
              id="nav-logo"
              onClick={handleScrollTop}
              className="flex items-center gap-2 group flex-shrink-0"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                style={{
                  background: "transparent",
                  boxShadow: isDark
                    ? "0 0 16px var(--brand-glow)"
                    : "0 4px 12px rgba(13, 148, 136, 0.25)",
                  border: "1px solid var(--brand-border)",
                }}
              >
                <Activity
                  className="w-5 h-5 drop-shadow-md"
                  style={{ color: "var(--brand)" }}
                  strokeWidth={2.5}
                />
              </div>
              <span
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                  transition: "color 0.3s",
                }}
              >
                ReassureAI
              </span>
            </Link>

            {/* Desktop links */}
            <nav className="hidden lg:flex items-center justify-center flex-1 gap-8 ml-8">
              {(user ? authNavLinks : unauthNavLinks).map(({ href, label }) => {
                const active = location.pathname === href;
                const isHashLink = href.includes("#");
                const isMailLink = href.startsWith("mailto:");
                const isExternalLink = href.startsWith("http");
                const isHomeLink = label === "Home";


                const isContactLink = label === "Contact";
                const linkProps = {
                  key: href,
                  className:
                    "text-sm font-medium transition-all duration-150 hover:text-opacity-100",
                  style: {
                    color: active ? "var(--brand)" : "var(--text-muted)",
                  },
                  onMouseEnter: (e) => {
                    if (!active) e.currentTarget.style.color = "var(--brand)";
                  },
                  onMouseLeave: (e) => {
                    if (!active)
                      e.currentTarget.style.color = "var(--text-muted)";
                  },
                };

                if (isContactLink) {
                  return (
                    <div
                      key={href}
                      className="relative"
                      onMouseEnter={() => setContactHover(true)}
                      onMouseLeave={() => setContactHover(false)}
                    >
                      <a
                        href={href}
                        className="text-sm font-medium transition-all duration-150 hover:text-opacity-100"
                        style={linkProps.style}
                      >
                        {label}
                      </a>

                      <AnimatePresence>
                        {contactHover && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max"
                            style={{
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "0.5rem",
                              padding: "0.75rem 1rem",
                              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                              zIndex: 40,
                            }}
                          >
                            <a
                              href={href}
                              className="block text-sm py-1 hover:text-brand"
                              style={{ color: "var(--text-primary)" }}
                            >
                              reassureai.support@gmail.com
                            </a>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                if (isHomeLink) {
                  return (
                    <Link
                      to="/"
                      id={`nav-${label.toLowerCase()}`}
                      onClick={handleScrollTop}
                      {...linkProps}
                    >
                      {label}
                    </Link>
                  );
                }

                return isHashLink || isMailLink || isExternalLink ? (
                  <a
                    href={href}
                    {...linkProps}
                    {...(isExternalLink
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    to={href}
                    id={`nav-${label.toLowerCase()}`}
                    {...linkProps}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <ServerStatus />
              </div>

              {/* Theme toggle */}
              <button
                id="btn-theme-toggle"
                onClick={toggleTheme}
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
                className="relative p-2 rounded-lg transition-all duration-200"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--brand-subtle)";
                  e.currentTarget.style.borderColor = "var(--brand-border)";
                  e.currentTarget.style.color = "var(--brand)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>

              {user ? (
                <div className="hidden lg:flex items-center gap-2">
                  <button
                    onClick={logout}
                    id="btn-logout"
                    className="btn-ghost"
                    style={{
                      fontSize: "0.8125rem",
                      padding: "0.4rem 0.875rem",
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  id="btn-signin"
                  className="hidden lg:inline-flex btn-primary text-sm"
                  style={{ padding: "0.5rem 1.25rem" }}
                >
                  Get started
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-1.5 rounded-md transition-colors"
                style={{ color: "var(--text-muted)" }}
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: "var(--bg-surface)",
                borderBottom: "1px solid var(--border-subtle)",
                overflow: "hidden",
              }}
            >
              <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
                {(user ? authNavLinks : unauthNavLinks).map(
                  ({ href, label, icon: Icon }) => {
                    const isHashLink = href.includes("#");
                    const isMailLink = href.startsWith("mailto:");
                    const isExternalLink = href.startsWith("http");
                    const isHomeLink = label === "Home";
                    const commonStyle = {
                      color:
                        location.pathname === href
                          ? "var(--brand)"
                          : "var(--text-muted)",
                    };

                    if (isHomeLink) {
                      return (
                        <Link
                          key={href}
                          to="/"
                          onClick={handleScrollTop}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors"
                          style={commonStyle}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </Link>
                      );
                    }

                    return isHashLink || isMailLink || isExternalLink ? (
                      <a
                        key={href}
                        href={href}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors"
                        style={commonStyle}
                        {...(isExternalLink
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </a>
                    ) : (
                      <Link
                        key={href}
                        to={href}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors"
                        style={commonStyle}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </Link>
                    );
                  },
                )}
                {user ? (
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium mt-2"
                    style={{
                      color: "var(--text-muted)",
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "1rem",
                      marginTop: "0.5rem",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="btn-primary mt-3 justify-center w-full"
                  >
                    Get started
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
