"use client";

import * as React from "react";
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof PanelGroup>) {
  return (
    <PanelGroup
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel(props: React.ComponentProps<typeof Panel>) {
  return <Panel {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <PanelResizeHandle
      className={cn(
        "relative flex w-px items-center justify-center bg-border",
        className,
      )}
      {...props}
    >
      {withHandle && <div className="z-10 h-6 w-1 rounded-lg bg-border" />}
    </PanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
