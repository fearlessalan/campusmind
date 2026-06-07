"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

interface AppModalProps {
  open: boolean;
  title: string;
  message: string;
  variant?: "info" | "error" | "success" | "warning";
  mode?: "alert" | "confirm";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const variantStyles = {
  info: { icon: Info, color: "text-primary", bg: "bg-primary-container/40" },
  error: { icon: XCircle, color: "text-error", bg: "bg-error-container/40" },
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success-container/40" },
  warning: { icon: AlertTriangle, color: "text-tertiary", bg: "bg-tertiary-container/40" },
};

export default function AppModal({
  open,
  title,
  message,
  variant = "info",
  mode = "alert",
  confirmLabel = "OK",
  cancelLabel = "Annuler",
  onConfirm,
  onClose,
}: AppModalProps) {
  if (!open) return null;

  const { icon: Icon, color, bg } = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-outline-variant md-elevation-3 animate-fadeIn overflow-hidden">
        <div className={`flex items-start gap-3 p-5 ${bg}`}>
          <Icon className={`w-6 h-6 shrink-0 mt-0.5 ${color}`} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-on-surface">{title}</h2>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 text-on-surface-variant shrink-0"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-outline-variant">
          {mode === "confirm" && (
            <button onClick={onClose} className="md-btn-text">
              {cancelLabel}
            </button>
          )}
          <button onClick={onConfirm} className="md-btn-filled">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
