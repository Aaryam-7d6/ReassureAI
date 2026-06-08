import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MessageSquare,
  FileText,
  Leaf,
  ShieldCheck,
  Activity,
  Heart,
  Sparkles,
  ChevronRight,
  Upload,
  Mic,
  Users,
  ChevronDown,
} from "lucide-react";

// Inline SVGs for brand icons missing in old lucide-react version
const LinkedinIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: delay * 0.12,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const teamData = [
  {
    name: "Aarya R. Thakar",
    role: "Originator & Project Lead · System Architecture · AI Pipeline · Research",
    initials: "AT",
    linkedin: "https://www.linkedin.com/in/aaryamthakar/",
    github: "https://github.com/Aaryam-7d6",
    gradient: "linear-gradient(135deg, var(--brand), var(--brand-hover))",
  },
  {
    name: "Ansh B. Patel",
    role: "Frontend & Backend Development",
    initials: "AP",
    linkedin: "https://www.linkedin.com/in/ansh-patel-a756162b5/",
    github: "https://github.com/Ansh-Patel-123",
    gradient: "linear-gradient(135deg, var(--purple), #6366f1)",
  },
  {
    name: "Darshan B. Kyada",
    role: "Frontend & Backend Development",
    initials: "DK",
    linkedin: "https://www.linkedin.com/in/darshankyada/",
    github: "https://github.com/DARSHAN081104",
    gradient: "linear-gradient(135deg, var(--green), #16a34a)",
  },
  {
    name: "Elvis T. Fernandes",
    role: "Database",
    initials: "EF",
    linkedin: "https://www.linkedin.com/in/elvis-thomas-46631a375/",
    github: "https://github.com/Elvis2724",
    gradient: "linear-gradient(135deg, var(--orange), #ea580c)",
  },
];

