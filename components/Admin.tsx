"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  LayoutDashboard,
  Package,
  Layers,
  ChartNoAxesCombined,
  ScanLine,
  Users,
  ArrowLeftRight,
  Truck,
  Settings,
  Search,
  ArrowUpRight,
  Plus,
  Copy,
  Pencil,
  Download,
  Upload,
  ChevronDown,
  Check,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import {
  useRips,
  money,
  date,
  Modal,
  Field,
  FoilPack,
  PackBuyButton,
  Badge,
  Empty,
  AdminData,
  Pack,
  Symbol,
  contrastText,
} from "./shared";
const pages = [
  ["", "Dashboard", LayoutDashboard],
  ["packs", "Packs", Package],
  ["inventory", "Inventory", Layers],
  ["odds", "Odds & RTP", ChartNoAxesCombined],
  ["openings", "Openings", ScanLine],
  ["users", "Users", Users],
  ["transactions", "Transactions", ArrowLeftRight],
  ["shipping", "Shipping", Truck],
  ["settings", "Settings", Settings],
] as const;
type Card = AdminData["cards"][number];
export default function Admin() {
  const { post, toast, role, setRole } = useRips(),
    path = usePathname(),
    section = path.split("/")[2] ?? "";
  const [data, setData] = useState<AdminData | null>(null),
    [query, setQuery] = useState(""),
    [days, setDays] = useState("0"),
    [menu, setMenu] = useState(false),
    [editing, setEditing] = useState<Pack | true | null>(null),
    [cardEdit, setCardEdit] = useState<Card | true | null>(null),
    [stockEdit, setStockEdit] = useState<
      AdminData["pools"][number] | true | null
    >(null),
    [adjust, setAdjust] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const read = async () => {
    try {
      const response = await fetch(`/api/admin?days=${days}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    read();
  }, [days, path]);
  const run = async (
    route: string,
    body: unknown,
    success = "Changes saved",
  ) => {
    setBusy(true);
    try {
      const result = await post(`admin/${route}`, body);
      await read();
      toast(success);
      return result;
    } catch (e) {
      toast((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  };
  const match = (...values: unknown[]) =>
    values.some((v) => String(v).toLowerCase().includes(query.toLowerCase()));
  const readonly = role === "analyst";
  const exportCSV = () => {
    if (!data) return;
    const fields = [
      "id",
      "categoryId",
      "tierId",
      "name",
      "grade",
      "gradingCompany",
      "certNumber",
      "marketValueCents",
      "sellValueCents",
      "acquisitionCostCents",
      "vendor",
      "imageAsset",
      "location",
      "status",
    ];
    const csv = [
      fields.join(","),
      ...data.cards.map((c) =>
        fields
          .map(
            (f) =>
              `"${String(c[f as keyof Card] ?? "").replaceAll('"', '""')}"`,
          )
          .join(","),
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "rips-inventory-demo.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importCSV = async (file: File) => {
    const text = await file.text();
    const lines = parseCSV(text);
    const fields = lines.shift() ?? [];
    if (
      !["categoryId", "tierId", "name", "marketValueCents"].every((f) =>
        fields.includes(f),
      )
    ) {
      toast(
        "CSV requires categoryId, tierId, name, marketValueCents. Export inventory for the complete template.",
      );
      return;
    }
    let count = 0;
    try {
      for (const row of lines.filter((r) => r.some(Boolean))) {
        const raw = Object.fromEntries(fields.map((f, i) => [f, row[i] ?? ""]));
        if (raw.status && raw.status !== "in_stock")
          throw new Error(
            "Import supports in_stock records only; remove allocated snapshots.",
          );
        const { id, status, ...input } = raw;
        const c = {
          ...input,
          marketValueCents: Number(raw.marketValueCents),
          sellValueCents: Number(raw.sellValueCents || raw.marketValueCents),
          acquisitionCostCents: Number(raw.acquisitionCostCents || 0),
          grade: raw.grade || null,
          gradingCompany: raw.gradingCompany || null,
          certNumber: raw.certNumber || null,
          vendor: raw.vendor || "CSV import",
          location: raw.location || "Demo vault A",
          imageAsset: raw.imageAsset || `/assets/cards/${raw.categoryId}-0.svg`,
        };
        await post("admin/card", { data: c });
        count++;
      }
      await read();
      toast(`Imported ${count} demo inventory records.`);
    } catch (e) {
      await read();
      toast(
        `Imported ${count} records before stopping: ${(e as Error).message}`,
      );
    }
  };
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${menu ? "open" : ""}`}>
        <Link href="/play" className="admin-brand">
          <img src="/assets/brand/logo.svg" alt="RIPS" />
          <span>OPERATIONS</span>
        </Link>
        <div className="workspace-label">
          WORKSPACE <Badge>DEMO</Badge>
        </div>
        <nav aria-label="Admin navigation">
          {pages.map(([slug, label, Icon]) => (
            <Link
              key={slug}
              href={`/admin${slug ? `/${slug}` : ""}`}
              className={section === slug ? "active" : ""}
              onClick={() => setMenu(false)}
            >
              <Icon size={18} />
              {label}
              {slug === "" && <span className="nav-marker" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="demo-dot" />
          <p>
            Sandbox environment<span>No real money or shipments</span>
          </p>
        </div>
        <Link href="/play" className="return-shop">
          Player experience <ArrowUpRight size={15} />
        </Link>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle admin menu"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
          <div className="breadcrumbs">
            Workspace <span>/</span>{" "}
            <strong>
              {pages.find((p) => p[0] === section)?.[1] ?? "Dashboard"}
            </strong>
          </div>
          <label className="global-search">
            <Search size={16} />
            <input
              aria-label="Search current admin view"
              placeholder="Search this view…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>⌕</kbd>
          </label>
          <Badge>
            <i className="demo-dot" /> Demo environment
          </Badge>
          <label className="role-switch">
            <span className="sr-only">Demo role</span>
            <select
              aria-label="Demo role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="analyst">Analyst</option>
            </select>
          </label>
          <div className="admin-avatar">SC</div>
        </header>
        <main className="admin-main">
          <div className="admin-title">
            <div>
              <p className="eyebrow">RIPS BY LONESTAR / BACK OFFICE</p>
              <h1>
                {section === ""
                  ? "An eye on every rip."
                  : (pages.find((p) => p[0] === section)?.[1] ?? "Not found")}
              </h1>
              <p>
                {
                  (
                    {
                      "": "Your demo business, at a glance. Every number comes from your ledger.",
                      packs:
                        "Shape the experience. Configure, preview, and publish your packs.",
                      inventory:
                        "Original demo collectibles. Tracked from stock to their next home.",
                      odds: "Transparent probabilities. Versioned outcomes. No hidden assumptions.",
                      openings: "Every rip, from reservation to resolution.",
                      users: "Demo accounts and their activity.",
                      transactions:
                        "An immutable demo wallet ledger. No real money exchanged.",
                      shipping:
                        "Simulated fulfillment only. No carriers, labels, or real addresses.",
                      settings: "The rules behind your demo workspace.",
                    } as Record<string, string>
                  )[section]
                }
              </p>
            </div>
            {section === "" ? (
              <select
                className="filter-select"
                aria-label="Dashboard period"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              >
                <option value="1">Today / last 24h</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="0">All time</option>
              </select>
            ) : section === "packs" ? (
              <button
                className="button primary"
                disabled={readonly}
                onClick={() => setEditing(true)}
              >
                <Plus size={16} /> Create pack
              </button>
            ) : section === "inventory" ? (
              <div className="toolbar">
                <button className="button secondary" onClick={exportCSV}>
                  <Download size={15} /> Export
                </button>
                <label
                  className={`button secondary ${readonly ? "disabled" : ""}`}
                >
                  <Upload size={15} /> Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    hidden
                    disabled={readonly}
                    onChange={(e) => {
                      if (e.target.files?.[0]) importCSV(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  className="button primary"
                  disabled={readonly}
                  onClick={() => setCardEdit(true)}
                >
                  <Plus size={16} /> Add card
                </button>
                <button
                  className="button secondary"
                  disabled={readonly}
                  onClick={() => setStockEdit(true)}
                >
                  Add pool
                </button>
              </div>
            ) : null}
          </div>
          {readonly && (
            <div className="notice">
              Read-only analyst role. Viewing is enabled; mutations are blocked
              by the server.
            </div>
          )}
          {error ? (
            <div className="notice error">
              {error}
              <button className="button secondary" onClick={read}>
                Retry
              </button>
            </div>
          ) : !data ? (
            <p className="muted">Loading operations…</p>
          ) : (
            <>
              {section === "" && <Dashboard data={data} />}
              {section === "packs" && (
                <div className="admin-pack-grid">
                  {data.packs
                    .filter((p) => match(p.title, p.category.label))
                    .map((p) => (
                      <article className="admin-pack-card" key={p.id}>
                        <div className="admin-pack-art">
                          <FoilPack pack={p} />
                          <Badge
                            tone={p.isActive && p.available ? "success" : ""}
                          >
                            {p.isHidden
                              ? "Hidden"
                              : p.isActive
                                ? p.available
                                  ? "Active"
                                  : "Stock blocked"
                                : "Inactive"}
                          </Badge>
                        </div>
                        <div className="admin-pack-card-body">
                          <div>
                            <p className="eyebrow">{p.category.label}</p>
                            <h2>{p.title}</h2>
                          </div>
                          <div className="pack-card-stats">
                            <span>
                              PRICE<strong>{money(p.priceCents)}</strong>
                            </span>
                            <span>
                              MARKET RTP
                              <strong>{p.marketRtp.toFixed(1)}%</strong>
                            </span>
                            <span>
                              ODDS<strong>v{p.oddsVersion}</strong>
                            </span>
                          </div>
                          <div className="pack-card-actions">
                            <button
                              className="button secondary"
                              disabled={readonly}
                              onClick={() => setEditing(p)}
                            >
                              <Pencil size={14} /> Edit pack
                            </button>
                            <button
                              className="icon-button"
                              disabled={readonly || busy}
                              aria-label={`Duplicate ${p.title}`}
                              onClick={() =>
                                run(
                                  "duplicate",
                                  { id: p.id },
                                  "Pack duplicated as inactive",
                                ).catch(() => {})
                              }
                            >
                              <Copy size={16} />
                            </button>
                            <Link
                              href={`/admin/odds?pack=${p.id}`}
                              className="icon-button"
                              aria-label={`Edit odds for ${p.title}`}
                            >
                              <ChartNoAxesCombined size={17} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
              )}
              {section === "inventory" && (
                <Inventory
                  data={data}
                  query={query}
                  readonly={readonly}
                  editCard={setCardEdit}
                  editStock={setStockEdit}
                />
              )}
              {section === "odds" && (
                <OddsEditor
                  data={data}
                  run={run}
                  readonly={readonly}
                  busy={busy}
                />
              )}
              {section === "openings" && (
                <Table
                  headers={[
                    "Opening / time",
                    "User",
                    "Pack",
                    "Paid",
                    "Outcome",
                    "Value",
                    "Odds",
                    "Resolution",
                  ]}
                  rows={data.openings
                    .filter((o) =>
                      match(
                        o.id,
                        o.userId,
                        o.pack.title,
                        o.card.name,
                        o.status,
                      ),
                    )
                    .map((o) => [
                      <div key={o.id}>
                        <code>{o.id.slice(-10)}</code>
                        <small>{date(o.createdAt)}</small>
                      </div>,
                      o.userId,
                      o.pack.title,
                      money(o.priceCents),
                      o.card.name,
                      money(o.outcomeMarketValueCents),
                      `v${o.oddsVersion.version}`,
                      <Badge
                        key="s"
                        tone={
                          o.status === "pending"
                            ? "warning"
                            : o.status === "collected"
                              ? "success"
                              : ""
                        }
                      >
                        {o.status}
                      </Badge>,
                    ])}
                />
              )}
              {section === "users" && (
                <Table
                  headers={[
                    "Account",
                    "Role",
                    "Demo balance",
                    "Purchases",
                    "Cards held",
                    "Recent activity",
                    "Actions",
                  ]}
                  rows={data.users
                    .filter((u) => match(u.name, u.id, u.role))
                    .map((u) => {
                      const os = data.openings.filter((o) => o.userId === u.id);
                      return [
                        <div key={u.id}>
                          <strong>{u.name}</strong>
                          <small>{u.id}</small>
                        </div>,
                        <Badge key="r">{u.role}</Badge>,
                        money(u.wallet?.balanceCents ?? 0),
                        money(os.reduce((s, o) => s + o.priceCents, 0)),
                        os.filter((o) => o.status === "collected").length,
                        os[0] ? date(os[0].createdAt) : "No activity",
                        <button
                          key="a"
                          className="text-button"
                          disabled={readonly || u.role !== "player"}
                          onClick={() => setAdjust(u.id)}
                        >
                          Adjust wallet
                        </button>,
                      ];
                    })}
                />
              )}
              {section === "transactions" && (
                <Table
                  headers={[
                    "Entry / time",
                    "User",
                    "Type",
                    "Amount",
                    "Before → after",
                    "Reference",
                    "Reason",
                  ]}
                  rows={data.transactions
                    .filter((t) => match(t.type, t.userId, t.id, t.reason))
                    .map((t) => [
                      <div key={t.id}>
                        <code>{t.id.slice(-10)}</code>
                        <small>{date(t.createdAt)}</small>
                      </div>,
                      t.userId,
                      <Badge key="t">{t.type.replaceAll("_", " ")}</Badge>,
                      <strong
                        key="a"
                        className={t.amountCents > 0 ? "positive" : ""}
                      >
                        {t.amountCents > 0 ? "+" : "−"}
                        {money(Math.abs(t.amountCents))}
                      </strong>,
                      `${money(t.balanceBeforeCents)} → ${money(t.balanceAfterCents)}`,
                      t.openingId?.slice(-10) ?? "Demo wallet",
                      t.reason ?? "—",
                    ])}
                />
              )}
              {section === "shipping" && (
                <>
                  <div className="notice">
                    <Truck size={16} /> Requests are simulated. Address and
                    tracking fields are placeholders; no real fulfillment
                    integration is active.
                  </div>
                  <Table
                    headers={[
                      "Request",
                      "Card / user",
                      "Value",
                      "Eligibility",
                      "Address",
                      "Status",
                      "Next step",
                    ]}
                    rows={data.shipping
                      .filter((s) => match(s.id, s.opening.card.name, s.status))
                      .map((s) => [
                        s.id.slice(-10),
                        <div key="c">
                          <strong>{s.opening.card.name}</strong>
                          <small>{s.opening.user.name}</small>
                        </div>,
                        money(s.opening.outcomeMarketValueCents),
                        s.opening.outcomeMarketValueCents >
                        data.settings.shippingThresholdCents
                          ? "Eligible"
                          : "Below current threshold",
                        s.addressPlaceholder,
                        <Badge key="s">{s.status}</Badge>,
                        <div className="table-actions" key="a">
                          {s.status !== "shipped" &&
                            s.status !== "cancelled" && (
                              <>
                                <button
                                  disabled={readonly || busy}
                                  className="text-button"
                                  onClick={() =>
                                    run(
                                      "shipping",
                                      {
                                        id: s.id,
                                        status: (
                                          {
                                            requested: "approved",
                                            approved: "packing",
                                            packing: "shipped",
                                          } as Record<string, string>
                                        )[s.status],
                                      },
                                      "Demo request advanced",
                                    ).catch(() => {})
                                  }
                                >
                                  {
                                    (
                                      {
                                        requested: "Approve",
                                        approved: "Mark packing",
                                        packing: "Mark shipped",
                                      } as Record<string, string>
                                    )[s.status]
                                  }
                                </button>
                                <button
                                  disabled={readonly || busy}
                                  className="text-button danger-text"
                                  onClick={() =>
                                    run(
                                      "shipping",
                                      { id: s.id, status: "cancelled" },
                                      "Demo request cancelled",
                                    ).catch(() => {})
                                  }
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                        </div>,
                      ])}
                  />
                </>
              )}
              {section === "settings" && (
                <SettingsEditor
                  data={data}
                  run={run}
                  readonly={readonly}
                  busy={busy}
                />
              )}
            </>
          )}
          <footer className="admin-footer">
            <span>RIPS by Lonestar · Demo operations</span>
            <span>Simulated values. Original artwork. No real money.</span>
          </footer>
        </main>
      </div>
      {editing && data && (
        <PackEditor
          pack={editing === true ? null : editing}
          packs={data.packs}
          close={() => setEditing(null)}
          run={run}
          busy={busy}
        />
      )}
      {cardEdit && data && (
        <CardEditor
          card={cardEdit === true ? null : cardEdit}
          data={data}
          close={() => setCardEdit(null)}
          run={run}
          busy={busy}
        />
      )}
      {stockEdit && data && (
        <StockEditor
          data={data}
          pool={stockEdit === true ? null : stockEdit}
          close={() => setStockEdit(null)}
          run={run}
          busy={busy}
        />
      )}
      {adjust && (
        <WalletAdjustment
          userId={adjust}
          close={() => setAdjust(null)}
          run={run}
          busy={busy}
        />
      )}
    </div>
  );
}
type Run = (route: string, body: unknown, success?: string) => Promise<any>;
export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="table-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length}>
                  <Empty
                    title="Nothing here yet"
                    description="Demo activity will appear as the player experience is used."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        {rows.length} record{rows.length === 1 ? "" : "s"} · Demo data
      </div>
    </div>
  );
}
function Dashboard({ data }: { data: AdminData }) {
  const m = data.metrics;
  const metrics = [
    ["Pack sales", money(m.sales), "Sum of pack purchases. Top-ups excluded."],
    ["Openings", m.count, "Persistent, inventory-backed outcomes."],
    [
      "Gross margin before ops",
      money(m.margin),
      "Pack sales minus allocated market values.",
    ],
    [
      "Realized market RTP",
      `${m.realizedMarketRtp.toFixed(1)}%`,
      "Allocated market value / pack sales.",
    ],
    [
      "Demo wallet top-ups",
      money(m.topups),
      "Simulated funds added; not revenue.",
    ],
    [
      "Observed cash-outs",
      money(m.sell),
      "Actual simulated sell credits only.",
    ],
    [
      "Collected card value",
      money(m.held),
      "Outstanding collection at market value.",
    ],
    [
      "Inventory acquisition cost",
      money(m.inventoryCost),
      "Cost of available unique and pooled stock.",
    ],
  ];
  const low = data.packs.flatMap((p) =>
    p.rows
      .filter((r) => r.stock < r.minStock)
      .map((r) => ({ pack: p.title, ...r })),
  );
  return (
    <>
      <div className="metric-grid">
        {metrics.map(([title, value, definition], i) => (
          <div className="metric-card" key={title}>
            <div className="metric-label">
              {title}
              <span title={String(definition)} aria-label={String(definition)}>
                ⓘ
              </span>
            </div>
            <strong>{value}</strong>
            <p>{definition}</p>
            {i === 0 && (
              <span className="metric-tag">DEMO PURCHASE VOLUME</span>
            )}
          </div>
        ))}
      </div>
      <div className="dashboard-charts">
        <section className="panel sales-panel">
          <div className="panel-heading">
            <div>
              <h2>Pack sales over time</h2>
              <p>Last 7 days · USD demo purchase volume</p>
            </div>
            <Badge>DEMO</Badge>
          </div>
          <div className="sales-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.chart}
                margin={{ top: 20, right: 12, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="chartGold" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f5c84b" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#f5c84b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#2a2a32"
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#85858f", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#85858f", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a21",
                    border: "1px solid #2a2a32",
                    borderRadius: 10,
                  }}
                  formatter={(v) => [`$${v}`, "Demo pack sales"]}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="sales"
                  stroke="#f5c84b"
                  strokeWidth={2}
                  fill="url(#chartGold)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel category-breakdown">
          <div className="panel-heading">
            <div>
              <h2>By category</h2>
              <p>Purchase volume in selected period</p>
            </div>
          </div>
          {Array.from(
            new Map(data.packs.map((p) => [p.categoryId, p.category])).values(),
          ).map((c) => {
            const total = data.categorySales[c.id] ?? 0;
            return (
              <div className="breakdown-row" key={c.id}>
                <Symbol category={c.id} />
                <span>{c.label}</span>
                <strong>{money(total)}</strong>
                <div className="breakdown-track">
                  <i
                    style={{
                      width: `${m.sales ? Math.min(100, (total / m.sales) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Odds & economics</h2>
              <p>Computed outcomes. Business target shown separately.</p>
            </div>
            <Link href="/admin/odds" className="text-link">
              Manage <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="economics-list">
            {data.packs
              .filter((p) => p.isActive)
              .slice(0, 4)
              .map((p) => (
                <div key={p.id}>
                  <Symbol category={p.categoryId} />
                  <div>
                    <strong>{p.title}</strong>
                    <span>
                      Market {p.marketRtp.toFixed(1)}% · Sell{" "}
                      {p.sellRtp.toFixed(1)}%
                    </span>
                  </div>
                  <div className="rtp-mini">
                    <i style={{ width: `${Math.min(p.marketRtp, 100)}%` }} />
                  </div>
                </div>
              ))}
          </div>
          <p className="panel-note">
            RTP target: {(data.settings.rtpTargetBps / 100).toFixed(1)}% ·
            Configurable, never guaranteed.
            <br />
            Turnover = {money(m.turnover)} pack sales. Observed cash sell RTP ={" "}
            {m.cashSellRtp.toFixed(1)}%.
          </p>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Inventory health</h2>
              <p>Published tiers must stay stocked.</p>
            </div>
            <Layers size={19} />
          </div>
          <div className="inventory-health">
            <div className={`health-icon ${low.length ? "warning" : ""}`}>
              {low.length ? <AlertTriangle size={25} /> : <Check size={25} />}
            </div>
            <h3>
              {low.length
                ? `${low.length} low-stock pack tiers`
                : "Ready for the next rip."}
            </h3>
            <p>
              {low.length
                ? "Restock or explicitly republish odds before more purchases."
                : `${data.tiers.length} illustrative tiers · ${data.pools.reduce((s, p) => s + p.quantityAvailable, 0)} pooled units available.`}
            </p>
            <Link className="button secondary" href="/admin/inventory">
              View inventory <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      </div>
      <h2 className="section-title">Pack performance</h2>
      <Table
        headers={[
          "Pack",
          "Purchase volume",
          "Expected market RTP",
          "Expected sell RTP",
          "Theoretical margin / opening",
        ]}
        rows={data.packs.map((p) => [
          p.title,
          money(data.packSales[p.id] ?? 0),
          `${p.marketRtp.toFixed(2)}%`,
          `${p.sellRtp.toFixed(2)}%`,
          money(Math.round(p.priceCents * (1 - p.marketRtp / 100))),
        ])}
      />
    </>
  );
}
function PackEditor({
  pack,
  packs,
  close,
  run,
  busy,
}: {
  pack: Pack | null;
  packs: Pack[];
  close: () => void;
  run: Run;
  busy: boolean;
}) {
  const base = pack ?? packs[0];
  const [form, setForm] = useState({
    ...base,
    id: pack?.id,
    title: pack?.title ?? "New Pack",
    slug: pack?.slug ?? "new-pack",
    isActive: pack?.isActive ?? false,
  });
  const [error, setError] = useState("");
  const update = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await run("pack", { id: pack?.id, data: form });
      close();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Modal title={pack ? "Edit pack" : "Create pack"} onClose={close} wide>
      <form onSubmit={save} className="pack-editor">
        <div className="form-grid">
          <Field label="Pack title">
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
          </Field>
          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              required
            />
          </Field>
          <Field label="Category">
            <select
              value={form.categoryId}
              disabled={!!pack}
              onChange={(e) => {
                const p = packs.find((p) => p.categoryId === e.target.value)!;
                setForm((f) => ({
                  ...f,
                  categoryId: p.categoryId,
                  category: p.category,
                  artworkAsset: p.artworkAsset,
                  symbol: p.symbol,
                }));
              }}
            >
              {Array.from(
                new Map(
                  packs.map((p) => [p.categoryId, p.category.label]),
                ).entries(),
              ).map(([id, label]) => (
                <option value={id} key={id}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price (integer cents)">
            <input
              type="number"
              min="1"
              step="1"
              value={form.priceCents}
              onChange={(e) => update("priceCents", Number(e.target.value))}
            />
          </Field>
          <Field label="Primary accent">
            <div className="color-field">
              <input
                type="color"
                value={form.accentHex}
                onChange={(e) => update("accentHex", e.target.value)}
              />
              <input
                aria-label="Accent hex"
                value={form.accentHex}
                onChange={(e) => update("accentHex", e.target.value)}
              />
            </div>
          </Field>
          <Field label="Secondary foil color">
            <input
              type="color"
              value={form.secondaryHex}
              onChange={(e) => update("secondaryHex", e.target.value)}
            />
          </Field>
          <Field label="Artwork asset">
            <select
              value={form.artworkAsset}
              onChange={(e) => update("artworkAsset", e.target.value)}
            >
              {packs
                .filter((p) => p.categoryId === form.categoryId)
                .map((p) => (
                  <option key={p.id} value={p.artworkAsset}>
                    {p.artworkAsset.split("/").pop()}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Sell policy (% of market)">
            <input
              type="number"
              min="0"
              max="100"
              step=".01"
              value={form.sellBps / 100}
              onChange={(e) =>
                update("sellBps", Math.round(Number(e.target.value) * 100))
              }
            />
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) => update("sortOrder", Number(e.target.value))}
            />
          </Field>
          <Field label="Visibility">
            <select
              value={
                form.isHidden ? "hidden" : form.isActive ? "active" : "inactive"
              }
              onChange={(e) => {
                update("isActive", e.target.value === "active");
                update("isHidden", e.target.value === "hidden");
              }}
            >
              <option value="inactive">Inactive</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden (archive)</option>
            </select>
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
          <p className="muted">
            Activation requires valid published odds and stock. Archive hides
            the pack while preserving ledger and opening history.
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="button primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save pack"}
          </button>
        </div>
        <div className="live-preview">
          <p className="eyebrow">LIVE PLAYER PREVIEW</p>
          <FoilPack pack={form as Pack} />
          <h3>{form.title}</h3>
          <div
            className="buy-button"
            style={
              {
                "--accent": form.accentHex,
                color: contrastText(form.accentHex),
              } as React.CSSProperties
            }
          >
            <Symbol
              category={form.categoryId}
              variant={
                contrastText(form.accentHex) === "#FFFFFF"
                  ? "cta-light"
                  : "cta-dark"
              }
            />
            Buy for {money(form.priceCents)}
          </div>
          <p>
            {money(base.minCents)} min · {money(base.maxCents)} max
            <br />
            Derived from published outcomes.
          </p>
        </div>
      </form>
    </Modal>
  );
}
function Inventory({
  data,
  query,
  readonly,
  editCard,
  editStock,
}: {
  data: AdminData;
  query: string;
  readonly: boolean;
  editCard: (v: Card) => void;
  editStock: (v: AdminData["pools"][number]) => void;
}) {
  const [mode, setMode] = useState("all"),
    [status, setStatus] = useState("all"),
    [category, setCategory] = useState("all"),
    [sort, setSort] = useState("value-desc");
  const cards = data.cards
    .filter(
      (c) =>
        (status === "all" || c.status === status) &&
        (category === "all" || c.categoryId === category) &&
        `${c.name} ${c.id} ${c.certNumber}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "value-desc"
        ? b.marketValueCents - a.marketValueCents
        : sort === "value-asc"
          ? a.marketValueCents - b.marketValueCents
          : a.name.localeCompare(b.name),
    );
  return (
    <>
      <div className="inventory-summary">
        <Badge>{data.tiers.length} illustrative price tiers</Badge>
        <Badge>
          {data.cards.filter((c) => c.status === "in_stock").length} unique
          cards in stock
        </Badge>
        <Badge>
          {data.pools.reduce((s, p) => s + p.quantityAvailable, 0)} pooled units
        </Badge>
      </div>
      <div className="filter-row">
        <select
          aria-label="Inventory mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="all">All inventory modes</option>
          <option value="unique">Individually tracked cards</option>
          <option value="pooled">Pooled tier units</option>
        </select>
        <select
          aria-label="Inventory category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          {["pokemon", "one-piece", "basketball", "baseball"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Inventory status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {[
            "in_stock",
            "reserved",
            "collected",
            "sold",
            "shipping_requested",
            "shipped",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Inventory sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="value-desc">Value: high to low</option>
          <option value="value-asc">Value: low to high</option>
          <option value="name">Name</option>
        </select>
      </div>
      {mode !== "unique" && (
        <>
          <h2 className="section-title">
            Pooled inventory <span>Under $60 by default</span>
          </h2>
          <Table
            headers={[
              "Representative card",
              "Category / tier",
              "Available",
              "Reserved",
              "Unit value / cost",
              "Health",
              "Action",
            ]}
            rows={data.pools
              .filter(
                (p) =>
                  (category === "all" || p.categoryId === category) &&
                  (status === "all" || status === "in_stock") &&
                  `${p.name} ${p.id}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              )
              .map((p) => [
                <div key="n" className="table-card">
                  <img src={p.imageAsset} alt="" />
                  <strong>{p.name}</strong>
                </div>,
                <div key="t">
                  {p.categoryId}
                  <small>{p.tier.label}</small>
                </div>,
                p.quantityAvailable,
                p.quantityReserved,
                `${money(p.unitValueCents)} / ${money(p.unitAcquisitionCostCents)}`,
                <Badge
                  key="h"
                  tone={
                    p.quantityAvailable < p.tier.minStock
                      ? "warning"
                      : "success"
                  }
                >
                  {p.quantityAvailable < p.tier.minStock
                    ? "Low stock"
                    : "Stocked"}
                </Badge>,
                <button
                  key="a"
                  className="text-button"
                  disabled={readonly}
                  onClick={() => editStock(p)}
                >
                  Adjust stock
                </button>,
              ])}
          />
        </>
      )}
      {mode !== "pooled" && (
        <>
          <h2 className="section-title">Tracked cards & outcome snapshots</h2>
          <Table
            headers={[
              "Card / ID",
              "Category / tier",
              "Grade / certificate",
              "Value / cost",
              "Vendor / vault",
              "Acquired",
              "Status",
              "Action",
            ]}
            rows={cards.map((c) => [
              <div key="c" className="table-card">
                <img src={c.imageAsset} alt="" />
                <div>
                  <strong>{c.name}</strong>
                  <small>
                    {c.id.slice(-10)} · {c.inventoryMode}
                  </small>
                </div>
              </div>,
              <div key="t">
                {c.categoryId}
                <small>{c.tier.label}</small>
              </div>,
              <div key="g">
                {c.grade ? `${c.gradingCompany} ${c.grade}` : "Ungraded"}
                <small>{c.certNumber ?? "—"}</small>
              </div>,
              `${money(c.marketValueCents)} / ${money(c.acquisitionCostCents)}`,
              <div key="v">
                {c.vendor}
                <small>{c.location}</small>
              </div>,
              date(c.acquiredAt),
              <Badge key="s" tone={c.status === "in_stock" ? "success" : ""}>
                {c.status.replaceAll("_", " ")}
              </Badge>,
              <button
                key="e"
                className="text-button"
                disabled={readonly || c.status !== "in_stock"}
                onClick={() => editCard(c)}
              >
                Edit
              </button>,
            ])}
          />
        </>
      )}
    </>
  );
}
function OddsEditor({
  data,
  run,
  readonly,
  busy,
}: {
  data: AdminData;
  run: Run;
  readonly: boolean;
  busy: boolean;
}) {
  const [id, setId] = useState(data.packs[0].id),
    [weights, setWeights] = useState<Record<string, number>>({}),
    [simulation, setSimulation] = useState<any>(null),
    [seed, setSeed] = useState(42);
  const p = data.packs.find((p) => p.id === id) ?? data.packs[0];
  const tiers = data.tiers.filter((t) => t.categoryId === p.categoryId);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("pack");
    if (q && data.packs.some((p) => p.id === q)) setId(q);
  }, []);
  useEffect(() => {
    setWeights(Object.fromEntries(p.rows.map((r) => [r.tierId, r.weightBps])));
    setSimulation(null);
  }, [id, p.oddsVersion]);
  const sum = Object.values(weights).reduce((s, w) => s + w, 0);
  const ev =
    tiers.reduce((s, t) => s + (weights[t.id] ?? 0) * t.marketValueCents, 0) /
    10000;
  const stock = (t: string) =>
    data.pools
      .filter((p) => p.tierId === t)
      .reduce((s, p) => s + p.quantityAvailable, 0) +
    data.cards.filter((c) => c.tierId === t && c.status === "in_stock").length;
  const valid =
    sum === 10000 &&
    tiers.every((t) => !(weights[t.id] > 0) || stock(t.id) > 0);
  return (
    <>
      <div className="odds-toolbar">
        <Field label="Configure pack">
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {data.packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} · {p.category.label}
              </option>
            ))}
          </select>
        </Field>
        <Badge>Published version {p.oddsVersion}</Badge>
        <Badge>
          Target {(data.settings.rtpTargetBps / 100).toFixed(1)}% · configurable
        </Badge>
      </div>
      <div className="rtp-summary">
        <div>
          <span>Market-value RTP</span>
          <strong>{((ev / p.priceCents) * 100).toFixed(2)}%</strong>
          <small>Weighted market value / pack price</small>
        </div>
        <div>
          <span>Cash sell-value RTP</span>
          <strong>
            {(((ev * p.sellBps) / 10000 / p.priceCents) * 100).toFixed(2)}%
          </strong>
          <small>Sell policy {(p.sellBps / 100).toFixed(2)}% of market</small>
        </div>
        <div>
          <span>Expected market outcome</span>
          <strong>{money(Math.round(ev))}</strong>
          <small>{money(p.priceCents)} pack price</small>
        </div>
        <div className={sum === 10000 ? "valid" : "invalid"}>
          <span>Total probability</span>
          <strong>{(sum / 100).toFixed(3)}%</strong>
          <small>
            {valid ? "Valid & stocked" : "Must total 100% and be stocked"}
          </small>
        </div>
      </div>
      <Table
        headers={[
          "Tier",
          "Market value",
          "Eligible stock",
          "Probability (%)",
          "Expected contribution",
        ]}
        rows={tiers.map((t) => [
          t.label,
          money(t.marketValueCents),
          <Badge key="s" tone={stock(t.id) > 0 ? "success" : "warning"}>
            {stock(t.id)} units
          </Badge>,
          <input
            key="w"
            className="odds-input"
            aria-label={`${t.label} probability`}
            type="number"
            min="0"
            max="100"
            step=".01"
            disabled={readonly}
            value={(weights[t.id] ?? 0) / 100}
            onChange={(e) =>
              setWeights((prev) => ({
                ...prev,
                [t.id]: Math.round(Number(e.target.value) * 100),
              }))
            }
          />,
          money(
            Math.round(((weights[t.id] ?? 0) * t.marketValueCents) / 10000),
          ),
        ])}
      />
      <div className="odds-actions">
        <p>
          Publishing creates a new version. Existing openings retain their
          original version and outcome.
        </p>
        <button
          className="button primary"
          disabled={readonly || busy || !valid}
          onClick={() =>
            run(
              "odds",
              {
                packId: id,
                rows: tiers.map((t) => ({
                  tierId: t.id,
                  weightBps: weights[t.id] ?? 0,
                })),
              },
              "New odds version published",
            ).catch(() => {})
          }
        >
          Publish odds version
        </button>
      </div>
      <section className="panel simulation">
        <div className="panel-heading">
          <div>
            <h2>10,000-opening preview</h2>
            <p>
              Deterministic simulation of published odds. Wallet and live stock
              stay untouched.
            </p>
          </div>
        </div>
        <div className="simulation-controls">
          <Field label="Deterministic seed">
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
            />
          </Field>
          <button
            className="button secondary"
            disabled={readonly || busy}
            onClick={async () => {
              try {
                setSimulation(
                  await run(
                    "simulate",
                    { packId: id, seed },
                    "Simulation completed — no live inventory used",
                  ),
                );
              } catch {}
            }}
          >
            Run 10k simulation
          </button>
        </div>
        {simulation && (
          <>
            <div className="notice">
              {simulation.count.toLocaleString()} openings · Market RTP{" "}
              {simulation.marketRtp.toFixed(2)}% · Sell RTP{" "}
              {simulation.sellRtp.toFixed(2)}% · Seed {simulation.seed}
            </div>
            <Table
              headers={["Tier", "Observed pulls", "Observed probability"]}
              rows={p.rows.map((r) => [
                r.label,
                simulation.counts[r.tierId] ?? 0,
                `${((simulation.counts[r.tierId] ?? 0) / 100).toFixed(2)}%`,
              ])}
            />
          </>
        )}
      </section>
    </>
  );
}
function CardEditor({
  card,
  data,
  close,
  run,
  busy,
}: {
  card: Card | null;
  data: AdminData;
  close: () => void;
  run: Run;
  busy: boolean;
}) {
  const tier = data.tiers.find((t) => t.marketValueCents >= 6000)!;
  const [form, setForm] = useState(
    card ?? {
      categoryId: tier.categoryId,
      tierId: tier.id,
      name: "New Original Collectible",
      grade: "10",
      gradingCompany: "DEMO",
      certNumber: "",
      marketValueCents: tier.marketValueCents,
      sellValueCents: tier.marketValueCents,
      acquisitionCostCents: 0,
      vendor: "Demo vendor",
      imageAsset: `/assets/cards/${tier.categoryId}-4.svg`,
      location: "Demo vault A",
    },
  );
  const [error, setError] = useState("");
  const update = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));
  return (
    <Modal
      title={card ? "Edit inventory card" : "Add inventory card"}
      onClose={close}
      wide
    >
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await run("card", { id: card?.id, data: form });
            close();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <Field label="Title">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </Field>
        <Field label="Tier (sets category and market value)">
          <select
            value={form.tierId}
            onChange={(e) => {
              const t = data.tiers.find((t) => t.id === e.target.value)!;
              setForm((f) => ({
                ...f,
                tierId: t.id,
                categoryId: t.categoryId,
                marketValueCents: t.marketValueCents,
                sellValueCents: t.marketValueCents,
                imageAsset: `/assets/cards/${t.categoryId}-${t.id.split("t").pop()}.svg`,
              }));
            }}
          >
            {data.tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.categoryId} · {t.label} · {money(t.marketValueCents)}
              </option>
            ))}
          </select>
        </Field>
        {(
          [
            "grade",
            "gradingCompany",
            "certNumber",
            "vendor",
            "location",
            "imageAsset",
          ] as const
        ).map((k) => (
          <Field key={k} label={k}>
            <input
              value={form[k] ?? ""}
              onChange={(e) => update(k, e.target.value)}
            />
          </Field>
        ))}
        <Field label="Acquisition cost (cents)">
          <input
            type="number"
            min="0"
            value={form.acquisitionCostCents}
            onChange={(e) =>
              update("acquisitionCostCents", Number(e.target.value))
            }
          />
        </Field>
        <p className="muted">
          Outcome sell value is snapshotted from market value and the pack’s
          sell policy. Allocated cards cannot be edited.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          Save inventory card
        </button>
      </form>
    </Modal>
  );
}
function StockEditor({
  pool,
  data,
  close,
  run,
  busy,
}: {
  pool: AdminData["pools"][number] | null;
  data: AdminData;
  close: () => void;
  run: Run;
  busy: boolean;
}) {
  const t = data.tiers.find((t) => t.marketValueCents < 6000)!;
  const [form, setForm] = useState({
    tierId: pool?.tierId ?? t.id,
    name: pool?.name ?? "New Original Tier Units",
    imageAsset: pool?.imageAsset ?? `/assets/cards/${t.categoryId}-0.svg`,
    unitAcquisitionCostCents: pool?.unitAcquisitionCostCents ?? 0,
    minStock: pool?.tier.minStock ?? 5,
    quantityAvailable: pool?.quantityAvailable ?? 100,
    reason: "Demo restock",
  });
  const [delta, setDelta] = useState(0),
    [error, setError] = useState("");
  const update = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));
  return (
    <Modal
      title={pool ? "Edit pooled inventory" : "Add pooled inventory"}
      onClose={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await run(
              "pool",
              {
                id: pool?.id,
                data: {
                  ...form,
                  quantityAvailable: form.quantityAvailable + delta,
                  expectedQuantityAvailable: pool?.quantityAvailable,
                },
              },
              "Pooled stock saved with audit log",
            );
            close();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <Field label="Tier">
          <select
            disabled={!!pool}
            value={form.tierId}
            onChange={(e) => {
              const tier = data.tiers.find((t) => t.id === e.target.value)!;
              update("tierId", tier.id);
              update(
                "imageAsset",
                `/assets/cards/${tier.categoryId}-${tier.id.split("t").pop()}.svg`,
              );
            }}
          >
            {data.tiers
              .filter((t) => t.marketValueCents < 6000)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.categoryId} · {t.label} · {money(t.marketValueCents)}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Representative name">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="Representative original artwork">
          <input
            value={form.imageAsset}
            onChange={(e) => update("imageAsset", e.target.value)}
          />
        </Field>
        <Field label="Unit acquisition cost (cents)">
          <input
            type="number"
            min="0"
            value={form.unitAcquisitionCostCents}
            onChange={(e) =>
              update("unitAcquisitionCostCents", Number(e.target.value))
            }
          />
        </Field>
        <Field label="Tier minimum stock alert">
          <input
            type="number"
            min="0"
            value={form.minStock}
            onChange={(e) => update("minStock", Number(e.target.value))}
          />
        </Field>
        <p className="muted">
          {form.quantityAvailable} units available ·{" "}
          {pool?.quantityReserved ?? 0} reserved
        </p>
        <Field label="Unit change (positive or negative)">
          <input
            type="number"
            step="1"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
          />
        </Field>
        <Field label="Reason">
          <input
            value={form.reason}
            required
            minLength={3}
            onChange={(e) => update("reason", e.target.value)}
          />
        </Field>
        <p>Result: {form.quantityAvailable + delta} units</p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button
          className="button primary"
          disabled={busy || form.quantityAvailable + delta < 0}
        >
          Save pooled inventory
        </button>
      </form>
    </Modal>
  );
}
function WalletAdjustment({
  userId,
  close,
  run,
  busy,
}: {
  userId: string;
  close: () => void;
  run: Run;
  busy: boolean;
}) {
  const [amount, setAmount] = useState(1000),
    [reason, setReason] = useState("Demo support adjustment"),
    [key] = useState(crypto.randomUUID());
  return (
    <Modal title="Demo wallet adjustment" onClose={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await run(
              "adjustment",
              { userId, amountCents: amount, reason, key },
              "Adjustment recorded in ledger and audit",
            );
            close();
          } catch {}
        }}
      >
        <Field label="Amount (signed integer cents)">
          <input
            type="number"
            step="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </Field>
        <Field label="Reason">
          <input
            value={reason}
            minLength={3}
            required
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <p className="muted">
          Adds a new immutable ledger entry. Existing entries stay unchanged.
        </p>
        <button className="button primary" disabled={busy}>
          Record adjustment
        </button>
      </form>
    </Modal>
  );
}
function SettingsEditor({
  data,
  run,
  readonly,
  busy,
}: {
  data: AdminData;
  run: Run;
  readonly: boolean;
  busy: boolean;
}) {
  const [form, setForm] = useState(data.settings),
    [reset, setReset] = useState(false),
    [confirmation, setConfirmation] = useState("");
  return (
    <>
      <section className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <h2>Demo business rules</h2>
            <p>Applied on the server. All values are simulated.</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run("settings", form).catch(() => {});
          }}
        >
          <div className="form-grid">
            <Field label="Shipping threshold (cents, strictly greater than)">
              <input
                type="number"
                min="0"
                disabled={readonly}
                value={form.shippingThresholdCents}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    shippingThresholdCents: Number(e.target.value),
                  }))
                }
              />
            </Field>
            <Field label="RTP business target (%)">
              <input
                type="number"
                min="0"
                max="200"
                step=".01"
                disabled={readonly}
                value={form.rtpTargetBps / 100}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    rtpTargetBps: Math.round(Number(e.target.value) * 100),
                  }))
                }
              />
            </Field>
            <Field label="Starting demo balance (cents)">
              <input
                type="number"
                min="0"
                disabled={readonly}
                value={form.startingBalanceCents}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    startingBalanceCents: Number(e.target.value),
                  }))
                }
              />
            </Field>
          </div>
          <button className="button primary" disabled={readonly || busy}>
            Save settings
          </button>
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Categories & original assets</h2>
            <p>
              Category symbols are original alternatives. Color is configured
              per pack.
            </p>
          </div>
          <a
            className="text-link"
            href="/assets/manifest.json"
            target="_blank"
            rel="noreferrer"
          >
            Asset manifest <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="category-settings">
          {Array.from(
            new Map(data.packs.map((p) => [p.categoryId, p.category])).values(),
          ).map((c) => (
            <div key={c.id}>
              <Symbol category={c.id} />
              <strong>{c.label}</strong>
              <span>{c.iconAsset}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="panel audit-panel">
        <div className="panel-heading">
          <div>
            <h2>Audit trail</h2>
            <p>Actor, action, before/after summary and timestamp.</p>
          </div>
        </div>
        <Table
          headers={["Time", "Actor", "Entity", "Action", "Summary"]}
          rows={data.audits.map((a) => [
            date(a.createdAt),
            a.actorId,
            `${a.entityType} / ${a.entityId.slice(-10)}`,
            <Badge key="a">{a.action}</Badge>,
            <details key="p">
              <summary>Inspect changes</summary>
              <pre>{JSON.stringify(JSON.parse(a.payloadJson), null, 2)}</pre>
            </details>,
          ])}
        />
      </section>
      <section className="panel danger-panel">
        <div>
          <h2>Reset demo activity</h2>
          <p>
            Clears openings, demo ledger and fulfillment, resets wallets and
            stock. Pack configuration and audit logs are retained.
          </p>
        </div>
        <button
          className="button secondary danger-text"
          disabled={readonly}
          onClick={() => setReset(true)}
        >
          Reset demo
        </button>
      </section>
      {reset && (
        <Modal title="Reset demo activity?" onClose={() => setReset(false)}>
          <p>
            This removes all demo openings, collection, ledger activity and
            fulfillment requests. Audit history is retained.
          </p>
          <Field label="Type RESET DEMO to confirm">
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </Field>
          <button
            className="button primary danger"
            disabled={busy || confirmation !== "RESET DEMO"}
            onClick={async () => {
              try {
                await run("reset", { confirmation }, "Demo reset completed");
                setReset(false);
              } catch {}
            }}
          >
            Confirm reset
          </button>
        </Modal>
      )}
    </>
  );
}
function parseCSV(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}
