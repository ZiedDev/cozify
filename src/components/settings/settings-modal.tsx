import { useState } from "react";
import { Modal, Tabs, ScrollShadow, Typography, Surface } from "@heroui/react";
import { Settings, Database, Sliders, Info } from "lucide-react";

import { GeneralTab } from "./components/general-tab";
import { DataTab } from "./components/data-tab";
import { AboutTab } from "./components/about-tab";
import { SessionsLogModal } from "./components/sessions-log-modal";
import { TasksLogModal } from "./components/tasks-log-modal";

import { siteConfig } from "@/config/site";

export function SettingsModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedTab, setSelectedTab] = useState<string>("general");
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

  if (!isOpen && !isLogModalOpen && !isTasksLogModalOpen) return null;

  return (
    <>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container size="lg">
          <Modal.Dialog className="max-sm:mt-0! md:max-w-250 sm:h-140 max-h-[88vh] shadow-2xl space-y-5">
            <Modal.Header className="flex-row items-center gap-3">
              <Modal.Icon>
                <Settings className="text-accent" />
              </Modal.Icon>
              <div>
                <Modal.Heading>Settings</Modal.Heading>
                <Typography color="muted" type="body-xs">
                  Preferences & workspace management
                </Typography>
              </div>
            </Modal.Header>
            <Modal.CloseTrigger />
            <Modal.Body>
              <Tabs
                className="h-full sm:flex-row"
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
              >
                {/* Responsive Tabs Navigation: Horizontal on mobile, vertical sidebar on desktop */}
                <Surface className="px-0 py-0 flex sm:flex-col justify-between sm:items-stretch">
                  <Tabs.ListContainer className="bg-transparent p-0 w-full">
                    <Tabs.List
                      aria-label="Settings Categories"
                      className="sm:flex-col space-y-5"
                    >
                      <Tabs.Tab
                        className="p-6 sm:justify-start gap-2"
                        id="general"
                      >
                        <Sliders className="size-4 shrink-0" />
                        <Typography type="body">General</Typography>
                        <Tabs.Indicator className="bg-accent" />
                      </Tabs.Tab>

                      <Tabs.Tab
                        className="p-6 sm:justify-start gap-2"
                        id="data"
                      >
                        <Database className="size-4 shrink-0" />
                        <Typography type="body">Data</Typography>
                        <Tabs.Indicator className="bg-accent" />
                      </Tabs.Tab>

                      <Tabs.Tab
                        className="p-6 sm:justify-start gap-2"
                        id="about"
                      >
                        <Info className="size-4" />
                        <Typography type="body">About</Typography>
                        <Tabs.Indicator className="bg-accent" />
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>

                  <Typography
                    className="hidden sm:block"
                    color="muted"
                    type="body-xs"
                  >
                    {siteConfig.version}
                  </Typography>
                </Surface>

                {/* Scrollable Panel Container */}
                <ScrollShadow
                  className="flex-1 bg-background/40 rounded-4xl p-4"
                  orientation="vertical"
                  size={24}
                >
                  <Tabs.Panel id="general">
                    <GeneralTab />
                  </Tabs.Panel>

                  <Tabs.Panel id="data">
                    <DataTab
                      onOpenSessionsLog={handleOpenSessionsLog}
                      onOpenTasksLog={handleOpenTasksLog}
                    />
                  </Tabs.Panel>

                  <Tabs.Panel id="about">
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
