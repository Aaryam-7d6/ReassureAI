export default function Journal() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)', transition: 'color 0.3s' }}>Wellness Journal</h1>

      <div className="p-6 mb-8 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', transition: 'background 0.3s, border-color 0.3s' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)', transition: 'color 0.3s' }}>How are you feeling today?</h2>
        <div className="flex gap-4 mb-6">
          {['😢', '😕', '😐', '🙂', '😄'].map((emoji, i) => (
            <button key={i} className="text-4xl hover:scale-110 transition-transform focus:outline-none">
              {emoji}
            </button>
          ))}
        </div>

        <textarea
          className="input-field min-h-[150px] resize-y mb-4"
          placeholder="Write your thoughts here..."
        ></textarea>

        <button className="btn-primary">Save Entry</button>
      </div>

      <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)', transition: 'color 0.3s' }}>Past Entries</h2>
      <div className="space-y-4">
        {/* Placeholder for entries */}
        <div className="p-4 rounded-xl shadow-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', transition: 'background 0.3s, border-color 0.3s' }}>
          <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            <span>May 30, 2026</span>
            <span>Mood: 🙂</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}>Felt pretty productive today. Followed the Ayurvedic tip and felt more energetic.</p>
        </div>
      </div>
    </div>
  )
}
