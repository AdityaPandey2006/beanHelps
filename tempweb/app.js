const apiBase = "http://localhost:5000/api";
const keys = {
  token: "beanhelps_token",
  user: "beanhelps_user",
  selectedForums: "beanhelps_selected_forums",
};

const state = {
  screen: "auth",
  authMode: "login",
  page: "forums",
  token: localStorage.getItem(keys.token),
  user: readJson(keys.user),
  forums: [],
  groups: [],
  selectedForumIds: readJson(keys.selectedForums) || [],
  activeForum: null,
  activeGroup: null,
  posts: [],
  meetings: [],
  comments: [],
  groupMessages: [],
  groupMembers: [],
  toast: "",
  error: "",
  modal: null,
};

const app = document.querySelector("#app");

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitList(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function formToObject(form) {
  const data = {};
  const arrays = new Set(["languages", "primaryStruggles", "optionalTags", "specializations", "tags"]);
  const numbers = new Set(["capacity", "minimumStartSize"]);

  new FormData(form).forEach((value, key) => {
    const text = String(value).trim();
    if (arrays.has(key)) data[key] = splitList(text);
    else if (numbers.has(key)) {
      if (text) data[key] = Number(text);
    } else if (text) data[key] = text;
  });

  return data;
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Request failed");
  return payload;
}

async function run(action, successMessage) {
  state.error = "";
  state.toast = "";
  try {
    const result = await action();
    if (successMessage) state.toast = successMessage;
    render();
    return result;
  } catch (error) {
    state.error = error.message;
    render();
    return null;
  }
}

function saveSession(data) {
  if (data.token) {
    state.token = data.token;
    localStorage.setItem(keys.token, data.token);
  }
  if (data.user) {
    state.user = data.user;
    localStorage.setItem(keys.user, JSON.stringify(data.user));
  }
}

function clearSession() {
  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.user);
  localStorage.removeItem(keys.selectedForums);
  Object.assign(state, {
    screen: "auth",
    page: "forums",
    token: null,
    user: null,
    selectedForumIds: [],
    activeForum: null,
    activeGroup: null,
  });
  render();
}

function needsOnboarding() {
  if (!state.user) return false;
  if (state.user.role === "beaner") return !state.user.onboardingProfile?.completedAt;
  if (state.user.role === "beanpist") return !state.user.therapistProfile?.licenseOrCertificateUrl;
  return false;
}

function selectedForums() {
  if (state.user?.role === "beanpist") return state.forums;
  return state.forums.filter((forum) => state.selectedForumIds.includes(forum._id));
}

async function boot() {
  await loadForums(false);

  if (state.token) {
    await run(async () => {
      const result = await api("/auth/me");
      saveSession({ user: result.data.user });
    });
  }

  if (!state.user) state.screen = "auth";
  else if (needsOnboarding()) state.screen = "onboarding";
  else if (state.user.role === "beaner" && state.selectedForumIds.length === 0) state.screen = "forum-picker";
  else state.screen = "app";

  if (state.user?.role === "beanpist") saveAllForumsForTherapist();
  render();
}

async function loadForums(shouldRender = true) {
  const result = await api("/forums").catch(() => null);
  state.forums = result?.data?.forums || [];
  if (state.user?.role === "beanpist") saveAllForumsForTherapist();
  if (shouldRender) render();
}

function saveAllForumsForTherapist() {
  state.selectedForumIds = state.forums.map((forum) => forum._id);
  localStorage.setItem(keys.selectedForums, JSON.stringify(state.selectedForumIds));
}

async function loadGroups(filters = {}) {
  const params = new URLSearchParams();
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.groupType) params.set("groupType", filters.groupType);
  const result = await api(`/support-groups?${params.toString()}`);
  state.groups = result.data.groups;
}

function statusHtml() {
  return `${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}${state.toast ? `<p class="success">${escapeHtml(state.toast)}</p>` : ""}`;
}

