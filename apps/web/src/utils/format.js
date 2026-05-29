export function formatDateTime(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function initials(name = "beanHelps") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function publicName(user, fallback = "Member") {
  if (!user) return fallback;
  if (user.role === "beaner") return user.displayName || fallback;
  return user.displayName || user.name || fallback;
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
