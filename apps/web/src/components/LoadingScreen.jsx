import { HeartPulse } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-bean-cream px-6 text-bean-ink">
      <div className="flex items-center gap-3 rounded-full border border-white/80 bg-white/80 px-5 py-3 shadow-soft">
        <HeartPulse className="h-5 w-5 text-bean-teal" />
        <span className="text-sm font-semibold">Opening beanHelps...</span>
      </div>
    </div>
  );
}
