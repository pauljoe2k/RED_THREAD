'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createNode, getErrorMessage } from '@/lib/api';

export default function NewNodePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', tags: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // interceptor unwraps → data is the created node object
      const { data } = await createNode({ title: form.title, description: form.description, tags });
      router.push(`/nodes/${data._id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create node.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-100">New Conspiracy Node</h1>
        <p className="text-gray-400 text-sm mt-0.5">Add a new piece of information to your board</p>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-500"
            placeholder="e.g. Area 51 Cover-up"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            value={form.description}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-500 resize-none"
            placeholder="Describe this node in detail…"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">
            Tags
            <span className="text-gray-500 font-normal ml-1">(comma-separated)</span>
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={form.tags}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-500"
            placeholder="government, moon, nasa"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            id="create-node-btn"
            type="submit"
            disabled={loading}
            className="bg-red-600 text-white px-5 py-2 rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : 'Create Node'}
          </button>
          <Link
            href="/dashboard"
            className="border border-gray-600 text-gray-400 px-5 py-2 rounded text-sm hover:bg-gray-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
