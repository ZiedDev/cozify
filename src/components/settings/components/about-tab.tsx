import {
  Card,
  Link,
  Separator,
  Surface,
  Typography,
  Button,
} from "@heroui/react";
import { Download, CheckCircle2 } from "lucide-react";

import { siteConfig } from "@/config/site";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function AboutTab() {
  const { isInstallable, isInstalled, installApp } = usePwaInstall();

  return (
    <div className="space-y-5">
      {/* Header */}
      <Surface variant="transparent">
        <Typography type="h4">About</Typography>
        <Typography color="muted" type="body-sm">
          Your ideal cozy focus & study environment.
        </Typography>
      </Surface>

      {/* PWA Install Card */}
      {(isInstallable || isInstalled) && (
        <Card>
          <Card.Content className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <Typography className="font-semibold text-sm" type="h6">
                {isInstalled ? "Cozify is NOT Installed" : "Install Cozify App"}
              </Typography>
              <Typography color="muted" type="body-xs">
                {isInstalled
                  ? "You are using the installed standalone application."
                  : "Install on your device for fast offline access and a native desktop/mobile experience."}
              </Typography>
            </div>
            {isInstallable && (
              <Button
                className="shrink-0 gap-1.5"
                size="sm"
                variant="primary"
                onPress={installApp}
              >
                <Download className="size-3.5" />
                <span>Install</span>
              </Button>
            )}
            {isInstalled && !isInstallable && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 shrink-0 font-medium">
                <CheckCircle2 className="size-3.5" />
                <span>Installed</span>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      <Card>
        <Card.Content className="space-y-3">
          <Card.Header>
            <Card.Title>
              <Typography className="font-serif" type="h6">
                Cozify
              </Typography>
            </Card.Title>
            <Card.Description>Version {siteConfig.version}</Card.Description>
          </Card.Header>

          <Card.Description>
            Designed for mindful work, deep study sessions, and serene ambient
            productivity.
          </Card.Description>

          <Separator />

          <Card.Footer className="gap-2">
            Created By
            <Link
              className="text-muted hover:text-foreground transition-colors"
              href={siteConfig.links.profile}
              rel="noopener noreferrer"
              target="_blank"
            >
              ZiedDev
            </Link>
          </Card.Footer>
        </Card.Content>
      </Card>
    </div>
  );
}
