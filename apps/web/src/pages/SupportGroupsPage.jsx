import { Plus, Search, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Tag from "../components/Tag.jsx";
import { asArray } from "../utils/format.js";

export default function SupportGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState({ tags: "", language: "", groupType: "" });
  const [matchTags, setMatchTags] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeGroupId, setActiveGroupId] = useState("");
  const [joiningId, setJoiningId] = useState("");

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.tags) params.set("tags", filters.tags);
    if (filters.language) params.set("language", filters.language);
    if (filters.groupType) params.set("groupType", filters.groupType);
    const groupsRequest = api(`/support-groups${params.toString() ? `?${params}` : ""}`);
    const homeRequest = user?.role === "beaner" ? api("/users/home") : Promise.resolve(null);

    Promise.all([groupsRequest, homeRequest])
      .then(([groupsData, homeData]) => {
        setGroups(groupsData.groups || []);
        setActiveGroupId(homeData?.supportGroup?.group?._id || "");
      })
      .catch((err) => setError(err.message));
  }, [filters, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  const match = async () => {
    setMessage("");
    try {
      const data = await api("/support-groups/match", {
        method: "POST",
        body: JSON.stringify({
          tags: matchTags.split(",").map((tag) => tag.trim()).filter(Boolean),
          preferredGroupType: "any",
        }),
      });
      setMessage(data.group ? `Matched with ${data.group.name}` : "Added to waitlist. A circle will form when enough matching members are ready.");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const canCreate = user?.role === "beanpist" && user?.therapistProfile?.verificationStatus === "verified";

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-bean-teal">Explore Support Groups</p>
            <h1 className="mt-2 text-3xl font-black">Small groups with structure</h1>
            <p className="mt-2 max-w-3xl text-bean-muted">Join manually or let matching place you into a circle based on tags and preferences.</p>
          </div>
          {canCreate && <CreateGroupButton onCreated={load} />}
        </div>
      </section>

      <section className="grid gap-4 rounded-lg bg-white/85 p-5 shadow-soft lg:grid-cols-[1fr_auto]">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="field" placeholder="tags: anxiety, stress" value={filters.tags} onChange={(e) => setFilters({ ...filters, tags: e.target.value })} />
          <input className="field" placeholder="language" value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })} />
          <select className="field" value={filters.groupType} onChange={(e) => setFilters({ ...filters, groupType: e.target.value })}>
            <option value="">Any type</option>
            <option value="peer_led">Peer led</option>
            <option value="therapist_led">Therapist led</option>
          </select>
        </div>
        <Button onClick={load}><Search className="h-4 w-4" />Filter</Button>
      </section>

      <section className="rounded-lg bg-white/85 p-5 shadow-soft">
        <h2 className="text-xl font-black">Auto-match</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input className="field" placeholder="anxiety, loneliness, sleep" value={matchTags} onChange={(e) => setMatchTags(e.target.value)} />
          <Button onClick={match}>Find my circle</Button>
        </div>
        {message && <p className="mt-3 rounded-md bg-bean-mist px-3 py-2 text-sm font-semibold text-bean-teal">{message}</p>}
      </section>

      {error && <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.length ? groups.map((group) => (
          <GroupCard
            key={group._id}
            group={group}
            activeGroupId={activeGroupId}
            joining={joiningId === group._id}
            setJoiningId={setJoiningId}
            setMessage={setMessage}
            onJoined={load}
          />
        )) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState title="No matching groups">Try fewer filters or use auto-match to join the waitlist.</EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}

function GroupCard({ group, activeGroupId, joining, setJoiningId, setMessage, onJoined }) {
  const isCurrentGroup = activeGroupId === group._id;
  const hasAnotherActiveGroup = Boolean(activeGroupId) && !isCurrentGroup;

  const join = async () => {
    if (isCurrentGroup) {
      setMessage("You are already part of this support group.");
      return;
    }

    if (hasAnotherActiveGroup) {
      setMessage("You are already part of a support group. Leave your current circle before joining another one.");
      return;
    }

    setJoiningId(group._id);
    setMessage("");
    try {
      await api(`/support-groups/${group._id}/join`, { method: "POST" });
      setMessage(`Joined ${group.name}.`);
      onJoined();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setJoiningId("");
    }
  };

  return (
    <article className="rounded-lg bg-white/90 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <UsersRound className="h-5 w-5 text-bean-teal" />
          <Link to={`/support-groups/${group._id}`} className="mt-3 block text-xl font-black hover:text-bean-teal">{group.name}</Link>
        </div>
        <StatusBadge tone={group.status}>{group.status}</StatusBadge>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-bean-muted">{group.description}</p>
      <p className="mt-3 text-sm font-semibold text-bean-muted">{group.currentMemberCount || 0}/{group.capacity || 8} members · {group.language || "Any language"}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {asArray(group.tags).slice(0, 4).map((tag) => <Tag key={tag}>{tag}</Tag>)}
      </div>
      <div className="mt-4 flex gap-2">
        {isCurrentGroup ? (
          <span className="inline-flex min-h-10 items-center rounded-md bg-emerald-50 px-3 text-sm font-bold text-emerald-700">
            Your group
          </span>
        ) : hasAnotherActiveGroup ? (
          <Button variant="secondary" onClick={join}>Already in a circle</Button>
        ) : (
          <Button variant="secondary" onClick={join} disabled={joining}>
            {joining ? "Joining..." : "Join"}
          </Button>
        )}
        <Link className="btn-subtle" to={`/support-groups/${group._id}`}>View</Link>
      </div>
    </article>
  );
}

function CreateGroupButton({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", tags: "", language: "English", groupType: "therapist_led", capacity: 8 });

  const submit = async (event) => {
    event.preventDefault();
    await api("/support-groups", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        capacity: Number(form.capacity),
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      }),
    });
    setOpen(false);
    onCreated();
  };

  if (!open) return <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New circle</Button>;

  return (
    <form onSubmit={submit} className="grid min-w-72 gap-2 rounded-lg bg-bean-mist p-3">
      <input className="field" placeholder="Group name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className="field" placeholder="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} required />
      <input className="field" placeholder="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
      <textarea className="field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="flex gap-2">
        <Button type="submit">Create</Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
