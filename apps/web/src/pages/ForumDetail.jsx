import { CalendarDays, CalendarPlus, Lock, MessageCircle, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ReportButton from "../components/ReportButton.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Tag from "../components/Tag.jsx";
import { asArray, formatDateTime, publicName } from "../utils/format.js";

export default function ForumDetail() {
  const { forumKey } = useParams();
  const { user } = useAuth();
  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [tab, setTab] = useState("discussion");
  const [postForm, setPostForm] = useState({ title: "", content: "", type: "thread" });
  const [meetingForm, setMeetingForm] = useState(defaultMeetingForm());
  const [meetingNotice, setMeetingNotice] = useState("");
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

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
        const [postsData, meetingsData, myForumsData] = await Promise.all([
          api(`/forums/${currentForum._id}/posts`),
          api(`/forums/${currentForum._id}/meetings`),
          user?.role === "beaner" ? api("/forums/my") : Promise.resolve({ forums: [] }),
        ]);
        if (active) {
          setForum(currentForum);
          setPosts(postsData.posts || []);
          setMeetings(meetingsData.meetings || []);
          setIsMember(
            user?.role !== "beaner" ||
              (myForumsData.forums || []).some((item) => item._id === currentForum._id)
          );
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
  }, [forumKey, user?.role]);

  const grouped = useMemo(() => ({
    articles: posts.filter((post) => ["therapist_article", "resource"].includes(post.type)),
    threads: posts.filter((post) => !["therapist_article", "resource"].includes(post.type)),
  }), [posts]);

  const submitPost = async (event) => {
    event.preventDefault();
    if (!forum) return;
    if (user?.role === "beaner" && !isMember) {
      setNotice("Join this forum before posting or replying.");
      return;
    }
    const data = await api(`/forums/${forum._id}/posts`, {
      method: "POST",
      body: JSON.stringify(postForm),
    });
    setPosts((current) => [data.post, ...current]);
    setPostForm({ title: "", content: "", type: "thread" });
  };

  const joinForum = async () => {
    if (!forum) return;
    setJoining(true);
    setNotice("");
    try {
      await api(`/forums/${forum._id}/join`, { method: "POST" });
      setIsMember(true);
      setNotice("Forum joined. You can now start posts and reply.");
    } catch (err) {
      setNotice(err.message);
    } finally {
      setJoining(false);
    }
  };

  const createMeeting = async (event) => {
    event.preventDefault();
    if (!forum) return;
    setMeetingNotice("");
    setCreatingMeeting(true);
    try {
      const data = await api(`/forums/${forum._id}/meetings`, {
        method: "POST",
        body: JSON.stringify({
          ...meetingForm,
          capacity: Number(meetingForm.capacity),
          tags: asArray(forum.tags).slice(0, 3),
        }),
      });
      setMeetings((current) => [...current, data.meeting].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)));
      setMeetingForm(defaultMeetingForm());
      setMeetingNotice("Forum meeting scheduled.");
    } catch (err) {
      setMeetingNotice(err.message);
    } finally {
      setCreatingMeeting(false);
    }
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
            {notice && <p className="mt-4 rounded-md bg-bean-mist px-3 py-2 text-sm font-semibold text-bean-teal">{notice}</p>}
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            {user?.role === "beaner" && !isMember && (
              <Button onClick={joinForum} disabled={joining}>
                <Plus className="h-4 w-4" />
                {joining ? "Joining..." : "Join forum"}
              </Button>
            )}
            <div className="flex rounded-lg bg-bean-mist p-1">
              <TabButton active={tab === "discussion"} onClick={() => setTab("discussion")} icon={MessageCircle}>Discussion</TabButton>
              <TabButton active={tab === "meetings"} onClick={() => setTab("meetings")} icon={CalendarDays}>Meetings</TabButton>
            </div>
          </div>
        </div>
      </section>

      {tab === "discussion" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
          <section className="rounded-lg bg-white/85 p-5 shadow-soft">
            {user?.role === "beaner" && !isMember ? (
              <EmptyState
                title="Join before participating"
                action={<Button onClick={joinForum} disabled={joining}><Lock className="h-4 w-4" />{joining ? "Joining..." : "Join forum"}</Button>}
              >
                You can read the discussion, but posting is limited to forum members.
              </EmptyState>
            ) : (
              <>
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
              </>
            )}
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
        <div className="space-y-4">
          {canCreateTherapistContent && (
            <section className="rounded-lg bg-white/85 p-5 shadow-soft">
              <form onSubmit={createMeeting} className="grid gap-3">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="h-5 w-5 text-bean-teal" />
                  <h2 className="text-xl font-black">Schedule forum meeting</h2>
                </div>
                <input
                  className="field"
                  placeholder="Meeting title"
                  value={meetingForm.title}
                  onChange={(event) => setMeetingForm({ ...meetingForm, title: event.target.value })}
                  required
                />
                <textarea
                  className="field min-h-24"
                  placeholder="Describe the webinar, Q&A, or discussion."
                  value={meetingForm.description}
                  onChange={(event) => setMeetingForm({ ...meetingForm, description: event.target.value })}
                  required
                />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <select
                    className="field"
                    value={meetingForm.meetingType}
                    onChange={(event) => setMeetingForm({ ...meetingForm, meetingType: event.target.value })}
                  >
                    <option value="webinar">Webinar</option>
                    <option value="open_discussion">Open discussion</option>
                    <option value="workshop">Workshop</option>
                    <option value="qna">Q&A</option>
                  </select>
                  <select
                    className="field"
                    value={meetingForm.mode}
                    onChange={(event) => setMeetingForm({ ...meetingForm, mode: event.target.value })}
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <input
                    className="field"
                    type="number"
                    min="1"
                    value={meetingForm.capacity}
                    onChange={(event) => setMeetingForm({ ...meetingForm, capacity: event.target.value })}
                    required
                  />
                  <div className="hidden xl:block" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="field"
                    type="datetime-local"
                    value={meetingForm.startsAt}
                    onChange={(event) => setMeetingForm({ ...meetingForm, startsAt: event.target.value })}
                    required
                  />
                  <input
                    className="field"
                    type="datetime-local"
                    value={meetingForm.endsAt}
                    onChange={(event) => setMeetingForm({ ...meetingForm, endsAt: event.target.value })}
                    required
                  />
                </div>
                {meetingForm.mode !== "offline" && (
                  <input
                    className="field"
                    placeholder="Meeting link"
                    value={meetingForm.meetingLink}
                    onChange={(event) => setMeetingForm({ ...meetingForm, meetingLink: event.target.value })}
                    required={meetingForm.mode === "online"}
                  />
                )}
                {meetingForm.mode !== "online" && (
                  <input
                    className="field"
                    placeholder="Location"
                    value={meetingForm.location}
                    onChange={(event) => setMeetingForm({ ...meetingForm, location: event.target.value })}
                    required={meetingForm.mode === "offline"}
                  />
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={creatingMeeting}>
                    {creatingMeeting ? "Scheduling..." : "Schedule meeting"}
                  </Button>
                  {meetingNotice && <p className="text-sm font-semibold text-bean-teal">{meetingNotice}</p>}
                </div>
              </form>
            </section>
          )}
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
                  {meeting.location && <p className="mt-2 text-sm text-bean-muted">{meeting.location}</p>}
                </article>
              ))
            ) : (
              <div className="md:col-span-2 xl:col-span-3">
                <EmptyState title="No forum-wide meetings">Therapists can host webinars, Q&A sessions, or workshops here.</EmptyState>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function defaultMeetingForm() {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    title: "",
    description: "",
    meetingType: "webinar",
    mode: "online",
    startsAt: toLocalInputValue(start),
    endsAt: toLocalInputValue(end),
    meetingLink: "",
    location: "",
    capacity: 80,
  };
}

function toLocalInputValue(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge>{post.type?.replace("_", " ") || "thread"}</StatusBadge>
          <span className="text-xs font-semibold text-bean-muted">by {publicName(post.author, "community member")}</span>
        </div>
        <ReportButton targetType="forum_post" targetId={post._id} label="Report post" />
      </div>
      <Link to={`/forums/posts/${post._id}`} className="mt-3 block text-xl font-black hover:text-bean-teal">{post.title}</Link>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-bean-muted">{post.content}</p>
    </article>
  );
}
