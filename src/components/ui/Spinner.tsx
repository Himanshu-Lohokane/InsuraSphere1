"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-b-transparent border-indigo-600",
        className
      )}
      {...props}
    />
  )
}