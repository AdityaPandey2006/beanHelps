// this tells what the layout for login page and signup page will look like
import "../styles/app.css";
import logo from "../assets/beanhelps-logo.png";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <img className="brand-logo" src={logo} alt="beanHelps" />

        <h1>{title}</h1>
        <p>{subtitle}</p>

        {children}
      </section>

      <section className="auth-side">
        <div className="paper-card">
          <p className="eyebrow">structured support</p>
          <h2>Find people who understand what you are carrying.</h2>
          <p>
            Privacy-first support circles connecting people through trusted
            communities and therapist-assisted guidance.
          </p>
        </div>
      </section>
    </main>
  );
};

export default AuthLayout;