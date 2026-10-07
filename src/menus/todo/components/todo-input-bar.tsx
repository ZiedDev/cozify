import {
  useState,
  useRef,
  useMemo,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  FormEvent,
} from "react";
import { Button, Popover, Calendar, ScrollShadow, cn } from "@heroui/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import {
  Plus,
  Flag,
  Calendar as CalendarIcon,
  Tag as TagIcon,
} from "lucide-react";

import {
  TodoPriority,
  PRIORITY_CONFIG,
  PRIORITY_THEMES,
  PRESET_TAGS,
  getTagIcon,
  getTagInfo,
} from "../types";
import {
  getDateSuggestions,
  parseDateInput,
  formatFriendlyDate,
} from "../logic/date-parser";

import { useTodos } from "@/hooks/use-todos";

interface TriggerState {
  type: "priority" | "tag" | "date";
  query: string;
  startIndex: number;
  endIndex: number;
}

function getTriggerAtCursor(
  text: string,
  cursorPos: number,
): TriggerState | null {
  const textBeforeCursor = text.slice(0, cursorPos);
  const match = textBeforeCursor.match(/(?:^|\s)(!|#|@)([^\s!#@]*)$/);

  if (!match) return null;

  const triggerChar = match[1];
  const query = match[2];
  const matchIndex = textBeforeCursor.lastIndexOf(match[0]);
  const tokenStart = matchIndex + match[0].indexOf(triggerChar);

  let triggerType: TriggerState["type"] = "tag";

  if (triggerChar === "!") triggerType = "priority";
  else if (triggerChar === "@") triggerType = "date";

  return {
    type: triggerType,
    query,
    startIndex: tokenStart,
    endIndex: cursorPos,
  };
}

function applySuggestion(
  currentText: string,
  trigger: TriggerState,
  replacementText: string = "",
): string {
  const before = currentText.slice(0, trigger.startIndex);
  const after = currentText.slice(trigger.endIndex);

  return (before + replacementText + after).replace(/\s\s+/g, " ").trimStart();
}

export function TodoInputBar() {
  const { todos, addTodo, viewMode, selectedTag, selectedPriority } =
    useTodos();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority>(() =>
    selectedPriority &&
    selectedPriority !== "all" &&
    selectedPriority !== "none"
      ? selectedPriority
      : "none",
  );
  const [dueDate, setDueDate] = useState<string>("");
  const [tag, setTag] = useState<string | undefined>(() =>
    selectedTag ? selectedTag.toLowerCase() : undefined,
  );
  const [notes, setNotes] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

  const [activeTrigger, setActiveTrigger] = useState<TriggerState | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  // Sync category & priority when filtering in header
  useEffect(() => {
    if (selectedTag) {
      setTag(selectedTag.toLowerCase());
    } else {
      setTag(undefined);
    }
  }, [selectedTag]);

  useEffect(() => {
    if (
      selectedPriority &&
      selectedPriority !== "all" &&
      selectedPriority !== "none"
    ) {
      setPriority(selectedPriority);
    } else {
      setPriority("none");
    }
  }, [selectedPriority]);

  // Collect all tag options (presets + user custom tags)
  const allTagOptions = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        label: string;
        icon: ReturnType<typeof getTagIcon>;
        color: string;
      }
    >();

    for (const preset of PRESET_TAGS) {
      map.set(preset.id.toLowerCase(), {
        id: preset.id,
        label: preset.label,
        icon: getTagIcon(preset.id),
        color: preset.color,
      });
    }

    for (const item of todos) {
      if (item.tag && !map.has(item.tag.toLowerCase())) {
        const info = getTagInfo(item.tag);

        map.set(item.tag.toLowerCase(), {
          id: item.tag.toLowerCase(),
          label: info?.label || item.tag,
          icon: getTagIcon(item.tag),
          color: info?.color || "text-accent border-accent/40 bg-accent/15",
        });
      }
    }

    return Array.from(map.values());
  }, [todos]);

  // Priority options list (no "none" needed in options)
  const priorityOptions = useMemo(
    () => [
      {
        id: "high" as TodoPriority,
        label: "High Priority",
        color: "text-rose-400",
        dot: "bg-rose-400",
        hint: "!high",
      },
      {
        id: "medium" as TodoPriority,
        label: "Medium Priority",
        color: "text-amber-400",
        dot: "bg-amber-400",
        hint: "!medium",
      },
      {
        id: "low" as TodoPriority,
        label: "Low Priority",
        color: "text-blue-400",
        dot: "bg-blue-400",
        hint: "!low",
      },
    ],
    [],
  );

  const filteredPriorities = useMemo(() => {
    if (!activeTrigger || activeTrigger.type !== "priority") return [];
    const query = activeTrigger.query.toLowerCase().trim();

    if (!query) return priorityOptions;

    return priorityOptions.filter(
      (priorityItem) =>
        priorityItem.id.toLowerCase().startsWith(query) ||
        priorityItem.label.toLowerCase().includes(query) ||
        (query === "h" && priorityItem.id === "high") ||
        (query === "m" && priorityItem.id === "medium") ||
        (query === "l" && priorityItem.id === "low"),
    );
  }, [activeTrigger, priorityOptions]);

  const filteredTags = useMemo(() => {
    if (!activeTrigger || activeTrigger.type !== "tag") return [];
    const query = activeTrigger.query.toLowerCase().trim();
    const matches = query
      ? allTagOptions.filter(
          (tagOption) =>
            tagOption.id.toLowerCase().includes(query) ||
            tagOption.label.toLowerCase().includes(query),
        )
      : allTagOptions;

    if (
      query &&
      !allTagOptions.some((tagOption) => tagOption.id.toLowerCase() === query)
    ) {
      return [
        ...matches,
        {
          id: query,
          label: `#${query}`,
          icon: TagIcon,
          color: "text-accent border-accent/40 bg-accent/15",
          isCustom: true,
        },
      ];
    }

    return matches;
  }, [activeTrigger, allTagOptions]);

  // Quick Date suggestions list
  const dateSuggestionsList = useMemo(() => getDateSuggestions(), []);

  const filteredDates = useMemo(() => {
    if (!activeTrigger || activeTrigger.type !== "date") return [];
    const query = activeTrigger.query.toLowerCase().trim();

    if (!query) return dateSuggestionsList;

    const parsedDirect = parseDateInput(query);
    const matches = dateSuggestionsList.filter(
      (item) =>
        item.id.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query) ||
        item.hint.toLowerCase().includes(query) ||
        item.badge.toLowerCase().includes(query),
    );

    if (
      parsedDirect &&
      !matches.some((item) => item.dateValue === parsedDirect.dateValue)
    ) {
      return [
        {
          id: query,
          label: parsedDirect.label,
          dateValue: parsedDirect.dateValue,
          hint: `@${query}`,
          badge: parsedDirect.label,
        },
        ...matches,
      ];
    }

    return matches;
  }, [activeTrigger, dateSuggestionsList]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeTrigger?.query, activeTrigger?.type]);

  const parseInlineTokens = (text: string) => {
    let detectedPriority: TodoPriority | null = null;
    let detectedTag: string | null = null;
    let detectedDate: string | null = null;

    const pMatch = text.match(/(?:^|\s)!(high|medium|med|low|h|m|l)\b/i);

    if (pMatch) {
      const raw = pMatch[1].toLowerCase();

      if (raw === "high" || raw === "h") detectedPriority = "high";
      else if (raw === "medium" || raw === "med" || raw === "m")
        detectedPriority = "medium";
      else if (raw === "low" || raw === "l") detectedPriority = "low";
    }

    const tMatch = text.match(/(?:^|\s)#([a-zA-Z0-9_-]+)\b/i);

    if (tMatch) {
      detectedTag = tMatch[1].toLowerCase();
    }

    const dMatch = text.match(
      /(?:^|\s)@([a-zA-Z0-9_:-]+(?:\+[a-zA-Z0-9_:-]+)?)\b/i,
    );

    if (dMatch) {
      const parsed = parseDateInput(dMatch[1]);

      if (parsed) {
        detectedDate = parsed.dateValue;
      }
    }

    return { detectedPriority, detectedTag, detectedDate };
  };

  const selectPriority = (targetPriority: TodoPriority) => {
    if (activeTrigger) {
      const token = `!${targetPriority}`;
      const newTitle = applySuggestion(title, activeTrigger, token);

      setTitle(newTitle);
      setActiveTrigger(null);
    } else {
      // Manual selection from menu/popover
      if (priority === targetPriority) {
        // Toggle off
        const newTitle = title
          .replace(/(?:^|\s)!(high|medium|med|low|h|m|l)\b/gi, "")
          .replace(/\s\s+/g, " ")
          .trim();

        setTitle(newTitle);
        setPriority(
          selectedPriority &&
            selectedPriority !== "all" &&
            selectedPriority !== "none"
            ? selectedPriority
            : "none",
        );

        return;
      }
      const pMatch = title.match(/(?:^|\s)!(high|medium|med|low|h|m|l)\b/i);
      let newTitle = title;

      if (pMatch) {
        newTitle = title.replace(pMatch[0], ` !${targetPriority}`);
      } else {
        newTitle = `${title.trimEnd()} !${targetPriority}`.trimStart();
      }
      setTitle(newTitle);
    }
    setPriority(targetPriority);
    inputRef.current?.focus();
  };

  const selectTag = (selectedTagId?: string) => {
    if (!selectedTagId) {
      const newTitle = title
        .replace(/(?:^|\s)#[a-zA-Z0-9_-]+\b/gi, "")
        .replace(/\s\s+/g, " ")
        .trim();

      setTitle(newTitle);
      setTag(selectedTag ? selectedTag.toLowerCase() : undefined);

      return;
    }

    if (activeTrigger) {
      const token = `#${selectedTagId}`;
      const newTitle = applySuggestion(title, activeTrigger, token);

      setTitle(newTitle);
      setActiveTrigger(null);
    } else {
      if (tag === selectedTagId) {
        const newTitle = title
          .replace(/(?:^|\s)#[a-zA-Z0-9_-]+\b/gi, "")
          .replace(/\s\s+/g, " ")
          .trim();

        setTitle(newTitle);
        setTag(selectedTag ? selectedTag.toLowerCase() : undefined);

        return;
      }
      const tMatch = title.match(/(?:^|\s)#[a-zA-Z0-9_-]+\b/i);
      let newTitle = title;

      if (tMatch) {
        newTitle = title.replace(tMatch[0], ` #${selectedTagId}`);
      } else {
        newTitle = `${title.trimEnd()} #${selectedTagId}`.trimStart();
      }
      setTitle(newTitle);
    }
    setTag(selectedTagId);
    inputRef.current?.focus();
  };

  const selectDate = (dateValue?: string, hintToken?: string) => {
    if (!dateValue) {
      const newTitle = title
        .replace(
          /(?:^|\s)@[a-zA-Z0-9_:-]+(?:\+[a-zA-Z0-9_:-]+)?(?:\s+(?:[0-9]{1,2}(?::[0-9]{2})?(?:am|pm)?|[0-9]{1,2}:[0-9]{2}))?/gi,
          "",
        )
        .replace(/\s\s+/g, " ")
        .trim();

      setTitle(newTitle);
      setDueDate("");

      return;
    }

    const token = hintToken || `@${dateValue}`;

    if (activeTrigger && activeTrigger.type === "date") {
      const newTitle = applySuggestion(title, activeTrigger, token);

      setTitle(newTitle);
      setActiveTrigger(null);
    } else {
      if (dueDate === dateValue) {
        // Toggle off
        const newTitle = title
          .replace(
            /(?:^|\s)@[a-zA-Z0-9_:-]+(?:\+[a-zA-Z0-9_:-]+)?(?:\s+(?:[0-9]{1,2}(?::[0-9]{2})?(?:am|pm)?|[0-9]{1,2}:[0-9]{2}))?/gi,
            "",
          )
          .replace(/\s\s+/g, " ")
          .trim();

        setTitle(newTitle);
        setDueDate("");

        return;
      }
      const atMatch = title.match(
        /(?:^|\s)@[a-zA-Z0-9_:-]+(?:\+[a-zA-Z0-9_:-]+)?/i,
      );
      let newTitle = title;

      if (atMatch) {
        newTitle = title.replace(atMatch[0], ` ${token}`);
      } else {
        newTitle = `${title.trimEnd()} ${token}`.trimStart();
      }
      setTitle(newTitle);
    }
    setDueDate(dateValue);
    inputRef.current?.focus();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    setTitle(inputValue);

    const { detectedPriority, detectedTag, detectedDate } =
      parseInlineTokens(inputValue);

    if (detectedPriority) {
      setPriority(detectedPriority);
    } else if (!inputValue.includes("!")) {
      setPriority(
        selectedPriority &&
          selectedPriority !== "all" &&
          selectedPriority !== "none"
          ? selectedPriority
          : "none",
      );
    }

    if (detectedTag) {
      setTag(detectedTag);
    } else if (!inputValue.includes("#")) {
      setTag(selectedTag ? selectedTag.toLowerCase() : undefined);
    }

    if (detectedDate) {
      setDueDate(detectedDate);
    } else if (!inputValue.includes("@")) {
      setDueDate("");
    }

    const cursorPos = event.target.selectionStart ?? inputValue.length;
    const trigger = getTriggerAtCursor(inputValue, cursorPos);

    setActiveTrigger(trigger);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (activeTrigger) {
      const itemsCount =
        activeTrigger.type === "priority"
          ? filteredPriorities.length
          : activeTrigger.type === "tag"
            ? filteredTags.length
            : filteredDates.length;

      if (itemsCount > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelectedIndex((prevIndex) => (prevIndex + 1) % itemsCount);

          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelectedIndex(
            (prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount,
          );

          return;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          if (activeTrigger.type === "priority") {
            const selected = filteredPriorities[selectedIndex];

            if (selected) {
              selectPriority(selected.id);

              return;
            }
          } else if (activeTrigger.type === "tag") {
            const selected = filteredTags[selectedIndex];

            if (selected) {
              selectTag(selected.id);

              return;
            }
          } else if (activeTrigger.type === "date") {
            const selected = filteredDates[selectedIndex];

            if (selected) {
              selectDate(selected.dateValue, selected.hint);

              return;
            }
          }
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setActiveTrigger(null);

          return;
        }
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAdd();
    }
  };

  const handleAdd = (event?: FormEvent) => {
    if (event) event.preventDefault();
    let cleanTitle = title.trim();

    if (!cleanTitle) return;

    let finalPriority: TodoPriority = priority;
    let finalTag: string | undefined = tag;
    let finalDueDate: string | undefined = dueDate || undefined;

    // Parse inline !priority token
    const pMatch = cleanTitle.match(
      /(?:^|\s)!(high|medium|med|low|none|h|m|l)\b/i,
    );

    if (pMatch) {
      const raw = pMatch[1].toLowerCase();

      if (raw === "high" || raw === "h") finalPriority = "high";
      else if (raw === "medium" || raw === "med" || raw === "m")
        finalPriority = "medium";
      else if (raw === "low" || raw === "l") finalPriority = "low";
      else if (raw === "none") finalPriority = "none";
      cleanTitle = cleanTitle.replace(pMatch[0], " ").trim();
    }

    // Parse inline #tag token
    const tMatch = cleanTitle.match(/(?:^|\s)#([a-zA-Z0-9_-]+)\b/);

    if (tMatch) {
      finalTag = tMatch[1].toLowerCase();
      cleanTitle = cleanTitle.replace(tMatch[0], " ").trim();
    }

    // Parse inline @date token
    const dMatch = cleanTitle.match(
      /(?:^|\s)@([a-zA-Z0-9_:-]+(?:\+[a-zA-Z0-9_:-]+)?)\b/,
    );

    if (dMatch) {
      const parsed = parseDateInput(dMatch[1]);

      if (parsed) {
        finalDueDate = parsed.dateValue;
      }
      cleanTitle = cleanTitle.replace(dMatch[0], " ").trim();
    }

    if (!cleanTitle) return;

    addTodo({
      title: cleanTitle,
      priority: finalPriority,
      dueDate: finalDueDate,
      tag: finalTag,
      notes: notes.trim() || undefined,
    });

    // Reset fields
    setTitle("");
    setPriority(
      selectedPriority &&
        selectedPriority !== "all" &&
        selectedPriority !== "none"
        ? selectedPriority
        : "none",
    );
    setDueDate("");
    setTag(selectedTag ? selectedTag.toLowerCase() : undefined);
    setNotes("");
    setActiveTrigger(null);
    setIsExpanded(false);
  };

  const renderHighlightedTokens = (text: string) => {
    if (!text) return null;
    const parts = text.split(
      /(!(?:high|medium|med|low|h|m|l)\b|#[a-zA-Z0-9_-]+\b|@[a-zA-Z0-9_:-]+(?:\+[a-zA-Z0-9_:-]+)?\b)/gi,
    );

    return parts.map((part, index) => {
      const lower = part.toLowerCase();

      if (lower === "!high" || lower === "!h") {
        return (
          <span key={index} className="text-rose-400 font-medium">
            {part}
          </span>
        );
      }
      if (lower === "!medium" || lower === "!med" || lower === "!m") {
        return (
          <span key={index} className="text-amber-400 font-medium">
            {part}
          </span>
        );
      }
      if (lower === "!low" || lower === "!l") {
        return (
          <span key={index} className="text-blue-400 font-medium">
            {part}
          </span>
        );
      }
      if (/^#[a-zA-Z0-9_-]+$/.test(part)) {
        return (
          <span key={index} className="text-accent font-medium">
            {part}
          </span>
        );
      }
      if (/^@[a-zA-Z0-9_:-]+(?:\+[a-zA-Z0-9_:-]+)?$/i.test(part)) {
        return (
          <span key={index} className="text-emerald-400 font-medium">
            {part}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();

  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

  const hasExtraConfig =
    priority !== "none" || Boolean(dueDate) || Boolean(tag) || Boolean(notes);

  const ActiveTagIcon = tag ? getTagIcon(tag) : TagIcon;
  const activeTagMeta = tag ? getTagInfo(tag) : null;

  const showSuggestions =
    Boolean(activeTrigger) &&
    (activeTrigger?.type === "priority"
      ? filteredPriorities.length > 0
      : activeTrigger?.type === "tag"
        ? filteredTags.length > 0
        : filteredDates.length > 0);

  return (
    <form
      className="relative z-30 flex flex-col gap-2.5 w-full rounded-2xl bg-surface p-2.5 md:p-3 border border-separator/40 shadow-sm transition-colors focus-within:border-accent/60 shrink-0"
      onSubmit={handleAdd}
    >
      {/* Smart Trigger Popover opening from BOTTOM */}
      {showSuggestions && (
        <div
          aria-label="Quick autocomplete suggestions"
          className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-surface/98 backdrop-blur-xl border border-separator rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-muted border-b border-separator/30 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              {activeTrigger?.type === "priority" ? (
                <>
                  <Flag className="size-3 text-accent" />
                  <span>Priority (Limit 1)</span>
                </>
              ) : activeTrigger?.type === "tag" ? (
                <>
                  <TagIcon className="size-3 text-accent" />
                  <span>Category Tag</span>
                </>
              ) : (
                <>
                  <CalendarIcon className="size-3 text-accent" />
                  <span>Due Date</span>
                </>
              )}
            </span>
          </div>

          <ScrollShadow
            className="flex flex-col gap-1 max-h-52 overflow-y-auto no-scrollbar py-0.5"
            orientation="vertical"
            size={24}
          >
            {activeTrigger?.type === "priority"
              ? filteredPriorities.map((item, itemIndex) => {
                  const isFocused = itemIndex === selectedIndex;

                  return (
                    <Button
                      key={item.id}
                      ref={isFocused ? selectedItemRef : null}
                      className={cn(
                        "w-full justify-between text-muted shrink-0 text-xs",
                        isFocused && "bg-accent-soft font-semibold",
                      )}
                      size="sm"
                      variant="secondary"
                      onClick={() => selectPriority(item.id)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                    >
                      <span className={item.color}>{item.label}</span>
                      <span className="text-[10px] text-muted/50 font-mono">
                        {item.hint}
                      </span>
                    </Button>
                  );
                })
              : activeTrigger?.type === "tag"
                ? filteredTags.map((item, itemIndex) => {
                    const isFocused = itemIndex === selectedIndex;
                    const ItemIcon = item.icon;
                    const info = getTagInfo(item.id);

                    return (
                      <Button
                        key={item.id}
                        ref={isFocused ? selectedItemRef : null}
                        className={cn(
                          "w-full justify-between text-muted shrink-0 text-xs",
                          isFocused &&
                            "bg-accent-soft text-accent font-semibold",
                        )}
                        size="sm"
                        variant="secondary"
                        onClick={() => selectTag(item.id)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ItemIcon
                            className={cn(
                              "size-3.5 shrink-0",
                              info?.textClass || "text-accent",
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span className="text-[10px] text-muted/50 font-mono">
                          #{item.id}
                        </span>
                      </Button>
                    );
                  })
                : filteredDates.map((item, itemIndex) => {
                    const isFocused = itemIndex === selectedIndex;

                    return (
                      <Button
                        key={item.id}
                        ref={isFocused ? selectedItemRef : null}
                        className={cn(
                          "w-full justify-between text-muted shrink-0 text-xs",
                          isFocused &&
                            "bg-accent-soft text-accent font-semibold",
                        )}
                        size="sm"
                        variant="secondary"
                        onClick={() => selectDate(item.dateValue, item.hint)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CalendarIcon className="size-3.5 text-accent shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span className="text-[10px] text-muted/50 font-mono">
                          {item.hint}
                        </span>
                      </Button>
                    );
                  })}
          </ScrollShadow>
        </div>
      )}

      <div className="flex items-center gap-2 w-full">
        {/* Input with live syntax highlight overlay */}
        <div className="relative flex-1 flex items-center min-w-0">
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center px-1 text-sm md:text-base pointer-events-none whitespace-pre overflow-hidden font-sans select-none leading-normal"
          >
            {title ? (
              renderHighlightedTokens(title)
            ) : (
              <span className="text-muted/60">
                Add a new task... (type ! priority, # tag, @ date)
              </span>
            )}
          </div>

          <input
            ref={inputRef}
            className="relative z-10 w-full bg-transparent border-none text-sm md:text-base text-transparent caret-foreground px-1 py-1.5 focus:outline-none placeholder:text-transparent font-sans leading-normal"
            placeholder="Add a new task... (type ! priority, # tag, @ date)"
            value={title}
            onChange={handleChange}
            onFocus={() => {
              if (viewMode === "detailed") setIsExpanded(true);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <Button
          isIconOnly
          aria-label="Add task"
          className="size-8 md:size-9 rounded-xl bg-accent text-accent-foreground shrink-0 shadow-xs cursor-pointer hover:opacity-90 active:scale-95 transition-[opacity,transform]"
          isDisabled={!title.trim()}
          size="sm"
          type="submit"
        >
          <Plus className="size-4 stroke-[2.5]" />
        </Button>
      </div>

      {/* Expanded Actions Row */}
      {(isExpanded || viewMode === "detailed" || hasExtraConfig) && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority Popover */}
          <Popover>
            <Popover.Trigger>
              <Button
                aria-label={
                  priority !== "none"
                    ? `Priority: ${PRIORITY_THEMES[priority]?.label || priority}`
                    : "Set priority"
                }
                className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                  priority !== "none"
                    ? `${PRIORITY_THEMES[priority]?.badgeClass || "bg-accent/15 text-accent border-accent/40"} shadow-2xs`
                    : "bg-surface-secondary/60 hover:bg-surface border-separator/40 text-muted hover:text-foreground"
                }`}
                size="sm"
                variant="ghost"
              >
                <Flag
                  className={`size-3 shrink-0 ${
                    priority === "high"
                      ? "text-rose-400 fill-rose-400/30"
                      : priority === "medium"
                        ? "text-amber-400 fill-amber-400/30"
                        : priority === "low"
                          ? "text-blue-400 fill-blue-400/30"
                          : "opacity-80"
                  }`}
                />
                <span>
                  {priority === "none"
                    ? "Priority"
                    : PRIORITY_CONFIG[priority].label}
                </span>
              </Button>
            </Popover.Trigger>
            <Popover.Content placement="bottom start">
              <Popover.Dialog className="p-1.5 rounded-xl bg-surface border border-separator shadow-lg flex flex-col gap-0.5 min-w-36 z-50">
                <button
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                    priority === "none"
                      ? "bg-accent/15 text-accent font-semibold"
                      : "hover:bg-surface-secondary/60 text-foreground"
                  }`}
                  type="button"
                  onClick={() => selectPriority("none")}
                >
                  <Flag className="size-3.5 opacity-60 shrink-0 text-muted" />
                  <span>No Priority</span>
                </button>
                {(["high", "medium", "low"] as TodoPriority[]).map((pOpt) => {
                  const isSelected = priority === pOpt;
                  const cfg = PRIORITY_CONFIG[pOpt];

                  return (
                    <button
                      key={pOpt}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-accent/15 text-accent font-semibold"
                          : "hover:bg-surface-secondary/60 text-foreground"
                      }`}
                      type="button"
                      onClick={() => selectPriority(pOpt)}
                    >
                      <span
                        className={`size-2 rounded-full shrink-0 ${cfg.dotColor}`}
                      />
                      <span className={cfg.color}>{cfg.label}</span>
                    </button>
                  );
                })}
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          {/* Tag Popover */}
          <Popover>
            <Popover.Trigger>
              <Button
                aria-label={
                  tag ? `Tag: ${activeTagMeta?.label || tag}` : "Set tag"
                }
                className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                  tag
                    ? `${activeTagMeta?.color || "bg-accent/15 text-accent border-accent/40"} shadow-2xs`
                    : "bg-surface-secondary/60 hover:bg-surface border-separator/40 text-muted hover:text-foreground"
                }`}
                size="sm"
                variant="ghost"
              >
                <ActiveTagIcon className="size-3 shrink-0 opacity-90" />
                <span>{tag ? activeTagMeta?.label || tag : "Tag"}</span>
              </Button>
            </Popover.Trigger>
            <Popover.Content placement="bottom start">
              <Popover.Dialog className="p-1.5 rounded-xl bg-surface border border-separator shadow-lg flex flex-col gap-0.5 min-w-36 z-50">
                <ScrollShadow
                  className="max-h-44 overflow-y-auto flex flex-col gap-0.5 no-scrollbar p-0.5"
                  orientation="vertical"
                  size={16}
                >
                  <button
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                      !tag
                        ? "bg-accent/15 text-accent font-semibold"
                        : "hover:bg-surface-secondary/60 text-foreground"
                    }`}
                    type="button"
                    onClick={() => selectTag(undefined)}
                  >
                    <TagIcon className="size-3.5 opacity-60 shrink-0 text-muted" />
                    <span>No Tag</span>
                  </button>
                  {allTagOptions.map((tagOption) => {
                    const TagIconComp = tagOption.icon;
                    const isSelected =
                      tag?.toLowerCase() === tagOption.id.toLowerCase();

                    return (
                      <button
                        key={tagOption.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-left cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-accent/15 text-accent font-semibold"
                            : "hover:bg-surface-secondary/60 text-foreground"
                        }`}
                        type="button"
                        onClick={() => selectTag(tagOption.id)}
                      >
                        <TagIconComp className="size-3.5 opacity-80 shrink-0" />
                        <span>{tagOption.label}</span>
                      </button>
                    );
                  })}
                </ScrollShadow>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          {/* Due Date Popover */}
          <Popover>
            <Popover.Trigger>
              <Button
                className={cn(
                  "h-7 text-xs font-medium shrink-0",
                  dueDate
                    ? "bg-accent-soft text-accent font-semibold"
                    : "text-muted",
                )}
                size="sm"
                variant="secondary"
              >
                <CalendarIcon
                  className={cn(
                    "size-3",
                    dueDate ? "text-accent" : "text-muted",
                  )}
                />
                <span>
                  {dueDate ? formatFriendlyDate(dueDate) : "Due Date"}
                </span>
              </Button>
            </Popover.Trigger>
            <Popover.Content>
              <Popover.Dialog className="flex flex-col gap-1.5 min-w-56 z-50 p-1.5">
                <div className="flex items-center gap-1 pb-1 border-b border-separator/30">
                  <Button
                    className={cn(
                      "flex-1 text-xs h-6 px-1.5",
                      dueDate.startsWith(todayStr)
                        ? "bg-accent-soft text-accent font-semibold"
                        : "text-muted",
                    )}
                    size="sm"
                    variant="secondary"
                    onClick={() => selectDate(todayStr, "@today")}
                  >
                    Today
                  </Button>
                  <Button
                    className={cn(
                      "flex-1 text-xs h-6 px-1.5",
                      dueDate.startsWith(tomorrowStr)
                        ? "bg-accent-soft text-accent font-semibold"
                        : "text-muted",
                    )}
                    size="sm"
                    variant="secondary"
                    onClick={() => selectDate(tomorrowStr, "@tomorrow")}
                  >
                    Tomorrow
                  </Button>
                  {dueDate && (
                    <Button
                      className="text-danger text-xs h-6 px-1.5"
                      size="sm"
                      variant="ghost"
                      onClick={() => selectDate(undefined)}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <Calendar
                  aria-label="Pick due date"
                  className="p-0 bg-transparent w-full"
                  value={
                    dueDate
                      ? parseDate(dueDate.slice(0, 10))
                      : today(getLocalTimeZone())
                  }
                  onChange={(selectedDate) =>
                    selectDate(
                      selectedDate ? selectedDate.toString() : undefined,
                    )
                  }
                >
                  <Calendar.Header>
                    <Calendar.YearPickerTrigger>
                      <Calendar.YearPickerTriggerHeading />
                      <Calendar.YearPickerTriggerIndicator />
                    </Calendar.YearPickerTrigger>
                    <Calendar.NavButton slot="previous" />
                    <Calendar.NavButton slot="next" />
                  </Calendar.Header>
                  <Calendar.Grid>
                    <Calendar.GridHeader>
                      {(dayName) => (
                        <Calendar.HeaderCell>{dayName}</Calendar.HeaderCell>
                      )}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(calendarDate) => <Calendar.Cell date={calendarDate} />}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                  <Calendar.YearPickerGrid>
                    <Calendar.YearPickerGridBody>
                      {({ year: calendarYear }) => (
                        <Calendar.YearPickerCell year={calendarYear} />
                      )}
                    </Calendar.YearPickerGridBody>
                  </Calendar.YearPickerGrid>
                </Calendar>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>
      )}
    </form>
  );
}
