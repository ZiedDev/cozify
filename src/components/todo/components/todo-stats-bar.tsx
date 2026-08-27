import { ProgressBar, Button, Typography } from "@heroui/react";
import { Trash2, CheckCircle2 } from "lucide-react";

import { useTodos } from "@/hooks/use-todos";

export function TodoStatsBar() {
  const { stats, clearCompleted } = useTodos();

  if (stats.total === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 w-full pt-3 border-t border-separator/30">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-3.5 text-accent" />
          <Typography color="muted" type="body-xs" className="text-xs">
            <strong className="text-foreground font-medium">
              {stats.completed}
            </strong>{" "}
            of {stats.total} tasks completed ({stats.percentage}%)
          </Typography>
        </div>

        {stats.completed > 0 && (
          <Button
            className="text-[11px] h-6 px-2.5 rounded-lg text-muted/80 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            size="sm"
            variant="ghost"
            onPress={clearCompleted}
          >
            <Trash2 className="size-3 mr-1" />
            Clear Done ({stats.completed})
          </Button>
        )}
      </div>

      {/* Visual Progress Bar */}
      <ProgressBar
        aria-label="Task completion progress"
        value={stats.percentage}
      >
        <ProgressBar.Track className="h-1 bg-surface-secondary/60 rounded-full overflow-hidden border border-separator/30">
          <ProgressBar.Fill className="bg-accent rounded-full transition-all duration-300" />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}
