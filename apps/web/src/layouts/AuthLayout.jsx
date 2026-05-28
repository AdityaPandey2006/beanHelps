import { HeartHandshake } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-bean-cream text-bean-ink">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="space-y-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-bean-teal text-white shadow-soft">
              <HeartHandshake className="h-6 w-6" />
            </span>
            <span className="text-xl font-black">beanHelps</span>
          </Link>

          <div className="space-y-5">
            <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-bean-teal shadow-sm">
              Peer support with structure
            </p>
            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              Calmer communities for people who need to be heard.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-bean-muted">
              Forums, private circles, therapist-led sessions, and moderation tools in one focused mental wellness platform.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-white/80 bg-white/85 p-5 shadow-soft sm:p-8">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
