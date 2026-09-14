import { useState, useRef, ChangeEvent } from "react";
import {
  Button,
  Card,
  Typography,
  Modal,
  toast,
  Surface,
  Separator,
} from "@heroui/react";
import {
  Download,
  Upload,
  RotateCcw,
  Database,
  Clock,
  Palette,
  HardDrive,
  AlertTriangle,
  FileJson,
  History,
  CheckSquare,
  ExternalLink,
  Trash,
  Cloud,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "@/services/supabase/auth-context";
import { AuthModal, AccountModal } from "@/components/auth";
import {
  getStorageOverview,
  exportAndDownloadBackup,
  importBackupFromJson,
  resetAllCozifyData,
  StorageOverview,
} from "@/services/data-management";

export function DataTab({
  onOpenSessionsLog,
  onOpenTasksLog,
}: {
  onOpenSessionsLog?: () => void;
  onOpenTasksLog?: () => void;
}) {
  const { user, syncNow } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<StorageOverview>(() =>
    getStorageOverview(),
  );
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshStats = () => {
    setStats(getStorageOverview());
  };

  const handleExport = () => {
    try {
      const result = exportAndDownloadBackup();

      toast("Data Exported!", {
        description: `Saved ${result.fileName} with ${result.sessionsCount} session records.`,
        variant: "accent",
        timeout: 3000,
      });
      refreshStats();
    } catch {
      toast("Export Failed", {
        description: "An error occurred while generating the backup file.",
        variant: "danger",
      });
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const result = importBackupFromJson(text);

      if (result.success) {
        toast("Data Imported Successfully!", {
          description: `Restored ${result.details?.sessionsCount ?? 0} sessions and preferences. Refreshing...`,
          variant: "accent",
          timeout: 2500,
        });

        refreshStats();

        // Allow toast to show before clean reload to hydrate all contexts
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        toast("Import Failed", {
          description: result.message,
          variant: "danger",
        });
      }
    } catch {
      toast("Import Error", {
        description:
          "Failed to read the selected file. Please make sure it is valid JSON.",
        variant: "danger",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleResetAll = () => {
    setIsResetConfirming(false);
    resetAllCozifyData();
    window.location.reload();
  };

  return (
    <div className="space-y-5">
      {/* Header Info */}
      {/* Header */}
      <Surface variant="transparent">
        <Typography type="h4">Data & Storage Management</Typography>
        <Typography color="muted" type="body-sm">
          All your data is stored securely in your browser. Export backups or
          restore anytime.
        </Typography>
      </Surface>

      {/* Cloud Account & Multi-Device Sync Card */}
      <Card className="md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-6 flex items-center justify-center text-accent shrink-0">
            {user ? (
              <ShieldCheck className="size-6" />
            ) : (
              <Cloud className="size-6" />
            )}
          </div>
          <div>
            <Typography className="font-semibold" type="h6">
              {user ? "Connected Account" : "Cloud Synchronization"}
            </Typography>
            <Typography color="muted" type="body-xs">
              {user
                ? "Your focus sessions, tasks, and wallpapers sync automatically across devices."
                : "Sign in to securely backup and sync your workspace across all your devices."}
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2 max-md:w-full">
          {user ? (
            <>
              <Button
                className="max-md:flex-1"
                isDisabled={isSyncing}
                size="sm"
                variant="secondary"
                onPress={async () => {
                  setIsSyncing(true);
                  try {
                    await syncNow();
                    toast.success("Synced successfully!");
                  } finally {
                    setIsSyncing(false);
                  }
                }}
              >
                <RefreshCw
                  className={`size-3.5 ${isSyncing ? "animate-spin text-accent" : ""}`}
                />
                <span>Sync Now</span>
              </Button>
            </>
          ) : (
            <Button
              className="max-md:w-full"
              size="sm"
              variant="primary"
              onPress={() => setIsAuthOpen(true)}
            >
              <Cloud className="size-4" />
              <span>Connect / Sign In</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Storage Overview Stats Grid */}
      <Surface
        className="grid grid-cols-2 xl:grid-cols-4 gap-2"
        variant="transparent"
      >
        <Card className="flex justify-between sm:flex-row">
          <Surface>
            <Card.Title className="flex items-center gap-2">
              <Typography
                className="flex items-center gap-1"
                color="muted"
                type="body-sm"
              >
                <Database className="size-4" />
                Sessions
              </Typography>
            </Card.Title>
            <Typography type="body" weight="bold">
              {stats.sessionsCount}
            </Typography>
          </Surface>
        </Card>
        <Card className="flex justify-between sm:flex-row">
          <Surface>
            <Card.Title className="flex items-center gap-2">
              <Typography
                className="flex items-center gap-1"
                color="muted"
                type="body-sm"
              >
                <Clock className="size-4" />
                Focus Time
              </Typography>
            </Card.Title>
            <Typography type="body" weight="bold">
              {stats.totalFocusMinutes}m
            </Typography>
          </Surface>
        </Card>
        <Card className="flex justify-between sm:flex-row">
          <Surface>
            <Card.Title className="flex items-center gap-2">
              <Typography
                className="flex items-center gap-1"
                color="muted"
                type="body-sm"
              >
                <Palette className="size-4" />
                Wallpapers
              </Typography>
            </Card.Title>
            <Typography type="body" weight="bold">
              {stats.customWallpapersCount}
            </Typography>
          </Surface>
        </Card>
        <Card className="flex justify-between sm:flex-row">
          <Surface>
            <Card.Title className="flex items-center gap-2">
              <Typography
                className="flex items-center gap-1"
                color="muted"
                type="body-sm"
              >
                <HardDrive className="size-4" />
                Space Used
              </Typography>
            </Card.Title>
            <Typography type="body" weight="bold">
              {stats.formattedStorageSize}
            </Typography>
          </Surface>
        </Card>
      </Surface>

      {/* Focus Sessions Log Inspection Card */}
      <Card className="rounded-4xl py-5">
        <Card className="p-0 md:flex-row">
          <Card.Header className="w-full">
            <Card.Title className="flex items-center gap-2">
              <History className="size-4 text-blue-400" />
              <Typography type="h6">Focus Sessions Log</Typography>
            </Card.Title>
            <Card.Description>
              Inspect and view all your recorded focus sessions, notes, and
              metrics in detail.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button
              className="max-md:w-full"
              size="sm"
              variant="secondary"
              onPress={onOpenSessionsLog}
            >
              <ExternalLink className="size-4" />
              Inspect Log ({stats.sessionsCount})
            </Button>
          </Card.Footer>
        </Card>

        <Separator />

        {/* Tasks & Archive Log Inspection Card */}
        <Card className="p-0 md:flex-row">
          <Card.Header className="w-full">
            <Card.Title className="flex items-center gap-2">
              <CheckSquare className="size-4 text-emerald-400" />
              <Typography type="h6">Tasks & Archive Log</Typography>
            </Card.Title>
            <Card.Description>
              Inspect all created, completed, and archived to-do tasks or
              restore them.
            </Card.Description>
          </Card.Header>

          <Card.Footer>
            <Button
              className="max-md:w-full"
              size="sm"
              variant="secondary"
              onPress={onOpenTasksLog}
            >
              <ExternalLink className="size-4" />
              Inspect Log ({stats.todosCount})
            </Button>
          </Card.Footer>
        </Card>
      </Card>

      {/* Export and Import Actions */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <FileJson className="size-4 text-accent" />
            <Typography type="h6">Backup & Restore</Typography>
          </Card.Title>
          <Card.Description>
            Save a backup file to your computer or load an existing Cozify
            backup to sync across devices.
          </Card.Description>
        </Card.Header>

        <Card.Footer className="w-full flex flex-wrap gap-2">
          <Button
            className="flex-1"
            size="sm"
            variant="secondary"
            onPress={handleExport}
          >
            <Download className="size-4" />
            <span>Export Backup</span>
          </Button>

          <Button
            className="flex-1"
            isPending={isImporting}
            size="sm"
            variant="secondary"
            onPress={() => fileInputRef.current?.click()}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              accept=".json,application/json"
              className="hidden"
              type="file"
              onChange={handleFileSelect}
            />
            <Upload className="size-4" />
            Import Backup
          </Button>
        </Card.Footer>
      </Card>

      {/* Reset Data Section */}
      <Card className="justify-between bg-danger-soft md:flex-row">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <AlertTriangle className="text-danger size-4" />
            <Typography className="text-danger" type="h6">
              Reset Application Data
            </Typography>
          </Card.Title>
          <Card.Description>
            Clear all saved timer cycles, history, custom wallpapers, and
            themes.
          </Card.Description>
        </Card.Header>

        <Card.Footer>
          <Button
            className="max-sm:w-full"
            size="sm"
            variant="danger-soft"
            onPress={() => setIsResetConfirming(true)}
          >
            <Trash className="size-4" />
            Reset All Application Data
          </Button>
        </Card.Footer>
      </Card>

      {/* Reset Application Data Confirmation Modal */}
      <Modal.Backdrop
        isOpen={isResetConfirming}
        onOpenChange={(open) => !open && setIsResetConfirming(false)}
      >
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header className="flex-row">
              <Modal.Icon className="text-danger">
                <AlertTriangle />
              </Modal.Icon>
              <div>
                <Modal.Heading className="text-danger font-semibold">
                  Reset Application Data?
                </Modal.Heading>
                <Typography color="muted" type="body-xs">
                  Permanently clear all local data & settings
                </Typography>
              </div>
            </Modal.Header>

            <Modal.Body className="py-2.5 space-y-2">
              <Typography color="muted" type="body-xs">
                This will wipe all your saved focus sessions, streaks,
                achievements, custom wallpapers, task history, and sound
                preferences.
              </Typography>
              <Typography className="text-danger font-semibold" type="body-xs">
                This action cannot be undone.
              </Typography>
            </Modal.Body>

            <Modal.Footer>
              <Button
                className="flex-1"
                size="sm"
                variant="secondary"
                onPress={() => setIsResetConfirming(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                size="sm"
                variant="danger-soft"
                onPress={() => {
                  setIsResetConfirming(false);
                  handleResetAll();
                }}
              >
                <RotateCcw className="size-4" />
                <span>Yes, Reset Everything</span>
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Auth Modal for Guests / Account Modal for Logged in Users */}
      {user ? (
        <AccountModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
      ) : (
        <AuthModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
      )}
    </div>
  );
}
