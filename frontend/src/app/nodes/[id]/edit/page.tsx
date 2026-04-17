'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchNode, updateNode, getErrorMessage } from '@/lib/api';

export default function EditNodePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', tags: '' });
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNode(id)
      .then(({ data }) => {
        // interceptor unwraps → data is the node object
        const node = data as { title: string; description: string; tags: string[] };
        setForm({
          title: node.title,
          description: node.description,
          tags: node.tags.join(', '),
        });
      })
      .catch((err) => setLoadError(getErrorMessage(err, 'Failed to load node.')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await updateNode(id, { title: form.title, description: form.description, tags });
      router.push(`/nodes/${id}`);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Failed to save changes.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center mt-24">
        <p className="text-red-400 mb-3">{loadError}</p>
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-200 text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-100">Edit Node</h1>
        <p className="text-gray-400 text-sm mt-0.5">Update this node's information</p>
      </div>

      {saveError && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm mb-5">
          {saveError}
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
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            id="save-node-btn"
            type="submit"
            disabled={saving}
            className="bg-red-600 text-white px-5 py-2 rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link
            href={`/nodes/${id}`}
            className="border border-gray-600 text-gray-400 px-5 py-2 rounded text-sm hover:bg-gray-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
