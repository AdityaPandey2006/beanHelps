import { BarChart3, CalendarDays, FileText, MessageSquareHeart, Plus, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Tag from "../components/Tag.jsx";
import { asArray, formatDateTime } from "../utils/format.js";

export default function TherapistHome() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/therapists/dashboard")
      .then((data) => active && setDashboard(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</div>;
  if (!dashboard) return <div className="h-96 animate-pulse rounded-lg bg-white/70 shadow-soft" />;

  const insights = dashboard.insights || {};
  const sessions = [
    ...asArray(dashboard.upcomingForumMeetings),
    ...asArray(dashboard.joinedForumMeetings).map((item) => item.meeting),
    ...asArray(dashboard.upcomingSupportGroupMeetings),
  ].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-wider text-bean-teal">Therapist dashboard</p>
              <StatusBadge tone={dashboard.verification?.status}>{dashboard.verification?.status}</StatusBadge>
            </div>
            <h1 className="mt-2 text-3xl font-black">Welcome, {dashboard.user?.name}</h1>
            <p className="mt-2 max-w-3xl text-bean-muted">{dashboard.verification?.message}</p>
          </div>
          {dashboard.verification?.canUseTherapistPowers && (
            <Link className="btn-primary" to="/support-groups">
              <Plus className="h-4 w-4" />
              Create or guide a group
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UsersRound} label="Assigned circles" value={insights.assignedSupportGroupsCount || 0} />
        <Metric icon={CalendarDays} label="Upcoming sessions" value={insights.upcomingSessionsCount || 0} />
        <Metric icon={FileText} label="Resources posted" value={insights.therapistPostsCount || 0} />
        <Metric icon={MessageSquareHeart} label="Recent messages" value={insights.recentSupportMessagesCount || 0} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg bg-white/85 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Upcoming sessions</h2>
            <CalendarDays className="h-5 w-5 text-bean-teal" />
          </div>
          <div className="mt-4 space-y-3">
            {sessions.length ? (
              sessions.slice(0, 6).map((session) => (
                <div key={session._id} className="rounded-lg border border-bean-sage/20 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{session.title}</h3>
                      <p className="mt-1 text-sm text-bean-muted">{formatDateTime(session.startsAt)}</p>
                    </div>
                    <StatusBadge tone={session.status}>{session.status || "scheduled"}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-bean-muted">{session.description}</p>
                </div>
              ))
            ) : (
              <EmptyState title="No upcoming sessions">Created webinars and assigned group meetings will appear here.</EmptyState>
            )}
          </div>
        </section>

        <section className="rounded-lg bg-white/85 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Weekly insights</h2>
            <BarChart3 className="h-5 w-5 text-bean-teal" />
          </div>
          <div className="mt-4 space-y-3">
            {asArray(dashboard.recentSupportGroupMessages).length ? (
              asArray(dashboard.recentSupportGroupMessages).map((message) => (
                <div key={message._id} className="rounded-lg bg-bean-mist/70 p-4">
                  <p className="text-sm font-bold">{message.supportGroup?.name}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-bean-muted">{message.content}</p>
                </div>
              ))
            ) : (
              <EmptyState title="No chat insights yet">
                Recent assigned-circle messages will populate this section for AI moderation summaries.
              </EmptyState>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg bg-white/85 p-5 shadow-soft">
        <h2 className="text-xl font-black">Assigned support circles</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {asArray(dashboard.assignedSupportGroups).length ? (
            asArray(dashboard.assignedSupportGroups).map((group) => (
              <Link key={group._id} to={`/support-groups/${group._id}`} className="rounded-lg border border-bean-sage/20 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black">{group.name}</h3>
                  <StatusBadge tone={group.status}>{group.status}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-bean-muted">{group.currentMemberCount || 0}/{group.capacity || 8} members</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {asArray(group.tags).slice(0, 4).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                </div>
              </Link>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState title="No assigned circles yet">Therapist-led or assigned support groups will appear here.</EmptyState>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-white/85 p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-bean-muted">{label}</p>
        <Icon className="h-5 w-5 text-bean-teal" />
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}
