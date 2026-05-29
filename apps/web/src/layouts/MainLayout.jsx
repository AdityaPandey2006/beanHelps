import {
  CalendarDays,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { getRoleHome } from "../utils/routes.js";
import { initials } from "../utils/format.js";

const linkBase =
  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition";
const linkIdle = "text-bean-muted hover:bg-white hover:text-bean-ink";
const linkActive = "bg-white text-bean-teal shadow-sm";

function navFor(role) {
  if (role === "beanpist") {
    return [
      { to: "/therapist/home", label: "Dashboard", icon: LayoutDashboard },
      { to: "/forums", label: "Explore Forums", icon: MessageCircle },
      { to: "/support-groups", label: "Explore Support Groups", icon: UsersRound },
    ];
  }
  if (role === "admin") {
    return [
      { to: "/admin", label: "Admin", icon: ShieldCheck },
      { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
      { to: "/admin/reports", label: "Reports", icon: CalendarDays },
    ];
  }
  return [
    { to: "/home", label: "Home", icon: Home },
    { to: "/forums", label: "Explore Forums", icon: MessageCircle },
    { to: "/support-groups", label: "Explore Support Groups", icon: UsersRound },
  ];
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const home = getRoleHome(user);
  const links = navFor(user?.role);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bean-cream text-bean-ink">
      <header className="sticky top-0 z-30 border-b border-bean-sage/20 bg-bean-cream/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link to={home} className="flex items-center gap-3" aria-label="beanHelps home">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-bean-teal text-white shadow-soft">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-black tracking-normal">beanHelps</span>
              <span className="block text-xs font-semibold text-bean-muted">
                structured support circles
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkIdle}`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{user?.name}</p>
              <p className="text-xs capitalize text-bean-muted">{user?.role}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-black text-bean-teal shadow-sm">
              {initials(user?.name)}
            </div>
            <button
              onClick={handleLogout}
              className="grid h-10 w-10 place-items-center rounded-md text-bean-muted transition hover:bg-white hover:text-bean-ink"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