function authView() {
  const isLogin = state.authMode === "login";
  return `
    <main class="auth-shell">
      <section class="intro">
        <p class="eyebrow">Open Innovation Demo</p>
        <h1>beanHelps</h1>
        <p>A structured peer-support platform for forums, smaller support circles, therapist participation, chat, and support meetings.</p>
      </section>
      <section class="auth-panel">
        <div>
          <p class="eyebrow">Welcome</p>
          <h2>${isLogin ? "Log in" : "Create account"}</h2>
        </div>
        ${statusHtml()}
        <div class="tabs">
          <button class="${isLogin ? "active" : ""}" data-auth-mode="login">Login</button>
          <button class="${!isLogin ? "active" : ""}" data-auth-mode="signup">Signup</button>
        </div>
        <form class="form" id="${isLogin ? "loginForm" : "signupForm"}">
          ${isLogin ? "" : `
            <input name="name" placeholder="Name" value="Demo Beaner" required />
            <select name="role">
              <option value="beaner">I am a beaner</option>
              <option value="beanpist">I am a beanpist</option>
            </select>
          `}
          <input name="email" placeholder="Email" value="beaner@example.com" required />
          <input name="password" type="password" placeholder="Password" value="password123" required />
          <button>${isLogin ? "Login" : "Signup"}</button>
        </form>
      </section>
    </main>
  `;
}

function onboardingView() {
  const therapist = state.user?.role === "beanpist";
  return `
    <main class="auth-shell">
      <section class="intro">
        <p class="eyebrow">${therapist ? "Beanpist setup" : "Beaner setup"}</p>
        <h1>${therapist ? "Tell us how you can help" : "Find your support path"}</h1>
        <p>${therapist ? "Add specializations, languages, availability, and certificate details before entering the demo app." : "Share your struggles and preferences so beanHelps can guide you toward relevant forums and support circles."}</p>
      </section>
      <section class="auth-panel">
        <div>
          <p class="eyebrow">Onboarding</p>
          <h2>${therapist ? "Therapist profile" : "Support preferences"}</h2>
        </div>
        ${statusHtml()}
        ${therapist ? `
          <form class="form" id="therapistProfileForm">
            <input name="specializations" placeholder="Specializations" value="anxiety,stress management" required />
            <input name="languages" placeholder="Languages" value="English,Hindi" required />
            <input name="experience" placeholder="Experience" value="3 years supporting young adults" required />
            <input name="availability" placeholder="Availability" value="Weekends, 6 PM to 8 PM" required />
            <input name="licenseOrCertificateUrl" placeholder="Certificate URL" value="https://example.com/certificate.pdf" required />
            <button>Continue</button>
          </form>
        ` : `
          <form class="form" id="beanerOnboardingForm">
            <div class="field-row">
              <input name="ageRange" placeholder="Age range" value="18-24" required />
              <input name="location" placeholder="Location" value="Delhi" required />
            </div>
            <input name="languages" placeholder="Languages" value="English,Hindi" required />
            <input name="preferredGroupSize" placeholder="Preferred group size" value="6-8" required />
            <input name="primaryStruggles" placeholder="Primary struggles" value="anxiety,stress" required />
            <input name="optionalTags" placeholder="Optional tags" value="exam stress,loneliness" />
            <textarea name="description">Feeling overwhelmed and looking for a small support circle.</textarea>
            <button>Continue</button>
          </form>
        `}
      </section>
    </main>
  `;
}

function forumPickerView() {
  return `
    <main class="content">
      <div class="page-head">
        <div>
          <p class="eyebrow">Choose Forums</p>
          <h1>Pick communities to follow</h1>
          <p>This temp frontend stores forum choices locally. The backend currently exposes forum listing, discussions, comments, and meetings.</p>
        </div>
        <button class="secondary" data-action="logout">Logout</button>
      </div>
      ${statusHtml()}
      <section class="grid">${state.forums.map((forum) => forumCard(forum, true)).join("")}</section>
      <section class="panel" style="margin-top:16px"><button data-action="finish-forum-picker">Continue to Home</button></section>
    </main>
  `;
}

function appView() {
  return `
    <main class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <p class="eyebrow">beanHelps</p>
          <strong>${state.user.role === "beanpist" ? "Beanpist" : "Beaner"} Demo</strong>
        </div>
        <nav class="nav">
          ${navButton("forums", "Forums")}
          ${navButton("support", "Support Groups")}
          ${navButton("profile", "Profile")}
        </nav>
        <div class="profile-card">
          <strong>${escapeHtml(state.user.name)}</strong>
          <span>${escapeHtml(state.user.email)}</span>
          <span class="chip">${escapeHtml(state.user.role)}</span>
          <button class="secondary" data-action="logout">Logout</button>
        </div>
      </aside>
      <section class="content">
        ${statusHtml()}
        ${state.page === "forums" ? forumsPage() : ""}
        ${state.page === "support" ? supportPage() : ""}
        ${state.page === "profile" ? profilePage() : ""}
      </section>
      ${state.modal ? modalView() : ""}
    </main>
  `;
}

