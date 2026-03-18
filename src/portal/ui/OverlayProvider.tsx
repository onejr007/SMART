import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import './overlay.css';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  timeoutMs?: number;
};

type ModalState =
  | null
  | {
      title: string;
      body: React.ReactNode;
      primaryText?: string;
      secondaryText?: string;
      onPrimary?: () => void;
      onSecondary?: () => void;
      dismissible?: boolean;
    };

type PromptOptions = {
  title: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  primaryText?: string;
  secondaryText?: string;
};

type ConfirmOptions = {
  title: string;
  body: React.ReactNode;
  primaryText?: string;
  secondaryText?: string;
};

type AlertOptions = {
  title: string;
  body: React.ReactNode;
  primaryText?: string;
};

type OverlayApi = {
  toast: (message: string, opts?: Partial<Omit<Toast, 'id' | 'message'>>) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
  alert: (opts: AlertOptions) => Promise<void>;
};

const OverlayContext = createContext<OverlayApi | null>(null);

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function OverlayProvider(props: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const modalResolveRef = useRef<((value: any) => void) | null>(null);
  const modalInputRef = useRef<HTMLInputElement | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<OverlayApi['toast']>((message, opts) => {
    const id = uid();
    const toastItem: Toast = {
      id,
      message,
      variant: opts?.variant ?? 'info',
      actionLabel: opts?.actionLabel,
      onAction: opts?.onAction,
      timeoutMs: opts?.timeoutMs ?? 3500,
    };
    setToasts((prev) => [...prev, toastItem]);

    if ((toastItem.timeoutMs ?? 0) > 0) {
      window.setTimeout(() => removeToast(id), toastItem.timeoutMs);
    }
  }, [removeToast]);

  const closeModal = useCallback(() => {
    setModal(null);
    modalResolveRef.current = null;
  }, []);

  const confirm = useCallback<OverlayApi['confirm']>((opts) => {
    return new Promise<boolean>((resolve) => {
      modalResolveRef.current = resolve;
      setModal({
        title: opts.title,
        body: opts.body,
        primaryText: opts.primaryText ?? 'OK',
        secondaryText: opts.secondaryText ?? 'Cancel',
        onPrimary: () => {
          resolve(true);
          closeModal();
        },
        onSecondary: () => {
          resolve(false);
          closeModal();
        },
        dismissible: true,
      });
    });
  }, [closeModal]);

  const alert = useCallback<OverlayApi['alert']>((opts) => {
    return new Promise<void>((resolve) => {
      modalResolveRef.current = resolve;
      setModal({
        title: opts.title,
        body: opts.body,
        primaryText: opts.primaryText ?? 'Close',
        onPrimary: () => {
          resolve();
          closeModal();
        },
        dismissible: true,
      });
    });
  }, [closeModal]);

  const prompt = useCallback<OverlayApi['prompt']>((opts) => {
    return new Promise<string | null>((resolve) => {
      modalResolveRef.current = resolve;
      const initialValue = opts.initialValue ?? '';
      let value = initialValue;

      const body = (
        <div className="overlay-form">
          <label className="overlay-label">{opts.label}</label>
          <input
            ref={(el) => {
              modalInputRef.current = el;
            }}
            className="overlay-input"
            defaultValue={initialValue}
            placeholder={opts.placeholder}
            onChange={(e) => {
              value = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                resolve(value.trim().length === 0 ? null : value);
                closeModal();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                resolve(null);
                closeModal();
              }
            }}
          />
        </div>
      );

      setModal({
        title: opts.title,
        body,
        primaryText: opts.primaryText ?? 'Save',
        secondaryText: opts.secondaryText ?? 'Cancel',
        onPrimary: () => {
          resolve(value.trim().length === 0 ? null : value);
          closeModal();
        },
        onSecondary: () => {
          resolve(null);
          closeModal();
        },
        dismissible: true,
      });
    });
  }, [closeModal]);

  useEffect(() => {
    if (!modal) return;
    window.setTimeout(() => modalInputRef.current?.focus(), 0);
  }, [modal]);

  useEffect(() => {
    const onSwUpdate = () => {
      toast('Update tersedia. Reload untuk versi terbaru.', {
        variant: 'info',
        actionLabel: 'Reload',
        onAction: () => window.location.reload(),
        timeoutMs: 8000,
      });
    };
    window.addEventListener('app:sw-update', onSwUpdate as any);
    return () => window.removeEventListener('app:sw-update', onSwUpdate as any);
  }, [toast]);

  const api = useMemo<OverlayApi>(() => ({ toast, confirm, prompt, alert }), [toast, confirm, prompt, alert]);

  return (
    <OverlayContext.Provider value={api}>
      {props.children}

      <div className="toast-host" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.variant}`}>
            <div className="toast-message">{t.message}</div>
            <div className="toast-actions">
              {t.actionLabel && t.onAction && (
                <button
                  className="toast-action"
                  onClick={() => {
                    t.onAction?.();
                    removeToast(t.id);
                  }}
                >
                  {t.actionLabel}
                </button>
              )}
              <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Close">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onMouseDown={() => modal.dismissible && modal.onSecondary?.()}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className="modal-title">{modal.title}</div>
              <button className="modal-x" onClick={() => modal.dismissible && modal.onSecondary?.()} aria-label="Close">
                ×
              </button>
            </div>
            <div className="modal-body">{modal.body}</div>
            <div className="modal-footer">
              {modal.secondaryText && modal.onSecondary && (
                <button className="modal-secondary" onClick={modal.onSecondary}>
                  {modal.secondaryText}
                </button>
              )}
              {modal.primaryText && modal.onPrimary && (
                <button className="modal-primary" onClick={modal.onPrimary}>
                  {modal.primaryText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlay must be used within OverlayProvider');
  return ctx;
}

