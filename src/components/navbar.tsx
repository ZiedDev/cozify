import { Link } from "@heroui/react";
import { Code2 } from "lucide-react";

import { siteConfig } from "@/config/site";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto flex h-20 md:h-24 items-center justify-between px-8 md:px-12">
        <a
          className="font-serif font-black text-3xl md:text-4xl tracking-tight text-foreground hover:opacity-90 transition-opacity"
          href="/"
        >
          Cozify
        </a>

        <div className="flex items-center gap-4">
          <Link
            aria-label="Source Code"
            className="p-2.5 rounded-full text-muted hover:text-foreground hover:bg-surface transition-all"
            href={siteConfig.links.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Code2 className="size-6" />
          </Link>
        </div>
      </div>
    </header>
  );
};