function TeamSection() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleCard = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="team"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
      className="py-24 px-4"
    >
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-16">
            <span className="badge mb-4 inline-flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Meet the Team
            </span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                fontWeight: 500,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                marginTop: "1rem",
                transition: "color 0.3s",
              }}
            >
              Built with passion.
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                marginTop: "0.75rem",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
              }}
            >
              The minds behind ReassureAI — engineering empathy into technology.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {teamData.map((member, index) => {
            const isExpanded = expandedIndex === index;

            return (
              <Reveal key={member.name} delay={index + 1}>
                <motion.div
                  layout
                  onClick={() => toggleCard(index)}
                  className="rounded-2xl p-6 cursor-pointer group"
                  style={{
                    background: "var(--bg-surface)",
                    border: `1px solid ${isExpanded ? "var(--brand-border)" : "var(--border)"}`,
                    transition: "border-color 0.3s, background 0.3s, box-shadow 0.3s",
                    boxShadow: isExpanded
                      ? "0 8px 32px rgba(0,0,0,0.12)"
                      : "none",
                  }}
                  whileHover={{
                    borderColor: "var(--brand-border)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* Avatar */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-transform duration-300 group-hover:scale-105"
                      style={{
                        background: member.gradient,
                        color: "#fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    >
                      {member.initials}
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ChevronDown
                        className="w-4 h-4"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </motion.div>
                  </div>

                  {/* Name */}
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                      transition: "color 0.3s",
                    }}
                  >
                    {member.name}
                  </h3>

                  {/* Expanded content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
                          opacity: { duration: 0.2, delay: 0.05 },
                        }}
                        style={{ overflow: "hidden" }}
                      >
                        <p
                          className="mt-3"
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--text-muted)",
                            lineHeight: 1.6,
                          }}
                        >
                          {member.role}
                        </p>

                        {/* Social links */}
                        <div
                          className="flex items-center gap-2 mt-4 pt-4"
                          style={{
                            borderTop: "1px solid var(--border-subtle)",
                          }}
                        >
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg transition-all duration-200"
                            style={{
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#0077b5";
                              e.currentTarget.style.color = "#fff";
                              e.currentTarget.style.borderColor = "#0077b5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--bg-elevated)";
                              e.currentTarget.style.color = "var(--text-muted)";
                              e.currentTarget.style.borderColor = "var(--border)";
                            }}
                            title={`${member.name} on LinkedIn`}
                          >
                            <LinkedinIcon className="w-4 h-4" />
                          </a>
                          <a
                            href={member.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg transition-all duration-200"
                            style={{
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--text-primary)";
                              e.currentTarget.style.color = "var(--bg-base)";
                              e.currentTarget.style.borderColor = "var(--text-primary)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--bg-elevated)";
                              e.currentTarget.style.color = "var(--text-muted)";
                              e.currentTarget.style.borderColor = "var(--border)";
                            }}
                            title={`${member.name} on GitHub`}
                          >
                            <GithubIcon className="w-4 h-4" />
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const chatMessages = [
  {
    id: 1,
    from: "user",
    text: "I've been having headaches and feeling fatigued for a week.",
  },
  {
    id: 2,
    from: "ai",
    text: "I understand — that sounds really draining. How's your sleep been? And are you drinking enough water?",
  },
  { id: 3, from: "user", text: "Sleep is okay, but I don't drink much water." },
  {
    id: 4,
    from: "ai",
    text: "Dehydration is often a hidden culprit. From an Ayurvedic lens, this may also indicate a Vata imbalance.",
    tags: ["Vata Imbalance", "Hydration", "Pitta-reducing diet"],
  },
];

const features = [
  {
    id: "feat-chat",
    icon: MessageSquare,
    label: "Empathetic Chat",
    desc: "Real conversations about your health. Our AI listens, reasons, and escalates when needed.",
    colorVar: "var(--brand)",
    bgVar: "var(--brand-subtle)",
    borderVar: "var(--brand-border)",
    status: "Active",
    actionLabel: "Launch App",
    actionHref: "/chat",
  },
  {
    id: "feat-report",
    icon: FileText,
    label: "Report Simplifier",
    desc: "Upload lab reports and get them explained in plain, human language instantly.",
    colorVar: "var(--purple)",
    bgVar: "var(--purple-subtle)",
    borderVar: "var(--purple-border)",
    status: "Active",
    actionLabel: "Launch App",
    actionHref: "/chat",
  },
  {
    id: "feat-ayurveda",
    icon: Leaf,
    label: "Ayurvedic Discover",
    desc: "Explore your dosha, get wellness rituals and diet tips from ancient Ayurvedic texts.",
    colorVar: "var(--green)",
    bgVar: "var(--green-subtle)",
    borderVar: "var(--green-border)",
    status: "Active",
    actionLabel: "Launch App",
    actionHref: "/chat",
  },
  {
    id: "feat-safety",
    icon: ShieldCheck,
    label: "Safety & Privacy",
    desc: "Crisis detection with automatic guardian alerts. Your data never trains any model.",
    colorVar: "var(--orange)",
    bgVar: "var(--orange-subtle)",
    borderVar: "var(--orange-border)",
    status: "Active",
    actionLabel: "Launch App",
    actionHref: "/chat",
  },
  {
    id: "feat-crisis",
    icon: Heart,
    label: "Crisis Support",
    desc: "Immediate connection to verified mental health helplines, local emergency resources, and critical care details.",
    colorVar: "var(--red)",
    bgVar: "var(--red-subtle)",
    borderVar: "var(--red-border)",
    status: "Active",
    actionLabel: "Launch App",
    actionHref: "/chat",
  },
  {
    id: "feat-health",
    icon: MessageSquare,
    label: "24/7 Health Chat",
    desc: "Intelligent multi-model system providing quick response and comprehensive reasoning for physical health queries.",
    colorVar: "var(--brand)",
    bgVar: "var(--brand-subtle)",
    borderVar: "var(--brand-border)",
    status: "Active",
    actionLabel: "Launch App",
    actionHref: "/chat",
  },
];

const pillars = [
  { label: "feel less anxious after 1 week", value: "85%" },
  { label: "faster understanding of reports", value: "3×" },
  { label: "Ayurvedic wellness entries", value: "10K+" },
  { label: "avg escalation time when needed", value: "<30s" },
];

const steps = [
  {
    step: 1,
    icon: MessageSquare,
    colorVar: "var(--brand)",
    title: "Share how you feel",
    desc: "Chat naturally, upload a report, or describe your symptoms in any language.",
  },
  {
    step: 2,
    icon: ShieldCheck,
    colorVar: "var(--purple)",
    title: "Screened & routed",
    desc: "Safety gates check your message first, then AI routes the best response path.",
  },
  {
    step: 3,
    icon: Leaf,
    colorVar: "var(--green)",
    title: "Dual insights delivered",
    desc: "Receive a blended biomedical and Ayurvedic response, tailored to your profile.",
  },
];

export default function Home() {
  return (
    <div
      className="flex-1 flex flex-col overflow-x-hidden"
      style={{
        background: "var(--bg-base)",
        color: "var(--text-secondary)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center text-center px-4 pt-28 pb-20 min-h-[92vh]">
        {/* Organic blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute animate-pulse-slow"
            style={{
              top: "-10%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "700px",
              height: "500px",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, var(--brand-subtle) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute animate-pulse-slow"
            style={{
              animationDelay: "2s",
              top: "20%",
              right: "-15%",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, var(--purple-subtle) 0%, transparent 70%)",
              filter: "blur(70px)",
            }}
          />
          <div
            className="absolute animate-pulse-slow"
            style={{
              animationDelay: "1s",
              bottom: "10%",
              left: "-10%",
              width: "350px",
              height: "350px",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, var(--green-subtle) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          id="hero-badge"
        >
          <span className="badge">
            <Heart className="w-3 h-3 animate-breathe" />
            AI-Powered Health &amp; Wellness Platform
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.12,
          }}
          id="hero-headline"
          className="text-balance"
          style={{
            fontSize: "clamp(2.25rem, 6.5vw, 5rem)",
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            color: "var(--text-primary)",
            marginTop: "1.5rem",
            marginBottom: "1.25rem",
            maxWidth: "780px",
            transition: "color 0.3s",
          }}
        >
          Feel heard.
          <br />
          <span
            style={{
              background:
                "linear-gradient(135deg, var(--brand) 0%, var(--purple) 55%, var(--green) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Get answers that matter.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          id="hero-subtext"
          style={{
            maxWidth: "500px",
            fontSize: "1.0625rem",
            color: "var(--text-muted)",
            lineHeight: 1.75,
            marginBottom: "2.5rem",
            transition: "color 0.3s",
          }}
        >
          <>
            ReassureAI provides empathetic mental wellness support, simplifies
            clinical medical reports, and connects you to Ayurvedic guidance —{" "}
            <br /> built safely for your peace of mind.
          </>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            to="/auth"
            id="cta-start"
            className="btn-primary text-sm px-7 py-3"
          >
            Start free <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            id="cta-learn"
            className="btn-secondary text-sm px-7 py-3"
          >
            Explore features
          </a>
        </motion.div>

        {/* Chat UI preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.55,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="mt-20 w-full max-w-lg mx-auto relative animate-float"
          aria-hidden="true"
        >
          <div
            className="absolute inset-x-8 bottom-0 h-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, var(--brand-glow) 0%, transparent 70%)",
              filter: "blur(20px)",
              transform: "translateY(50%)",
            }}
          />
          <div
            className="relative rounded-2xl overflow-hidden text-left"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
              transition: "background 0.3s, border-color 0.3s",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-subtle)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: "transparent",
                  border: "1px solid var(--brand-border)",
                }}
              >
                <Heart className="w-4 h-4" style={{ color: "var(--brand)" }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  ReassureAI
                </p>
                <p style={{ fontSize: "0.6875rem", color: "var(--brand)" }}>
                  ● Active
                </p>
              </div>
            </div>
            {/* Messages */}
            <div className="px-4 py-5 flex flex-col gap-3">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.from === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.3, duration: 0.4 }}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "0.6rem 0.875rem",
                      borderRadius:
                        msg.from === "user"
                          ? "1rem 1rem 0.25rem 1rem"
                          : "1rem 1rem 1rem 0.25rem",
                      background:
                        msg.from === "user"
                          ? "var(--brand-subtle)"
                          : "var(--bg-elevated)",
                      border: `1px solid ${msg.from === "user" ? "var(--brand-border)" : "var(--border)"}`,
                      fontSize: "0.78125rem",
                      color:
                        msg.from === "user"
                          ? "var(--brand)"
                          : "var(--text-secondary)",
                      lineHeight: 1.6,
                      transition: "background 0.3s, border-color 0.3s",
                    }}
                  >
                    {msg.text}
                    {msg.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {msg.tags.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: "0.625rem",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "9999px",
                              background: "var(--brand-subtle)",
                              border: "1px solid var(--brand-border)",
                              color: "var(--brand)",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {/* Typing dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
                className="flex justify-start"
              >
                <div
                  style={{
                    padding: "0.6rem 0.875rem",
                    borderRadius: "1rem 1rem 1rem 0.25rem",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="animate-breathe"
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--brand)",
                        display: "inline-block",
                        animationDelay: `${d * 0.25}s`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
            {/* Input bar */}
            <div
              className="px-4 pb-4"
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "0.75rem",
                background: "var(--bg-subtle)",
              }}
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-placeholder)",
                    flex: 1,
                  }}
                >
                  Ask anything about your health...
                </span>
                <Mic
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--text-placeholder)" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section
        style={{
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          transition: "border-color 0.3s",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal
              key={p.label}
              delay={i}
              className="flex flex-col items-center text-center py-4 px-2"
            >
              <span
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 600,
                  color: "var(--brand)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {p.value}
              </span>
              <span
                style={{
                  fontSize: "0.6875rem",
                  color: "var(--text-dim)",
                  marginTop: "0.5rem",
                  lineHeight: 1.5,
                }}
              >
                {p.label}
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="badge">
              <Sparkles className="w-3 h-3" /> What ReassureAI can do
            </span>
            <h2
              className="text-balance"
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                fontWeight: 500,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                marginTop: "1.25rem",
                marginBottom: "0.75rem",
                transition: "color 0.3s",
              }}
            >
              One platform, complete care.
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                maxWidth: "400px",
                margin: "0 auto",
                fontSize: "0.9375rem",
              }}
            >
              Modern medicine meets ancient wisdom — all in a single, elegant
              interface.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10 auto-rows-fr">
            {features.map((f, i) => (
              <Reveal key={f.id} delay={i}>
                <div
                  id={f.id}
                  className="rounded-3xl p-8 h-full flex flex-col justify-between gap-6"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    minHeight: "280px",
                    transition:
                      "border-color 0.25s, transform 0.25s, box-shadow 0.25s, background 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = f.borderVar;
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 20px 60px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="w-12 h-12 rounded-[1.4rem] flex items-center justify-center"
                      style={{
                        background: f.bgVar,
                        border: `1px solid ${f.borderVar}`,
                      }}
                    >
                      <f.icon
                        className="w-6 h-6"
                        style={{ color: f.colorVar }}
                      />
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em]"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {f.status}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "0.65rem",
                        transition: "color 0.3s",
                      }}
                    >
                      {f.label}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.95rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.8,
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                  <Link
                    to={f.actionHref}
                    className="inline-flex items-center gap-2 font-semibold transition-colors"
                    style={{
                      color: "var(--brand)",
                    }}
                  >
                    {f.actionLabel} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="workflow"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
        className="py-28 px-4"
      >
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                fontWeight: 500,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                transition: "color 0.3s",
              }}
            >
              Simple by design.
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                marginTop: "0.625rem",
                fontSize: "0.9375rem",
              }}
            >
              From question to insight in three steps.
            </p>
          </Reveal>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--border), var(--border), transparent)",
              }}
            />
            {steps.map((item, i) => (
              <Reveal
                key={item.step}
                delay={i}
                className="flex flex-col items-center text-center"
              >
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center mb-5 z-10"
                  style={{
                    background: "var(--bg-surface)",
                    border: `2px solid ${item.colorVar}`,
                    boxShadow: `0 0 20px color-mix(in srgb, ${item.colorVar} 15%, transparent)`,
                    transition: "background 0.3s",
                  }}
                >
                  <item.icon
                    className="w-6 h-6"
                    style={{ color: item.colorVar }}
                  />
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: item.colorVar,
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      color: "#000",
                    }}
                  >
                    {item.step}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                    transition: "color 0.3s",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.7,
                    maxWidth: "220px",
                  }}
                >
                  {item.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── REPORT HIGHLIGHT ── */}
      <section
        style={{ borderTop: "1px solid var(--border-subtle)" }}
        className="py-24 px-4"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <span className="badge mb-6 inline-flex">
              <Upload className="w-3 h-3" /> Report Simplifier
            </span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                fontWeight: 500,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                marginBottom: "1rem",
                transition: "color 0.3s",
              }}
            >
              Stop Googling your lab results.
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                lineHeight: 1.75,
                marginBottom: "1.5rem",
                fontSize: "0.9375rem",
              }}
            >
              Upload any medical report — blood work, MRI findings, ECG — and
              get it explained in plain language with context.
            </p>
            <div className="flex flex-col gap-3">
              {[
                "PDF, JPG, PNG support",
                "Hindi & English reports",
                "Flags critical values instantly",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "var(--brand)" }}
                  />
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Report mockup */}
          <Reveal delay={2} className="animate-float">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                transition: "background 0.3s, border-color 0.3s",
              }}
            >
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-subtle)",
                }}
              >
                <FileText
                  className="w-4 h-4"
                  style={{ color: "var(--purple)" }}
                />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  CBC_Report_May2025.pdf
                </span>
                <span
                  className="ml-auto"
                  style={{
                    fontSize: "0.625rem",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    background: "var(--green-subtle)",
                    border: "1px solid var(--green-border)",
                    color: "var(--green)",
                  }}
                >
                  Analyzed
                </span>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {[
                  {
                    label: "Hemoglobin",
                    value: "10.2 g/dL",
                    flag: "Low",
                    flagColorVar: "var(--orange)",
                  },
                  {
                    label: "WBC Count",
                    value: "7,200 /μL",
                    flag: "Normal",
                    flagColorVar: "var(--green)",
                  },
                  {
                    label: "Platelet Count",
                    value: "1,50,000 /μL",
                    flag: "Normal",
                    flagColorVar: "var(--green)",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                  >
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {row.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {row.value}
                      </span>
                      <span
                        style={{
                          fontSize: "0.625rem",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "9999px",
                          color: row.flagColorVar,
                        }}
                      >
                        {row.flag}
                      </span>
                    </div>
                  </div>
                ))}
                <div
                  className="mt-2 p-3 rounded-xl"
                  style={{
                    background: "var(--orange-subtle)",
                    border: "1px solid var(--orange-border)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--orange)",
                      lineHeight: 1.6,
                    }}
                  >
                    ⚠ Your hemoglobin is slightly below the normal range (12–17
                    g/dL). This may indicate mild anemia. Discuss iron
                    supplementation with your doctor.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TEAM ── */}
      <TeamSection />

      {/* ── CTA ── */}
      <section
        style={{ borderTop: "1px solid var(--border-subtle)" }}
        className="py-24 px-4"
      >
        <div className="max-w-xl mx-auto text-center">
          <Reveal>
            <div
              className="relative rounded-2xl p-12 overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                transition: "background 0.3s, border-color 0.3s",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 60% at 50% 0%, var(--brand-subtle) 0%, transparent 70%)",
                }}
              />
              <div className="relative z-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: "var(--brand-subtle)",
                    border: "1px solid var(--brand-border)",
                  }}
                >
                  <Activity
                    className="w-6 h-6"
                    style={{ color: "var(--brand)" }}
                  />
                </div>
                <h2
                  style={{
                    fontSize: "clamp(1.375rem, 3vw, 2rem)",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.03em",
                    marginBottom: "0.75rem",
                    transition: "color 0.3s",
                  }}
                >
                  Your wellness journey starts here.
                </h2>
                <p
                  style={{
                    color: "var(--text-muted)",
                    marginBottom: "2rem",
                    lineHeight: 1.75,
                    fontSize: "0.9375rem",
                  }}
                >
                  Free to use. No card required. Private by default.
                </p>
                <Link
                  to="/auth"
                  id="cta-final"
                  className="btn-primary px-8 py-3 text-sm"
                >
                  Get started for free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
        }}
        className="py-8 px-4"
      >
        <div className="w-full mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          {/* LEFT — Logo + Disclaimer */}
          <div className="flex flex-col gap-3" style={{ maxWidth: "380px" }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: "transparent",
                  boxShadow: "0 4px 12px var(--brand-glow)",
                  border: "1px solid var(--brand-border)",
                }}
              >
                <Activity
                  className="w-5 h-5"
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
                }}
              >
                ReassureAI
              </span>
            </div>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                Disclaimer:
              </span>{" "}
              ReassureAI can make mistakes. Cross‑verify important health
              information. This platform is educational and does not provide
              clinical diagnosis.
            </p>
          </div>

          {/* RIGHT — Created by + License */}
          <div className="flex flex-col items-start text-left md:items-end md:text-right gap-2">
            <p
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Created by:
            </p>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              <a
                href="https://github.com/Aaryam-7d6"
                target="_blank"
                rel="noopener noreferrer"
              >
                Aarya R. Thakar
              </a>
              &nbsp;&bull;&nbsp;
              <a
                href="https://github.com/Ansh-Patel-123"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ansh B. Patel
              </a>
              &nbsp;&bull;&nbsp;
              <a
                href="https://github.com/DARSHAN081104"
                target="_blank"
                rel="noopener noreferrer"
              >
                Darshan B. Kyada
              </a>
              &nbsp;&bull;&nbsp;
              <a
                href="https://github.com/Elvis2724"
                target="_blank"
                rel="noopener noreferrer"
              >
                Elvis T. Fernandes
              </a>
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Licensed under MIT &copy; 2026 ReassureAI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
