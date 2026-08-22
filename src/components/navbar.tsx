import { Link } from "@heroui/react";

import { siteConfig } from "@/config/site";
import { GithubIcon } from "@/components/icons";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-separator bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <a
            className="flex items-center gap-2 font-bold text-lg text-foreground tracking-tight"
            href="/"
          >
            <span>Cozify</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            aria-label="GitHub"
            className="text-muted hover:text-foreground transition-colors"
            href={siteConfig.links.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubIcon size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
};
