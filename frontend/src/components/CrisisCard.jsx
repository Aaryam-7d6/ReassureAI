import { AlertTriangle, PhoneCall } from 'lucide-react';

export default function CrisisCard() {
  return (
    <div className="rounded-2xl p-6 shadow-sm mb-6 animate-pulse-slow" style={{ background: 'var(--orange-subtle)', border: '1px solid var(--orange-border)', transition: 'background 0.3s, border-color 0.3s' }}>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full flex-shrink-0" style={{ background: 'var(--orange-subtle)' }}>
          <AlertTriangle className="h-8 w-8" style={{ color: 'var(--orange)' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--orange)' }}>Emergency Support Available</h2>
          <p className="mb-4" style={{ color: 'var(--text-primary)', transition: 'color 0.3s' }}>
            We noticed signs of distress in your message. Your safety is our top priority. Please reach out to immediate support—you don't have to go through this alone.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg shadow-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <PhoneCall className="h-5 w-5" style={{ color: 'var(--orange)' }} />
              <div>
                <p className="font-bold" style={{ color: 'var(--text-primary)', transition: 'color 0.3s' }}>iCall (TISS)</p>
                <a href="tel:9152987821" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>9152987821</a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg shadow-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <PhoneCall className="h-5 w-5" style={{ color: 'var(--orange)' }} />
              <div>
                <p className="font-bold" style={{ color: 'var(--text-primary)', transition: 'color 0.3s' }}>Vandrevala Foundation</p>
                <a href="tel:18602662345" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>1860-2662-345</a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg shadow-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <PhoneCall className="h-5 w-5" style={{ color: 'var(--orange)' }} />
              <div>
                <p className="font-bold" style={{ color: 'var(--text-primary)', transition: 'color 0.3s' }}>MANAS</p>
                <a href="tel:14416" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>14416</a> <span style={{ color: 'var(--text-dim)' }}>/</span> <a href="tel:18008914416" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>1-800-891-4416</a>
              </div>
            </div>
          </div>

          <p className="text-xs mt-4 italic" style={{ color: 'var(--orange)' }}>
            * An automatic alert has been sent to your registered guardian contact.
          </p>
        </div>
      </div>
    </div>
  );
}
