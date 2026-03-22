'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Plus, MoreVertical, Eye, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAssignmentStore, Assignment } from '../store/assignmentStore';
import { listAssignments, deleteAssignment } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import toast from 'react-hot-toast';

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-36 h-36 relative">
          {/* Document */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
              {/* magnifier */}
              <circle cx="65" cy="55" r="38" fill="#F0F0F0" stroke="#E0E0E0" strokeWidth="2"/>
              {/* doc lines */}
              <rect x="45" y="38" width="28" height="3" rx="1.5" fill="#CACACA"/>
              <rect x="45" y="46" width="22" height="3" rx="1.5" fill="#CACACA"/>
              <rect x="45" y="54" width="18" height="3" rx="1.5" fill="#CACACA"/>
              {/* X */}
              <circle cx="68" cy="58" r="16" fill="white" stroke="#E0E0E0"/>
              <path d="M62 52L74 64M74 52L62 64" stroke="#F06060" strokeWidth="2.5" strokeLinecap="round"/>
              {/* handle */}
              <line x1="92" y1="80" x2="108" y2="96" stroke="#CACACA" strokeWidth="5" strokeLinecap="round"/>
              {/* sparkles */}
              <circle cx="28" cy="45" r="3" fill="#6B8DD6"/>
              <circle cx="110" cy="35" r="2" fill="#E8B84B"/>
              <path d="M108 68L110 72L114 70L110 74L108 78L106 74L102 72L106 70Z" fill="#E8B84B"/>
            </svg>
          </div>
        </div>
      </div>
      <h2 className="text-[17px] font-semibold text-gray-800 mb-2">No assignments yet</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs mb-7 leading-relaxed">
        Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <Link
        href="/create"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
        style={{ background: '#1A1A1A' }}
      >
        <Plus size={16} />
        Create Your First Assignment
      </Link>
    </div>
  );
}

function AssignmentCard({ assignment, onDelete, onView }: {
  assignment: Assignment;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const assignedDate = new Date(assignment.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).replace(/\//g, '-');
  const dueDate = new Date(assignment.dueDate).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).replace(/\//g, '-');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 relative">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-[14px] text-gray-900 flex-1 pr-2">{assignment.title}</h3>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[150px]">
                <button
                  onClick={() => { setMenuOpen(false); onView(assignment._id); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye size={14} />
                  View Assignment
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(assignment._id); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status dot */}
      <div className="mt-3 mb-3 flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${
          assignment.status === 'completed' ? 'bg-green-400' :
          assignment.status === 'processing' ? 'bg-blue-400' :
          assignment.status === 'failed' ? 'bg-red-400' : 'bg-gray-300'
        }`} />
        <span className="text-xs text-gray-400 capitalize">{assignment.status}</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span><span className="font-medium text-gray-600">Assigned on</span> : {assignedDate}</span>
        <span><span className="font-medium text-gray-600">Due</span> : {dueDate}</span>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const router = useRouter();
  const { assignments, setAssignments } = useAssignmentStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useWebSocket();

  useEffect(() => {
    listAssignments()
      .then(setAssignments)
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [setAssignments]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      setAssignments(assignments.filter(a => a._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleView = (id: string) => {
    const a = assignments.find(x => x._id === id);
    if (!a) return;
    if (a.status === 'completed') router.push(`/result/${id}`);
    else router.push(`/generate/${id}`);
  };

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#EFEFEF]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 pt-4">
          <TopBar title="Assignment" showBack />
        </div>
        <div className="flex-1 p-6 pt-4">
          {!loading && assignments.length === 0 ? (
            <div className="bg-white rounded-2xl h-full min-h-[600px] flex flex-col">
              <EmptyState />
            </div>
          ) : (
            <div className="bg-white rounded-2xl min-h-[600px] flex flex-col">
              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                <h1 className="text-[18px] font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  Assignments
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">Manage and create assignments for your classes.</p>
              </div>

              {/* Filter + Search */}
              <div className="px-6 py-3 flex items-center gap-3 border-b border-gray-100">
                <button className="flex items-center gap-2 text-sm text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <SlidersHorizontal size={14} />
                  Filter By
                </button>
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search Assignment"
                    className="w-full pl-8 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-300"
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 p-6 pb-20 relative">
                {loading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="bg-gray-50 rounded-xl h-28 animate-pulse border border-gray-200" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filtered.map(a => (
                      <AssignmentCard
                        key={a._id}
                        assignment={a}
                        onDelete={handleDelete}
                        onView={handleView}
                      />
                    ))}
                  </div>
                )}

                {/* Floating create button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <Link
                    href="/create"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg"
                    style={{ background: '#1A1A1A' }}
                  >
                    <Plus size={15} />
                    Create Assignment
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
