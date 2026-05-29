import { CalendarDays, FileText, MessageSquareHeart, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ReportButton from "../components/ReportButton.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Tag from "../components/Tag.jsx";
import { asArray, formatDateTime } from "../utils/format.js";

const prompts = [
  "What felt heavier than usual this week?",
  "What is one small thing that helped you stay steady?",
  "What kind of support would feel useful today?",
];

const resources = [
  "Grounding: name five things you can see, four you can feel, three you can hear.",
  "Journal prompt: write the worry, then write the next tiny action.",
  "Boundary script: I cannot solve this tonight, but I can revisit it tomorrow.",
];

export default function SupportGroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    Promise.all([
      api(`/support-groups/${groupId}`),
      api(`/support-groups/${groupId}/members`),
      api(`/support-groups/${groupId}/meetings`),
      api(`/support-groups/${groupId}/messages`),
    ])
      .then(([groupData, membersData, meetingsData, messagesData]) => {
        setGroup(groupData.group);
        setMembers(membersData.members || []);
        setMeetings(meetingsData.meetings || []);
        setMessages(messagesData.messages || []);
      })
      .catch((err) => setError(err.message));
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (event) => {
    event.preventDefault();
    const data = await api(`/support-groups/${groupId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: message, messageType: "text" }),
    });
    setMessages((current) => [...current, data.message]);
    setMessage("");
  };

  if (error) return <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</div>;
  if (!group) return <div className="h-96 animate-pulse rounded-lg bg-white/70 shadow-soft" />;

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black">{group.name}</h1>
              <StatusBadge tone={group.status}>{group.status}</StatusBadge>
              <ReportButton targetType="support_group" targetId={group._id} label="Report support group" />
            </div>
            <p className="mt-2 max-w-3xl text-bean-muted">{group.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">{asArray(group.tags).map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
          </div>
          <div className="rounded-lg bg-bean-mist p-3 text-sm font-semibold text-bean-teal">
            {members.length} members · {group.groupType?.replace("_", " ")}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <aside className="space-y-4">
          <section className="rounded-lg bg-white/85 p-5 shadow-soft">
            <h2 className="text-lg font-black">Members</h2>
            <div className="mt-3 space-y-2">
              {members.map((member) => (
                <div key={member._id} className="rounded-md bg-bean-mist/70 p-3 text-sm">
                  <p className="font-bold">{member.user?.name || member.name}</p>
                  <p className="text-bean-muted">{member.role}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="rounded-lg bg-white/85 p-5 shadow-soft">
          <div className="flex flex-wrap gap-2 border-b border-bean-sage/20 pb-3">
            <Tab active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageSquareHeart}>Chat</Tab>
            <Tab active={tab === "prompts"} onClick={() => setTab("prompts")} icon={Sparkles}>Prompts</Tab>
            <Tab active={tab === "resources"} onClick={() => setTab("resources")} icon={FileText}>Resources</Tab>
            <Tab active={tab === "events"} onClick={() => setTab("events")} icon={CalendarDays}>Events</Tab>
          </div>

          {tab === "chat" && (
            <div className="mt-4">
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {messages.length ? messages.map((item) => (
                  <div key={item._id} className="rounded-lg bg-bean-mist/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-bold text-bean-teal">{item.sender?.name || "Member"}</p>
                      <ReportButton targetType="support_group_message" targetId={item._id} label="Report message" />
                    </div>
                    <p className="mt-1 text-sm text-bean-ink">{item.content}</p>
                  </div>
                )) : <EmptyState title="No messages yet">Start the circle gently.</EmptyState>}
              </div>
              <form onSubmit={send} className="mt-4 flex gap-2">
                <input className="field" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write to the circle" required />
                <Button type="submit">Send</Button>
              </form>
            </div>
          )}

          {tab === "prompts" && <ListItems items={prompts} />}
          {tab === "resources" && <ListItems items={resources} />}
          {tab === "events" && (
            <div className="mt-4 space-y-3">
              {meetings.length ? meetings.map((meeting) => (
                <article key={meeting._id} className="rounded-lg bg-bean-mist/70 p-4">
                  <h3 className="font-black">{meeting.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-bean-teal">{formatDateTime(meeting.startsAt)}</p>
                  <p className="mt-2 text-sm text-bean-muted">{meeting.description}</p>
                </article>
              )) : <EmptyState title="No events yet">Group meetings will show here once scheduled.</EmptyState>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, children }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${active ? "bg-bean-teal text-white" : "bg-bean-mist text-bean-teal"}`}>
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function ListItems({ items }) {
  return (
    <div className="mt-4 grid gap-3">
      {items.map((item) => <div key={item} className="rounded-lg bg-bean-mist/70 p-4 text-sm font-medium text-bean-ink">{item}</div>)}
    </div>
  );
}
