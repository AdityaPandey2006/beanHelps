import { CheckCircle2, Compass, MessageCircle, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Tag from "../components/Tag.jsx";
import { asArray } from "../utils/format.js";

export default function ForumsPage() {
  const { user } = useAuth();
  const [joinedForums, setJoinedForums] = useState([]);
  const [exploreForums, setExploreForums] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [joiningId, setJoiningId] = useState("");

  const loadForums = useCallback(() => {
    let active = true;
    const request =
      user?.role === "beaner"
        ? Promise.all([api("/forums/my"), api("/forums/explore")])
        : Promise.all([api("/forums/my"), Promise.resolve({ forums: [] })]);

    request
      .then(([myData, exploreData]) => {
        if (!active) return;
        setJoinedForums(myData.forums || []);
        setExploreForums(exploreData.forums || []);
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [user?.role]);

  useEffect(() => {
    return loadForums();
  }, [loadForums]);

  const joinForum = async (forumId) => {
    setNotice("");
    setJoiningId(forumId);
    try {
      await api(`/forums/${forumId}/join`, { method: "POST" });
      setNotice("Forum joined. You can now post and reply there.");
      const [myData, exploreData] = await Promise.all([
        api("/forums/my"),
        api("/forums/explore"),
      ]);
      setJoinedForums(myData.forums || []);
      setExploreForums(exploreData.forums || []);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setJoiningId("");
    }
  };

  if (error) return <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <Compass className="h-6 w-6 text-bean-teal" />
          <div>
            <h1 className="text-3xl font-black">Explore Forums</h1>
            <p className="mt-1 text-bean-muted">Join curated spaces before posting, asking questions, or following forum-wide meetings.</p>
          </div>
        </div>
      </section>

      {notice && <p className="rounded-md bg-bean-mist px-3 py-2 text-sm font-semibold text-bean-teal">{notice}</p>}

      <section className="space-y-4">
        <h2 className="text-xl font-black">Your forums</h2>
        {joinedForums.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {joinedForums.map((forum) => (
              <ForumCard key={forum._id} forum={forum} joined />
            ))}
          </div>
        ) : (
          <EmptyState title="No joined forums yet">Choose forums below to unlock posting and replies.</EmptyState>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black">Available forums</h2>
        {exploreForums.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {exploreForums.map((forum) => (
              <ForumCard
                key={forum._id}
                forum={forum}
                onJoin={() => joinForum(forum._id)}
                joining={joiningId === forum._id}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No more forums to join">You are already in every currently available forum.</EmptyState>
        )}
      </section>
    </div>
  );
}

function ForumCard({ forum, joined = false, joining = false, onJoin }) {
  return (
    <article className="rounded-lg border border-bean-sage/20 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl">{forum.icon || "🌿"}</p>
          <Link to={`/forums/${forum.slug || forum._id}`} className="mt-3 block text-xl font-black hover:text-bean-teal">
            {forum.name}
          </Link>
        </div>
        {joined ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <MessageCircle className="h-5 w-5 text-bean-teal" />}
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-bean-muted">{forum.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {asArray(forum.tags).slice(0, 4).map((tag) => <Tag key={tag}>{tag}</Tag>)}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Link className="btn-subtle" to={`/forums/${forum.slug || forum._id}`}>
          View
        </Link>
        {joined ? (
          <span className="inline-flex min-h-10 items-center rounded-md bg-emerald-50 px-3 text-sm font-bold text-emerald-700">
            Joined
          </span>
        ) : (
          <Button variant="secondary" onClick={onJoin} disabled={joining}>
            <Plus className="h-4 w-4" />
            {joining ? "Joining..." : "Join"}
          </Button>
        )}
      </div>
    </article>
  );
}
