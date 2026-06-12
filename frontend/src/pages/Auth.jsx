import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useToast } from "../components/Toast";
import { Heart, Mail, Lock, User, Shield } from "lucide-react";

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) {
    errors.push("At least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter (A–Z)");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter (a–z)");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("At least one number (0–9)");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("At least one special character (!@#$%^&*...)");
  }
  return errors;
};

export default function Auth() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLogin) {
      const password = document.getElementById("input-password")?.value || "";
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        addToast("Password needs a bit more strength", "error", passwordErrors);
        return;
      }
    }
    const email = document.getElementById("input-email")?.value || "user@example.com";
    const name = document.getElementById("input-name")?.value || "Demo User";
    login({ id: 1, name, email });
  };

  return (
    <div>
      {/* Heading */}
      <div className="mb-7 text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "transparent",
            border: "1px solid var(--brand-border)",
            boxShadow: "0 4px 14px var(--brand-glow)",
          }}
        >
          <Heart className="w-6 h-6" style={{ color: "var(--brand)" }} />
        </div>
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "0.25rem",
            transition: "color 0.3s",
          }}
        >
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            transition: "color 0.3s",
          }}
        >
          {isLogin
            ? "Sign in to continue your wellness journey."
            : "Start your free health companion."}
        </p>
      </div>

      {/* Tab toggle */}
      <div
        className="flex rounded-xl p-1 mb-6"
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        {["Sign In", "Sign Up"].map((label, i) => {
          const active = (isLogin && i === 0) || (!isLogin && i === 1);
          return (
            <button
              key={label}
              onClick={() => setIsLogin(i === 0)}
              id={`tab-${label.toLowerCase().replace(" ", "-")}`}
              className="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150"
              style={{
                background: active ? "var(--bg-elevated)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                border: active
                  ? "1px solid var(--border)"
                  : "1px solid transparent",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Form */}
      <motion.form
        key={isLogin ? "login" : "register"}
        initial={{ opacity: 0, x: isLogin ? -8 : 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {!isLogin && (
          <div>
            <label
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: "0.375rem",
                display: "block",
                transition: "color 0.3s",
              }}
            >
              Full Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-dim)", transition: "color 0.3s" }}
              />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: "2.25rem" }}
                placeholder="Ansh Patel"
                required={!isLogin}
                id="input-name"
              />
            </div>
          </div>
        )}

        <div>
          <label
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginBottom: "0.375rem",
              display: "block",
              transition: "color 0.3s",
            }}
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-dim)", transition: "color 0.3s" }}
            />
            <input
              type="email"
              className="input-field"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="you@example.com"
              required
              id="input-email"
            />
          </div>
        </div>

        {!isLogin && (
          <div>
            <label
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: "0.375rem",
                display: "block",
                transition: "color 0.3s",
              }}
            >
              Guardian Alert Email
              <span
                className="ml-2"
                style={{
                  fontSize: "0.625rem",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  background: "var(--brand-subtle)",
                  color: "var(--brand)",
                  border: "1px solid var(--brand-border)",
                  transition: "all 0.3s",
                }}
              >
                Crisis Safety
              </span>
            </label>
            <div className="relative">
              <Shield
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-dim)", transition: "color 0.3s" }}
              />
              <input
                type="email"
                className="input-field"
                style={{ paddingLeft: "2.25rem" }}
                placeholder="guardian@example.com"
                required={!isLogin}
                id="input-guardian"
              />
            </div>
            <p
              style={{
                fontSize: "0.6875rem",
                color: "var(--text-dim)",
                marginTop: "0.375rem",
                lineHeight: 1.5,
                transition: "color 0.3s",
              }}
            >
              Notified only if our crisis detection identifies an emergency.
            </p>
          </div>
        )}

        <div>
          <label
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginBottom: "0.375rem",
              display: "block",
              transition: "color 0.3s",
            }}
          >
            Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-dim)", transition: "color 0.3s" }}
            />
            <input
              type="password"
              className="input-field"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="••••••••"
              required
              id="input-password"
            />
          </div>
        </div>

        <button
          type="submit"
          id="btn-submit-auth"
          className="btn-primary w-full mt-1"
          style={{
            padding: "0.75rem",
            borderRadius: "0.75rem",
            justifyContent: "center",
          }}
        >
          {isLogin ? "Sign In" : "Create Account"}
        </button>
      </motion.form>

      <p
        style={{
          fontSize: "0.6875rem",
          color: "var(--text-dim)",
          textAlign: "center",
          marginTop: "1.5rem",
          lineHeight: 1.6,
          transition: "color 0.3s",
        }}
      >
        By continuing you agree to our{" "}
        <span
          style={{
            color: "var(--text-muted)",
            textDecoration: "underline",
            cursor: "pointer",
            transition: "color 0.3s",
          }}
        >
          Terms
        </span>{" "}
        and{" "}
        <span
          style={{
            color: "var(--text-muted)",
            textDecoration: "underline",
            cursor: "pointer",
            transition: "color 0.3s",
          }}
        >
          Privacy Policy
        </span>
      </p>
    </div>
  );
}
