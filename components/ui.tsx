"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentUser, logout } from "@/lib/store";
import type { InterviewKind } from "@/lib/types";

export function useUser(required = true) {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string } | null | undefined>(undefined);
  useEffect(() => {
    const u = currentUser();
    setUser(u);
    if (!u && required) router.replace("/login");
  }, [router, required]);
  return user;
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/dashboard" className="logo" style={dark ? { color: "#eceef2" } : undefined}>
      <span className="logo-mark" style={dark ? { background: "#232730" } : undefined}>
        <span />
      </span>
      CritRoom
    </Link>
  );
}

export function Header({ user }: { user: { email: string; name: string } }) {
  const router = useRouter();
  return (
    <header className="header">
      <div className="container">
        <Logo />
        <div className="spacer" />
        <Link href="/questions" className="btn ghost sm hide-sm">
          Question bank
        </Link>
        <Link href="/new" className="btn primary sm">
          New interview
        </Link>
        <div className="row" style={{ gap: 8 }}>
          <div className="avatar" title={user.email}>
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <button
            className="btn ghost sm"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

export function scoreTone(score: number, max = 100) {
  const p = score / max;
  if (p >= 0.75) return { fg: "var(--good)", bg: "var(--good-soft)", bar: "#2f9e62" };
  if (p >= 0.55) return { fg: "var(--warn)", bg: "var(--warn-soft)", bar: "#d98a1f" };
  return { fg: "var(--bad)", bg: "var(--bad-soft)", bar: "#d9534b" };
}

export function KindIcon({ kind, size = 20 }: { kind: InterviewKind; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "pd-interview":
      return (
        <svg {...p}>
          <path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
          <path d="M17 9h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v3l-4-3h-3" />
        </svg>
      );
    case "portfolio":
      return (
        <svg {...p}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "case-study":
      return (
        <svg {...p}>
          <path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" />
          <path d="M8 7h6M8 11h8M8 15h5" />
        </svg>
      );
    case "app-critique":
      return (
        <svg {...p}>
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <circle cx="12" cy="11" r="3" />
          <path d="M14.2 13.2 16 15" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M3 21l3.5-1 11-11-2.5-2.5-11 11L3 21z" />
          <path d="M14 5l2.5 2.5M19 3l2 2" />
        </svg>
      );
  }
}
