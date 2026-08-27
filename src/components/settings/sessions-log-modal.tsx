import { useState, useMemo } from "react";
import {
  Modal,
  Input,
  ScrollShadow,
  Separator,
  InputGroup,
  Typography,
} from "@heroui/react";
import {
  History,
  Search,
  Calendar,
  Clock,
  Zap,
  FileText,
  Target,
} from "lucide-react";

import {
  storageAdapter,
  STORAGE_KEYS,
  SessionRecord,
} from "@/services/storage";
import { formatMinutesDisplay } from "@/components/stats/logic/stats-calculator";

interface SessionsLogModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionsLogModal({
  isOpen,
  onOpenChange,
}: SessionsLogModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const sessions = useMemo<SessionRecord[]>(() => {
    if (!isOpen) return [];

    return storageAdapter.getItem<SessionRecord[]>(
      STORAGE_KEYS.SESSIONS_HISTORY,
      [],
    );
  }, [isOpen]);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) return sessions;

    return sessions.filter((s) => {
      const matchTitle = (s.title || "").toLowerCase().includes(q);
      const matchNotes = (s.notes || "").toLowerCase().includes(q);

      return matchTitle || matchNotes;
    });
  }, [sessions, searchQuery]);

  const totalFocusMinutes = useMemo(
    () =>
      sessions.reduce(
        (acc, s) =>
          acc +
          (Number(s.focusMinutes) || 0) +
          (Number(s.overtimeMinutes) || 0),
        0,
      ),
    [sessions],
  );

  const totalCycles = useMemo(
    () =>
      sessions.reduce(
        (acc, s) =>
          acc + (Number(s.cyclesCompleted ?? s.sprintsCompleted) || 0),
        0,
      ),
    [sessions],
  );

  const formatSessionDateTime = (dateVal?: number | string) => {
    if (!dateVal) return { date: "—", time: "—" };
    try {
      const d = new Date(dateVal);
      const date = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const time = d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });

      return { date, time };
    } catch {
      return { date: "—", time: "—" };
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="lg">
        <Modal.Dialog className="sm:max-w-195 md:max-w-210 w-full h-140 max-h-[88vh] flex flex-col overflow-hidden p-0 rounded-3xl border border-border/50">
          <Modal.CloseTrigger />

          {/* Modal Header */}
          <Modal.Header className="px-6 py-4 gap-2.5">
            <Modal.Icon>
              <History className="size-5 text-accent" />
            </Modal.Icon>
            <Modal.Heading className="text-base font-semibold">
              Focus Sessions Log
            </Modal.Heading>
          </Modal.Header>

          <Separator />

          {/* Modal Body: Matching 2-Column Split Structure of Settings Modal */}
          <Modal.Body className="p-0 overflow-hidden flex-1 min-h-0 flex flex-col sm:flex-row gap-0">
            {/* Left Sidebar: Search & Summary Stats (matching w-full sm:w-56) */}
            <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-border/40 p-4 bg-surface-secondary/40 shrink-0 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3.5">
                {/* Search Bar */}
                <div className="flex flex-col gap-1.5">
                  <Typography
                    color="muted"
                    type="body-xs"
                    weight="medium"
                    className="text-[11px] uppercase tracking-wider"
                  >
                    Search
                  </Typography>
                  <InputGroup fullWidth>
                    <InputGroup.Prefix>
                      <Search className="size-3.5 text-muted" />
                    </InputGroup.Prefix>
                    <Input
                      className="text-xs bg-surface"
                      placeholder="Filter title or notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>
                </div>

                <Separator />

                {/* Summary Stats Breakdown */}
                <div className="flex flex-col gap-2">
                  <Typography
                    color="muted"
                    type="body-xs"
                    weight="medium"
                    className="text-[11px] uppercase tracking-wider"
                  >
                    Summary
                  </Typography>

                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-surface/70 border border-separator/30">
                      <Typography color="muted" type="body-xs">Total Sessions</Typography>
                      <Typography type="body-xs" weight="semibold" className="text-foreground tabular-nums">
                        {sessions.length}
                      </Typography>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-surface/70 border border-separator/30">
                      <Typography color="muted" type="body-xs">Total Focus</Typography>
                      <Typography type="body-xs" weight="semibold" className="text-accent tabular-nums">
                        {formatMinutesDisplay(totalFocusMinutes)}
                      </Typography>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-surface/70 border border-separator/30">
                      <Typography color="muted" type="body-xs">Total Cycles</Typography>
                      <Typography type="body-xs" weight="semibold" className="text-purple-400 tabular-nums">
                        {totalCycles}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>

              {/* Read-only footer note */}
              <Typography color="muted" type="body-xs" className="px-1 text-[11px] opacity-70">
                Read-only inspection log of all completed Pomodoro sessions.
              </Typography>
            </div>

            {/* Right Panel: Scrollable Session Records List */}
            <ScrollShadow
              className="flex-1 min-h-0 h-full overflow-y-auto p-6 sm:p-7 bg-background/40"
              orientation="vertical"
              size={24}
            >
              {filteredSessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center text-muted">
                  <div className="size-12 rounded-2xl bg-surface-secondary flex items-center justify-center mb-3">
                    <History className="size-6 text-muted/60" />
                  </div>
                  <Typography type="body-sm" weight="semibold" className="text-foreground">
                    {searchQuery
                      ? "No matching sessions found"
                      : "No sessions recorded yet"}
                  </Typography>
                  <Typography color="muted" type="body-xs" className="mt-1 max-w-xs opacity-70">
                    {searchQuery
                      ? "Try searching for a different keyword."
                      : "Complete your first focus session to see it logged here."}
                  </Typography>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSessions.map((s) => {
                    const { date, time } = formatSessionDateTime(s.createdAt);
                    const totalMins =
                      (Number(s.focusMinutes) || 0) +
                      (Number(s.overtimeMinutes) || 0);
                    const cycleCount = s.cyclesCompleted ?? s.sprintsCompleted;

                    return (
                      <div
                        key={s.id}
                        className="flex flex-col gap-2 p-3.5 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-all select-none"
                      >
                        {/* Top Row: Title, Date & Time, Duration Pill */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                            <Typography
                              truncate
                              type="body-sm"
                              weight="semibold"
                              className="text-xs sm:text-sm text-foreground"
                            >
                              {s.title || "Focus Session"}
                            </Typography>
                            <div className="flex items-center gap-2.5 text-[11px] text-muted font-light mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3 text-accent" />
                                <span>{date}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3 text-muted" />
                                <span>{time}</span>
                              </span>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent tabular-nums shrink-0">
                            {formatMinutesDisplay(totalMins)}
                          </span>
                        </div>

                        {/* Sub-details row: Cycles, Overtime */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] pt-0.5">
                          {cycleCount !== undefined && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-secondary text-muted border border-separator/30">
                              <Target className="size-3 text-purple-400" />
                              <span>
                                {cycleCount}{" "}
                                {cycleCount === 1 ? "cycle" : "cycles"}
                              </span>
                            </span>
                          )}

                          {s.overtimeMinutes !== undefined &&
                            s.overtimeMinutes > 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Zap className="size-3" />
                                <span>
                                  +{formatMinutesDisplay(s.overtimeMinutes)}{" "}
                                  overtime
                                </span>
                              </span>
                            )}
                        </div>

                        {/* Optional Notes */}
                        {s.notes && (
                          <div className="flex items-start gap-1.5 p-2 rounded-xl bg-surface-secondary/50 border border-separator/20 text-xs text-foreground/80 mt-1">
                            <FileText className="size-3.5 text-muted shrink-0 mt-0.5" />
                            <Typography type="body-xs" className="leading-relaxed whitespace-pre-wrap">
                              {s.notes}
                            </Typography>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollShadow>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
