import { Card, Link, Typography } from "@heroui/react";
import { FolderGit2 } from "lucide-react";

import { siteConfig } from "@/config/site";

export function AboutTab() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Typography
          className="text-base text-foreground"
          type="h3"
          weight="semibold"
        >
          About Cozify
        </Typography>
        <Typography color="muted" type="body-sm">
          Your ideal cozy focus & study environment.
        </Typography>
      </div>

      <Card className="border border-border/50 bg-surface/40">
        <Card.Content className="space-y-3">
          <div className="flex items-center gap-3">
            <div>
              <Typography
                className="text-sm text-foreground font-serif tracking-tight"
                type="h4"
                weight="bold"
              >
                Cozify
              </Typography>
              <Typography className="text-xs" color="muted" type="body-xs">
                Version {siteConfig.version}
              </Typography>
            </div>
          </div>

          <Typography
            className="text-xs leading-relaxed"
            color="muted"
            type="body-xs"
          >
            Designed for mindful work, deep study sessions, and serene ambient
            productivity.
          </Typography>

          <div className="pt-3 flex flex-wrap items-center gap-4 text-xs border-t border-border/40">
            <Link
              className="flex items-center gap-1.5 text-muted hover:text-foreground text-xs font-medium transition-colors"
              href={siteConfig.links.github}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FolderGit2 className="size-3.5" />
              <span>GitHub Repository</span>
            </Link>

            <Link
              className="flex items-center gap-1.5 text-muted hover:text-foreground text-xs font-medium transition-colors"
              href={siteConfig.links.profile}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>ZiedDev</span>
            </Link>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
