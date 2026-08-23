import { useState, useRef } from "react";
import { Button, Card, toast } from "@heroui/react";
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
} from "lucide-react";

import {
  getStorageOverview,
  exportAndDownloadBackup,
  importBackupFromJson,
  resetAllCozifyData,
  StorageOverview,
} from "@/services/data-management";

export function DataTab() {
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
        <h3 className="text-base font-semibold text-foreground">
          Data & Storage Management
        </h3>
        <p className="text-xs text-muted mt-0.5">
          All your data is stored securely in your browser. Export backups or
          restore anytime.
        </p>
      </div>

      {/* Storage Overview Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-border/50 bg-surface/50 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted text-xs font-medium mb-1">
            <Database className="size-3.5" />
            <span>Sessions</span>
          </div>
          <span className="text-lg font-bold text-foreground">
            {stats.sessionsCount}
          </span>
        </div>

        <div className="rounded-xl border border-border/50 bg-surface/50 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted text-xs font-medium mb-1">
            <Clock className="size-3.5" />
            <span>Focus Time</span>
          </div>
          <span className="text-lg font-bold text-foreground">
            {stats.totalFocusMinutes}m
          </span>
        </div>

        <div className="rounded-xl border border-border/50 bg-surface/50 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted text-xs font-medium mb-1">
            <Palette className="size-3.5" />
            <span>Wallpapers</span>
          </div>
          <span className="text-lg font-bold text-foreground">
            {stats.customWallpapersCount}
          </span>
        </div>

        <div className="rounded-xl border border-border/50 bg-surface/50 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted text-xs font-medium mb-1">
            <HardDrive className="size-3.5" />
            <span>Space Used</span>
          </div>
          <span className="text-lg font-bold text-foreground">
            {stats.formattedStorageSize}
          </span>
        </div>
      </div>

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
          {isResetConfirming ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg bg-danger/10 border border-danger/20">
              <span className="text-xs text-danger font-medium">
                Are you sure? This will wipe all local data.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  className="text-xs"
                  size="sm"
                  variant="ghost"
                  onPress={() => setIsResetConfirming(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="text-xs"
                  size="sm"
                  variant="danger"
                  onPress={handleResetAll}
                >
                  Yes, Reset Everything
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="text-xs text-danger hover:bg-danger/10 hover:text-danger flex items-center gap-1.5"
              size="sm"
              variant="tertiary"
              onPress={() => setIsResetConfirming(true)}
            >
              <RotateCcw className="size-3.5" />
              <span>Clear All Data</span>
            </Button>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
