"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArchiveX } from "lucide-react";
import { PolaRosterItem } from "@/types/pola-roster";

interface PolaDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPola: PolaRosterItem | null;
  onConfirm: () => void;
  isPending?: boolean;
}

export function PolaDeleteDialog({
  open,
  onOpenChange,
  targetPola,
  onConfirm,
  isPending = false,
}: PolaDeleteDialogProps) {
  if (!targetPola) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[#041E3F]/10 bg-[#FFFAF3] sm:max-w-112.5 rounded-2xl p-6 shadow-xl">
        <AlertDialogHeader className="flex flex-col items-center gap-2 text-center sm:text-left sm:items-start sm:flex-row">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0">
            <ArchiveX className="h-6 w-6 text-red-600 stroke-[2px]" />
          </div>

          <div className="flex flex-col gap-1.5 mt-2 sm:mt-0">
            <AlertDialogTitle className="text-xl font-bold text-[#041E3F]">
              Non-Aktifkan Pola Roster?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-semibold leading-relaxed text-[#041E3F]/70">
              Anda yakin ingin menonaktifkan{" "}
              <strong>{targetPola.namaPola}</strong>?
              <br />
              <br />
              Pola ini tidak akan bisa digunakan lagi untuk Auto-Generate jadwal
              di masa depan.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 sm:mt-4 flex gap-3 sm:justify-end">
          <AlertDialogCancel
            disabled={isPending}
            className="w-full sm:w-auto h-11 cursor-pointer border-[#041E3F]/20 text-[#041E3F] hover:bg-[#041E3F]/5 bg-transparent font-bold rounded-xl m-0"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="w-full sm:w-auto h-11 cursor-pointer bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl m-0 shadow-sm"
          >
            {isPending ? "Menonaktifkan..." : "Ya, Non-Aktifkan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
