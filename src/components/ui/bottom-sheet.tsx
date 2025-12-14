import * as React from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  ariaTitle?: string;
  ariaDescription?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  ariaTitle = "Panel",
  ariaDescription = "Additional content",
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[92%] flex-col rounded-t-[20px] bg-background",
            "focus:outline-none"
          )}
        >
          {/* Drag handle */}
          <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
          <Drawer.Title className="sr-only">{ariaTitle}</Drawer.Title>
          <Drawer.Description className="sr-only">
            {ariaDescription}
          </Drawer.Description>
          
          {/* Close button - visible on desktop */}
          <Drawer.Close className="absolute left-4 top-4 rounded-full p-2 hover:bg-muted transition-colors hidden sm:flex items-center justify-center">
            <X className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </Drawer.Close>

          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

interface BottomSheetHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function BottomSheetHeader({ className, children }: BottomSheetHeaderProps) {
  return (
    <div className={cn("px-6 pt-6 pb-4 border-b border-border/50", className)}>
      {children}
    </div>
  );
}

interface BottomSheetBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function BottomSheetBody({ className, children }: BottomSheetBodyProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-6 py-4", className)}>
      {children}
    </div>
  );
}

interface BottomSheetFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function BottomSheetFooter({ className, children }: BottomSheetFooterProps) {
  return (
    <div className={cn("sticky bottom-0 px-6 py-4 border-t border-border/50 bg-background", className)}>
      {children}
    </div>
  );
}
