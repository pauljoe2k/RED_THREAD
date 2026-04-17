'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchNodes, fetchThreads, getErrorMessage } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import NodeCard from '@/components/NodeCard';
import GraphView, { type GraphNode, type GraphThread } from '@/components/GraphView';

type View = 'cards' | 'graph';

export default function DashboardPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [threads, setThreads] = useState<GraphThread[]>([]);
  const [view, setView] = useState<View>('cards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
      return;
    }

    // Fetch nodes and threads in parallel
    Promise.all([fetchNodes(), fetchThreads()])
      .then(([nodesRes, threadsRes]) => {
        setNodes(Array.isArray(nodesRes.data) ? nodesRes.data : []);
        setThreads(Array.isArray(threadsRes.data) ? threadsRes.data : []);
      })
      .catch((err) =>
        setError(getErrorMessage(err, 'Failed to load data. Is the backend running?'))
      )
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      {/* ─── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Conspiracy Board</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''}
            {threads.length > 0 && ` · ${threads.length} thread${threads.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex border border-gray-700 rounded overflow-hidden">
            <button
              id="view-cards-btn"
              onClick={() => setView('cards')}
              className={`px-3 py-1.5 text-xs font-medium ${
                view === 'cards'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              Cards
            </button>
            <button
              id="view-graph-btn"
              onClick={() => setView('graph')}
              className={`px-3 py-1.5 text-xs font-medium border-l border-gray-700 ${
                view === 'graph'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              Graph
            </button>
          </div>

          {/* Actions */}
          <Link
            href="/threads/new"
            id="new-thread-btn"
            className="border border-gray-600 text-gray-300 px-3 py-1.5 rounded text-xs hover:bg-gray-800"
          >
            + Thread
          </Link>
          <Link
            href="/nodes/new"
            id="new-node-btn"
            className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-700"
          >
            + Node
          </Link>
        </div>
      </div>

      {/* ─── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm mb-5">
          {error}
        </div>
      )}

      {/* ─── Empty state ─────────────────────────────────────────────────────── */}
      {nodes.length === 0 ? (
        <div className="text-center mt-24">
          <p className="text-gray-400 mb-2">No conspiracy nodes yet.</p>
          <Link href="/nodes/new" className="text-red-400 hover:text-red-300 text-sm">
            Create your first node →
          </Link>
        </div>
      ) : view === 'cards' ? (
        /* ─── Card view ──────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <NodeCard key={node._id} node={node} />
          ))}
        </div>
      ) : (
        /* ─── Graph view ─────────────────────────────────────────────────────── */
        <GraphView nodes={nodes} threads={threads} />
      )}
    </div>
  );
}
