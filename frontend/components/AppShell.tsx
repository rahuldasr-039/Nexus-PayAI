'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { api } from '@/lib/api';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<'CLIENT' | 'FREELANCER'>('CLIENT');

  const handleToggleRole = (newRole: 'CLIENT' | 'FREELANCER') => {
    setRole(newRole);
    api.setDemoRole(newRole);
    // Dispatch storage event or custom event so active pages refresh if needed
    window.dispatchEvent(new CustomEvent('persona-changed', { detail: { role: newRole } }));
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex">
      <Sidebar currentRole={role} onToggleRole={handleToggleRole} />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar currentRole={role} onDemoRunComplete={() => {
          window.location.reload();
        }} />
        <main className="flex-1 mt-16 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

