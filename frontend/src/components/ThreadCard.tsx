import Link from 'next/link';

interface RedThread {
  _id: string;
  fromNode: { _id: string; title: string };
  toNode: { _id: string; title: string };
  type: string;
  description: string;
  createdBy: { _id: string; username: string };
}

interface ThreadCardProps {
  thread: RedThread;
  onDelete?: (id: string) => void;
}

// Color coding per thread type
const TYPE_STYLES: Record<string, { badge: string; label: string }> = {
  influence: { badge: 'bg-amber-900/50 border-amber-700 text-amber-300', label: 'Influence' },
  similarity: { badge: 'bg-blue-900/50 border-blue-700 text-blue-300', label: 'Similarity' },
  cause: { badge: 'bg-red-900/50 border-red-700 text-red-300', label: 'Cause' },
};

export default function ThreadCard({ thread, onDelete }: ThreadCardProps) {
  const typeStyle = TYPE_STYLES[thread.type] ?? {
    badge: 'bg-gray-700 border-gray-600 text-gray-300',
    label: thread.type,
  };

  return (
    <div
      id={`thread-card-${thread._id}`}
      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
    >
      {/* Connection row */}
      <div className="flex items-center gap-2 flex-wrap text-sm mb-2">
        <Link
          href={`/nodes/${thread.fromNode._id}`}
          className="text-gray-200 font-medium hover:text-white hover:underline truncate max-w-[160px]"
        >
          {thread.fromNode.title}
        </Link>

        <span
          className={`shrink-0 text-xs border px-2 py-0.5 rounded font-medium ${typeStyle.badge}`}
        >
          {typeStyle.label}
        </span>

        <Link
          href={`/nodes/${thread.toNode._id}`}
          className="text-gray-200 font-medium hover:text-white hover:underline truncate max-w-[160px]"
        >
          {thread.toNode.title}
        </Link>
      </div>

      {/* Description */}
      {thread.description && (
        <p className="text-gray-400 text-xs leading-relaxed mb-2">{thread.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-xs">by {thread.createdBy.username}</span>
        {onDelete && (
          <button
            id={`delete-thread-${thread._id}`}
            onClick={() => onDelete(thread._id)}
            className="text-xs text-red-600 hover:text-red-400"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
