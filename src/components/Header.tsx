import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import blndLogo from "@/assets/blnd-logo.jpg";

export const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const switchLang = (lng: "ku" | "en") => i18n.changeLanguage(lng);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="relative z-20 max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 group">
        <img
          src={blndLogo}
          alt="BLND Team logo"
          className="size-10 rounded-md object-cover shadow-[var(--shadow-neon)] transition-transform group-hover:scale-105"
        />
        <span className="font-display font-bold text-lg sm:text-xl tracking-wide uppercase">
          {t("brand")}
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link
              to="/dashboard"
              className="hidden sm:inline text-xs uppercase tracking-widest font-mono text-muted-foreground hover:text-foreground transition"
            >
              {t("nav.dashboard")}
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline text-xs uppercase tracking-widest font-mono text-primary hover:opacity-80 transition"
              >
                Admin
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-xs uppercase tracking-widest font-mono"
            >
              {t("nav.logout")}
            </Button>
          </>
        ) : (
          <Link
            to="/login"
            className="text-xs uppercase tracking-widest font-mono text-muted-foreground hover:text-foreground transition"
          >
            {t("nav.login")}
          </Link>
        )}

        <div className="flex items-center gap-1 surface-card p-1 font-mono-ui text-[11px] tracking-widest uppercase">
          <button
            onClick={() => switchLang("en")}
            className={`px-3 py-1.5 transition-colors ${
              i18n.language === "en"
                ? "bg-white/10 text-foreground border border-white/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => switchLang("ku")}
            className={`px-3 py-1.5 transition-colors ${
              i18n.language === "ku"
                ? "bg-white/10 text-foreground border border-white/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            KU
          </button>
        </div>
      </div>
    </header>
  );
};
