import { useState } from "react";
import {
  Modal,
  Tabs,
  ScrollShadow,
  Separator,
  Typography,
} from "@heroui/react";
import { Settings as SettingsIcon, Database, Info } from "lucide-react";

import { DataTab } from "./data-tab";
import { AboutTab } from "./about-tab";
import { SessionsLogModal } from "./sessions-log-modal";
import { TasksLogModal } from "./tasks-log-modal";

import { siteConfig } from "@/config/site";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const [selectedTab, setSelectedTab] = useState<string>("data");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isTasksLogModalOpen, setIsTasksLogModalOpen] = useState(false);

  const handleOpenSessionsLog = () => {
    onOpenChange(false);
    setIsLogModalOpen(true);
  };

  const handleCloseSessionsLog = () => {
    setIsLogModalOpen(false);
    setSelectedTab("data");
    onOpenChange(true);
  };

  const handleOpenTasksLog = () => {
    onOpenChange(false);
    setIsTasksLogModalOpen(true);
  };

  const handleCloseTasksLog = () => {
    setIsTasksLogModalOpen(false);
    setSelectedTab("data");
    onOpenChange(true);
  };

  return (
    <>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container size="lg">
          <Modal.Dialog className="sm:max-w-195 md:max-w-210 w-full h-140 max-h-[88vh] flex flex-col overflow-hidden p-0 rounded-3xl border border-border/50">
            <Modal.CloseTrigger />

            <Modal.Header className="px-6 py-4 gap-2.5">
              <Modal.Icon>
                <SettingsIcon className="size-5 text-accent" />
              </Modal.Icon>
              <Modal.Heading className="text-base font-semibold">
                Settings & Preferences
              </Modal.Heading>
            </Modal.Header>
            <Separator />
            <Modal.Body className="p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
              <Tabs
                className="flex-1 min-h-0 h-full flex flex-col sm:flex-row overflow-hidden gap-0"
                orientation="vertical"
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
              >
                {/* Left Column: Vertical Tabs Navigation (fixed width) */}
                <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-border/40 p-3 bg-surface-secondary/40 shrink-0 flex flex-col justify-between">
                  <Tabs.ListContainer className="bg-transparent p-0">
                    <Tabs.List
                      aria-label="Settings Categories"
                      className="flex sm:flex-col gap-1.5 w-full bg-transparent p-0"
                    >
                      <Tabs.Tab
                        className="flex items-center justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium w-full text-left cursor-pointer transition-all hover:bg-surface/70 text-muted data-selected:text-white"
                        id="data"
                      >
                        <Database className="size-4 shrink-0 transition-colors" />
                        <span>Data & Storage</span>
                        <Tabs.Indicator className="rounded-xl bg-accent text-accent-foreground shadow-xs" />
                      </Tabs.Tab>

                      <Tabs.Tab
                        className="flex items-center justify-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium w-full text-left cursor-pointer transition-all hover:bg-surface/70 text-muted data-selected:text-white"
                        id="about"
                      >
                        <Info className="size-4 shrink-0 transition-colors" />
                        <span>About</span>
                        <Tabs.Indicator className="rounded-xl bg-accent text-accent-foreground shadow-xs" />
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>

                  <Typography
                    className="hidden sm:block px-3 py-2 text-[11px] opacity-70 capitalize"
                    color="muted"
                    type="body-xs"
                  >
                    {siteConfig.version}
                  </Typography>
                </div>

                {/* Right Column: Scrollable Panel Container */}
                <ScrollShadow
                  className="flex-1 min-h-0 h-full overflow-y-auto p-6 sm:p-7 bg-background/40"
                  orientation="vertical"
                  size={24}
                >
                  <Tabs.Panel className="p-0 m-0 outline-none" id="data">
                    <DataTab
                      onOpenSessionsLog={handleOpenSessionsLog}
                      onOpenTasksLog={handleOpenTasksLog}
                    />
                  </Tabs.Panel>

                  <Tabs.Panel className="p-0 m-0 outline-none" id="about">
                    <AboutTab />
                  </Tabs.Panel>
                </ScrollShadow>
              </Tabs>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Focus Sessions Log Inspection Modal (Chained Modal) */}
      <SessionsLogModal
        isOpen={isLogModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseSessionsLog();
          } else {
            setIsLogModalOpen(true);
          }
        }}
      />

      {/* Tasks Log Inspection Modal (Chained Modal) */}
      <TasksLogModal
        isOpen={isTasksLogModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseTasksLog();
          } else {
            setIsTasksLogModalOpen(true);
          }
        }}
      />
    </>
  );
}
