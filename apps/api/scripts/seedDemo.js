require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Forum = require("../models/Forum");
const ForumMembership = require("../models/ForumMembership");
const ForumPost = require("../models/ForumPost");
const ForumComment = require("../models/ForumComment");
const ForumMeeting = require("../models/ForumMeeting");
const SupportGroup = require("../models/SupportGroup");
const SupportGroupMembership = require("../models/SupportGroupMembership");
const SupportGroupMessage = require("../models/SupportGroupMessage");
const SupportGroupMeeting = require("../models/SupportGroupMeeting");
const SupportGroupWaitlist = require("../models/SupportGroupWaitlist");
const Report = require("../models/Report");

const PASSWORD = "BeanHelpsDemo123";

const daysFromNow = (days, hour = 15) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const hashPassword = async () => bcrypt.hash(PASSWORD, 12);

const upsertUser = async ({ name, displayName, email, role, onboardingProfile, therapistProfile }) => {
  const password = await hashPassword();

  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        displayName,
        email,
        role,
        password,
        ...(onboardingProfile ? { onboardingProfile } : {}),
        ...(therapistProfile ? { therapistProfile } : {}),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertForum = async (forum) => {
  return Forum.findOneAndUpdate(
    { slug: forum.slug },
    { $set: forum },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertForumMembership = async (forum, user, role = "member") => {
  return ForumMembership.findOneAndUpdate(
    { forum: forum._id, user: user._id },
    {
      $set: {
        forum: forum._id,
        user: user._id,
        role,
        status: "active",
        leftAt: null,
      },
      $setOnInsert: {
        joinedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertPost = async ({ forum, author, title, content, type = "thread", tags = [], isPinned = false }) => {
  return ForumPost.findOneAndUpdate(
    { forum: forum._id, title },
    {
      $set: {
        forum: forum._id,
        author: author._id,
        title,
        content,
        type,
        tags,
        isPinned,
        isDeleted: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertComment = async ({ post, forum, author, content, parentComment = null }) => {
  return ForumComment.findOneAndUpdate(
    {
      post: post._id,
      author: author._id,
      content,
    },
    {
      $set: {
        post: post._id,
        forum: forum._id,
        author: author._id,
        content,
        parentComment,
        isDeleted: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertForumMeeting = async ({ forum, host, title, description, meetingType, mode, startsAt, tags }) => {
  return ForumMeeting.findOneAndUpdate(
    { forum: forum._id, title },
    {
      $set: {
        forum: forum._id,
        host: host._id,
        title,
        description,
        meetingType,
        mode,
        startsAt,
        endsAt: addHours(startsAt, 1),
        meetingLink: mode === "online" ? "https://meet.beanhelps.demo/forum-session" : "",
        location: mode === "offline" ? "Community Wellness Center" : "",
        capacity: 80,
        tags,
        status: "scheduled",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getGroupStatus = (count, capacity, minimumStartSize) => {
  if (count >= capacity) return "full";
  if (count < minimumStartSize) return "needs_members";
  return "open";
};

const upsertSupportGroup = async ({ name, description, tags, capacity, minimumStartSize, createdBy, organizer, therapist, groupType, language }) => {
  const existingMembershipCount = await SupportGroupMembership.countDocuments({
    supportGroup: { $exists: true },
    status: "active",
  });

  const group = await SupportGroup.findOneAndUpdate(
    { name },
    {
      $set: {
        name,
        description,
        tags,
        capacity,
        minimumStartSize,
        createdBy: createdBy._id,
        organizer: organizer?._id || createdBy._id,
        therapist: therapist?._id || null,
        groupType,
        language,
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const count = await SupportGroupMembership.countDocuments({
    supportGroup: group._id,
    status: "active",
  });

  group.currentMemberCount = count;
  group.status = getGroupStatus(count, group.capacity, group.minimumStartSize);
  await group.save();

  return group;
};

const upsertSupportMembership = async (group, user, role = "member") => {
  const membership = await SupportGroupMembership.findOneAndUpdate(
    { supportGroup: group._id, user: user._id },
    {
      $set: {
        supportGroup: group._id,
        user: user._id,
        role,
        status: "active",
        leftAt: null,
      },
      $setOnInsert: {
        joinedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  group.currentMemberCount = await SupportGroupMembership.countDocuments({
    supportGroup: group._id,
    status: "active",
  });
  group.status = getGroupStatus(group.currentMemberCount, group.capacity, group.minimumStartSize);
  await group.save();

  return membership;
};

const upsertSupportMessage = async ({ group, sender, content, messageType = "text" }) => {
  return SupportGroupMessage.findOneAndUpdate(
    {
      supportGroup: group._id,
      sender: sender._id,
      content,
    },
    {
      $set: {
        supportGroup: group._id,
        sender: sender._id,
        content,
        messageType,
        isDeleted: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertSupportMeeting = async ({ group, organizer, title, description, mode, startsAt }) => {
  return SupportGroupMeeting.findOneAndUpdate(
    { supportGroup: group._id, title },
    {
      $set: {
        supportGroup: group._id,
        organizer: organizer._id,
        title,
        description,
        mode,
        startsAt,
        endsAt: addHours(startsAt, 1),
        meetingLink: mode !== "offline" ? "https://meet.beanhelps.demo/support-circle" : "",
        location: mode !== "online" ? "City Library Quiet Room" : "",
        status: "scheduled",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertWaitlist = async ({ user, tags, language = "English", preferredGroupType = "any" }) => {
  return SupportGroupWaitlist.findOneAndUpdate(
    { user: user._id, status: "waiting" },
    {
      $set: {
        user: user._id,
        tags,
        language,
        preferredGroupType,
        status: "waiting",
        matchedSupportGroup: null,
        matchedAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const upsertReport = async ({ reporter, targetType, targetId, reason, details, priority = "normal" }) => {
  return Report.findOneAndUpdate(
    {
      reporter: reporter._id,
      targetType,
      targetId,
    },
    {
      $set: {
        reporter: reporter._id,
        targetType,
        targetId,
        reason,
        details,
        status: "open",
        priority,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const admins = await Promise.all([
    upsertUser({ name: "ad1", displayName: "ad1", email: "ad1@beanhelps.demo", role: "admin" }),
    upsertUser({ name: "ad2", displayName: "ad2", email: "ad2@beanhelps.demo", role: "admin" }),
    upsertUser({ name: "ad3", displayName: "ad3", email: "ad3@beanhelps.demo", role: "admin" }),
  ]);

  const beaners = await Promise.all([
    upsertUser({ name: "Aarav Demo", displayName: "QuietWave", email: "aarav@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "18-24", languages: ["English", "Hindi"], location: "Delhi", preferredGroupSize: "Small", primaryStruggles: ["anxiety", "stress"], optionalTags: ["overthinking", "sleep"], description: "Looking for steady peer support.", completedAt: new Date() } }),
    upsertUser({ name: "Maya Demo", displayName: "KindSprout", email: "maya@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "18-24", languages: ["English"], location: "Mumbai", preferredGroupSize: "Small", primaryStruggles: ["loneliness"], optionalTags: ["friendship"], description: "Wants a gentle community.", completedAt: new Date() } }),
    upsertUser({ name: "Rohan Demo", displayName: "MoonBean", email: "rohan@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "25-34", languages: ["English", "Hindi"], location: "Bengaluru", preferredGroupSize: "Medium", primaryStruggles: ["burnout", "stress"], optionalTags: ["work"], description: "Trying to recover from burnout.", completedAt: new Date() } }),
    upsertUser({ name: "Sara Demo", displayName: "SoftHarbor", email: "sara@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "18-24", languages: ["English"], location: "Pune", preferredGroupSize: "Small", primaryStruggles: ["relationship"], optionalTags: ["heartbreak", "conflict"], description: "Needs relationship support.", completedAt: new Date() } }),
    upsertUser({ name: "Kabir Demo", displayName: "SteadyLeaf", email: "kabir@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "25-34", languages: ["English"], location: "Hyderabad", preferredGroupSize: "Small", primaryStruggles: ["grief"], optionalTags: ["loss"], description: "Looking for grief support.", completedAt: new Date() } }),
    upsertUser({ name: "Nia Demo", displayName: "TinySun", email: "nia@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "18-24", languages: ["English"], location: "Chennai", preferredGroupSize: "Small", primaryStruggles: ["anxiety"], optionalTags: ["panic"], description: "Wants practical anxiety support.", completedAt: new Date() } }),
    upsertUser({ name: "Isha Demo", displayName: "BluePebble", email: "isha@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "18-24", languages: ["English"], location: "Kolkata", preferredGroupSize: "Small", primaryStruggles: ["exam-stress"], optionalTags: ["night-panic"], description: "Waiting for an exam stress circle.", completedAt: new Date() } }),
    upsertUser({ name: "Dev Demo", displayName: "WarmLamp", email: "dev@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "18-24", languages: ["English"], location: "Jaipur", preferredGroupSize: "Small", primaryStruggles: ["exam-stress"], optionalTags: ["night-panic"], description: "Waiting for an exam stress circle.", completedAt: new Date() } }),
    upsertUser({ name: "Tara Demo", displayName: "RiverNote", email: "tara@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "18-24", languages: ["English"], location: "Lucknow", preferredGroupSize: "Small", primaryStruggles: ["exam-stress"], optionalTags: ["night-panic"], description: "Waiting for an exam stress circle.", completedAt: new Date() } }),
    upsertUser({ name: "Om Demo", displayName: "CalmOrbit", email: "om@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "18-24", languages: ["English"], location: "Ahmedabad", preferredGroupSize: "Small", primaryStruggles: ["exam-stress"], optionalTags: ["night-panic"], description: "Waiting for an exam stress circle.", completedAt: new Date() } }),
    upsertUser({ name: "Leela Demo", displayName: "HopeMint", email: "leela@beanhelps.demo", role: "beaner", onboardingProfile: { ageRange: "18-24", languages: ["English"], location: "Indore", preferredGroupSize: "Small", primaryStruggles: ["exam-stress"], optionalTags: ["night-panic"], description: "Waiting for an exam stress circle.", completedAt: new Date() } }),
  ]);

  const therapists = await Promise.all([
    upsertUser({ name: "Dr. Meera Rao", displayName: "Dr. Meera", email: "meera@beanhelps.demo", role: "beanpist", therapistProfile: { specializations: ["anxiety", "stress"], languages: ["English", "Hindi"], experience: "8 years supporting anxiety and stress management.", availability: "Weekends and weekday evenings", licenseOrCertificateUrl: "https://beanhelps.demo/certificates/meera.pdf", verificationStatus: "verified" } }),
    upsertUser({ name: "Dr. Arjun Sen", displayName: "Dr. Arjun", email: "arjun@beanhelps.demo", role: "beanpist", therapistProfile: { specializations: ["grief", "loneliness"], languages: ["English"], experience: "6 years in grief and group facilitation.", availability: "Friday evenings", licenseOrCertificateUrl: "https://beanhelps.demo/certificates/arjun.pdf", verificationStatus: "verified" } }),
    upsertUser({ name: "Priya Kapoor", displayName: "Priya K.", email: "priya.pending@beanhelps.demo", role: "beanpist", therapistProfile: { specializations: ["relationships"], languages: ["English", "Hindi"], experience: "Counselling intern with relationship support experience.", availability: "Sunday afternoons", licenseOrCertificateUrl: "https://beanhelps.demo/certificates/priya.pdf", verificationStatus: "pending" } }),
    upsertUser({ name: "Rejected Therapist", displayName: "Rejected Therapist", email: "rejected.therapist@beanhelps.demo", role: "beanpist", therapistProfile: { specializations: ["stress"], languages: ["English"], experience: "Incomplete profile for rejected demo state.", availability: "Unknown", licenseOrCertificateUrl: "https://beanhelps.demo/certificates/rejected.pdf", verificationStatus: "rejected" } }),
  ]);

  const [meera, arjun] = therapists;

  const forums = await Promise.all([
    upsertForum({ name: "General", slug: "general", description: "A broad space for kind check-ins, questions, and gentle peer support.", icon: "heart", tags: ["general", "support", "community"], isFeatured: true, isActive: true }),
    upsertForum({ name: "Anxiety", slug: "anxiety", description: "Conversations around panic, overthinking, uncertainty, and calming routines.", icon: "cloud", tags: ["anxiety", "panic", "overthinking", "sleep"], isFeatured: true, isActive: true }),
    upsertForum({ name: "Loneliness", slug: "loneliness", description: "For people seeking connection, friendship, and a place to be heard.", icon: "moon", tags: ["loneliness", "friendship", "isolation"], isFeatured: true, isActive: true }),
    upsertForum({ name: "Stress & Burnout", slug: "stress-burnout", description: "Support for work stress, academic pressure, and emotional exhaustion.", icon: "leaf", tags: ["stress", "burnout", "work", "exam-stress"], isFeatured: true, isActive: true }),
    upsertForum({ name: "Relationship Issues", slug: "relationship-issues", description: "Conversations around family, friendship, love, conflict, and heartbreak.", icon: "sparkles", tags: ["relationship", "heartbreak", "conflict"], isFeatured: true, isActive: true }),
    upsertForum({ name: "Grief & Loss", slug: "grief-loss", description: "A steady space for loss, grief, remembrance, and difficult transitions.", icon: "flower", tags: ["grief", "loss", "transition"], isFeatured: true, isActive: true }),
  ]);

  const [general, anxiety, loneliness, stressForum, relationships, grief] = forums;

  await Promise.all([
    upsertForumMembership(anxiety, beaners[0]),
    upsertForumMembership(anxiety, beaners[5]),
    upsertForumMembership(loneliness, beaners[1]),
    upsertForumMembership(stressForum, beaners[2]),
    upsertForumMembership(relationships, beaners[3]),
    upsertForumMembership(grief, beaners[4]),
    upsertForumMembership(general, beaners[0]),
    upsertForumMembership(general, beaners[1]),
  ]);

  const anxietyPost = await upsertPost({
    forum: anxiety,
    author: beaners[0],
    title: "What helps when overthinking gets loud at night?",
    content: "I keep replaying conversations before sleeping. Has anyone found a small routine that actually helps?",
    type: "question",
    tags: ["anxiety", "sleep", "overthinking"],
  });

  const therapistArticle = await upsertPost({
    forum: anxiety,
    author: meera,
    title: "A three-minute grounding exercise for anxious moments",
    content: "Try naming five things you can see, four you can feel, three you can hear, two you can smell, and one thing you can taste. The goal is not to force calm, but to return attention to the present.",
    type: "therapist_article",
    tags: ["grounding", "anxiety"],
    isPinned: true,
  });

  const lonelinessPost = await upsertPost({
    forum: loneliness,
    author: beaners[1],
    title: "How do you start talking again after isolating?",
    content: "I want to reach out to people, but I feel awkward after being quiet for weeks.",
    type: "thread",
    tags: ["loneliness", "friendship"],
  });

  const c1 = await upsertComment({
    post: anxietyPost,
    forum: anxiety,
    author: beaners[5],
    content: "I write one sentence about what I can control tomorrow. It helps me close the loop a little.",
  });

  await upsertComment({
    post: anxietyPost,
    forum: anxiety,
    author: meera,
    content: "That is a useful idea. Keeping it tiny matters because the brain is already tired at night.",
    parentComment: c1._id,
  });

  const c2 = await upsertComment({
    post: lonelinessPost,
    forum: loneliness,
    author: beaners[4],
    content: "I usually start with one low-pressure message, like sharing a song or asking a simple question.",
  });

  await Promise.all([
    upsertForumMeeting({ forum: anxiety, host: meera, title: "Anxiety Q&A: calming the evening spiral", description: "A therapist-led Q&A about night anxiety, grounding, and routines.", meetingType: "qna", mode: "online", startsAt: daysFromNow(2, 19), tags: ["anxiety", "sleep"] }),
    upsertForumMeeting({ forum: stressForum, host: meera, title: "Burnout reset workshop", description: "A practical workshop on low-energy recovery and boundary setting.", meetingType: "workshop", mode: "online", startsAt: daysFromNow(4, 18), tags: ["stress", "burnout"] }),
    upsertForumMeeting({ forum: grief, host: arjun, title: "Grief circle introduction", description: "A gentle introduction to peer grief support and safe sharing.", meetingType: "open_discussion", mode: "online", startsAt: daysFromNow(5, 17), tags: ["grief", "loss"] }),
  ]);

  const calmGroup = await upsertSupportGroup({
    name: "Calm Evenings Circle",
    description: "A small peer circle for anxiety, night overthinking, and gentle evening check-ins.",
    tags: ["anxiety", "sleep", "overthinking"],
    capacity: 8,
    minimumStartSize: 6,
    createdBy: beaners[0],
    organizer: beaners[0],
    therapist: meera,
    groupType: "therapist_led",
    language: "English",
  });

  const burnoutGroup = await upsertSupportGroup({
    name: "Burnout Recovery Circle",
    description: "A circle for people recovering from work stress, exhaustion, and pressure.",
    tags: ["stress", "burnout", "work"],
    capacity: 8,
    minimumStartSize: 6,
    createdBy: beaners[2],
    organizer: beaners[2],
    therapist: meera,
    groupType: "therapist_led",
    language: "English",
  });

  const griefGroup = await upsertSupportGroup({
    name: "Gentle Grief Circle",
    description: "A quieter space for loss, remembrance, and slow recovery.",
    tags: ["grief", "loss"],
    capacity: 8,
    minimumStartSize: 6,
    createdBy: beaners[4],
    organizer: beaners[4],
    therapist: arjun,
    groupType: "therapist_led",
    language: "English",
  });

  await Promise.all([
    upsertSupportMembership(calmGroup, beaners[0], "organizer"),
    upsertSupportMembership(calmGroup, beaners[5], "member"),
    upsertSupportMembership(burnoutGroup, beaners[2], "organizer"),
    upsertSupportMembership(griefGroup, beaners[4], "organizer"),
  ]);

  const anxietyMsg = await upsertSupportMessage({
    group: calmGroup,
    sender: beaners[0],
    content: "Tonight my anxiety is mostly about tomorrow morning. I am trying to name one thing I can prepare and leave the rest.",
  });

  await Promise.all([
    upsertSupportMessage({ group: calmGroup, sender: beaners[5], content: "I relate to that. I am trying the five senses grounding exercise before sleep." }),
    upsertSupportMessage({ group: calmGroup, sender: meera, content: "A gentle reminder: keep the goal small. Prepared, not perfect.", messageType: "prompt" }),
    upsertSupportMessage({ group: burnoutGroup, sender: beaners[2], content: "I noticed I say yes to tasks even when I am already overloaded." }),
    upsertSupportMessage({ group: griefGroup, sender: beaners[4], content: "Today was heavy, but writing one memory helped a little." }),
  ]);

  await Promise.all([
    upsertSupportMeeting({ group: calmGroup, organizer: beaners[0], title: "Evening grounding check-in", description: "A short online support circle meeting for grounding and planning tomorrow gently.", mode: "online", startsAt: daysFromNow(1, 20) }),
    upsertSupportMeeting({ group: burnoutGroup, organizer: beaners[2], title: "Boundary scripts practice", description: "Practice simple scripts for saying no and asking for time.", mode: "online", startsAt: daysFromNow(3, 18) }),
    upsertSupportMeeting({ group: griefGroup, organizer: beaners[4], title: "Memory and reflection circle", description: "A quiet session for sharing memories and listening without fixing.", mode: "hybrid", startsAt: daysFromNow(6, 16) }),
  ]);

  await Promise.all([
    upsertWaitlist({ user: beaners[6], tags: ["exam-stress", "night-panic"], preferredGroupType: "peer_led" }),
    upsertWaitlist({ user: beaners[7], tags: ["exam-stress", "night-panic"], preferredGroupType: "peer_led" }),
    upsertWaitlist({ user: beaners[8], tags: ["exam-stress", "night-panic"], preferredGroupType: "peer_led" }),
    upsertWaitlist({ user: beaners[9], tags: ["exam-stress", "night-panic"], preferredGroupType: "peer_led" }),
    upsertWaitlist({ user: beaners[10], tags: ["exam-stress", "night-panic"], preferredGroupType: "peer_led" }),
  ]);

  await Promise.all([
    upsertReport({ reporter: beaners[1], targetType: "forum_post", targetId: anxietyPost._id, reason: "unsafe_advice", details: "Some advice in this thread may be interpreted as a replacement for care.", priority: "high" }),
    upsertReport({ reporter: beaners[2], targetType: "forum_post", targetId: anxietyPost._id, reason: "misinformation", details: "I think this needs moderator review.", priority: "high" }),
    upsertReport({ reporter: beaners[3], targetType: "forum_post", targetId: anxietyPost._id, reason: "other", details: "Flagging for admin demo.", priority: "high" }),
    upsertReport({ reporter: beaners[0], targetType: "forum_comment", targetId: c2._id, reason: "harassment", details: "This comment should be reviewed for tone.", priority: "normal" }),
    upsertReport({ reporter: beaners[3], targetType: "support_group_message", targetId: anxietyMsg._id, reason: "self_harm", details: "Message mentions feeling unsafe and needs attention.", priority: "high" }),
    upsertReport({ reporter: beaners[5], targetType: "support_group", targetId: calmGroup._id, reason: "other", details: "Demo report against a support group.", priority: "normal" }),
  ]);

  console.log("Demo seed complete.");
  console.log("Password for all demo accounts:", PASSWORD);
  console.log("Admins: ad1@beanhelps.demo, ad2@beanhelps.demo, ad3@beanhelps.demo");
  console.log("Verified therapists: meera@beanhelps.demo, arjun@beanhelps.demo");
  console.log("Pending therapist: priya.pending@beanhelps.demo");
  console.log("Rejected therapist: rejected.therapist@beanhelps.demo");
  console.log("Beaner examples: aarav@beanhelps.demo, maya@beanhelps.demo, rohan@beanhelps.demo");
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });