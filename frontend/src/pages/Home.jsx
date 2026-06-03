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
