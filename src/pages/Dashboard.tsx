import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, username, loading } = useAuth();
  const [lots, setLots] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: all } = await supabase
        .from("profiles")
        .select("id, lots")
        .order("lots", { ascending: false });
      if (!all) return;
      setTotal(all.length);
      const idx = all.findIndex((p) => p.id === user.id);
      if (idx >= 0) {
        setRank(idx + 1);
        setLots(all[idx].lots);
      }
    };
    load();

    const channel = supabase
      .channel("dashboard-profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        <div className="mb-10">
          <p className="font-mono-ui text-[10px] uppercase tracking-widest text-primary mb-2">
            {t("dashboard.title")}
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tighter">
            {t("dashboard.welcome", { name: username ?? "" })}
          </h1>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="surface-card p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px neon-edge opacity-60" />
            <p className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
              {t("dashboard.yourLots")}
            </p>
            <p className="font-display font-bold text-6xl tabular-nums text-primary">
              {lots?.toLocaleString() ?? "—"}
            </p>
          </div>

          <div className="surface-card p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
            <p className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
              {t("dashboard.yourRank")}
            </p>
            <div className="flex items-baseline gap-3">
              <p className="font-display font-bold text-6xl tabular-nums">
                {rank !== null ? `#${rank}` : "—"}
              </p>
              {rank !== null && (
                <span className="font-mono-ui text-xs text-muted-foreground uppercase tracking-widest">
                  {t("dashboard.of", { total })}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
