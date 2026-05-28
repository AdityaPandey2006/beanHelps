import { useEffect, useState } from "react";
import { api } from "../api/client";

const TherapistHome = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchCurrentUser();
  }, []);

  const verificationStatus = user?.therapistProfile?.verificationStatus;

  if (error) {
    return (
      <main className="app-shell">
        <section className="dashboard-hero">
          <p className="eyebrow">therapist home</p>
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
          <p className="eyebrow">therapist home</p>
          <h1>Loading your dashboard...</h1>
        </section>
      </main>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <main className="app-shell">
        <section className="dashboard-hero">
          <p className="eyebrow">verification rejected</p>
          <h1>Your therapist profile was not verified.</h1>
          <p>
            You can still log in, but therapist features are unavailable for
            this account.
          </p>
        </section>
      </main>
    );
  }

  if (verificationStatus === "pending") {
    return (
      <main className="app-shell">
        <section className="dashboard-hero">
          <p className="eyebrow">verification pending</p>
          <h1>Your therapist profile is under review.</h1>
          <p>
            Once an admin verifies your profile, you will be able to create
            therapist-led spaces, resources, and sessions.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="dashboard-hero">
        <p className="eyebrow">therapist home</p>
        <h1>Your therapist dashboard</h1>
        <p>
          Soon this page will show featured forums, upcoming sessions, support
          groups, and community insights.
        </p>
      </section>
    </main>
  );
};

export default TherapistHome;