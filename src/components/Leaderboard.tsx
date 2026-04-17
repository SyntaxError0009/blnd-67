import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  id: string;
  username: string;
  lots: number;
}

export const Leaderboard = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, lots")
        .order("lots", { ascending: false })
        .limit(10);
      setRows(data ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("profiles-leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="relative">
      <div className="absolute -top-px left-0 right-0 h-px neon-edge opacity-80 z-20" />

      <div className="surface-card overflow-hidden shadow-[var(--shadow-elevated)]">
        <div className="grid grid-cols-[80px_1fr_120px] items-center px-4 sm:px-6 py-4 border-b border-white/[0.06] bg-background/40 font-mono-ui text-[10px] text-muted-foreground uppercase tracking-widest">
          <div className="text-center">{t("leaderboard.rank")}</div>
          <div>{t("leaderboard.operator")}</div>
          <div className="text-end">{t("leaderboard.lots")}</div>
        </div>

        {loading && (
          <div className="px-6 py-12 text-center text-muted-foreground font-mono-ui text-xs uppercase tracking-widest">
            {t("common.loading")}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground font-mono-ui text-xs uppercase tracking-widest">
            {t("leaderboard.empty")}
          </div>
        )}

        {rows.map((r, i) => {
          const rank = i + 1;
          const isFirst = rank === 1;
          return (
            <div
              key={r.id}
              className={`relative grid grid-cols-[80px_1fr_120px] items-center px-4 sm:px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors ${
                isFirst ? "bg-[image:var(--gradient-row)]" : ""
              }`}
            >
              {isFirst && (
                <div className="absolute start-0 top-0 bottom-0 w-[2px] bg-primary shadow-[var(--shadow-neon)]" />
              )}
              <div
                className={`text-center tabular-nums ${
                  isFirst
                    ? "font-display font-bold text-2xl text-primary"
                    : rank <= 3
                      ? "font-mono-ui text-foreground/90 text-lg"
                      : "font-mono-ui text-muted-foreground"
                }`}
              >
                {String(rank).padStart(2, "0")}
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`size-9 rounded-sm bg-secondary border ${
                    isFirst ? "border-primary/50" : "border-white/10"
                  } flex items-center justify-center font-display font-bold text-sm uppercase shrink-0`}
                >
                  {r.username.slice(0, 2)}
                </div>
                <span
                  className={`truncate ${
                    isFirst
                      ? "font-display font-bold text-lg"
                      : "font-medium text-foreground/90"
                  }`}
                >
                  {r.username}
                </span>
              </div>
              <div
                className={`font-mono-ui text-end tabular-nums ${
                  isFirst
                    ? "text-primary text-lg"
                    : "text-foreground/80"
                }`}
              >
                {r.lots.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
