import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/Leaderboard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Header />

      <main className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 pt-12 sm:pt-20 pb-32">
        <section className="text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-primary/30 bg-primary/5 font-mono-ui text-[10px] text-primary uppercase tracking-widest">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {t("hero.badge")}
          </div>
          <h1 className="font-display font-bold text-5xl sm:text-7xl md:text-8xl tracking-tighter text-balance uppercase mb-6 glow-text leading-[0.9]">
            {t("hero.title_1")}
            <br />
            {t("hero.title_2")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-[50ch] mx-auto text-pretty mb-8">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="font-mono-ui text-xs uppercase tracking-widest">
              <Link to="/login">{t("hero.cta_login")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-mono-ui text-xs uppercase tracking-widest">
              <Link to="/contact">{t("hero.cta_contact")}</Link>
            </Button>
          </div>
        </section>

        <Leaderboard />
      </main>
    </div>
  );
};

export default Index;
