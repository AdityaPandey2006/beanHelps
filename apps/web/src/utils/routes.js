export function hasBeanerOnboarding(user) {
  return Boolean(user?.onboardingProfile?.completedAt);
}

export function therapistStatus(user) {
  return user?.therapistProfile?.verificationStatus || "pending";
}

export function hasTherapistProfile(user) {
  const profile = user?.therapistProfile;
  return Boolean(
    profile?.specializations?.length &&
      profile?.languages?.length &&
      profile?.experience &&
      profile?.availability &&
      profile?.licenseOrCertificateUrl
  );
}

export function isTherapistTerminalOrComplete(user) {
  const status = therapistStatus(user);
  return status === "rejected" || hasTherapistProfile(user);
}

export function getRoleHome(user) {
  if (!user) return "/login";
  if (user.role === "admin") return "/admin";
  if (user.role === "beanpist") return "/therapist/home";
  return "/home";
}

export function getNextRoute(user) {
  if (!user) return "/login";
  if (user.role === "admin") return "/admin";
  if (user.role === "beanpist") {
    return isTherapistTerminalOrComplete(user)
      ? "/therapist/home"
      : "/onboarding/therapist";
  }
  return hasBeanerOnboarding(user) ? "/home" : "/onboarding/user";
}
