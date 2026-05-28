export const getNextRoute = (user) => {
  if (!user) {
    return "/login";
  }

  if (user.role === "beaner" && !user.onboardingProfile?.completedAt) {
    return "/onboarding/beaner";
  }

  if (
    user.role === "beanpist" &&
    !user.therapistProfile?.specializations?.length
  ) {
    return "/onboarding/therapist";
  }

  if (user.role === "beanpist") {
    return "/therapist/home";
  }

  return "/home";
};