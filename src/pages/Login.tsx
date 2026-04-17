import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FAKE_DOMAIN = "nexus.local";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = `${username.trim().toLowerCase()}@${FAKE_DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(t("login.error"));
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-md mx-auto px-6 pt-16 pb-24">
        <h1 className="font-display font-bold text-4xl uppercase tracking-tighter mb-2">
          {t("login.title")}
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">{t("login.subtitle")}</p>

        <form onSubmit={submit} className="surface-card p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("login.username")}
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("login.password")}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-background/50"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full font-mono-ui text-xs uppercase tracking-widest">
            {loading ? t("common.loading") : t("login.submit")}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link to="/contact" className="text-primary hover:underline">
            {t("login.contactLink")}
          </Link>
        </p>
      </main>
    </div>
  );
};

export default Login;
