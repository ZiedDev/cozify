import { Card, Link } from "@heroui/react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { FolderGit2 } from "lucide-react";

import { siteConfig } from "@/config/site";

export function AboutTab() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-foreground">
          About Cozify
        </h3>
        <p className="text-muted">Your ideal cozy focus & study environment.</p>
      </div>

      <Card className="border border-border/50 bg-surface/40">
        <Card.Content className="space-y-3">
          <div className="flex items-center gap-3">
            <div>
              <h4 className="text-sm font-bold text-foreground font-serif tracking-tight">
                Cozify
              </h4>
              <p className="text-xs text-muted">Version {siteConfig.version}</p>
            </div>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Designed for mindful work, deep study sessions, and serene ambient
            productivity.
          </p>

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
              <SiGithub className="size-3.5" />
              <span>@ZiedDev</span>
            </Link>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
