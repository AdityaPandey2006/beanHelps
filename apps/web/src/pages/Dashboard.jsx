import { useEffect, useState } from "react";
import { api } from "../api/client";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (err) {
        setError(err.message);
      }
    };

    loadUser();
  }, []);

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <main className="app-shell">
      <section className="dashboard-hero">
        <p className="eyebrow">{user.role}</p>
        <h1>Hello, {user.name}</h1>
        <p>
          Your beanHelps space is ready. Next we will add onboarding, forums,
          and support groups here.
        </p>
      </section>
    </main>
  );
};

export default Dashboard;