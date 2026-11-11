import Link from "next/link";

// Displays repository topics as links that filter the Explore
// page. Renders nothing when there are no topics.

export default function TopicChips({
  topics,
  small = false,
}: {
  topics: string[];
  small?: boolean;
}) {
  const list = (topics ?? []).filter(Boolean).slice(0, 8);

  if (list.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((topic) => (
        <Link
          key={topic}
          href={`/explore?topic=${encodeURIComponent(topic)}`}
          className={
            "rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 text-[#E5C76B] transition hover:border-[#C9A227]/60 hover:text-white " +
            (small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs")
          }
        >
          {topic}
        </Link>
      ))}
    </div>
  );
}
