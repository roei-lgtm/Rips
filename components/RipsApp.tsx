"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, LoaderCircle } from "lucide-react";
import { Context, Pack, PlayerData } from "./shared";
import Player from "./Player";
import dynamic from "next/dynamic";
const Admin = dynamic(() => import("./Admin"));
export default function RipsApp() {
  const path = usePathname(),
    router = useRouter();
  const [packs, setPacks] = useState<Pack[]>([]),
    [player, setPlayer] = useState<PlayerData | null>(null),
    [message, setMessage] = useState(""),
    [fatal, setFatal] = useState(""),
    [role, setRole] = useState("admin");
  const refresh = useCallback(async () => {
    const results = await Promise.all([
      fetch("/api/catalog", { cache: "no-store" }),
      fetch("/api/player", { cache: "no-store" }),
    ]);
    if (results.some((r) => !r.ok))
      throw new Error(
        "Unable to connect to the demo database. Retry in a moment.",
      );
    const [p, u] = await Promise.all(results.map((r) => r.json()));
    setPacks(p);
    setPlayer(u);
    setFatal("");
  }, []);
  useEffect(() => {
    refresh().catch((e) => setFatal(e.message));
  }, [refresh]);
  useEffect(() => {
    if (path === "/") router.replace("/play");
  }, [path, router]);
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  const post = async (path: string, body: unknown) => {
    const response = await fetch(`/api/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-role": role },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Something went wrong");
    await refresh();
    return data;
  };
  return (
    <Context.Provider
      value={{ packs, player, refresh, post, toast: setMessage, role, setRole }}
    >
      {fatal ? (
        <div className="loading-screen">
          <h2>Let’s reconnect.</h2>
          <p>{fatal}</p>
          <button
            className="button"
            onClick={() => refresh().catch((e) => setFatal(e.message))}
          >
            Retry connection
          </button>
        </div>
      ) : !player ? (
        <div className="loading-screen">
          <img src="/assets/brand/logo.svg" alt="RIPS" />
          <LoaderCircle className="spin" />
          <p>Getting your packs ready</p>
        </div>
      ) : path.startsWith("/admin") ? (
        <Admin />
      ) : (
        <Player />
      )}
      {message && (
        <div role="status" className="toast">
          <span>{message}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
