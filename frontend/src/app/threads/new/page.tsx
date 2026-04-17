'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchNodes, createThread, getErrorMessage } from '@/lib/api';

interface ConspiracyNode {
  _id: string;
  title: string;
}

const THREAD_TYPES = [
  { value: 'influence', label: 'Influence' },
  { value: 'similarity', label: 'Similarity' },
  { value: 'cause', label: 'Cause' },
] as const;

function NewThreadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedFromNode = searchParams.get('fromNode') || '';

  const [nodes, setNodes] = useState<ConspiracyNode[]>([]);
  const [form, setForm] = useState({
    fromNode: preselectedFromNode,
    toNode: '',
    type: 'influence',
    description: '',
  });
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNodes()
      .then(({ data }) => {
        // interceptor unwraps → data is the nodes array
        setNodes(Array.isArray(data) ? (data as ConspiracyNode[]) : []);
      })
      .catch((err) => setLoadError(getErrorMessage(err, 'Failed to load nodes.')))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await createThread(form);
      // Go back to the originating node, or dashboard
      router.push(preselectedFromNode ? `/nodes/${preselectedFromNode}` : '/dashboard');
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Failed to create thread.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading nodes…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-100">Draw a Red Thread</h1>
        <p className="text-gray-400 text-sm mt-0.5">Connect two conspiracy nodes with a typed relationship</p>
      </div>

      {loadError && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm mb-5">
          {loadError}
        </div>
      )}

      {nodes.length < 2 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-3">
            You need at least <span className="text-gray-200 font-medium">2 conspiracy nodes</span> to draw a thread.
          </p>
          <Link
            href="/nodes/new"
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Create a node →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm">
              {submitError}
            </div>
          )}

          {/* From Node */}
          <div>
            <label htmlFor="fromNode" className="block text-sm font-medium text-gray-300 mb-1">
              From Node <span className="text-red-500">*</span>
            </label>
            <select
              id="fromNode"
              name="fromNode"
              required
              value={form.fromNode}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            >
              <option value="" className="text-gray-500">Select a node…</option>
              {nodes.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>

          {/* Thread Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
              Relationship Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              required
              value={form.type}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            >
              {THREAD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* To Node (excludes fromNode) */}
          <div>
            <label htmlFor="toNode" className="block text-sm font-medium text-gray-300 mb-1">
              To Node <span className="text-red-500">*</span>
            </label>
            <select
              id="toNode"
              name="toNode"
              required
              value={form.toNode}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            >
              <option value="" className="text-gray-500">Select a node…</option>
              {nodes
                .filter((n) => n._id !== form.fromNode)
                .map((n) => (
                  <option key={n._id} value={n._id}>
                    {n.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description
              <span className="text-gray-500 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-500 resize-none"
              placeholder="Explain how these nodes connect…"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              id="create-thread-btn"
              type="submit"
              disabled={submitting}
              className="bg-red-600 text-white px-5 py-2 rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating…' : 'Draw Thread'}
            </button>
            <Link
              href={preselectedFromNode ? `/nodes/${preselectedFromNode}` : '/dashboard'}
              className="border border-gray-600 text-gray-400 px-5 py-2 rounded text-sm hover:bg-gray-800"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function NewThreadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-500">Loading…</p>
        </div>
      }
    >
      <NewThreadForm />
    </Suspense>
  );
}
