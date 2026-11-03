import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Autonomous Freelancer Negotiator & Payer | PayPal AI Hackathon 2026',
  description: 'Autonomous Agentic Commerce platform where an AI agent negotiates freelance deliverables within strict budgets, signs contracts, and handles PayPal Sandbox authorization, capture, and payouts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070b14] text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}