function navButton(page, label) {
  return `<button class="${state.page === page ? "active" : ""}" data-page="${page}">${label}</button>`;
}

function forumsPage() {
  const forums = selectedForums();
  return `
    <div class="page-head">
      <div>
        <p class="eyebrow">Forum Home</p>
        <h1>Your forums</h1>
        <p>${state.user.role === "beanpist" ? "Beanpists are shown all forums automatically for demo purposes." : "These are the forums selected after onboarding."}</p>
      </div>
      <button class="secondary" data-action="refresh-forums">Refresh</button>
    </div>
    <section class="grid">${forums.map((forum) => forumCard(forum, false)).join("") || emptyCard("No forums selected yet.")}</section>
    ${state.activeForum ? `<section class="grid two" style="margin-top:16px">${forumDiscussionPanel()}${forumMeetingsPanel()}</section>` : ""}
  `;
}

function forumCard(forum, picker) {
  const selected = state.selectedForumIds.includes(forum._id) || state.user?.role === "beanpist";
  return `
    <article class="card">
      <div class="item-head">
        <h3>${escapeHtml(forum.name)}</h3>
        ${picker ? `<input type="checkbox" data-forum-toggle="${forum._id}" ${selected ? "checked" : ""} />` : ""}
      </div>
      <p>${escapeHtml(forum.description)}</p>
      <div class="chips">${(forum.tags || []).slice(0, 4).map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}</div>
      ${picker ? "" : `<button data-open-forum="${forum._id}">Open Forum</button>`}
    </article>
  `;
}

function forumDiscussionPanel() {
  return `
    <section class="panel">
      <div class="page-head">
        <div><p class="eyebrow">Discussion</p><h2>${escapeHtml(state.activeForum.name)}</h2></div>
        <button data-action="new-post">New Post</button>
      </div>
      <div class="list">
        ${state.posts.map((post) => `
          <article class="item">
            <div class="item-head"><strong>${escapeHtml(post.title)}</strong><span class="meta">${escapeHtml(post.type)}</span></div>
            <p>${escapeHtml(post.content)}</p>
            <button class="secondary" data-open-comments="${post._id}">Comments</button>
          </article>
        `).join("") || emptyLine("No posts yet.")}
      </div>
    </section>
  `;
}

function forumMeetingsPanel() {
  return `
    <section class="panel">
      <div class="page-head">
        <div><p class="eyebrow">Forum Meetings</p><h2>Webinars and sessions</h2></div>
        ${state.user.role === "beanpist" ? `<button data-action="new-forum-meeting">Schedule</button>` : ""}
      </div>
      <div class="list">${state.meetings.map(meetingItem).join("") || emptyLine("No upcoming forum meetings.")}</div>
    </section>
  `;
}

function supportPage() {
  return `
    <div class="page-head">
      <div>
        <p class="eyebrow">Support Circles</p>
        <h1>Find or manage support groups</h1>
        <p>Groups are separate from forums and use tags for discovery and matching.</p>
      </div>
      <div class="field-row">
        ${state.user.role === "beaner" ? `<button data-action="smart-match">Smart Match</button>` : ""}
        ${state.user.role === "beanpist" ? `<button data-action="new-group">Create Group</button>` : ""}
      </div>
    </div>
    <section class="panel">
      <form class="toolbar" id="groupFilterForm">
        <input name="tags" placeholder="Filter tags, e.g. anxiety,stress" />
        <select name="groupType">
          <option value="">All types</option>
          <option value="peer_led">Peer led</option>
          <option value="therapist_led">Therapist led</option>
        </select>
        <button>Filter</button>
      </form>
    </section>
    <section class="grid" style="margin-top:16px">${state.groups.map(groupCard).join("") || emptyCard("No support groups loaded yet.")}</section>
    ${state.activeGroup ? `<section class="grid two" style="margin-top:16px">${groupChatPanel()}${groupDetailsPanel()}</section>` : ""}
  `;
}

function groupCard(group) {
  return `
    <article class="card">
      <div class="item-head"><h3>${escapeHtml(group.name)}</h3><span class="meta">${escapeHtml(group.status)}</span></div>
      <p>${escapeHtml(group.description || "No description yet.")}</p>
      <div class="chips">${(group.tags || []).map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}</div>
      <span>${group.currentMemberCount}/${group.capacity} members</span>
      <div class="field-row">
        <button data-open-group="${group._id}">Open</button>
        ${state.user.role === "beaner" ? `<button class="secondary" data-join-group="${group._id}">Join</button>` : ""}
      </div>
    </article>
  `;
}

