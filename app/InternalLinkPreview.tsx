"use client";

import {
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { LinkPreview } from "./posts";

const EDGE_GAP = 16;
const CARD_GAP = 8;
const MAX_CARD_WIDTH = 360;

type CardPosition = {
  left: number;
  top: number;
};

export function InternalLinkPreview({
  children,
  href,
  preview,
}: {
  children: ReactNode;
  href: string;
  preview: LinkPreview;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CardPosition>();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const pointerType = useRef("");
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const previewId = useId();

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
  }, []);

  const show = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }, [clearCloseTimer]);

  const updatePosition = useCallback(() => {
    const link = linkRef.current;
    const card = cardRef.current;
    if (!link || !card) return;

    const linkRect = link.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const width = Math.min(MAX_CARD_WIDTH, window.innerWidth - EDGE_GAP * 2);
    const centeredLeft = linkRect.left + linkRect.width / 2 - width / 2;
    const left = Math.min(
      Math.max(EDGE_GAP, centeredLeft),
      window.innerWidth - width - EDGE_GAP,
    );
    const roomBelow = window.innerHeight - linkRect.bottom;
    const top = roomBelow >= cardRect.height + CARD_GAP + EDGE_GAP
      ? linkRect.bottom + CARD_GAP
      : Math.max(EDGE_GAP, linkRect.top - cardRect.height - CARD_GAP);

    setPosition({ left, top });
  }, []);

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const closeFromOutside = (event: globalThis.PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        linkRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  function rememberPointer(event: PointerEvent<HTMLAnchorElement>) {
    pointerType.current = event.pointerType;
  }

  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    const isTouch = pointerType.current === "touch" || window.matchMedia("(hover: none)").matches;
    pointerType.current = "";
    if (isTouch && !open) {
      event.preventDefault();
      show();
    }
  }

  function handleBlur(event: React.FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleClose();
  }

  const metadata = [preview.date, preview.readingTime].filter(Boolean).join(" · ");

  return (
    <span
      className="internal-link-preview"
      ref={wrapperRef}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") show();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") scheduleClose();
      }}
      onFocus={show}
      onBlur={handleBlur}
    >
      <a
        aria-controls={previewId}
        aria-expanded={open}
        href={href}
        ref={linkRef}
        onClick={handleLinkClick}
        onPointerDown={rememberPointer}
      >
        {children}
      </a>
      <a
        aria-hidden={!open}
        className="internal-link-preview-card"
        data-open={open ? "" : undefined}
        data-positioned={position ? "" : undefined}
        href={href}
        id={previewId}
        ref={cardRef}
        style={position ? { left: position.left, top: position.top } : undefined}
        tabIndex={open ? 0 : -1}
      >
        <span className="internal-link-preview-title">{preview.title}</span>
        {metadata ? <span className="internal-link-preview-meta">{metadata}</span> : null}
        <span className="internal-link-preview-excerpt">{preview.excerpt}</span>
      </a>
    </span>
  );
}
