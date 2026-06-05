import { useState } from 'react';
import { motion } from 'framer-motion';
import { validatePassword } from '../utils/validators';
// import { useAuth } from '../hooks/useAuth'; // To be wired up next

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        guardianEmail: '',
        password: '',
        confirmPassword: ''
    });

    const [passwordErrors, setPasswordErrors] = useState([]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password' && !isLogin) {
            setPasswordErrors(validatePassword(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isLogin && passwordErrors.length > 0) {
            return; // Block submission if password rules are failing
        }

        if (!isLogin && formData.password !== formData.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        // TODO: Wire up with authApi / useAuth hook
        console.log("Submitting:", formData);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8"
            >
                <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Full Name"
                            required
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    )}

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />

                    {!isLogin && (
                        <input
                            type="email"
                            name="guardianEmail"
                            placeholder="Guardian Alert Email (Optional)"
                            value={formData.guardianEmail}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    )}

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />

                    {!isLogin && passwordErrors.length > 0 && (
                        <ul className="text-sm text-rose-500 space-y-1 pl-2">
                            {passwordErrors.map((err, i) => (
                                <li key={i}>• {err}</li>
                            ))}
                        </ul>
                    )}

                    {!isLogin && (
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    )}

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors">
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <p className="text-center mt-6 text-slate-600 dark:text-slate-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 hover:underline focus:outline-none">
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </motion.div>
        </div>
    );
}