function groupChatPanel() {
  return `
    <section class="panel">
      <div><p class="eyebrow">Group Chat</p><h2>${escapeHtml(state.activeGroup.name)}</h2></div>
      <div class="chat-box">
        ${state.groupMessages.map((message) => `<div class="message"><strong>${escapeHtml(message.sender?.name || "Member")}</strong><p>${escapeHtml(message.content)}</p></div>`).join("") || emptyLine("No messages loaded, or you are not a member yet.")}
      </div>
      <form class="form" id="messageForm">
        <textarea name="content">Today was heavy, but I am glad this group exists.</textarea>
        <button>Send Message</button>
      </form>
    </section>
  `;
}

function groupDetailsPanel() {
  return `
    <section class="panel">
      <div class="page-head">
        <div><p class="eyebrow">Members and Events</p><h2>Support circle details</h2></div>
        <button data-action="new-group-meeting">Schedule</button>
      </div>
      <div class="list"><strong>Members</strong>${state.groupMembers.map((member) => `<div class="item">${escapeHtml(member.user?.name)} · ${escapeHtml(member.role)}</div>`).join("") || emptyLine("No members loaded.")}</div>
      <div class="list"><strong>Meetings</strong>${state.meetings.map(meetingItem).join("") || emptyLine("No upcoming group meetings.")}</div>
    </section>
  `;
}

function profilePage() {
  return `
    <div class="page-head">
      <div><p class="eyebrow">Profile</p><h1>${escapeHtml(state.user.name)}</h1><p>${escapeHtml(state.user.email)} · ${escapeHtml(state.user.role)}</p></div>
    </div>
    <section class="grid two">
      <article class="panel"><h2>Beaner onboarding</h2><pre>${escapeHtml(JSON.stringify(state.user.onboardingProfile || {}, null, 2))}</pre></article>
      <article class="panel"><h2>Beanpist profile</h2><pre>${escapeHtml(JSON.stringify(state.user.therapistProfile || {}, null, 2))}</pre></article>
    </section>
  `;
}

function modalView() {
  return `
    <div class="modal-backdrop">
      <section class="modal">
        <div class="modal-head"><h2>${escapeHtml(state.modal.title)}</h2><button class="secondary" data-action="close-modal">Close</button></div>
        ${state.modal.body}
      </section>
    </div>
  `;
}

function meetingItem(meeting) {
  return `
    <article class="item">
      <div class="item-head"><strong>${escapeHtml(meeting.title)}</strong><span class="meta">${escapeHtml(meeting.mode)}</span></div>
      <p>${escapeHtml(meeting.description || "")}</p>
      <span>${new Date(meeting.startsAt).toLocaleString()}</span>
    </article>
  `;
}

function emptyCard(message) { return `<article class="card"><p>${escapeHtml(message)}</p></article>`; }
function emptyLine(message) { return `<p>${escapeHtml(message)}</p>`; }

