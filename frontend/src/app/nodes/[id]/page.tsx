'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchNode, deleteNode, fetchThreadsByNode, deleteThread, getErrorMessage } from '@/lib/api';
import ThreadCard from '@/components/ThreadCard';

interface ConspiracyNode {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  createdBy: { _id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

interface RedThread {
  _id: string;
  fromNode: { _id: string; title: string };
  toNode: { _id: string; title: string };
  type: string;
  description: string;
  createdBy: { _id: string; username: string };
}

export default function NodeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [node, setNode] = useState<ConspiracyNode | null>(null);
  const [threads, setThreads] = useState<RedThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchNode(id), fetchThreadsByNode(id)])
      .then(([nodeRes, threadsRes]) => {
        // interceptor unwraps envelope → .data is the actual object/array
        setNode(nodeRes.data as ConspiracyNode);
        setThreads(Array.isArray(threadsRes.data) ? (threadsRes.data as RedThread[]) : []);
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load node.')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeleteNode = async () => {
    if (!confirm('Delete this node? All connected threads will also be removed.')) return;
    setDeleting(true);
    try {
      await deleteNode(id);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete node.'));
      setDeleting(false);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Delete this red thread?')) return;
    try {
      await deleteThread(threadId);
      setThreads((prev) => prev.filter((t) => t._id !== threadId));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete thread.'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="text-center mt-24">
        <p className="text-gray-400 mb-3">Node not found.</p>
        <Link href="/dashboard" className="text-red-400 hover:text-red-300 text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Error banner */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm mb-5">
          {error}
        </div>
      )}

      {/* Node card */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-gray-100 leading-snug">{node.title}</h1>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/nodes/${id}/edit`}
              id="edit-node-btn"
              className="text-sm border border-gray-600 text-gray-300 px-3 py-1 rounded hover:bg-gray-700"
            >
              Edit
            </Link>
            <button
              id="delete-node-btn"
              onClick={handleDeleteNode}
              disabled={deleting}
              className="text-sm border border-red-800 text-red-400 px-3 py-1 rounded hover:bg-red-900/40 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm whitespace-pre-wrap mb-4 leading-relaxed">
          {node.description}
        </p>

        {/* Tags */}
        {node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {node.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-700 border border-gray-600 text-gray-300 text-xs px-2 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <p className="text-xs text-gray-500">
          Created by{' '}
          <span className="text-gray-400 font-medium">{node.createdBy.username}</span>
          {' · '}
          {new Date(node.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Red Threads section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-200">
          Red Threads
          <span className="text-gray-500 font-normal ml-2 text-sm">({threads.length})</span>
        </h2>
        <Link
          href={`/threads/new?fromNode=${id}`}
          id="new-thread-from-node-btn"
          className="bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700 font-medium"
        >
          + Draw Thread
        </Link>
      </div>

      {threads.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">No threads connected to this node yet.</p>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <ThreadCard key={thread._id} thread={thread} onDelete={handleDeleteThread} />
          ))}
        </div>
      )}

      {/* Back link */}
      <div className="mt-8">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300">
          ← Back to Board
        </Link>
      </div>
    </div>
  );
}
