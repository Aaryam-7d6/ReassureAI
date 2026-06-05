import { Outlet, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: 'var(--bg-base)', transition: 'background 0.3s' }}
    >
      {/* Organic ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', top: '-5%', left: '40%',
          width: '500px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, var(--brand-subtle) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-10%',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, var(--purple-subtle) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8 z-10"
      >
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{ background: 'transparent', border: '1px solid var(--brand-border)' }}
          >
            <Activity className="w-4 h-4" style={{ color: 'var(--brand)' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em', transition: 'color 0.3s' }}>
            ReassureAI
          </span>
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[400px] z-10 rounded-2xl p-8"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', transition: 'background 0.3s, border-color 0.3s' }}
      >
        <Outlet />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-xs z-10"
        style={{ color: 'var(--text-dim)', transition: 'color 0.3s' }}
      >
        Educational platform — not a substitute for medical advice
      </motion.p>
    </div>
  )
}
