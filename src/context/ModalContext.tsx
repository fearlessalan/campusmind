"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import AppModal from "../components/AppModal";

type ModalVariant = "info" | "error" | "success" | "warning";

interface ModalState {
  open: boolean;
  title: string;
  message: string;
  variant: ModalVariant;
  mode: "alert" | "confirm";
  confirmLabel: string;
  cancelLabel: string;
  resolve?: (value: boolean) => void;
}

const defaultState: ModalState = {
  open: false,
  title: "",
  message: "",
  variant: "info",
  mode: "alert",
  confirmLabel: "OK",
  cancelLabel: "Annuler",
};

interface ModalContextValue {
  showAlert: (title: string, message: string, variant?: ModalVariant) => void;
  showConfirm: (title: string, message: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalState>(defaultState);

  const closeModal = useCallback((result = false) => {
    setModal((prev) => {
      prev.resolve?.(result);
      return defaultState;
    });
  }, []);

  const showAlert = useCallback((title: string, message: string, variant: ModalVariant = "info") => {
    setModal({
      open: true,
      title,
      message,
      variant,
      mode: "alert",
      confirmLabel: "OK",
      cancelLabel: "Annuler",
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      setModal({
        open: true,
        title,
        message,
        variant: "warning",
        mode: "confirm",
        confirmLabel: "Confirmer",
        cancelLabel: "Annuler",
        resolve,
      });
    });
  }, []);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AppModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        mode={modal.mode}
        confirmLabel={modal.confirmLabel}
        cancelLabel={modal.cancelLabel}
        onConfirm={() => closeModal(true)}
        onClose={() => closeModal(false)}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal doit être utilisé dans ModalProvider");
  return ctx;
}
