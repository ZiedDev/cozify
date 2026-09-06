import { RollingText } from "@/components/ui/rolling-text";

export function RollingTimerText({
  formattedTime,
  mode,
}: {
  formattedTime: string;
  mode?: string;
}) {
  return <RollingText triggerKey={mode} value={formattedTime} />;
}
