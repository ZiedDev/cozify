import { useState } from "react";
import { ProgressBar, Button, Typography, Modal } from "@heroui/react";
import { Archive, CheckCircle2 } from "lucide-react";

import { useTodos } from "@/hooks/use-todos";

export function TodoStatsBar() {
  const { stats, clearCompleted } = useTodos();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (stats.total === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-2.5 w-full pt-3 border-t border-separator/30">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-accent" />
            <Typography className="text-xs" color="muted" type="body-xs">
              <strong className="text-foreground font-medium">
                {stats.completed}
              </strong>{" "}
              of {stats.total} tasks completed ({stats.percentage}%)
            </Typography>
          </div>

          {stats.completed > 0 && (
            <Button
              className="text-[11px] h-6 px-2.5 rounded-lg cursor-pointer"
              size="sm"
              variant="secondary"
              onPress={() => setIsConfirmOpen(true)}
            >
              <Archive className="size-3 mr-1 text-muted" />
              Archive Done ({stats.completed})
            </Button>
          )}
        </div>

        {/* Visual Progress Bar */}
        <ProgressBar
          aria-label="Task completion progress"
          value={stats.percentage}
        >
          <ProgressBar.Track className="h-1 bg-surface-secondary/60 rounded-full overflow-hidden border border-separator/30">
            <ProgressBar.Fill className="bg-accent rounded-full transition-[width] duration-300" />
          </ProgressBar.Track>
        </ProgressBar>
      </div>

      {/* Archive Confirmation Modal */}
      <Modal.Backdrop
        isOpen={isConfirmOpen}
        onOpenChange={(open) => !open && setIsConfirmOpen(false)}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-96 space-y-5">
            <Modal.Header className="flex-row items-center gap-3">
              <Modal.Icon>
                <Archive className="text-accent" />
              </Modal.Icon>
              <div>
                <Modal.Heading>Archive Completed Tasks?</Modal.Heading>
                <Typography color="muted" type="body-xs">
                  Move tasks to the archive log
                </Typography>
              </div>
            </Modal.Header>
            <Modal.CloseTrigger />

            <Modal.Body>
              <Typography color="muted" type="body-xs">
                Are you sure you want to archive{" "}
                <strong className="text-foreground font-semibold">
                  {stats.completed}{" "}
                  {stats.completed === 1 ? "completed task" : "completed tasks"}
                </strong>
                ? You can inspect and restore archived tasks at any time from
                Settings &gt; Data &amp; Storage.
              </Typography>
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onPress={() => setIsConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  clearCompleted();
                  setIsConfirmOpen(false);
                }}
              >
                <Archive className="size-3.5" />
                <span>
                  Archive {stats.completed}{" "}
                  {stats.completed === 1 ? "Task" : "Tasks"}
                </span>
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
