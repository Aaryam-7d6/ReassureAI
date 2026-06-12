import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useChat } from "../context/ChatContext";
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
  PanelLeft,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  ChevronDown,
  Monitor,
  HelpCircle,
  Settings,
  User,
  UserPlus,
  Heart,
  SquarePen,
} from "lucide-react";
import ServerStatus from "../components/ServerStatus";

const CHAT_MODES = [
  { id: "mental_health", label: "Mental Health", icon: Heart, color: "var(--orange)", bg: "var(--orange-subtle)", border: "var(--orange)" },
  { id: "physical_health", label: "Physical Health", icon: Activity, color: "var(--purple)", bg: "var(--purple-subtle)", border: "var(--purple)" },
];

const authNavLinks = [];

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

const MOCK_HISTORY = [
  { id: 1, title: "Anxiety management", date: "Today", mode: "mental_health" },
  { id: 2, title: "Blood test results", date: "Yesterday", mode: "physical_health" },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { theme, themeMode, setThemeMode, toggleTheme, isDark } = useTheme();
  const { activeMode, setActiveMode, setMessages, setIsCrisis } = useChat();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactHover, setContactHover] = useState(false);

  const handleNewChat = () => {
    setMessages([]);
    setIsCrisis(false);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const searchInputRef = useRef(null);
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);

  const handleSearchClick = () => {
    setShouldFocusSearch(true);
    setSidebarOpen(true);
  };

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountExpand, setAccountExpand] = useState(false);
  const [appearanceExpand, setAppearanceExpand] = useState(false);
  const accountRef = useRef(null);

  const isOnChatPage = location.pathname === "/chat";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  useEffect(() => {
    setMobileOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);


  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
        setAccountExpand(false);
        setAppearanceExpand(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredHistory = MOCK_HISTORY.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = user?.name || user?.email || "Guest";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out ${user && isOnChatPage
          ? sidebarOpen
            ? "md:pl-[280px]"
            : "md:pl-[68px]"
          : "pl-0"
        }`}
      style={{ background: "var(--bg-base)" }}
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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-[60px]">
            {/* Left side: Sidebar toggle + Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sidebar toggle — only show on chat page for logged-in users */}
              {user && isOnChatPage && (
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className={`p-2 rounded-lg transition-colors ${sidebarOpen ? "hidden" : "block md:hidden"}`}
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-subtle)"; e.currentTarget.style.color = "var(--brand)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                  aria-label="Toggle sidebar"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              )}

              {/* Logo */}
              <Link
                to={user ? "/dashboard" : "/"}
                id="nav-logo"
                onClick={handleScrollTop}
                className="flex items-center gap-2 group"
              >
                <div
                  className={`w-8 h-8 rounded-xl items-center justify-center transition-all duration-300 group-hover:scale-105 ${sidebarOpen && isOnChatPage ? "hidden" : "flex"}`}
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
            </div>

            {/* Desktop nav: mode switcher on chat, links otherwise */}
            <nav className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-8">
              {user && isOnChatPage ? (
                <div
                  className="flex gap-1 p-1 rounded-2xl shadow-sm"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  {CHAT_MODES.map((mode) => {
                    const active = activeMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        id={`nav-mode-${mode.id}`}
                        onClick={() => setActiveMode(mode.id)}
                        className="relative flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors duration-200 outline-none"
                        style={{ color: active ? mode.color : "var(--text-muted)" }}
                      >
                        {active && (
                          <motion.div
                            layoutId="navActiveMode"
                            className="absolute inset-0 rounded-xl"
                            style={{ background: mode.bg, border: `1px solid ${mode.border}` }}
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <mode.icon className="w-3.5 h-3.5" />
                          {mode.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : !user ? (
                unauthNavLinks.map(({ href, label }) => {
                  const isHashLink = href.includes("#");
                  const isMailLink = href.startsWith("mailto:");
                  const isExternalLink = href.startsWith("http");
                  const isHomeLink = label === "Home";
                  const isContactLink = label === "Contact";
                  const active = location.pathname === href;

                  const linkStyle = {
                    color: active ? "var(--brand)" : "var(--text-muted)",
                  };
                  const linkClass = "text-sm font-medium transition-all duration-150";
                  const hoverHandlers = {
                    onMouseEnter: (e) => { if (!active) e.currentTarget.style.color = "var(--brand)"; },
                    onMouseLeave: (e) => { if (!active) e.currentTarget.style.color = "var(--text-muted)"; },
                  };

                  if (isContactLink) {
                    return (
                      <div
                        key={href}
                        className="relative"
                        onMouseEnter={() => setContactHover(true)}
                        onMouseLeave={() => setContactHover(false)}
                      >
                        <a href={href} className={linkClass} style={linkStyle}>
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
                              <a href={href} className="block text-sm py-1" style={{ color: "var(--text-primary)" }}>
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
                      <Link key={href} to="/" id="nav-home" onClick={handleScrollTop} className={linkClass} style={linkStyle} {...hoverHandlers}>
                        {label}
                      </Link>
                    );
                  }

                  return isHashLink || isMailLink || isExternalLink ? (
                    <a key={href} href={href} className={linkClass} style={linkStyle} {...hoverHandlers} {...(isExternalLink ? { target: "_blank", rel: "noreferrer" } : {})}>
                      {label}
                    </a>
                  ) : (
                    <Link key={href} to={href} id={`nav-${label.toLowerCase()}`} className={linkClass} style={linkStyle} {...hoverHandlers}>
                      {label}
                    </Link>
                  );
                })
              ) : null}
            </nav>


            {/* Right side */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <ServerStatus />
              </div>

              {/* Theme toggle — hide on chat page since Appearance is in sidebar */}
              {!isOnChatPage && (
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
              )}

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

      {/* ── Sidebar Overlay + Panel ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 md:hidden"
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(2px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar Panel ── */}
      {user && isOnChatPage && (
        <div
          className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen
              ? "w-[280px] translate-x-0"
              : "-translate-x-full md:translate-x-0 md:w-[68px]"
            }`}
          style={{
            background: "var(--bg-surface)",
            borderRight: sidebarOpen ? "1px solid var(--border)" : "1px solid transparent",
            boxShadow: sidebarOpen ? "4px 0 30px rgba(0,0,0,0.15)" : "none",
          }}
        >
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              /* ── Wide Sidebar Content ── */
              <motion.div
                key="wide-sidebar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col h-full w-full"
              >
                {/* Sidebar Header */}
                <div className="px-4 py-4 flex items-center justify-between flex-shrink-0">
                  {/* Logo */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
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
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.03em",
                      }}
                    >
                    </span>
                  </div>

                  {/* Sidebar toggle inside sidebar */}
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-subtle)"; e.currentTarget.style.color = "var(--brand)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    aria-label="Close sidebar"
                  >
                    <PanelLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* New Chat */}
                <div className="px-4 mb-3 flex-shrink-0">
                  <button
                    id="btn-new-chat"
                    onClick={handleNewChat}
                    className="flex items-center gap-3 px-4 py-3 rounded-full w-full transition-all shadow-sm hover:shadow-md"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <Plus className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>
                      New chat
                    </span>
                  </button>
                </div>

                {/* Search */}
                <div className="px-4 mb-4 flex-shrink-0">
                  <div
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                    <input
                      ref={(el) => {
                        searchInputRef.current = el;
                        if (el && shouldFocusSearch) {
                          el.focus();
                          setShouldFocusSearch(false);
                        }
                      }}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search conversations..."
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-sans)",
                      }}
                    />
                  </div>
                </div>

                {/* Recent Label */}
                <div className="px-5 mb-2 flex-shrink-0">
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Recent
                  </span>
                </div>

                {/* History */}
                <div className="flex-1 overflow-y-auto px-2 pb-3 flex flex-col gap-0.5">
                  {filteredHistory.length === 0 ? (
                    <p className="px-4 py-3 text-center" style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      No conversations found
                    </p>
                  ) : (
                    filteredHistory.map((chat) => (
                      <button
                        key={chat.id}
                        id={`btn-history-chat-${chat.id}`}
                        onClick={() => {
                          setActiveMode(chat.mode);
                          setMessages([]);
                          setIsCrisis(false);
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group"
                        style={{ background: "transparent" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            {chat.title}
                          </p>
                        </div>
                        <Trash2
                          className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                          style={{ color: "var(--text-muted)" }}
                        />
                      </button>
                    ))
                  )}
                </div>

                {/* Account Section */}
                <div className="flex-shrink-0 relative" ref={accountRef}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-2 right-2 mb-2 rounded-xl overflow-hidden"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          boxShadow: "0 -8px 30px rgba(0,0,0,0.15)",
                          zIndex: 50,
                        }}
                      >
                        <div className="py-1.5">
                          {/* Account (expandable) */}
                          <button
                            onClick={() => setAccountExpand((v) => !v)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <User className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)", flex: 1 }}>Account</span>
                            <motion.div animate={{ rotate: accountExpand ? 90 : 0 }} transition={{ duration: 0.15 }}>
                              <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {accountExpand && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <button
                                  className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-left transition-colors"
                                  style={{ background: "transparent" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                >
                                  <UserPlus className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                                  <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Add account</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div style={{ height: 1, background: "var(--border)", margin: "4px 12px" }} />

                          {/* Help */}
                          <button
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <HelpCircle className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>Help</span>
                          </button>

                          {/* Settings */}
                          <button
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <Settings className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>Settings</span>
                          </button>

                          <div style={{ height: 1, background: "var(--border)", margin: "4px 12px" }} />

                          {/* Appearance (expandable) */}
                          <button
                            onClick={() => setAppearanceExpand((v) => !v)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            {isDark ? (
                              <Moon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            ) : (
                              <Sun className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            )}
                            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)", flex: 1 }}>Appearance</span>
                            <motion.div animate={{ rotate: appearanceExpand ? 90 : 0 }} transition={{ duration: 0.15 }}>
                              <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {appearanceExpand && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                {[
                                  { mode: "system", label: "System Default", icon: Monitor },
                                  { mode: "light", label: "Light Mode", icon: Sun },
                                  { mode: "dark", label: "Dark Mode", icon: Moon },
                                ].map(({ mode, label, icon: Icon }) => (
                                  <button
                                    key={mode}
                                    onClick={() => setThemeMode(mode)}
                                    className="flex items-center gap-3 w-full pl-11 pr-4 py-2 text-left transition-colors"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <Icon className="w-4 h-4" style={{ color: themeMode === mode ? "var(--brand)" : "var(--text-muted)" }} />
                                    <span style={{
                                      fontSize: "0.8125rem",
                                      color: themeMode === mode ? "var(--brand)" : "var(--text-secondary)",
                                      fontWeight: themeMode === mode ? 600 : 400,
                                      flex: 1,
                                    }}>
                                      {label}
                                    </span>
                                    {themeMode === mode && (
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: "var(--brand)" }}
                                      />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div style={{ height: 1, background: "var(--border)", margin: "4px 12px" }} />

                          {/* Log out */}
                          <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <LogOut className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>Log out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Account trigger */}
                  <button
                    onClick={() => {
                      setAccountOpen((v) => !v);
                      if (accountOpen) {
                        setAccountExpand(false);
                        setAppearanceExpand(false);
                      }
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors"
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "var(--brand)",
                        color: "#fff",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                      }}
                    >
                      {avatarInitial}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>
                        {displayName}
                      </p>
                    </div>
                    <motion.div animate={{ rotate: accountOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    </motion.div>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ── Collapsed Sidebar Content ── */
              <motion.div
                key="collapsed-sidebar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col h-full items-center justify-between py-4 select-none w-full"
              >
                {/* Top Section: Toggle & New Chat & Search & Recent */}
                <div className="flex flex-col items-center gap-6 w-full">
                  {/* Toggle Button */}
                  <button
                    id="btn-sidebar-expand"
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-subtle)"; e.currentTarget.style.color = "var(--brand)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    aria-label="Expand sidebar"
                  >
                    <PanelLeft className="w-5 h-5" />
                  </button>

                  {/* New Chat Button */}
                  <button
                    id="btn-new-chat-collapsed"
                    onClick={handleNewChat}
                    className="p-2.5 rounded-xl transition-all shadow-sm border border-transparent hover:shadow-md"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                    aria-label="New chat"
                  >
                    <Plus className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
                  </button>

                  {/* Search Button (expands sidebar) */}
                  <button
                    id="btn-search-collapsed"
                    onClick={handleSearchClick}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5" />
                  </button>

                  {/* Recents Icon Button (expands sidebar) */}
                  <button
                    id="btn-recents-collapsed"
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg transition-colors relative group"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    aria-label="Recent chats"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>

                {/* Bottom Section: Account */}
                <div className="w-full flex justify-center relative" ref={accountRef}>
                  <button
                    id="btn-account-collapsed"
                    onClick={() => {
                      setAccountOpen((v) => !v);
                      if (accountOpen) {
                        setAccountExpand(false);
                        setAppearanceExpand(false);
                      }
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 border"
                    style={{
                      background: "var(--brand)",
                      color: "#fff",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      borderColor: "var(--brand-border)",
                    }}
                  >
                    {avatarInitial}
                  </button>

                  {/* Collapsed Account Dropdown Menu */}
                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: 8 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-0 left-full ml-3 w-[220px] rounded-xl overflow-hidden shadow-xl animate-fade-in"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          zIndex: 55,
                        }}
                      >
                        <div className="py-1.5">
                          {/* Account (expandable) */}
                          <button
                            onClick={() => setAccountExpand((v) => !v)}
                            className="flex items-center gap-3 w-full px-4 py-2 text-left transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <User className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", flex: 1 }}>Account</span>
                            <motion.div animate={{ rotate: accountExpand ? 90 : 0 }} transition={{ duration: 0.15 }}>
                              <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {accountExpand && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <button
                                  className="flex items-center gap-3 w-full pl-11 pr-4 py-1.5 text-left transition-colors"
                                  style={{ background: "transparent" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                >
                                  <UserPlus className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Add account</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div style={{ height: 1, background: "var(--border)", margin: "4px 12px" }} />

                          {/* Help */}
                          <button
                            className="flex items-center gap-3 w-full px-4 py-2 text-left transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <HelpCircle className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>Help</span>
                          </button>

                          {/* Settings */}
                          <button
                            className="flex items-center gap-3 w-full px-4 py-2 text-left transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <Settings className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>Settings</span>
                          </button>

                          <div style={{ height: 1, background: "var(--border)", margin: "4px 12px" }} />

                          {/* Appearance (expandable) */}
                          <button
                            onClick={() => setAppearanceExpand((v) => !v)}
                            className="flex items-center gap-3 w-full px-4 py-2 text-left transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            {isDark ? (
                              <Moon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            ) : (
                              <Sun className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            )}
                            <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", flex: 1 }}>Appearance</span>
                            <motion.div animate={{ rotate: appearanceExpand ? 90 : 0 }} transition={{ duration: 0.15 }}>
                              <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {appearanceExpand && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                {[
                                  { mode: "system", label: "System Default", icon: Monitor },
                                  { mode: "light", label: "Light Mode", icon: Sun },
                                  { mode: "dark", label: "Dark Mode", icon: Moon },
                                ].map(({ mode, label, icon: Icon }) => (
                                  <button
                                    key={mode}
                                    onClick={() => setThemeMode(mode)}
                                    className="flex items-center gap-3 w-full pl-11 pr-4 py-1.5 text-left transition-colors"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <Icon className="w-4 h-4" style={{ color: themeMode === mode ? "var(--brand)" : "var(--text-muted)" }} />
                                    <span style={{
                                      fontSize: "0.75rem",
                                      color: themeMode === mode ? "var(--brand)" : "var(--text-secondary)",
                                      fontWeight: themeMode === mode ? 600 : 400,
                                      flex: 1,
                                    }}>
                                      {label}
                                    </span>
                                    {themeMode === mode && (
                                      <div
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ background: "var(--brand)" }}
                                      />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div style={{ height: 1, background: "var(--border)", margin: "4px 12px" }} />

                          {/* Log out */}
                          <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-4 py-2 text-left transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <LogOut className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>Log out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
