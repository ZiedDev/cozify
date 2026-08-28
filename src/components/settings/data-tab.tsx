import { useState, useRef } from "react";
import { Button, Card, Typography, Modal, toast } from "@heroui/react";
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
} from "lucide-react";

import {
  getStorageOverview,
  exportAndDownloadBackup,
  importBackupFromJson,
  resetAllCozifyData,
  StorageOverview,
} from "@/services/data-management";

interface DataTabProps {
  onOpenSessionsLog?: () => void;
  onOpenTasksLog?: () => void;
}

export function DataTab({ onOpenSessionsLog, onOpenTasksLog }: DataTabProps) {
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

      toast("Data Exported! 📦", {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const result = importBackupFromJson(text);

      if (result.success) {
        toast("Data Imported Successfully! 🚀", {
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
    resetAllCozifyData();
    toast("All Data Cleared", {
      description: "Local data has been reset to defaults. Refreshing...",
      variant: "default",
      timeout: 2000,
    });

    setIsResetConfirming(false);
    refreshStats();

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <Typography
          className="text-base text-foreground"
          type="h3"
          weight="semibold"
        >
          Data & Storage Management
        </Typography>
        <Typography className="mt-0.5" color="muted" type="body-xs">
          All your data is stored securely in your browser. Export backups or
          restore anytime.
        </Typography>
      </div>

      {/* Storage Overview Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-border/50 bg-surface/50 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted text-xs font-medium mb-1">
            <Database className="size-3.5" />
            <Typography color="muted" type="body-xs">
              Sessions
            </Typography>
          </div>
          <Typography
            className="text-lg text-foreground"
            type="h3"
            weight="bold"
          >
            {stats.sessionsCount}
          </Typography>
        </div>

        <div className="rounded-xl border border-border/50 bg-surface/50 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted text-xs font-medium mb-1">
            <Clock className="size-3.5" />
            <Typography color="muted" type="body-xs">
              Focus Time
            </Typography>
          </div>
          <Typography
            className="text-lg text-foreground"
            type="h3"
            weight="bold"
          >
            {stats.totalFocusMinutes}m
          </Typography>
        </div>

        <div className="rounded-xl border border-border/50 bg-surface/50 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted text-xs font-medium mb-1">
            <Palette className="size-3.5" />
            <Typography color="muted" type="body-xs">
              Wallpapers
            </Typography>
          </div>
          <Typography
            className="text-lg text-foreground"
            type="h3"
            weight="bold"
          >
            {stats.customWallpapersCount}
          </Typography>
        </div>

        <div className="rounded-xl border border-border/50 bg-surface/50 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted text-xs font-medium mb-1">
            <HardDrive className="size-3.5" />
            <Typography color="muted" type="body-xs">
              Space Used
            </Typography>
          </div>
          <Typography
            className="text-lg text-foreground"
            type="h3"
            weight="bold"
          >
            {stats.formattedStorageSize}
          </Typography>
        </div>
      </div>

      {/* Focus Sessions Log Inspection Card */}
      <Card className="border border-border/50 bg-surface/40">
        <Card.Header className="pb-2 flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <History className="size-4 text-blue-400" />
              <Card.Title className="text-sm font-semibold">
                Focus Sessions Log
              </Card.Title>
            </div>
            <Card.Description className="text-xs text-muted mt-1">
              Inspect and view all your recorded focus sessions, notes, and
              metrics in detail.
            </Card.Description>
          </div>

          <Button
            className="flex items-center gap-1.5 font-medium shrink-0 ml-3 cursor-pointer"
            size="sm"
            variant="secondary"
            onPress={() => onOpenSessionsLog?.()}
          >
            <ExternalLink className="size-3.5" />
            <span>Inspect Log ({stats.sessionsCount})</span>
          </Button>
        </Card.Header>
      </Card>

      {/* Tasks & Archive Log Inspection Card */}
      <Card className="border border-border/50 bg-surface/40">
        <Card.Header className="pb-2 flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <CheckSquare className="size-4 text-emerald-400" />
              <Card.Title className="text-sm font-semibold">
                Tasks & Archive Log
              </Card.Title>
            </div>
            <Card.Description className="text-xs text-muted mt-1">
              Inspect all created, completed, and archived to-do tasks or
              restore them.
            </Card.Description>
          </div>

          <Button
            className="flex items-center gap-1.5 font-medium shrink-0 ml-3 cursor-pointer"
            size="sm"
            variant="secondary"
            onPress={() => onOpenTasksLog?.()}
          >
            <ExternalLink className="size-3.5" />
            <span>Inspect Log ({stats.todosCount})</span>
          </Button>
        </Card.Header>
      </Card>

      {/* Export and Import Actions */}
      <Card className="border border-border/50 bg-surface/40">
        <Card.Header className="pb-2">
          <div className="flex items-center gap-2">
            <FileJson className="size-4 text-accent" />
            <Card.Title className="text-sm font-semibold">
              Backup & Restore
            </Card.Title>
          </div>
          <Card.Description className="text-xs text-muted mt-1">
            Save a backup file to your computer or load an existing Cozify
            backup to sync across devices.
          </Card.Description>
        </Card.Header>

        <Card.Content className="pt-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Export button */}
            <Button
              className="flex-1 flex items-center justify-center gap-2 font-medium"
              size="sm"
              variant="secondary"
              onPress={handleExport}
            >
              <Download className="size-4" />
              <span>Export Backup (.json)</span>
            </Button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              accept=".json,application/json"
              className="hidden"
              type="file"
              onChange={handleFileSelect}
            />

            {/* Import button */}
            <Button
              className="flex-1 flex items-center justify-center gap-2 font-medium"
              isPending={isImporting}
              size="sm"
              variant="secondary"
              onPress={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              <span>Import Backup</span>
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Reset Data Section */}
      <Card className="border border-danger/20 bg-danger/5">
        <Card.Header className="pb-2">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle className="size-4" />
            <Card.Title className="text-sm font-semibold text-danger">
              Reset Application Data
            </Card.Title>
          </div>
          <Card.Description className="text-xs text-muted mt-1">
            Clear all saved timer cycles, history, custom wallpapers, and
            themes.
          </Card.Description>
        </Card.Header>

        <Card.Content className="pt-2">
          <Button
            className="text-xs flex items-center gap-1.5 rounded-full font-medium"
            size="sm"
            variant="danger-soft"
            onPress={() => setIsResetConfirming(true)}
          >
            <RotateCcw className="size-3.5" />
            <span>Reset All Application Data</span>
          </Button>
        </Card.Content>
      </Card>

      {/* Reset Application Data Confirmation Modal */}
      <Modal.Backdrop
        isOpen={isResetConfirming}
        onOpenChange={(open) => !open && setIsResetConfirming(false)}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-105 rounded-2xl bg-surface border border-separator shadow-2xl p-4 sm:p-5">
            <Modal.CloseTrigger />
            <Modal.Header className="flex items-center gap-2.5 pb-2">
              <Modal.Icon className="bg-danger/15 text-danger border border-danger/30 rounded-xl p-2 shrink-0">
                <AlertTriangle className="size-4" />
              </Modal.Icon>
              <div>
                <Modal.Heading className="text-sm sm:text-base font-semibold text-foreground">
                  Reset Application Data?
                </Modal.Heading>
                <Typography
                  className="text-xs font-normal mt-0.5"
                  color="muted"
                  type="body-xs"
                >
                  Permanently clear all local data & settings
                </Typography>
              </div>
            </Modal.Header>

            <Modal.Body className="py-2.5 space-y-2">
              <Typography className="text-xs text-muted" type="body-xs">
                This will wipe all your saved focus sessions, streaks,
                achievements, custom wallpapers, task history, and sound
                preferences.
              </Typography>
              <Typography
                className="text-xs text-danger font-medium"
                type="body-xs"
              >
                This action cannot be undone. We recommend exporting a backup
                first if you wish to keep your data.
              </Typography>
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-end gap-2 pt-3 border-t border-separator/30">
              <Button
                className="h-7.5 px-3 rounded-full text-xs font-medium cursor-pointer"
                size="sm"
                variant="secondary"
                onPress={() => setIsResetConfirming(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-7.5 px-3.5 rounded-full text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
                size="sm"
                variant="danger-soft"
                onPress={() => {
                  setIsResetConfirming(false);
                  handleResetAll();
                }}
              >
                <RotateCcw className="size-3.5" />
                <span>Yes, Reset Everything</span>
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
