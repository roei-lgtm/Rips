"use client";
import { useEffect, useRef, createContext, useContext } from "react";
import { X, LoaderCircle } from "lucide-react";
import type { catalog, playerState, adminState } from "@/lib/domain";
type Json<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Json<U>[]
    : T extends object
      ? { [K in keyof T]: Json<T[K]> }
      : T;
export type Pack = Json<Awaited<ReturnType<typeof catalog>>[number]>;
export type PlayerData = Json<Awaited<ReturnType<typeof playerState>>>;
export type AdminData = Json<Awaited<ReturnType<typeof adminState>>>;
export type Opening = PlayerData["openings"][number];
export const money = (c: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: c % 100 ? 2 : 0,
  }).format(c / 100);
export const date = (s: string) =>
  new Date(s).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
export const Context = createContext<{
  packs: Pack[];
  player: PlayerData | null;
  refresh: () => Promise<void>;
  post: (path: string, body: unknown) => Promise<any>;
  toast: (text: string) => void;
  role: string;
  setRole: (role: string) => void;
}>({
  packs: [],
  player: null,
  refresh: async () => {},
  post: async () => {},
  toast: () => {},
  role: "admin",
  setRole: () => {},
});
export const useRips = () => useContext(Context);
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = ref.current;
    dialog?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const els = Array.from(
          dialog?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ) ?? [],
        );
        const first = els[0],
          last = els.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener("keydown", key);
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`modal ${wide ? "wide" : ""}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <button className="button secondary modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
export function Symbol({
  category,
  variant = "category",
  className = "",
}: {
  category: string;
  variant?: "category" | "cta-dark" | "cta-light";
  className?: string;
}) {
  return (
    <img
      className={`symbol ${className}`}
      src={`/assets/categories/${category}${variant === "category" ? "" : `-${variant}`}.svg`}
      alt=""
    />
  );
}
export function FoilPack({
  pack,
  eager = false,
  className = "",
}: {
  pack: Pack;
  eager?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`foil-pack ${className}`}
      style={{ "--accent": pack.accentHex } as React.CSSProperties}
    >
      <img
        draggable={false}
        loading={eager || className.includes("hero") ? "eager" : "lazy"}
        decoding="async"
        src={pack.artworkAsset}
        alt={`${pack.title} original foil packaging`}
        onError={(e) => {
          e.currentTarget.src = `/assets/packs/${pack.categoryId}-after-hours.png`;
        }}
      />
      <span className="foil-shimmer" />
    </div>
  );
}
export function contrastText(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return luminance > 0.179 ? "#111116" : "#FFFFFF";
}
export function PackBuyButton({
  pack,
  busy,
  disabled,
  onClick,
  label,
}: {
  pack: Pack;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      className="buy-button"
      style={
        {
          "--accent": pack.accentHex,
          color: contrastText(pack.accentHex),
        } as React.CSSProperties
      }
      disabled={disabled || busy}
      onClick={onClick}
    >
      {busy ? (
        <LoaderCircle className="spin" size={20} />
      ) : (
        <Symbol
          category={pack.categoryId}
          variant={
            contrastText(pack.accentHex) === "#FFFFFF"
              ? "cta-light"
              : "cta-dark"
          }
        />
      )}
      <span>
        {busy
          ? "Reserving your card…"
          : (label ?? `Buy for ${money(pack.priceCents)}`)}
      </span>
    </button>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Badge({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty">
      <div className="empty-symbol">✦</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
