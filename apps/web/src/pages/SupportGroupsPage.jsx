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

const SUPPORT_TAGS = [
  "anxiety",
  "stress",
  "loneliness",
  "grief",
  "relationship",
  "burnout",
  "sleep",
  "panic",
  "overthinking",
  "heartbreak",
  "conflict",
  "work",
  "exam-stress",
  "night-panic",
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Kannada",
  "Malayalam",
  "Gujarati",
  "Punjabi",
];

export default function SupportGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState({ tags: [], language: "", groupType: "" });
  const [matchTags, setMatchTags] = useState([]);
  const [matchLanguage, setMatchLanguage] = useState("");
  const [matchGroupType, setMatchGroupType] = useState("any");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeGroupId, setActiveGroupId] = useState("");
  const [activeGroup, setActiveGroup] = useState(null);
  const [waitlistStatus, setWaitlistStatus] = useState(null);
  const [joiningId, setJoiningId] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [cancellingWaitlist, setCancellingWaitlist] = useState(false);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.tags.length) params.set("tags", filters.tags.join(","));
    if (filters.language) params.set("language", filters.language);
    if (filters.groupType) params.set("groupType", filters.groupType);
    const groupsRequest = api(`/support-groups${params.toString() ? `?${params}` : ""}`);
    const homeRequest = user?.role === "beaner" ? api("/users/home") : Promise.resolve(null);

    Promise.all([groupsRequest, homeRequest])
      .then(([groupsData, homeData]) => {
        setGroups(groupsData.groups || []);
        setActiveGroupId(homeData?.supportGroup?.group?._id || "");
        setActiveGroup(homeData?.supportGroup?.group || null);
        setWaitlistStatus(homeData?.waitlistStatus || null);
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
          tags: matchTags,
          language: matchLanguage,
          preferredGroupType: matchGroupType,
        }),
      });
      setMessage(data.group ? `Matched with ${data.group.name}` : "Added to waitlist. A circle will form when enough matching members are ready.");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const leaveCurrentGroup = async () => {
    if (!activeGroup?._id) return;
    setLeaving(true);
    setMessage("");
    try {
      const data = await api(`/support-groups/${activeGroup._id}/leave`, { method: "POST" });
      setMessage(
        data.filledFromWaitlist
          ? "You left your circle. The open spot was offered to someone on the waitlist."
          : "You left your current support circle."
      );
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLeaving(false);
    }
  };

  const cancelWaitlist = async () => {
    setCancellingWaitlist(true);
    setMessage("");
    try {
      await api("/support-groups/waitlist/cancel", { method: "POST" });
      setMessage("Your support circle waitlist request was cancelled.");
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setCancellingWaitlist(false);
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

      <section className="rounded-lg bg-white/85 p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Filter circles</h2>
          <Button onClick={load}><Search className="h-4 w-4" />Filter</Button>
        </div>
        <div className="mt-4 grid gap-4">
          <ChipChecklist
            label="Tags"
            options={SUPPORT_TAGS}
            selected={filters.tags}
            onToggle={(value) => setFilters((current) => ({ ...current, tags: toggleValue(current.tags, value) }))}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select className="field" value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })}>
              <option value="">Any language</option>
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
            <select className="field" value={filters.groupType} onChange={(e) => setFilters({ ...filters, groupType: e.target.value })}>
              <option value="">Any type</option>
              <option value="peer_led">Peer led</option>
              <option value="therapist_led">Therapist led</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white/85 p-5 shadow-soft">
        <h2 className="text-xl font-black">Auto-match</h2>
        {activeGroup && (
          <div className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="font-bold">You are currently in {activeGroup.name}.</p>
            <p className="mt-1">Leave this circle before joining or matching into another one.</p>
            <Button type="button" variant="secondary" onClick={leaveCurrentGroup} disabled={leaving} className="mt-3">
              {leaving ? "Leaving..." : "Leave current circle"}
            </Button>
          </div>
        )}
        {!activeGroup && waitlistStatus && (
          <div className="mt-3 rounded-md bg-bean-mist p-3 text-sm text-bean-teal">
            <p className="font-bold">You are on the support circle waitlist.</p>
            <p className="mt-1">
              Waiting for a circle matching {asArray(waitlistStatus.tags).join(", ") || "your preferences"}.
            </p>
            <Button type="button" variant="secondary" onClick={cancelWaitlist} disabled={cancellingWaitlist} className="mt-3">
              {cancellingWaitlist ? "Cancelling..." : "Cancel waitlist request"}
            </Button>
          </div>
        )}
        <div className="mt-4 grid gap-4">
          <ChipChecklist
            label="What should your circle understand?"
            options={SUPPORT_TAGS}
            selected={matchTags}
            onToggle={(value) => setMatchTags((current) => toggleValue(current, value))}
          />
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select className="field" value={matchLanguage} onChange={(event) => setMatchLanguage(event.target.value)}>
              <option value="">Any language</option>
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
            <select className="field" value={matchGroupType} onChange={(event) => setMatchGroupType(event.target.value)}>
              <option value="any">Any type</option>
              <option value="peer_led">Peer led</option>
              <option value="therapist_led">Therapist led</option>
            </select>
            <Button onClick={match} disabled={Boolean(activeGroup) || matchTags.length === 0}>
              Find my circle
            </Button>
          </div>
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
  const [form, setForm] = useState({ name: "", description: "", tags: [], language: "English", groupType: "therapist_led", capacity: 8 });

  const submit = async (event) => {
    event.preventDefault();
    await api("/support-groups", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        capacity: Number(form.capacity),
      }),
    });
    setOpen(false);
    onCreated();
  };

  if (!open) return <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New circle</Button>;

  return (
    <form onSubmit={submit} className="grid min-w-72 gap-2 rounded-lg bg-bean-mist p-3">
      <input className="field" placeholder="Group name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <ChipChecklist
        label="Tags"
        options={SUPPORT_TAGS}
        selected={form.tags}
        onToggle={(value) => setForm((current) => ({ ...current, tags: toggleValue(current.tags, value) }))}
      />
      <select className="field" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
        {LANGUAGES.map((language) => (
          <option key={language} value={language}>{language}</option>
        ))}
      </select>
      <textarea className="field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="flex gap-2">
        <Button type="submit" disabled={form.tags.length === 0}>Create</Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

function ChipChecklist({ label, options, selected, onToggle }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-bean-ink">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3 py-1.5 text-sm font-bold transition ${
                active
                  ? "border-bean-teal bg-bean-teal text-white"
                  : "border-bean-sage/40 bg-white text-bean-teal hover:bg-bean-mist"
              }`}
              aria-pressed={active}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function toggleValue(values, value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
