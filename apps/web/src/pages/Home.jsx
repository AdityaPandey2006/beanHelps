import { CalendarDays, MessageCircle, Sparkles, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Tag from "../components/Tag.jsx";
import { asArray, formatDateTime, publicName } from "../utils/format.js";

export default function Home() {
  const { updateProfile, setUser } = useAuth();
  const [home, setHome] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [aliasNotice, setAliasNotice] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dailyQuote, setDailyQuote] = useState(null);
  const [joiningRecommended, setJoiningRecommended] = useState(false);
  const [savingAlias, setSavingAlias] = useState(false);

  const loadHome = () => {
    let active = true;
    api("/users/home")
      .then((data) => {
        if (active) {
          setHome(data);
          setDisplayName(data.user?.displayName || data.user?.name || "");
        }
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return loadHome();
  }, []);

  useEffect(() => {
    let active = true;
    api("/quotes/daily")
      .then((data) => active && setDailyQuote(data.quote))
      .catch(() => active && setDailyQuote(null));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorPanel message={error} />;
  if (!home) return <PageSkeleton />;

  const supportGroup = home.supportGroup?.group;
  const joinedForums = asArray(home.joinedForums);
  const recommendedForums = asArray(home.recommendedForums);
  const meetings = [
    ...asArray(home.upcomingForumMeetings).map((item) => item.meeting),
    ...asArray(home.upcomingSupportGroupMeetings),
  ];

  const joinRecommended = async () => {
    setNotice("");
    setJoiningRecommended(true);
    try {
      const data = await api("/forums/recommended/join-all", { method: "POST" });
      setNotice(
        data.memberships?.length
          ? "Recommended forums joined. Your home feed has been updated."
          : "No new recommended forums to join right now."
      );
      const freshHome = await api("/users/home");
      setHome(freshHome);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setJoiningRecommended(false);
    }
  };

  const saveDisplayName = async (event) => {
    event.preventDefault();
    setAliasNotice("");
    setSavingAlias(true);
    try {
      const updatedUser = await updateProfile({ displayName });
      setUser(updatedUser);
      setHome((current) => current ? { ...current, user: updatedUser } : current);
      setAliasNotice("Display name updated.");
    } catch (err) {
      setAliasNotice(err.message);
    } finally {
      setSavingAlias(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wider text-bean-teal">Beaner home</p>
        <h1 className="mt-2 text-3xl font-black">Hi {publicName(home.user)}, your calmer space is ready.</h1>
        <p className="mt-2 max-w-3xl text-bean-muted">
          Continue conversations, join forum meetings, or get matched into a small support circle.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg bg-white/85 p-5 shadow-soft">
          <h2 className="text-xl font-black">Privacy alias</h2>
          <p className="mt-1 text-sm text-bean-muted">
            This is the name other members see in forums and support circles.
          </p>
          <form onSubmit={saveDisplayName} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="field"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              minLength={2}
              maxLength={40}
              required
            />
            <Button type="submit" disabled={savingAlias}>
              {savingAlias ? "Saving..." : "Save alias"}
            </Button>
          </form>
          {aliasNotice && <p className="mt-3 rounded-md bg-bean-mist px-3 py-2 text-sm font-semibold text-bean-teal">{aliasNotice}</p>}
        </section>

        <section className="rounded-lg bg-white/85 p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-bean-teal" />
            <h2 className="text-xl font-black">Daily kindness</h2>
          </div>
          {dailyQuote ? (
            <div className="mt-4">
              <blockquote className="text-lg font-semibold leading-7 text-bean-ink">
                "{dailyQuote.quote}"
              </blockquote>
              <p className="mt-3 text-sm font-bold text-bean-teal">
                {dailyQuote.author}
              </p>
              {dailyQuote.attributionUrl && (
                <a
                  href={dailyQuote.attributionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-xs font-semibold text-bean-muted hover:text-bean-teal"
                >
                  {dailyQuote.attributionText}
                </a>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-bean-muted">
              A daily quote will appear here when the quote service is available.
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-lg bg-white/85 p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Your support circle</h2>
            <UsersRound className="h-5 w-5 text-bean-teal" />
          </div>
          {supportGroup ? (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-lg font-bold">{supportGroup.name}</h3>
                <p className="mt-1 text-sm text-bean-muted">{supportGroup.description || "A private support circle for steady conversation."}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {asArray(supportGroup.tags).map((tag) => <Tag key={tag}>{tag}</Tag>)}
              </div>
              <Link className="btn-primary mt-2" to={`/support-groups/${supportGroup._id}`}>
                Open group
              </Link>
            </div>
          ) : home.waitlistStatus ? (
            <EmptyState title="You are on the support circle waitlist">
              beanHelps will place you when a suitable group opens or enough similar members are waiting.
            </EmptyState>
          ) : (
            <EmptyState
              title="Find a support circle"
              action={<Link className="btn-primary" to="/support-groups">Explore Support Groups</Link>}
            >
              Match by tags, language, and group type.
            </EmptyState>
          )}
        </section>

        <section className="rounded-lg bg-white/85 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Upcoming sessions</h2>
            <CalendarDays className="h-5 w-5 text-bean-teal" />
          </div>
          <div className="mt-4 space-y-3">
            {meetings.length ? (
              meetings.slice(0, 4).map((meeting) => (
                <div key={meeting._id} className="rounded-md bg-bean-mist/70 p-3">
                  <p className="font-bold">{meeting.title}</p>
                  <p className="mt-1 text-sm text-bean-muted">{formatDateTime(meeting.startsAt)}</p>
                </div>
              ))
            ) : (
              <EmptyState title="No sessions yet">Forum webinars and support circle events will appear here.</EmptyState>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg bg-white/85 p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Your forums</h2>
          <MessageCircle className="h-5 w-5 text-bean-teal" />
        </div>
        {joinedForums.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {joinedForums.map((forum) => (
              <Link key={forum._id} to={`/forums/${forum.slug || forum._id}`} className="rounded-lg border border-bean-sage/20 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
                <p className="font-black">{forum.name}</p>
                <p className="mt-2 line-clamp-2 text-sm text-bean-muted">{forum.description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="You have not joined any forums yet"
            action={<Link className="btn-primary" to="/forums">Explore Forums</Link>}
          >
            Join a forum to post, ask questions, and follow forum-wide meetings.
          </EmptyState>
        )}
      </section>

      {recommendedForums.length > 0 && (
        <section className="rounded-lg bg-white/85 p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-bean-teal" />
              <div>
                <h2 className="text-xl font-black">Recommended forums</h2>
                <p className="text-sm text-bean-muted">Based on your onboarding tags.</p>
              </div>
            </div>
            <Button onClick={joinRecommended} disabled={joiningRecommended}>
              {joiningRecommended ? "Joining..." : "Auto join recommended"}
            </Button>
          </div>
          {notice && <p className="mt-3 rounded-md bg-bean-mist px-3 py-2 text-sm font-semibold text-bean-teal">{notice}</p>}
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recommendedForums.map((forum) => (
              <article key={forum._id} className="rounded-lg border border-bean-sage/20 bg-white p-4">
                <p className="font-black">{forum.name}</p>
                <p className="mt-2 line-clamp-2 text-sm text-bean-muted">{forum.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {asArray(forum.tags).slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ErrorPanel({ message }) {
  return <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{message}</div>;
}

function PageSkeleton() {
  return <div className="h-80 animate-pulse rounded-lg bg-white/70 shadow-soft" />;
}
