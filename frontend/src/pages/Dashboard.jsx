import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { MessageCircle, FileText, Heart, Activity, ArrowRight, Leaf, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import ReportViewer from '../components/ReportViewer'

const ayurvedicTips = [
  "Start your morning with warm water and half a lemon to balance Kapha and boost digestion.",
  "Abhyanga (self-oil massage) with sesame oil before a shower calms Vata and promotes sound sleep.",
  "A pinch of turmeric in warm milk at night helps reduce inflammation and supports immunity.",
]

function StatCard({ title, value, icon: Icon, colorVar, borderVar, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl p-5 flex items-center justify-between"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', transition: 'background 0.3s, border-color 0.3s, transform 0.3s' }}
      whileHover={{ y: -2, borderColor: borderVar }}
    >
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem', transition: 'color 0.3s' }}>{title}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1, transition: 'color 0.3s' }}>{value}</p>
      </div>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'transparent', border: `1px solid ${borderVar}` }}
      >
        <Icon className="w-5 h-5" style={{ color: colorVar }} />
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const tip = ayurvedicTips[new Date().getDay() % ayurvedicTips.length]

  return (
    <div
      className="flex-1 flex flex-col min-h-screen"
      style={{ background: 'var(--bg-base)', transition: 'background 0.3s' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col gap-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p style={{ fontSize: '0.8125rem', color: 'var(--brand)', marginBottom: '0.375rem', transition: 'color 0.3s' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
          </p>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em', transition: 'color 0.3s' }}>
            {user?.name || 'Guest'} 👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem', transition: 'color 0.3s' }}>
            Here's your wellness overview.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Conversations" value="12" icon={MessageCircle} colorVar="var(--brand)" borderVar="var(--brand-border)" delay={0.1} />
          <StatCard title="Reports Analyzed" value="3" icon={FileText} colorVar="var(--purple)" borderVar="var(--purple-border)" delay={0.18} />
          <StatCard title="Wellness Entries" value="5" icon={Heart} colorVar="var(--orange)" borderVar="var(--orange-border)" delay={0.26} />
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="rounded-2xl p-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', transition: 'background 0.3s, border-color 0.3s' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--brand)' }} />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', transition: 'color 0.3s' }}>Quick Actions</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/chat"
              id="dash-start-chat"
              className="flex items-center justify-between flex-1 rounded-xl px-4 py-3.5 transition-all duration-150"
              style={{ background: 'var(--brand-subtle)', border: '1px solid var(--brand-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--brand-border)'}
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', transition: 'color 0.3s' }}>Start a Chat</span>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--brand)' }} />
            </Link>
            <Link
              to="/journal"
              id="dash-journal"
              className="flex items-center justify-between flex-1 rounded-xl px-4 py-3.5 transition-all duration-150"
              style={{ background: 'var(--purple-subtle)', border: '1px solid var(--purple-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--purple)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--purple-border)'}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4" style={{ color: 'var(--purple)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', transition: 'color 0.3s' }}>Wellness Journal</span>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--purple)' }} />
            </Link>
          </div>
        </motion.div>

        {/* Ayurvedic Tip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'var(--green-subtle)',
            border: '1px solid var(--green-border)',
            transition: 'background 0.3s, border-color 0.3s'
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'transparent', border: '1px solid var(--green-border)' }}
            >
              <Leaf className="w-4 h-4" style={{ color: 'var(--green)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 500, marginBottom: '0.375rem' }}>
                Ayurvedic Tip of the Day
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic', transition: 'color 0.3s' }}>
                "{tip}"
              </p>
            </div>
          </div>
        </motion.div>

        {/* Report Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <ReportViewer />
        </motion.div>
      </div>
    </div>
  )
}
