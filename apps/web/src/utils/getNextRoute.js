export const getNextRoute = (user) => {
  if (!user) {
    return "/login";
  }

  if (user.role === "beaner" && !user.onboardingProfile?.completedAt) {
    return "/onboarding/beaner";
  }

  if (user.role === "beanpist") {
    const verificationStatus = user.therapistProfile?.verificationStatus;
    const hasCompletedProfile = user.therapistProfile?.specializations?.length;

    if (!hasCompletedProfile && verificationStatus !== "rejected") {
      return "/onboarding/therapist";
    }

    return "/therapist/home";
  }

  return "/home";
};
