import { useState, useEffect } from "react";
import { format } from "date-fns";

export function GlobalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <span className="font-mono-ledger text-[11px] tabular-nums text-sidebar-foreground/80">
        {format(time, "h:mm a")}
      </span>
      <span className="font-heading text-[9px] uppercase tracking-editorial text-sidebar-foreground/50">
        {format(time, "EEE, MMM d")}
      </span>
    </div>
  );
}
