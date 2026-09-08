import { Card, Link, Separator, Surface, Typography } from "@heroui/react";

import { siteConfig } from "@/config/site";

export function AboutTab() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <Surface variant="transparent">
        <Typography type="h4">About</Typography>
        <Typography color="muted" type="body-sm">
          Your ideal cozy focus & study environment.
        </Typography>
      </Surface>

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
