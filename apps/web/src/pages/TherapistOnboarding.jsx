import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const TherapistOnboarding = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/auth/me");
        const currentUser = response.data.user;

        setUser(currentUser);

        const verificationStatus =
          currentUser?.therapistProfile?.verificationStatus;
        const hasCompletedProfile =
          currentUser?.therapistProfile?.specializations?.length;

        if (verificationStatus === "rejected") {
          navigate("/therapist/home", { replace: true });
          return;
        }

        if (hasCompletedProfile) {
          navigate("/therapist/home", { replace: true });
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  if (error) {
    return (
      <main className="app-shell">
        <section className="dashboard-hero">
          <p className="eyebrow">therapist onboarding</p>
          <h1>Something went wrong</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-shell">
        <section className="dashboard-hero">
          <p className="eyebrow">therapist onboarding</p>
          <h1>Loading...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="dashboard-hero">
        <p className="eyebrow">therapist onboarding</p>
        <h1>Complete your therapist profile.</h1>
        <p>
          This page will collect specializations, languages, experience,
          availability, and license or certificate details.
        </p>
      </section>
    </main>
  );
};

export default TherapistOnboarding;