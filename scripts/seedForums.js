//we have a few default forums:
// general
// anxiety
// loneliness
// burnout
// exam-stress
// grief
// relationship-issues
// chronic-illness
// social-anxiety
// career-stress
// this js file helps create these default forums in mongodb

const path = require("path");
const dotenv = require("../apps/api/node_modules/dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../apps/api/.env"),
});

const connectDB = require("../apps/api/src/config/db");
const Forum = require("../apps/api/models/Forum");

const forums = [
  {
    name: "General",
    slug: "general",
    description: "A broad space for open conversations, support, and shared experiences.",
    icon: "messages",
    tags: ["general", "community", "support"],
  },
  {
    name: "Anxiety",
    slug: "anxiety",
    description: "For people dealing with anxiety, worry, panic, and overthinking.",
    icon: "cloud",
    tags: ["anxiety", "worry", "panic", "overthinking"],
  },
  {
    name: "Loneliness",
    slug: "loneliness",
    description: "A space to talk about isolation, disconnection, and finding connection.",
    icon: "moon",
    tags: ["loneliness", "isolation", "connection"],
  },
  {
    name: "Burnout",
    slug: "burnout",
    description: "Support for emotional exhaustion, overwhelm, and burnout recovery.",
    icon: "flame",
    tags: ["burnout", "stress", "exhaustion"],
  },
  {
    name: "Exam Stress",
    slug: "exam-stress",
    description: "For students facing pressure, fear, and stress around studies and exams.",
    icon: "book",
    tags: ["exam stress", "students", "academic pressure"],
  },
  {
    name: "Grief",
    slug: "grief",
    description: "A gentle place to share loss, grief, and healing journeys.",
    icon: "heart",
    tags: ["grief", "loss", "healing"],
  },
  {
    name: "Relationship Issues",
    slug: "relationship-issues",
    description: "Conversations around family, friendship, love, conflict, and heartbreak.",
    icon: "link",
    tags: ["relationships", "heartbreak", "conflict", "family"],
  },
  {
    name: "Chronic Illness",
    slug: "chronic-illness",
    description: "For people coping with long-term illness and its emotional impact.",
    icon: "cross",
    tags: ["chronic illness", "health", "emotional support"],
  },
  {
    name: "Social Anxiety",
    slug: "social-anxiety",
    description: "Support for fear of judgment, social discomfort, and confidence building.",
    icon: "users",
    tags: ["social anxiety", "confidence", "fear of judgment"],
  },
  {
    name: "Career Stress",
    slug: "career-stress",
    description: "Talk about work pressure, uncertainty, career confusion, and growth.",
    icon: "briefcase",
    tags: ["career stress", "work", "pressure", "jobs"],
  },
];

const seedForums = async () => {
  try {
    await connectDB();
    await Forum.deleteMany({});
    await Forum.insertMany(forums);

    console.log("Forums seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding forums:", error.message);
    process.exit(1);
  }
};

seedForums();