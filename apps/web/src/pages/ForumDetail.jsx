import { CalendarDays, MessageCircle, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Tag from "../components/Tag.jsx";
import { asArray, formatDateTime } from "../utils/format.js";

export default function ForumDetail() {
  const { forumKey } = useParams();
  const { user } = useAuth();
  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [tab, setTab] = useState("discussion");
  const [postForm, setPostForm] = useState({ title: "", content: "", type: "thread" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const canCreateTherapistContent =
    user?.role === "beanpist" && user?.therapistProfile?.verificationStatus === "verified";

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const forumData = await api(`/forums/slug/${forumKey}`).catch(() => api(`/forums/${forumKey}`));
        const currentForum = forumData.forum;
        const [postsData, meetingsData] = await Promise.all([
          api(`/forums/${currentForum._id}/posts`),
          api(`/forums/${currentForum._id}/meetings`),
        ]);
        if (active) {
          setForum(currentForum);
          setPosts(postsData.posts || []);
          setMeetings(meetingsData.meetings || []);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [forumKey]);

  const grouped = useMemo(() => ({
    articles: posts.filter((post) => ["therapist_article", "resource"].includes(post.type)),
    threads: posts.filter((post) => !["therapist_article", "resource"].includes(post.type)),
  }), [posts]);

  const submitPost = async (event) => {
    event.preventDefault();
    if (!forum) return;
    const data = await api(`/forums/${forum._id}/posts`, {
      method: "POST",
      body: JSON.stringify(postForm),
    });
    setPosts((current) => [data.post, ...current]);
    setPostForm({ title: "", content: "", type: "thread" });
  };

  if (loading) return <div className="h-96 animate-pulse rounded-lg bg-white/70 shadow-soft" />;
  if (error) return <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-bean-teal">Forum</p>
            <h1 className="mt-2 text-3xl font-black">{forum.name}</h1>
            <p className="mt-2 max-w-3xl text-bean-muted">{forum.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {asArray(forum.tags).map((tag) => <Tag key={tag}>{tag}</Tag>)}
            </div>
          </div>
          <div className="flex rounded-lg bg-bean-mist p-1">
            <TabButton active={tab === "discussion"} onClick={() => setTab("discussion")} icon={MessageCircle}>Discussion</TabButton>
            <TabButton active={tab === "meetings"} onClick={() => setTab("meetings")} icon={CalendarDays}>Meetings</TabButton>
          </div>
        </div>
      </section>

      {tab === "discussion" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
          <section className="rounded-lg bg-white/85 p-5 shadow-soft">
            <h2 className="text-xl font-black">Start a post</h2>
            <form onSubmit={submitPost} className="mt-4 space-y-3">
              <input className="field" placeholder="Title" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required />
              <textarea className="field min-h-28" placeholder="Share something useful, specific, or kind." value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} required />
              <select className="field" value={postForm.type} onChange={(e) => setPostForm({ ...postForm, type: e.target.value })}>
                <option value="thread">Thread</option>
                <option value="question">Question</option>
                {canCreateTherapistContent && <option value="therapist_article">Therapist article</option>}
                {canCreateTherapistContent && <option value="resource">Resource</option>}
              </select>
              <Button type="submit"><Plus className="h-4 w-4" />Post</Button>
            </form>
          </section>

          <section className="space-y-4">
            {[...grouped.articles, ...grouped.threads].length ? (
              [...grouped.articles, ...grouped.threads].map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            ) : (
              <EmptyState title="No posts yet">Create the first thread or therapist resource for this forum.</EmptyState>
            )}
          </section>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {meetings.length ? (
            meetings.map((meeting) => (
              <article key={meeting._id} className="rounded-lg bg-white/90 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-black">{meeting.title}</h2>
                  <StatusBadge tone={meeting.status}>{meeting.status}</StatusBadge>
                </div>
                <p className="mt-2 text-sm font-semibold text-bean-teal">{formatDateTime(meeting.startsAt)}</p>
                <p className="mt-3 line-clamp-3 text-sm text-bean-muted">{meeting.description}</p>
                {meeting.meetingLink && (
                  <a className="mt-4 inline-flex text-sm font-bold text-bean-teal hover:underline" href={meeting.meetingLink} target="_blank" rel="noreferrer">
                    Open meeting link
                  </a>
                )}
              </article>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState title="No forum-wide meetings">Therapists can host webinars, Q&A sessions, or workshops here.</EmptyState>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${active ? "bg-white text-bean-teal shadow-sm" : "text-bean-muted"}`}>
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function PostCard({ post }) {
  return (
    <article className="rounded-lg bg-white/90 p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge>{post.type?.replace("_", " ") || "thread"}</StatusBadge>
        <span className="text-xs font-semibold text-bean-muted">by {post.author?.name || "community member"}</span>
      </div>
      <Link to={`/forums/posts/${post._id}`} className="mt-3 block text-xl font-black hover:text-bean-teal">{post.title}</Link>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-bean-muted">{post.content}</p>
    </article>
  );
}
