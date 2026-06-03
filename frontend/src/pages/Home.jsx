import React from 'react'

export default function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>ReassureAI — Home</h1>
      <p>Feature cards: Mental Health, Report Simplifier, Ayurvedic Guidance, Crisis Support, 24/7 Chat</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
        <div className="card">Mental Health</div>
        <div className="card">Report Simplifier</div>
        <div className="card">Ayurvedic Guidance</div>
        <div className="card">Crisis Support</div>
        <div className="card">24/7 Chat</div>
      </div>
    </div>
  )
}
import React from 'react';
import FeatureCard from '../components/FeatureCard';

const features = [
  { title: 'Mental Health', description: 'Chat with AI for mental support' },
  { title: 'Report Simplifier', description: 'Upload reports, get plain language summary' },
  { title: 'Ayurvedic Guidance', description: 'Personalized Ayurvedic advice' },
  { title: 'Crisis Support', description: 'Immediate help resources' },
  { title: '24/7 Chat', description: 'Always available AI companion' },
];

export default function Home() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to ReassureAI</h1>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <FeatureCard key={i} title={f.title} description={f.description} />
        ))}
      </div>
    </div>
  );
}
