import { useState } from "react";
import {
  Modal,
  Drawer,
  Tabs,
  ScrollShadow,
  Typography,
  Surface,
} from "@heroui/react";
import { Settings, Database, Sliders, Info } from "lucide-react";

import { GeneralTab } from "./components/general-tab";
import { DataTab } from "./components/data-tab";
import { AboutTab } from "./components/about-tab";
import { SessionsLogModal } from "./components/sessions-log-modal";
import { TasksLogModal } from "./components/tasks-log-modal";

import { siteConfig } from "@/config/site";
import { useIsMobile } from "@/hooks/use-is-mobile";

export function SettingsModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
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
      {isMobile ? (
        <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
          <Drawer.Content placement="bottom">
            <Drawer.Dialog className="h-[80dvh] max-h-[85dvh] flex flex-col p-4 shadow-2xl overflow-hidden rounded-t-3xl rounded-b-none border-t border-separator/40 bg-surface/98 backdrop-blur-xl">
              <Drawer.Handle />
              <Drawer.Header className="flex-row items-center justify-between pb-2 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-2xl bg-accent/15 text-accent shrink-0">
                    <Settings className="size-5" />
                  </div>
                  <div>
                    <Drawer.Heading className="text-base font-semibold text-foreground">
                      Settings
                    </Drawer.Heading>
                    <Typography color="muted" type="body-xs">
                      Preferences & workspace
                    </Typography>
                  </div>
                </div>
                <Drawer.CloseTrigger />
              </Drawer.Header>
              <Drawer.Body className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden mt-2">
                <Tabs
                  className="h-full flex flex-col"
                  selectedKey={selectedTab}
                  onSelectionChange={(key) => setSelectedTab(key as string)}
                >
                  <Surface
                    className="px-0 py-0 flex justify-between shrink-0 mb-3"
                    variant="transparent"
                  >
                    <Tabs.ListContainer className="bg-transparent p-0 w-full">
                      <Tabs.List
                        aria-label="Settings Categories"
                        className="w-full justify-between"
                      >
                        <Tabs.Tab
                          className="p-3 gap-1.5 flex-1 justify-center"
                          id="general"
                        >
                          <Sliders className="size-3.5 shrink-0" />
                          <Typography type="body-sm">General</Typography>
                          <Tabs.Indicator className="bg-accent" />
                        </Tabs.Tab>

                        <Tabs.Tab
                          className="p-3 gap-1.5 flex-1 justify-center"
                          id="data"
                        >
                          <Database className="size-3.5 shrink-0" />
                          <Typography type="body-sm">Data</Typography>
                          <Tabs.Indicator className="bg-accent" />
                        </Tabs.Tab>

                        <Tabs.Tab
                          className="p-3 gap-1.5 flex-1 justify-center"
                          id="about"
                        >
                          <Info className="size-3.5 shrink-0" />
                          <Typography type="body-sm">About</Typography>
                          <Tabs.Indicator className="bg-accent" />
                        </Tabs.Tab>
                      </Tabs.List>
                    </Tabs.ListContainer>
                  </Surface>

                  {/* Static height scrollable panel */}
                  <ScrollShadow
                    className="flex-1 min-h-0 bg-background/40 rounded-3xl p-3.5 overflow-y-auto"
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
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      ) : (
        <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
          <Modal.Container size="lg">
            <Modal.Dialog className="md:max-w-250 h-140 max-h-[88vh] shadow-2xl flex flex-col space-y-5">
              <Modal.Header className="flex-row items-center gap-3 shrink-0">
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
              <Modal.Body className="flex-1 min-h-0 overflow-hidden">
                <Tabs
                  className="h-full sm:flex-row"
                  selectedKey={selectedTab}
                  onSelectionChange={(key) => setSelectedTab(key as string)}
                >
                  <Surface className="px-0 py-0 flex sm:flex-col justify-between sm:items-stretch shrink-0">
                    <Tabs.ListContainer className="bg-transparent p-0 w-full">
                      <Tabs.List
                        aria-label="Settings Categories"
                        className="sm:flex-col space-y-5"
                      >
                        <Tabs.Tab
                          className="p-4 sm:p-6 sm:justify-start gap-2"
                          id="general"
                        >
                          <Sliders className="size-4 shrink-0" />
                          <Typography type="body">General</Typography>
                          <Tabs.Indicator className="bg-accent" />
                        </Tabs.Tab>

                        <Tabs.Tab
                          className="p-4 sm:p-6 sm:justify-start gap-2"
                          id="data"
                        >
                          <Database className="size-4 shrink-0" />
                          <Typography type="body">Data</Typography>
                          <Tabs.Indicator className="bg-accent" />
                        </Tabs.Tab>

                        <Tabs.Tab
                          className="p-4 sm:p-6 sm:justify-start gap-2"
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

                  {/* Static height scrollable panel */}
                  <ScrollShadow
                    className="flex-1 min-h-0 bg-background/40 rounded-4xl p-4 overflow-y-auto"
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
      )}

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
