import { useState, FormEvent } from "react";
import {
  Modal,
  Button,
  Typography,
  Avatar,
  Card,
  Surface,
  Separator,
  toast,
} from "@heroui/react";
import {
  ShieldCheck,
  LogOut,
  RefreshCw,
  Edit2,
  Check,
  X,
  Database,
  CheckSquare,
  Palette,
  Cloud,
} from "lucide-react";

import { useAuth } from "@/services/supabase/auth-context";
import { db } from "@/services/db";

interface AccountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountModal({ isOpen, onOpenChange }: AccountModalProps) {
  const { user, profile, signOut, updateProfile, syncNow } = useAuth();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  if (!isOpen || !user) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const success = await syncNow();

      if (success) {
        toast("Sync Complete", {
          description: "All your devices are up to date.",
          variant: "accent",
        });
      } else {
        toast("Sync Pending", {
          description: "Data will be automatically synced when connected.",
        });
      }
    } catch {
      toast("Sync Failed", {
        description: "Could not reach remote cloud database.",
        variant: "danger",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveDisplayName = async (e: FormEvent) => {
    e.preventDefault();
    if (!editNameValue.trim()) return;

    const { error } = await updateProfile({
      displayName: editNameValue.trim(),
    });

    if (error) {
      toast("Could not update name", {
        description: error.message,
        variant: "danger",
      });
    } else {
      toast("Name updated!", { variant: "accent" });
      setIsEditingName(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast("Signed Out", {
      description: "Your session ended and client data was reset.",
    });
    onOpenChange(false);
  };

  const sessionsCount = db.sessions.getAll().length;
  const todosCount = db.todos.getAll().length;
  const wallpapersCount = db.customBackgrounds.getAll().length;

  const initialLetter = (profile?.displayName || user.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="md">
        <Modal.Dialog className="max-sm:mt-0! sm:max-w-120 shadow-2xl space-y-4">
          <Modal.Header className="flex-row items-center gap-3">
            <Modal.Icon>
              <ShieldCheck className="text-accent size-5" />
            </Modal.Icon>
            <div>
              <Modal.Heading>Account & Cloud Profile</Modal.Heading>
              <Typography color="muted" type="body-xs">
                Multi-device workspace synchronization
              </Typography>
            </div>
          </Modal.Header>
          <Modal.CloseTrigger />

          <Modal.Body className="space-y-3.5 py-1">
            {/* 1. Profile Surface Card */}
            <Card className="flex-row items-center gap-3.5" variant="secondary">
              <Avatar className="size-13 rounded-2xl shrink-0">
                {profile?.avatarUrl && <Avatar.Image src={profile.avatarUrl} />}
                <Avatar.Fallback className="text-base">
                  {initialLetter}
                </Avatar.Fallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <form
                    className="flex items-center gap-1.5"
                    onSubmit={handleSaveDisplayName}
                  >
                    <input
                      className="w-full h-8 text-xs px-2.5 rounded-xl bg-surface-secondary border border-accent text-foreground outline-none"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                    />
                    <Button
                      isIconOnly
                      aria-label="Save"
                      className="size-8 rounded-xl shrink-0"
                      size="sm"
                      type="submit"
                      variant="primary"
                    >
                      <Check className="size-3.5" />
                    </Button>
                    <Button
                      isIconOnly
                      aria-label="Cancel"
                      className="size-8 rounded-xl shrink-0"
                      size="sm"
                      type="button"
                      variant="ghost"
                      onPress={() => setIsEditingName(false)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-1.5 group cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setEditNameValue(profile?.displayName || "");
                        setIsEditingName(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setEditNameValue(profile?.displayName || "");
                          setIsEditingName(true);
                        }
                      }}
                    >
                      <Typography
                        className="truncate font-semibold text-sm group-hover:text-accent transition-colors"
                        type="body-sm"
                      >
                        {profile?.displayName || "Cozify Member"}
                      </Typography>
                      <Edit2 className="size-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )}
                <Typography
                  className="truncate text-xs text-muted mt-0.5"
                  color="muted"
                  type="body-xs"
                >
                  {user.email}
                </Typography>
              </div>
            </Card>

            {/* 2. Cloud Sync Status Card */}
            <Card
              className="flex-row items-center justify-between gap-3"
              variant="secondary"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 flex items-center justify-center text-accent shrink-0">
                  <Cloud className="size-6" />
                </div>
                <div>
                  <Typography className="font-semibold text-xs sm:text-sm">
                    Cloud Synchronization Active
                  </Typography>
                  <Typography color="muted" type="body-xs">
                    Automatic sync across devices
                  </Typography>
                </div>
              </div>
              <Button
                isIconOnly
                aria-label="Sync Now"
                className="size-8 rounded-xl shrink-0"
                isDisabled={isSyncing}
                size="sm"
                variant="secondary"
                onPress={handleManualSync}
              >
                <RefreshCw
                  className={`size-3.5 ${isSyncing ? "animate-spin text-accent" : ""}`}
                />
              </Button>
            </Card>

            {/* 3. Workspace Overview Stats Grid */}
            <div className="space-y-1.5 pt-1">
              <Surface className="grid grid-cols-3 gap-2" variant="transparent">
                <Card
                  className="text-center flex flex-col items-center justify-center"
                  variant="secondary"
                >
                  <Database className="size-6 text-blue-400" />
                  <Typography type="body" weight="bold">
                    {sessionsCount}
                  </Typography>
                  <Typography color="muted" type="body-xs">
                    Sessions
                  </Typography>
                </Card>
                <Card
                  className="text-center flex flex-col items-center justify-center"
                  variant="secondary"
                >
                  <CheckSquare className="size-6 text-emerald-400" />
                  <Typography type="body" weight="bold">
                    {todosCount}
                  </Typography>
                  <Typography color="muted" type="body-xs">
                    Tasks
                  </Typography>
                </Card>
                <Card
                  className="text-center flex flex-col items-center justify-center"
                  variant="secondary"
                >
                  <Palette className="size-6 text-purple-400" />
                  <Typography type="body" weight="bold">
                    {wallpapersCount}
                  </Typography>
                  <Typography color="muted" type="body-xs">
                    Wallpapers
                  </Typography>
                </Card>
              </Surface>
            </div>

            {/* 4. Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 rounded-2xl font-medium"
                isDisabled={isSyncing}
                size="md"
                variant="secondary"
                onPress={handleManualSync}
              >
                <RefreshCw
                  className={`size-3.5 ${isSyncing ? "animate-spin text-accent" : ""}`}
                />
                <span>Sync Now</span>
              </Button>

              <Button
                className="flex-1 rounded-2xl font-medium"
                size="md"
                variant="danger-soft"
                onPress={handleSignOut}
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