function render() {
  if (state.screen === "auth") app.innerHTML = authView();
  if (state.screen === "onboarding") app.innerHTML = onboardingView();
  if (state.screen === "forum-picker") app.innerHTML = forumPickerView();
  if (state.screen === "app") app.innerHTML = appView();
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.authMode = button.dataset.authMode;
      render();
    });
  });

  document.querySelector("#loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      const result = await api("/auth/login", { method: "POST", body: JSON.stringify(formToObject(event.currentTarget)) });
      saveSession(result.data);
      if (state.user.role === "beanpist") saveAllForumsForTherapist();
      state.screen = needsOnboarding() ? "onboarding" : (state.user.role === "beaner" && state.selectedForumIds.length === 0 ? "forum-picker" : "app");
    }, "Logged in");
  });

  document.querySelector("#signupForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      const result = await api("/auth/signup", { method: "POST", body: JSON.stringify(formToObject(event.currentTarget)) });
      saveSession(result.data);
      state.screen = "onboarding";
    }, "Account created");
  });

  document.querySelector("#beanerOnboardingForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      const result = await api("/users/onboarding", { method: "PATCH", body: JSON.stringify(formToObject(event.currentTarget)) });
      saveSession({ user: result.data.user });
      state.screen = "forum-picker";
    }, "Onboarding saved");
  });

  document.querySelector("#therapistProfileForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      const result = await api("/therapists/profile", { method: "PATCH", body: JSON.stringify(formToObject(event.currentTarget)) });
      saveSession({ user: result.data.user });
      saveAllForumsForTherapist();
      state.screen = "app";
    }, "Therapist profile saved");
  });

  document.querySelectorAll("[data-forum-toggle]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.dataset.forumToggle;
      state.selectedForumIds = input.checked ? [...new Set([...state.selectedForumIds, id])] : state.selectedForumIds.filter((forumId) => forumId !== id);
      localStorage.setItem(keys.selectedForums, JSON.stringify(state.selectedForumIds));
    });
  });

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.page = button.dataset.page;
      if (state.page === "support" && state.groups.length === 0) await run(() => loadGroups(), "Support groups loaded");
      else render();
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });

  document.querySelectorAll("[data-open-forum]").forEach((button) => {
    button.addEventListener("click", () => openForum(button.dataset.openForum));
  });

  document.querySelectorAll("[data-open-group]").forEach((button) => {
    button.addEventListener("click", () => openGroup(button.dataset.openGroup));
  });

  document.querySelectorAll("[data-join-group]").forEach((button) => {
    button.addEventListener("click", () => joinGroup(button.dataset.joinGroup));
  });

  document.querySelectorAll("[data-open-comments]").forEach((button) => {
    button.addEventListener("click", () => openComments(button.dataset.openComments));
  });

  document.querySelector("#groupFilterForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(() => loadGroups(formToObject(event.currentTarget)), "Support groups filtered");
  });

  document.querySelector("#messageForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      await api(`/support-groups/${state.activeGroup._id}/messages`, { method: "POST", body: JSON.stringify(formToObject(event.currentTarget)) });
      await openGroup(state.activeGroup._id, false);
    }, "Message sent");
  });
}

async function handleAction(action) {
  if (action === "logout") clearSession();
  if (action === "finish-forum-picker") {
    if (state.selectedForumIds.length === 0) state.error = "Choose at least one forum to continue.";
    else {
      state.error = "";
      state.screen = "app";
    }
    render();
  }
  if (action === "refresh-forums") await run(() => loadForums(), "Forums refreshed");
  if (action === "close-modal") {
    state.modal = null;
    render();
  }
  if (action === "new-post") showPostModal();
  if (action === "new-forum-meeting") showForumMeetingModal();
  if (action === "smart-match") showSmartMatchModal();
  if (action === "new-group") showGroupModal();
  if (action === "new-group-meeting") showGroupMeetingModal();
}

async function openForum(forumId) {
  await run(async () => {
    state.activeForum = state.forums.find((forum) => forum._id === forumId);
    const posts = await api(`/forums/${forumId}/posts`);
    const meetings = await api(`/forums/${forumId}/meetings`);
    state.posts = posts.data.posts;
    state.meetings = meetings.data.meetings;
  }, "Forum opened");
}

async function openGroup(groupId, shouldRender = true) {
  const operation = async () => {
    const group = await api(`/support-groups/${groupId}`);
    state.activeGroup = group.data.group;
    const members = await api(`/support-groups/${groupId}/members`).catch(() => ({ data: { members: [] } }));
    const messages = await api(`/support-groups/${groupId}/messages`).catch(() => ({ data: { messages: [] } }));
    const meetings = await api(`/support-groups/${groupId}/meetings`).catch(() => ({ data: { meetings: [] } }));
    state.groupMembers = members.data.members;
    state.groupMessages = messages.data.messages;
    state.meetings = meetings.data.meetings;
  };
  if (shouldRender) await run(operation, "Support group opened");
  else await operation();
}

async function joinGroup(groupId) {
  await run(async () => {
    await api(`/support-groups/${groupId}/join`, { method: "POST" });
    await loadGroups();
  }, "Joined support group");
}

async function openComments(postId) {
  const result = await run(() => api(`/forums/posts/${postId}/comments`));
  if (!result) return;
  state.comments = result.data.comments;
  state.modal = {
    title: "Comments",
    body: `
      <div class="list">${state.comments.map((comment) => `<article class="item"><strong>${escapeHtml(comment.author?.name || "Member")}</strong><p>${escapeHtml(comment.content)}</p></article>`).join("") || emptyLine("No comments yet.")}</div>
      <form class="form" id="commentCreateForm"><textarea name="content">Thank you for sharing this.</textarea><button>Add Comment</button></form>
    `,
  };
  render();
  document.querySelector("#commentCreateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      await api(`/forums/posts/${postId}/comments`, { method: "POST", body: JSON.stringify(formToObject(event.currentTarget)) });
      state.modal = null;
      await openForum(state.activeForum._id);
    }, "Comment added");
  });
}

