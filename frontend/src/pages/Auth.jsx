import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    guardianEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const passwordRules = [
    { rule: "at least 8 characters", test: (p) => p.length >= 8 },
    {
      rule: "at least one uppercase letter (A-Z)",
      test: (p) => /[A-Z]/.test(p),
    },
    {
      rule: "at least one lowercase letter (a-z)",
      test: (p) => /[a-z]/.test(p),
    },
    { rule: "at least one number (0-9)", test: (p) => /\d/.test(p) },
    {
      rule: "at least one special character",
      test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
    },
  ];

  const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  const validateEmail = (email) => {
    if (!email) return "Email is required";
    if (!emailPattern.test(email)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (password) => {
    const failedRules = passwordRules
      .filter((rule) => !rule.test(password))
      .map((rule) => rule.rule);
    return failedRules;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (isSignIn) {
      const emailError = validateEmail(formData.email);
      if (emailError) {
        setErrors({ email: emailError });
        setIsLoading(false);
        return;
      }

      try {
        await axios.post(
          "/api/v1/auth/login",
          { email: formData.email, password: formData.password },
          { withCredentials: true },
        );
        navigate("/dashboard");
      } catch (err) {
        setErrors({
          submit:
            err.response?.data?.detail || "Login failed. Please try again.",
        });
      }
    } else {
      const newErrors = {};

      if (!formData.fullName.trim()) {
        newErrors.fullName = "Full name is required";
      }

      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;

      if (!formData.guardianEmail) {
        newErrors.guardianEmail = "Guardian email is required";
      } else if (!emailPattern.test(formData.guardianEmail)) {
        newErrors.guardianEmail = "Please enter a valid guardian email";
      }

      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors;
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      try {
        await axios.post(
          "/api/v1/auth/register",
          {
            fullName: formData.fullName,
            email: formData.email,
            guardianEmail: formData.guardianEmail,
            password: formData.password,
          },
          { withCredentials: true },
        );
        navigate("/dashboard");
      } catch (err) {
        setErrors({
          submit:
            err.response?.data?.detail ||
            "Registration failed. Please try again.",
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">ReassureAI</h1>
          <p className="text-gray-500 mt-2">
            {isSignIn ? "Welcome back! Please sign in." : "Create your account"}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsSignIn(true)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              isSignIn
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignIn(false)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              !isSignIn
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSignIn && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {!isSignIn && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guardian Email
              </label>
              <input
                type="email"
                name="guardianEmail"
                value={formData.guardianEmail}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="guardian@example.com"
              />
              {errors.guardianEmail && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.guardianEmail}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {!isSignIn && formData.password && (
              <div className="mt-2 space-y-1">
                {passwordRules.map((rule, idx) => (
                  <p
                    key={idx}
                    className={`text-xs ${
                      rule.test(formData.password)
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  >
                    {rule.test(formData.password) ? "✓" : "✗"} {rule.rule}
                  </p>
                ))}
              </div>
            )}
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>
            )}
          </div>

          {!isSignIn && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {errors.submit && (
            <p className="text-red-500 text-sm text-center">{errors.submit}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? isSignIn
                ? "Signing In..."
                : "Creating Account..."
              : isSignIn
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
