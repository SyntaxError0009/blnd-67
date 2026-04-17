import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string;
  lots: number;
  created_at: string;
}
interface HistoryRow {
  id: string;
  user_id: string;
  previous_lots: number;
  new_lots: number;
  delta: number;
  note: string | null;
  created_at: string;
}

const Admin = () => {
  const { t } = useTranslation();
  const { user, isAdmin, loading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    lots: 0,
    is_admin: false,
  });
  const [editing, setEditing] = useState<Profile | null>(null);
  const [editLots, setEditLots] = useState(0);
  const [editNote, setEditNote] = useState("");
  const [pwdTarget, setPwdTarget] = useState<Profile | null>(null);
  const [newPwd, setNewPwd] = useState("");

  const load = async () => {
    const [{ data: p }, { data: h }] = await Promise.all([
      supabase.from("profiles").select("*").order("lots", { ascending: false }),
      supabase
        .from("lots_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setProfiles(p ?? []);
    setHistory(h ?? []);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-md mx-auto pt-32 px-6 text-center">
          <p className="font-display text-2xl">{t("admin.accessDenied")}</p>
        </div>
      </div>
    );
  }

  const callAdmin = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-users", { body });
    if (error || (data as { error?: string })?.error) {
      const msg = (data as { error?: string })?.error || error?.message || "Error";
      toast.error(msg);
      return false;
    }
    return true;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const ok = await callAdmin({ action: "create", ...newUser });
    setCreating(false);
    if (ok) {
      toast.success(t("admin.created"));
      setNewUser({ username: "", password: "", lots: 0, is_admin: false });
      load();
    }
  };

  const remove = async (p: Profile) => {
    if (!confirm(t("admin.confirmDelete"))) return;
    if (await callAdmin({ action: "delete", user_id: p.id })) {
      toast.success(t("admin.deleted"));
      load();
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (
      await callAdmin({
        action: "update_lots",
        user_id: editing.id,
        lots: editLots,
        note: editNote || null,
      })
    ) {
      toast.success(t("admin.updated"));
      setEditing(null);
      setEditNote("");
      load();
    }
  };

  const savePwd = async () => {
    if (!pwdTarget) return;
    if (
      await callAdmin({
        action: "reset_password",
        user_id: pwdTarget.id,
        password: newPwd,
      })
    ) {
      toast.success(t("admin.updated"));
      setPwdTarget(null);
      setNewPwd("");
    }
  };

  const usernameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.username ?? id.slice(0, 8);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-widest text-primary mb-1">
              ADMIN
            </p>
            <h1 className="font-display font-bold text-4xl uppercase tracking-tighter">
              {t("admin.title")}
            </h1>
          </div>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="font-mono-ui text-xs uppercase tracking-widest">
              {t("admin.users")}
            </TabsTrigger>
            <TabsTrigger value="create" className="font-mono-ui text-xs uppercase tracking-widest">
              {t("admin.createUser")}
            </TabsTrigger>
            <TabsTrigger value="history" className="font-mono-ui text-xs uppercase tracking-widest">
              {t("admin.history")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="surface-card overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_120px_1fr] gap-4 px-4 py-3 border-b border-white/[0.06] font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                <div>#</div>
                <div>{t("admin.username")}</div>
                <div className="text-end">{t("leaderboard.lots")}</div>
                <div className="text-end">{t("admin.actions")}</div>
              </div>
              {profiles.map((p, i) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[60px_1fr_120px_1fr] gap-4 items-center px-4 py-3 border-b border-white/[0.04]"
                >
                  <div className="font-mono-ui text-muted-foreground tabular-nums">
                    {i + 1}
                  </div>
                  <div className="font-medium truncate">{p.username}</div>
                  <div className="font-mono-ui text-end tabular-nums text-primary">
                    {p.lots.toLocaleString()}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(p);
                        setEditLots(p.lots);
                      }}
                      className="font-mono-ui text-[10px] uppercase tracking-widest"
                    >
                      {t("admin.setLots")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPwdTarget(p);
                        setNewPwd("");
                      }}
                      className="font-mono-ui text-[10px] uppercase tracking-widest"
                    >
                      {t("admin.resetPwd")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove(p)}
                      className="font-mono-ui text-[10px] uppercase tracking-widest"
                    >
                      {t("admin.delete")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <form onSubmit={create} className="surface-card p-6 max-w-lg space-y-4">
              <div className="space-y-2">
                <Label className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("admin.username")}
                </Label>
                <Input
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  required
                  placeholder="a-z 0-9 _"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("admin.password")}
                </Label>
                <Input
                  type="text"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="bg-background/50 font-mono-ui"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("admin.initialLots")}
                </Label>
                <Input
                  type="number"
                  value={newUser.lots}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lots: Number(e.target.value) })
                  }
                  className="bg-background/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_admin"
                  checked={newUser.is_admin}
                  onCheckedChange={(v) =>
                    setNewUser({ ...newUser, is_admin: !!v })
                  }
                />
                <Label htmlFor="is_admin" className="text-sm cursor-pointer">
                  {t("admin.isAdmin")}
                </Label>
              </div>
              <Button
                type="submit"
                disabled={creating}
                className="w-full font-mono-ui text-xs uppercase tracking-widest"
              >
                {creating ? t("common.loading") : t("admin.create")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="history">
            <div className="surface-card overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_1fr_2fr] gap-4 px-4 py-3 border-b border-white/[0.06] font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                <div>{t("admin.when")}</div>
                <div>{t("admin.target")}</div>
                <div>{t("admin.change")}</div>
                <div>{t("admin.note")}</div>
              </div>
              {history.length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  {t("admin.historyEmpty")}
                </div>
              )}
              {history.map((h) => (
                <div
                  key={h.id}
                  className="grid grid-cols-[1fr_1fr_1fr_2fr] gap-4 px-4 py-3 border-b border-white/[0.04] text-sm"
                >
                  <div className="font-mono-ui text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleString()}
                  </div>
                  <div>{usernameOf(h.user_id)}</div>
                  <div className="font-mono-ui">
                    {h.previous_lots} →{" "}
                    <span className="text-primary">{h.new_lots}</span>{" "}
                    <span
                      className={
                        h.delta >= 0 ? "text-emerald-400" : "text-destructive"
                      }
                    >
                      ({h.delta >= 0 ? "+" : ""}
                      {h.delta})
                    </span>
                  </div>
                  <div className="text-muted-foreground truncate">{h.note ?? "—"}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="surface-card">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-tight">
              {t("admin.setLots")} — {editing?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("leaderboard.lots")}
              </Label>
              <Input
                type="number"
                value={editLots}
                onChange={(e) => setEditLots(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("admin.note")}
              </Label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("admin.cancel")}
            </Button>
            <Button onClick={saveEdit}>{t("admin.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwdTarget} onOpenChange={(o) => !o && setPwdTarget(null)}>
        <DialogContent className="surface-card">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-tight">
              {t("admin.resetPwd")} — {pwdTarget?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("admin.newPassword")}
            </Label>
            <Input
              type="text"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              minLength={6}
              className="font-mono-ui"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdTarget(null)}>
              {t("admin.cancel")}
            </Button>
            <Button onClick={savePwd} disabled={newPwd.length < 6}>
              {t("admin.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
