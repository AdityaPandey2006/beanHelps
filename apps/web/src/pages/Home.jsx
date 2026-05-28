import { CalendarDays, MessageCircle, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import Tag from "../components/Tag.jsx";
import { asArray, formatDateTime } from "../utils/format.js";

export default function Home() {
  const [home, setHome] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/users/home")
      .then((data) => active && setHome(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorPanel message={error} />;
  if (!home) return <PageSkeleton />;

  const supportGroup = home.supportGroup?.group;
  const meetings = [
    ...asArray(home.upcomingForumMeetings).map((item) => item.meeting),
    ...asArray(home.upcomingSupportGroupMeetings),
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wider text-bean-teal">Beaner home</p>
        <h1 className="mt-2 text-3xl font-black">Hi {home.user?.name}, your calmer space is ready.</h1>
        <p className="mt-2 max-w-3xl text-bean-muted">
          Continue conversations, join forum meetings, or get matched into a small support circle.
        </p>
      </section>

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
              action={<Link className="btn-primary" to="/support-groups">Explore groups</Link>}
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
          <h2 className="text-xl font-black">Forums for you</h2>
          <MessageCircle className="h-5 w-5 text-bean-teal" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...asArray(home.joinedForums), ...asArray(home.recommendedForums)].slice(0, 6).map((forum) => (
            <Link key={forum._id} to={`/forums/${forum.slug || forum._id}`} className="rounded-lg border border-bean-sage/20 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
              <p className="font-black">{forum.name}</p>
              <p className="mt-2 line-clamp-2 text-sm text-bean-muted">{forum.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ErrorPanel({ message }) {
  return <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{message}</div>;
}

function PageSkeleton() {
  return <div className="h-80 animate-pulse rounded-lg bg-white/70 shadow-soft" />;
}
