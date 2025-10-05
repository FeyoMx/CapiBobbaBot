import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog Content */}
      <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]">
        {children}
      </div>
    </>
  )
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
  onClose?: () => void
}

export function DialogContent({ className, children, onClose }: DialogContentProps) {
  return (
    <div
      className={cn(
        "w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-lg",
        className
      )}
    >
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {children}
    </div>
  )
}

interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

export function DialogHeader({ className, children }: DialogHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
      {children}
    </div>
  )
}

interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

export function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  )
}

interface DialogDescriptionProps {
  className?: string
  children: React.ReactNode
}

export function DialogDescription({ className, children }: DialogDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}
