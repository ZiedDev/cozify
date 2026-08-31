import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  TextField,
  Input,
  TextArea,
  Label,
  DatePicker,
  DateField,
  Calendar,
  Typography,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Edit3, Flag, Calendar as CalendarIcon, Tag } from "lucide-react";

import { TodoItem, TodoPriority, PRIORITY_CONFIG, PRESET_TAGS } from "../types";

import { useTodos } from "@/hooks/use-todos";

interface TodoEditModalProps {
  todo: TodoItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TodoEditModal({ todo, isOpen, onClose }: TodoEditModalProps) {
  const { updateTodo } = useTodos();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("none");
  const [dueDate, setDueDate] = useState("");
  const [tag, setTag] = useState<string | undefined>(undefined);

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();

  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setNotes(todo.notes || "");
      setPriority(todo.priority || "none");
      setDueDate(todo.dueDate || "");
      setTag(todo.tag);
    }
  }, [todo]);

  const handleSave = () => {
    if (!todo || !title.trim()) return;

    updateTodo(todo.id, {
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      tag,
    });

    onClose();
  };

  if (!isOpen || !todo) return null;

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-120">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon>
              <Edit3 className="size-5 text-accent" />
            </Modal.Icon>
            <div>
              <Modal.Heading>Edit Task</Modal.Heading>
              <Typography
                className="font-normal mt-0.5"
                color="muted"
                type="body-xs"
              >
                Customize task details, notes, priority, tag, and due date.
              </Typography>
            </div>
          </Modal.Header>

          <Modal.Body className="space-y-4">
            {/* Task Title */}
            <TextField fullWidth name="title" value={title} onChange={setTitle}>
              <Label>Task Title</Label>
              <Input placeholder="What needs to be done?" />
            </TextField>

            {/* Notes */}
            <TextField fullWidth name="notes" value={notes} onChange={setNotes}>
              <Label>Notes & Subtasks (Optional)</Label>
              <TextArea
                className="resize-none"
                placeholder="Add additional context or steps..."
                rows={3}
              />
            </TextField>

            {/* Priority Selection */}
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5">
                <Flag className="size-3.5" />
                <span>Priority</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["none", "low", "medium", "high"] as TodoPriority[]).map(
                  (p) => (
                    <button
                      key={p}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                        priority === p
                          ? "bg-accent/20 border-accent text-accent font-semibold shadow-xs"
                          : "bg-surface-secondary/40 border-separator/30 text-muted hover:text-foreground"
                      }`}
                      type="button"
                      onClick={() => setPriority(p)}
                    >
                      <span
                        className={`size-2 rounded-full ${PRIORITY_CONFIG[p].dotColor}`}
                      />
                      <span>{PRIORITY_CONFIG[p].label}</span>
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Due Date with Quick Shortcuts + Default HeroUI DatePicker */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5" />
                  <span>Due Date</span>
                </Label>
                {dueDate && (
                  <button
                    className="text-[11px] text-danger hover:underline cursor-pointer"
                    type="button"
                    onClick={() => setDueDate("")}
                  >
                    Clear Date
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium border transition-colors text-center cursor-pointer ${
                      dueDate === todayStr
                        ? "bg-accent/20 text-accent border-accent font-semibold"
                        : "bg-surface-secondary/50 border-separator/30 text-foreground hover:bg-surface-secondary"
                    }`}
                    type="button"
                    onClick={() => setDueDate(todayStr)}
                  >
                    Today
                  </button>
                  <button
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium border transition-colors text-center cursor-pointer ${
                      dueDate === tomorrowStr
                        ? "bg-accent/20 text-accent border-accent font-semibold"
                        : "bg-surface-secondary/50 border-separator/30 text-foreground hover:bg-surface-secondary"
                    }`}
                    type="button"
                    onClick={() => setDueDate(tomorrowStr)}
                  >
                    Tomorrow
                  </button>
                </div>

                {/* Default HeroUI DatePicker Component */}
                <DatePicker
                  className="w-full"
                  name="editDueDate"
                  value={dueDate ? parseDate(dueDate) : null}
                  onChange={(val) => setDueDate(val ? val.toString() : "")}
                >
                  <DateField.Group fullWidth>
                    <DateField.Input>
                      {(segment) => <DateField.Segment segment={segment} />}
                    </DateField.Input>
                    <DateField.Suffix>
                      <DatePicker.Trigger>
                        <DatePicker.TriggerIndicator />
                      </DatePicker.Trigger>
                    </DateField.Suffix>
                  </DateField.Group>
                  <DatePicker.Popover className="z-50">
                    <Calendar aria-label="Select Due Date">
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
                          {(day) => (
                            <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                          )}
                        </Calendar.GridHeader>
                        <Calendar.GridBody>
                          {(date) => <Calendar.Cell date={date} />}
                        </Calendar.GridBody>
                      </Calendar.Grid>
                      <Calendar.YearPickerGrid>
                        <Calendar.YearPickerGridBody>
                          {({ year }) => (
                            <Calendar.YearPickerCell year={year} />
                          )}
                        </Calendar.YearPickerGridBody>
                      </Calendar.YearPickerGrid>
                    </Calendar>
                  </DatePicker.Popover>
                </DatePicker>
              </div>
            </div>

            {/* Tag Selection */}
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5">
                <Tag className="size-3.5" />
                <span>Category Tag</span>
              </Label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    !tag
                      ? "bg-accent text-accent-foreground border-accent font-semibold"
                      : "bg-surface-secondary/40 text-muted border-separator/30 hover:text-foreground"
                  }`}
                  type="button"
                  onClick={() => setTag(undefined)}
                >
                  None
                </button>
                {PRESET_TAGS.map((t) => (
                  <button
                    key={t.id}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      tag === t.id
                        ? "bg-accent/20 text-accent border-accent font-semibold"
                        : "bg-surface-secondary/40 text-muted/80 border-separator/30 hover:text-foreground"
                    }`}
                    type="button"
                    onClick={() => setTag(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className="flex items-center justify-end gap-2 pt-2">
            <Button slot="close" variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button
              isDisabled={!title.trim()}
              variant="primary"
              onPress={handleSave}
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
