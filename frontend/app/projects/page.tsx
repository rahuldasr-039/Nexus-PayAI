'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  DollarSign,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import { api, Project } from '@/lib/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState('500');
  const [currency, setCurrency] = useState('USD');
  const [freelancerId, setFreelancerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projs, fls] = await Promise.all([
        api.getProjects(),
        api.getFreelancers(),
      ]);
      setProjects(projs);
      setFreelancers(fls);
      if (fls.length > 0 && !freelancerId) {
        setFreelancerId(fls[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title || !description || !requirements || !budget) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await api.createProject({
        title,
        description,
        requirements,
        budget: parseFloat(budget),
        currency,
        freelancerId: freelancerId || undefined,
      });

      setShowModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setRequirements('');
      setBudget('500');
      // Reload projects
      await loadData();

      // If negotiation was initialized, redirect to negotiation room
      if (result.negotiation) {
        window.location.href = `/negotiations/${result.negotiation.id}`;
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PAID':
        return 'bg-[#0070ba]/20 text-[#009cde] border-[#0070ba]/40';
      case 'AGREED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'NEGOTIATING':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Projects Management</h1>
          <p className="text-xs text-slate-400">
            Define requirements and assign strict budget constraints for autonomous AI procurement.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel space-y-4">
          <Briefcase className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No projects found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create your first project, specify a strict budget ceiling, and let the AI agent autonomously negotiate terms with top freelancers.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold"
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const negotiation = project.negotiations?.[0];
            return (
              <div
                key={project.id}
                className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-sky-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      Ceiling: <strong className="text-white">${project.budget} {project.currency}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                      Core Requirements:
                    </div>
                    <div className="line-clamp-2 italic text-slate-400">
                      {project.requirements}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  {negotiation ? (
                    <Link
                      href={`/negotiations/${negotiation.id}`}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center space-x-1.5 transition-colors"
                    >
                      <span>Open Negotiation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href="/negotiations"
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1.5"
                    >
                      <span>Start Negotiation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  <span className="text-[10px] text-slate-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create New Project</h2>
                  <p className="text-xs text-slate-400">Define scope & strict maximum budget ceiling</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Professional Logo Design for a Technology Startup"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive description of the deliverables and brand vision..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Specific Requirements & Scope *
                </label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="1. Primary vector logo (SVG, AI). 2. App icon mark (512x512). 3. 3 rounds of revisions."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Strict Budget Ceiling (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      min="10"
                      step="1"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-sky-400 font-medium">AI will NEVER exceed this price.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Freelancer
                  </label>
                  <select
                    value={freelancerId}
                    onChange={(e) => setFreelancerId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500"
                  >
                    {freelancers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.title || 'Freelancer'})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500">Autonomous negotiation starts automatically</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Creating Project...' : 'Create & Start AI Negotiation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

