import { useState } from "react";
import { Modal, Button, Typography, toast, Spinner } from "@heroui/react";
import { Cloud, AlertCircle, HardDrive, Zap, LogIn } from "lucide-react";

import { useAuth } from "@/services/supabase/auth-context";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        fill="#EA4335"
      />
    </svg>
  );
}

function DiscordIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const { isConfigured, signInWithOAuth } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "discord" | null
  >(null);

  const handleOAuth = async (provider: "google" | "discord") => {
    setLoadingProvider(provider);
    try {
      const { error } = await signInWithOAuth(provider);

      if (error) {
        toast("Sign in failed", {
          description: error.message,
          variant: "danger",
        });
        setLoadingProvider(null);
      }
    } catch {
      setLoadingProvider(null);
    }
  };

  return (
    <Modal.Backdrop
      className="bg-black/70 backdrop-blur-md"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Modal.Container className="max-w-md w-full p-4 sm:p-6">
        <Modal.Dialog className="rounded-3xl bg-neutral-900/95 border border-white/10 shadow-2xl p-6 text-white backdrop-blur-xl relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <Modal.Header className="items-center gap-3">
            <Typography className="text-2xl font-bold tracking-tight text-white">
              Sign In to Cozify
            </Typography>
            <Typography className="text-sm text-neutral-400 mt-1.5 max-w-xs leading-relaxed text-center">
              Connect your account to sync your focus sessions, tasks, and
              custom themes across all devices.
            </Typography>
          </Modal.Header>

          <Modal.Body>
            {/* OAuth Login Buttons */}
            <div className="space-y-3 mb-6 relative z-10">
              {/* Google */}
              <Button
                className="w-full h-12 rounded-2xl border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
                isDisabled={loadingProvider !== null || !isConfigured}
                size="lg"
                variant="outline"
                onClick={() => handleOAuth("google")}
              >
                {loadingProvider === "google" ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <GoogleIcon className="w-5 h-5 shrink-0" />
                )}
                <span>Continue with Google</span>
              </Button>

              {/* Discord */}
              <Button
                className="w-full h-12 rounded-2xl border-[#5865F2]/40 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 font-medium flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] text-[#7983F5] hover:text-white"
                isDisabled={loadingProvider !== null || !isConfigured}
                size="lg"
                variant="outline"
                onClick={() => handleOAuth("discord")}
              >
                {loadingProvider === "discord" ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <DiscordIcon className="w-5 h-5 shrink-0 fill-[#5865F2]" />
                )}
                <span className="text-white">Continue with Discord</span>
              </Button>
            </div>

            {/* Offline / Cloud Merge Feature Callout */}
            <div className="rounded-2xl bg-white/3 border border-white/5 p-4 text-xs space-y-2.5 relative z-10">
              <div className="flex items-center gap-2 text-neutral-300 font-medium">
                <Zap className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                <span>Instant 1-Click Sync</span>
              </div>
              <div className="text-neutral-400 space-y-1.5 leading-relaxed pl-5.5">
                <p className="flex items-start gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Offline Workspace:</strong> Tasks & sessions created
                    without logging in stay securely saved on this device.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Cloud className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Automatic Merge:</strong> When you connect with
                    Google or Discord, all your offline work is automatically
                    uploaded and merged into your cloud account.
                  </span>
                </p>
              </div>
            </div>
          </Modal.Body>

          {/* Footer Close */}
          <Modal.Footer>
            <Button
              className="w-full text-neutral-400 hover:text-white rounded-xl text-xs"
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Continue as Guest
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
