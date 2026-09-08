import { AppMode } from "@/config/modes";
import { SidebarTodoWidget } from "./sidebar-todo";

export { SidebarTodoWidget };

export function SidebarLeft({ activeMode }: { activeMode: AppMode }) {
  // Show sidebar on desktop/tablet (> 950px) when not on To-Do tab
  if (activeMode === "todo") return null;

  return (
    <aside
      aria-label="Workspace Left Sidebar"
      className="hidden min-[951px]:flex fixed top-20 md:top-24 lg:top-28 left-4 md:left-6 lg:left-8 xl:left-12 z-30 select-none pointer-events-none flex-col items-start text-left w-56 md:w-60 lg:w-64 xl:w-72 transition-[opacity,transform] duration-300"
    >
      <div className="overflow-hidden pb-4 sm:pb-6 w-full flex flex-col items-start max-h-[calc(100vh-14rem)]">
        <SidebarTodoWidget />
      </div>
    </aside>
  );
}
