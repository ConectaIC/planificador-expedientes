'use client';
import Modal from './Modal';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open, title="Confirmar", message,
  confirmText="Aceptar", cancelText="Cancelar",
  onConfirm, onClose
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} widthClass="max-w-md">
      <p className="mb-4">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border"> {cancelText} </button>
        <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 rounded-lg bg-[var(--cic-primary)] text-white"> {confirmText} </button>
      </div>
    </Modal>
  );
}
