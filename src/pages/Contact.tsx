import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";

const Contact = () => {
  const { t } = useTranslation();
  const handle = t("contact.handle");
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-6 pt-16 pb-24 text-center">
        <h1 className="font-display font-bold text-4xl sm:text-5xl uppercase tracking-tighter mb-6">
          {t("contact.title")}
        </h1>
        <p className="text-muted-foreground text-lg mb-10">
          {t("contact.body", { handle: "" })}
        </p>
        <a
          href="https://t.me/blndsupport"
          target="_blank"
          rel="noreferrer"
          className="inline-block font-mono-ui text-2xl text-primary px-8 py-4 border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors tracking-widest"
        >
          {handle}
        </a>
      </main>
    </div>
  );
};

export default Contact;