function showPostModal() {
  state.modal = {
    title: "Create forum post",
    body: `
      <form class="form" id="postCreateForm">
        <input name="title" value="How do support circles work?" required />
        <textarea name="content">I am new here and want to understand how to join a circle.</textarea>
        <select name="type"><option value="thread">thread</option><option value="question">question</option><option value="therapist_article">therapist_article</option><option value="resource">resource</option></select>
        <input name="tags" value="anxiety,beginner" />
        <button>Create Post</button>
      </form>
    `,
  };
  render();
  document.querySelector("#postCreateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      await api(`/forums/${state.activeForum._id}/posts`, { method: "POST", body: JSON.stringify(formToObject(event.currentTarget)) });
      state.modal = null;
      await openForum(state.activeForum._id);
    }, "Post created");
  });
}

function showForumMeetingModal() {
  state.modal = { title: "Schedule forum meeting", body: meetingFormHtml("forumMeetingCreateForm", true) };
  render();
  document.querySelector("#forumMeetingCreateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      await api(`/forums/${state.activeForum._id}/meetings`, { method: "POST", body: JSON.stringify(formToObject(event.currentTarget)) });
      state.modal = null;
      await openForum(state.activeForum._id);
    }, "Forum meeting scheduled");
  });
}

function showGroupMeetingModal() {
  state.modal = { title: "Schedule group meeting", body: meetingFormHtml("groupMeetingCreateForm", false) };
  render();
  document.querySelector("#groupMeetingCreateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      await api(`/support-groups/${state.activeGroup._id}/meetings`, { method: "POST", body: JSON.stringify(formToObject(event.currentTarget)) });
      state.modal = null;
      await openGroup(state.activeGroup._id);
    }, "Group meeting scheduled");
  });
}

function showSmartMatchModal() {
  state.modal = {
    title: "Smart match",
    body: `
      <form class="form" id="smartMatchForm">
        <input name="tags" value="anxiety,stress" required />
        <input name="language" value="English" />
        <select name="preferredGroupType"><option value="any">Any</option><option value="peer_led">Peer led</option><option value="therapist_led">Therapist led</option></select>
        <button>Find Support Circle</button>
      </form>
    `,
  };
  render();
  document.querySelector("#smartMatchForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      const result = await api("/support-groups/match", { method: "POST", body: JSON.stringify(formToObject(event.currentTarget)) });
      state.modal = null;
      await loadGroups();
      if (result.data.group) state.activeGroup = result.data.group;
    }, "Matching complete");
  });
}

function showGroupModal() {
  state.modal = {
    title: "Create support group",
    body: `
      <form class="form" id="groupCreateForm">
        <input name="name" value="Calm Study Circle" required />
        <textarea name="description">A small support circle for stress and anxiety.</textarea>
        <input name="tags" value="anxiety,stress" required />
        <input name="capacity" type="number" value="8" />
        <input name="minimumStartSize" type="number" value="6" />
        <select name="groupType"><option value="therapist_led">Therapist led</option><option value="peer_led">Peer led</option></select>
        <input name="language" value="English" />
        <button>Create Group</button>
      </form>
    `,
  };
  render();
  document.querySelector("#groupCreateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await run(async () => {
      await api("/support-groups", { method: "POST", body: JSON.stringify(formToObject(event.currentTarget)) });
      state.modal = null;
      await loadGroups();
    }, "Support group created");
  });
}

function meetingFormHtml(id, includeMeetingType) {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(Date.now() + 25 * 60 * 60 * 1000);
  const value = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return `
    <form class="form" id="${id}">
      <input name="title" value="${includeMeetingType ? "Anxiety support webinar" : "Weekly support circle"}" required />
      <textarea name="description">${includeMeetingType ? "A guided online session for members of this forum." : "A small check-in for group members."}</textarea>
      ${includeMeetingType ? `<select name="meetingType"><option value="webinar">Webinar</option><option value="open_discussion">Open discussion</option><option value="workshop">Workshop</option><option value="qna">Q&A</option></select>` : ""}
      <select name="mode"><option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option></select>
      <input name="startsAt" type="datetime-local" value="${value(start)}" required />
      <input name="endsAt" type="datetime-local" value="${value(end)}" required />
      <input name="meetingLink" value="https://meet.example.com/beanhelps" />
      <input name="location" placeholder="Location" />
      <button>Schedule</button>
    </form>
  `;
}

boot();
