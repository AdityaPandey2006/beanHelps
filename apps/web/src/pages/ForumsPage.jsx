import { Compass, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import Tag from "../components/Tag.jsx";
import { asArray } from "../utils/format.js";

export default function ForumsPage() {
  const [forums, setForums] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/forums")
      .then((data) => active && setForums(data.forums || []))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <Compass className="h-6 w-6 text-bean-teal" />
          <div>
            <h1 className="text-3xl font-black">Discussion forums</h1>
            <p className="mt-1 text-bean-muted">Curated spaces for posts, therapist resources, and forum-wide meetings.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {forums.length ? (
          forums.map((forum) => (
            <Link key={forum._id} to={`/forums/${forum.slug || forum._id}`} className="rounded-lg border border-bean-sage/20 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl">{forum.icon || "🌿"}</p>
                  <h2 className="mt-3 text-xl font-black">{forum.name}</h2>
                </div>
                <MessageCircle className="h-5 w-5 text-bean-teal" />
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-bean-muted">{forum.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {asArray(forum.tags).slice(0, 4).map((tag) => <Tag key={tag}>{tag}</Tag>)}
              </div>
            </Link>
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState title="No forums yet">Seed the curated forums to show General, Anxiety, Loneliness, and more.</EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}
