"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  Grid2X2,
  Gift,
  User,
  ArrowLeft,
  ArrowUpRight,
  Package,
  Check,
  Truck,
  ArrowDownLeft,
  ShieldCheck,
} from "lucide-react";
import {
  useRips,
  money,
  date,
  Modal,
  Symbol,
  FoilPack,
  PackBuyButton,
  Pack,
  Opening,
  Empty,
  Badge,
} from "./shared";
const nav = [
  ["/play", "Packs", Layers],
  ["/play/collection", "Collection", Grid2X2],
  ["/play/rewards", "Rewards", Gift],
  ["/play/profile", "Profile", User],
] as const;
export default function Player() {
  const { packs, player, post, toast } = useRips();
  const router = useRouter(),
    path = usePathname();
  const [category, setCategory] = useState("pokemon"),
    [packId, setPackId] = useState("pokemon-0"),
    [inside, setInside] = useState(false),
    [wallet, setWallet] = useState(false),
    [busy, setBusy] = useState(false),
    [detail, setDetail] = useState<Opening | null>(null),
    [sellConfirm, setSellConfirm] = useState(false);
  const buying = useRef(false),
    key = useRef<string | null>(null),
    drag = useRef<number | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const c = q.get("category"),
      p = q.get("pack");
    if (c) setCategory(c);
    if (p) setPackId(p);
    const slug = window.location.pathname.split("/play/pack/")[1];
    const selected = packs.find((pack) => pack.slug === slug);
    if (selected) {
      setCategory(selected.categoryId);
      setPackId(selected.id);
    }
  }, []);
  const available = packs.filter(
      (p) => p.categoryId === category && !p.isHidden,
    ),
    pack = available.find((p) => p.id === packId) ?? available[0] ?? packs[0];
  const index = available.findIndex((p) => p.id === pack?.id);
  const choose = (p: Pack) => {
    setCategory(p.categoryId);
    setPackId(p.id);
    key.current = null;
    window.history.replaceState(
      null,
      "",
      `/play?category=${p.categoryId}&pack=${p.id}`,
    );
  };
  const change = (direction: number) => {
    if (available.length > 1)
      choose(
        available[(index + direction + available.length) % available.length],
      );
  };
  const categories = Array.from(
    new Map(packs.map((p) => [p.categoryId, p.category])).values(),
  );
  const openingId = path.split("/")[3];
  const opening = player?.openings.find((o) => o.id === openingId);
  const isOpening = path.includes("/open/"),
    isReveal = path.includes("/reveal/");
  useEffect(() => {
    if (isOpening && opening) {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const timer = setTimeout(
        () => router.replace(`/play/reveal/${opening.id}`),
        reduced ? 500 : 3000,
      );
      return () => clearTimeout(timer);
    }
  }, [isOpening, opening?.id, router]);
  useEffect(() => {
    if (path.startsWith("/play/pack/")) setInside(true);
  }, [path]);
  if (!player || !pack) return null;
  const buy = async () => {
    if (buying.current) return;
    if (player.wallet.balanceCents < pack.priceCents) {
      setWallet(true);
      return;
    }
    buying.current = true;
    setBusy(true);
    key.current ??=
      sessionStorage.getItem(`rips-purchase-${pack.id}`) ?? crypto.randomUUID();
    sessionStorage.setItem(`rips-purchase-${pack.id}`, key.current);
    try {
      const result = await post("purchase", {
        packId: pack.id,
        key: key.current,
      });
      router.push(`/play/open/${result.id}`);
      sessionStorage.removeItem(`rips-purchase-${pack.id}`);
      key.current = null;
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
      buying.current = false;
    }
  };
  const resolve = async (action: string) => {
    if (!opening || buying.current) return;
    buying.current = true;
    setBusy(true);
    try {
      await post("resolve", { id: opening.id, action });
      setSellConfirm(false);
      toast(
        action === "sold"
          ? "Card sold. Your demo wallet has been credited."
          : "Collected. Your card is safe in your collection.",
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      buying.current = false;
      setBusy(false);
    }
  };
  const requestShipping = async (o: Opening) => {
    setBusy(true);
    try {
      await post("shipping", { id: o.id });
      setDetail(null);
      toast(
        "Demo shipping request recorded. No real shipment will be created.",
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const collected = player.openings.filter((o) => o.status === "collected");
  return (
    <div className="play-canvas">
      <div
        className="player-shell"
        style={{ "--accent": pack.accentHex } as React.CSSProperties}
      >
        <header className="play-header">
          <Link href="/play" className="brand" aria-label="RIPS home">
            <img src="/assets/brand/logo.svg" alt="RIPS" />
            <span>BY LONESTAR</span>
          </Link>
          <button
            className="wallet-pill"
            aria-label={`Demo wallet balance ${money(player.wallet.balanceCents)}. Add demo funds.`}
            onClick={() => setWallet(true)}
          >
            <span className="wallet-label">DEMO WALLET</span>
            <strong data-testid="balance">
              {money(player.wallet.balanceCents)}
            </strong>
            <span className="wallet-plus">
              <Plus size={15} />
            </span>
          </button>
        </header>
        {path === "/play" || path === "/" || path.startsWith("/play/pack/") ? (
          <main className="shop">
            <div
              className="category-tabs"
              role="tablist"
              aria-label="Pack category"
            >
              {categories.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={category === c.id}
                  className={category === c.id ? "selected" : ""}
                  onClick={() => {
                    const first = packs.find(
                      (p) => p.categoryId === c.id && !p.isHidden,
                    );
                    if (first) choose(first);
                  }}
                >
                  <Symbol category={c.id} />
                  {c.label}
                </button>
              ))}
            </div>
            <div className="hero-meta">
              <span>
                {pack.sortOrder === 0
                  ? "THE ORIGINAL SERIES"
                  : "THE PREMIUM SERIES"}
              </span>
              <span>
                <i
                  className={`stock-dot ${pack.available ? "" : "unavailable"}`}
                />
                {pack.available ? "Ready to rip" : "Unavailable"}
              </span>
            </div>
            <div
              className="pack-carousel"
              role="region"
              aria-label="Pack carousel"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  change(1);
                }
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  change(-1);
                }
              }}
              onPointerDown={(e) => {
                drag.current = e.clientX;
              }}
              onPointerUp={(e) => {
                if (
                  drag.current !== null &&
                  Math.abs(e.clientX - drag.current) > 35
                )
                  change(e.clientX < drag.current ? 1 : -1);
                drag.current = null;
              }}
              onPointerCancel={() => (drag.current = null)}
            >
              <div className="hero-halo" />
              {available.length > 1 && (
                <>
                  <button
                    className="side-pack left"
                    aria-label="Previous pack"
                    onClick={() => change(-1)}
                  >
                    <FoilPack
                      eager
                      pack={
                        available[
                          (index - 1 + available.length) % available.length
                        ]
                      }
                    />
                  </button>
                  <button
                    className="side-pack right"
                    aria-label="Next pack"
                    onClick={() => change(1)}
                  >
                    <FoilPack
                      eager
                      pack={available[(index + 1) % available.length]}
                    />
                  </button>
                </>
              )}
              <FoilPack key={pack.id} pack={pack} className="hero-pack" />
              <button
                className="carousel-arrow left"
                aria-label="Previous pack"
                onClick={() => change(-1)}
                disabled={available.length < 2}
              >
                <ChevronLeft size={19} />
              </button>
              <button
                className="carousel-arrow right"
                aria-label="Next pack"
                onClick={() => change(1)}
                disabled={available.length < 2}
              >
                <ChevronRight size={19} />
              </button>
            </div>
            <div className="pagination" aria-label="Select pack">
              {available.map((p, i) => (
                <button
                  key={p.id}
                  className={i === index ? "active" : ""}
                  aria-label={`Select ${p.title}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => choose(p)}
                />
              ))}
            </div>
            <div className="pack-heading">
              <div>
                <p className="eyebrow">
                  {pack.category.label.toUpperCase()} · 1 CARD PER PACK
                </p>
                <h1>{pack.title}</h1>
              </div>
              <button
                className="inside-button"
                onClick={() => setInside(true)}
                aria-label="What's Inside"
              >
                What’s inside <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="pack-info">
              <div>
                <span>Min Value</span>
                <strong>{money(pack.minCents)}</strong>
              </div>
              <div>
                <span>Max Pull</span>
                <strong>{money(pack.maxCents)}</strong>
              </div>
              <button onClick={() => setInside(true)}>
                <span>Transparent odds</span>
                <strong>
                  View odds <ArrowUpRight size={13} />
                </strong>
              </button>
            </div>
            <div className="buy-area">
              <PackBuyButton
                pack={pack}
                busy={busy}
                disabled={!pack.available}
                onClick={buy}
                label={!pack.available ? "Temporarily unavailable" : undefined}
              />
              <p>
                <ShieldCheck size={11} /> Demo experience · No real money
              </p>
            </div>
          </main>
        ) : isOpening ? (
          <main className="opening-screen">
            <p className="eyebrow">{opening?.pack.title ?? "YOUR PACK"}</p>
            <h1>
              A little suspense.
              <br />A great possibility.
            </h1>
            {opening ? (
              <div className="tear-scene">
                <div className="opening-burst" />
                <FoilPack
                  eager
                  pack={packs.find((p) => p.id === opening.packId) ?? pack}
                  className="tearing"
                />
                {Array.from({ length: 12 }, (_, i) => (
                  <i
                    className="particle"
                    key={i}
                    style={{ "--i": i } as React.CSSProperties}
                  />
                ))}
              </div>
            ) : (
              <Empty
                title="Opening not found"
                description="Return to your packs and try again."
              />
            )}
            <p>Your card is already reserved.</p>
            {opening && (
              <button
                className="button secondary"
                onClick={() => router.replace(`/play/reveal/${opening.id}`)}
              >
                Skip animation <ChevronRight size={16} />
              </button>
            )}
          </main>
        ) : isReveal ? (
          <main className="reveal-screen">
            {opening ? (
              <>
                <p className="eyebrow">
                  {opening.status === "pending"
                    ? "YOUR NEXT GREAT PULL"
                    : "IT’S OFFICIAL"}
                </p>
                <h1>
                  {opening.status === "sold"
                    ? "A great trade."
                    : opening.status === "collected"
                      ? "A keeper."
                      : "Meet your new collectible."}
                </h1>
                <div className="card-reveal">
                  <div className="card-glow" />
                  <img src={opening.card.imageAsset} alt={opening.card.name} />
                  {opening.card.grade && (
                    <Badge>
                      DEMO GRADE {opening.card.grade} ·{" "}
                      {opening.card.certNumber}
                    </Badge>
                  )}
                </div>
                <h2>{opening.card.name}</h2>
                <p className="estimated">Estimated market value</p>
                <div className="reveal-value">
                  {money(opening.outcomeMarketValueCents)}
                </div>
                {opening.status === "pending" ? (
                  <div className="reveal-actions">
                    <PackBuyButton
                      pack={packs.find((p) => p.id === opening.packId) ?? pack}
                      busy={busy}
                      onClick={() => resolve("collected")}
                      label="Collect Card"
                    />
                    <button
                      disabled={busy}
                      className="button secondary"
                      onClick={() => setSellConfirm(true)}
                    >
                      Sell for {money(opening.outcomeSellValueCents)}
                    </button>
                    <p>Demo values. No real-money redemption.</p>
                  </div>
                ) : (
                  <div className="resolved">
                    <Badge tone="success">
                      <Check size={13} />{" "}
                      {opening.status === "sold"
                        ? "Demo wallet credited"
                        : "Added to collection"}
                    </Badge>
                    <Link
                      className="button secondary"
                      href={
                        opening.status === "collected"
                          ? "/play/collection"
                          : "/play"
                      }
                    >
                      {opening.status === "collected"
                        ? "View collection"
                        : "Back to packs"}{" "}
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <Empty
                title="Opening not found"
                description="Visit Profile to see your saved openings."
              />
            )}
          </main>
        ) : path === "/play/collection" ? (
          <main className="subpage">
            <div className="page-heading">
              <p className="eyebrow">YOUR PERSONAL VAULT</p>
              <h1>The keepers.</h1>
              <p>
                {collected.length} collectible
                {collected.length === 1 ? "" : "s"} ·{" "}
                {money(
                  collected.reduce((s, o) => s + o.outcomeMarketValueCents, 0),
                )}{" "}
                estimated value
              </p>
            </div>
            {collected.length ? (
              <div className="collection-grid">
                {collected.map((o) => (
                  <button
                    className="collection-card"
                    key={o.id}
                    onClick={() => setDetail(o)}
                  >
                    <img src={o.card.imageAsset} alt={o.card.name} />
                    <span className="card-category">
                      {o.pack.category.label}
                    </span>
                    <strong>{o.card.name}</strong>
                    <span>
                      {o.card.grade ? `Demo grade ${o.card.grade} · ` : ""}
                      {money(o.outcomeMarketValueCents)}
                    </span>
                    <Badge>{o.card.status.replaceAll("_", " ")}</Badge>
                  </button>
                ))}
              </div>
            ) : (
              <Empty
                title="Your story starts with a rip."
                description="Collect your first card to build a vault that’s yours."
              />
            )}
            <Link className="text-link" href="/play">
              Explore packs <ArrowUpRight size={15} />
            </Link>
          </main>
        ) : path === "/play/rewards" ? (
          <main className="subpage rewards">
            <div className="reward-icon">
              <Gift size={35} />
            </div>
            <p className="eyebrow">SOMETHING GOOD IS COMING</p>
            <h1>
              A little more
              <br />
              to look forward to.
            </h1>
            <p>
              Rewards are coming soon.
              <br />
              For now, enjoy the next great pull.
            </p>
            <Link className="button secondary" href="/play">
              Explore packs <ArrowUpRight size={16} />
            </Link>
          </main>
        ) : path === "/play/profile" ? (
          <main className="subpage">
            <div className="profile-heading">
              <div className="avatar">AM</div>
              <h1>Alex Morgan</h1>
              <Badge>Demo — no real money</Badge>
            </div>
            <div className="profile-wallet">
              <span>Demo wallet balance</span>
              <strong>{money(player.wallet.balanceCents)}</strong>
              <button
                className="button secondary"
                onClick={() => setWallet(true)}
              >
                <Plus size={16} /> Add demo funds
              </button>
            </div>
            <h2 className="section-title">
              Wallet activity <span>{player.transactions.length}</span>
            </h2>
            {player.transactions.length ? (
              <div className="history">
                {player.transactions.map((t) => (
                  <div key={t.id}>
                    <span className="history-icon">
                      {t.amountCents > 0 ? (
                        <ArrowDownLeft size={18} />
                      ) : (
                        <Package size={18} />
                      )}
                    </span>
                    <div>
                      <strong>
                        {
                          (
                            {
                              demo_topup: "Demo top-up",
                              pack_purchase: "Pack purchase",
                              sell_credit: "Card sale",
                              refund_adjustment: "Demo adjustment",
                            } as Record<string, string>
                          )[t.type]
                        }
                      </strong>
                      <span>{date(t.createdAt)}</span>
                    </div>
                    <b className={t.amountCents > 0 ? "positive" : ""}>
                      {t.amountCents > 0 ? "+" : "−"}
                      {money(Math.abs(t.amountCents))}
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                Your demo wallet activity will appear here.
              </p>
            )}
            <h2 className="section-title">
              Opening history <span>{player.openings.length}</span>
            </h2>
            <div className="history">
              {player.openings.map((o) => (
                <Link href={`/play/reveal/${o.id}`} key={o.id}>
                  <img src={o.card.imageAsset} alt="" />
                  <div>
                    <strong>{o.pack.title}</strong>
                    <span>
                      {o.status} · {date(o.createdAt)}
                    </span>
                  </div>
                  <b>{money(o.outcomeMarketValueCents)}</b>
                </Link>
              ))}
            </div>
            <Link className="admin-entry" href="/admin">
              Open demo back office <ArrowUpRight size={14} />
            </Link>
          </main>
        ) : (
          <main className="subpage">
            <Empty
              title="Page not found"
              description="There’s another great pack waiting for you."
            />
            <Link href="/play" className="button secondary">
              Back to packs
            </Link>
          </main>
        )}
        {!isOpening && !isReveal && (
          <nav className="bottom-nav" aria-label="Player navigation">
            {nav.map(([href, label, Icon]) => (
              <Link
                href={href}
                key={href}
                className={
                  (
                    href === "/play"
                      ? path === "/play" || path.startsWith("/play/pack/")
                      : path === href
                  )
                    ? "active"
                    : ""
                }
              >
                <Icon size={20} strokeWidth={1.7} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        )}
        {inside && (
          <Modal
            title="What’s inside"
            onClose={() => {
              setInside(false);
              if (path.startsWith("/play/pack/")) router.replace("/play");
            }}
          >
            <div className="inside-summary">
              <img src={pack.artworkAsset} alt={pack.title} />
              <div>
                <Badge>{pack.category.label}</Badge>
                <h3>{pack.title}</h3>
                <p>One card. Published odds v{pack.oddsVersion}.</p>
                <strong>{money(pack.priceCents)} per pack</strong>
              </div>
            </div>
            <p className="odds-explanation">
              Simulated demo probabilities by tier. Within each tier, eligible
              unique cards are selected equally; pooled outcomes use
              representative original art. No guaranteed value.
            </p>
            <div className="odds-card-grid">
              {pack.rows.map((r) => (
                <div key={r.tierId}>
                  <img
                    src={r.image}
                    alt={`${r.label} representative original art`}
                  />
                  <div>
                    <h4>{r.label}</h4>
                    <span>{money(r.valueCents)} market value</span>
                    <strong>{(r.weightBps / 100).toFixed(2)}% tier odds</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="odds-total">
              <span>Total probability</span>
              <strong>
                {(pack.rows.reduce((s, r) => s + r.weightBps, 0) / 100).toFixed(
                  3,
                )}
                %
              </strong>
            </div>
            <p className="muted">
              Expected market RTP: {pack.marketRtp.toFixed(2)}% · Sell RTP:{" "}
              {pack.sellRtp.toFixed(2)}%. Target is configurable and is not a
              guarantee.
            </p>
          </Modal>
        )}
        {wallet && <DemoWallet onClose={() => setWallet(false)} />}
        {sellConfirm && opening && (
          <Modal title="Sell this card?" onClose={() => setSellConfirm(false)}>
            <p>
              You’ll receive{" "}
              <strong>{money(opening.outcomeSellValueCents)}</strong> in your
              simulated demo wallet. This choice is final for this opening.
            </p>
            <p className="muted">No real money is exchanged.</p>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => resolve("sold")}
            >
              {busy
                ? "Selling…"
                : `Confirm sell for ${money(opening.outcomeSellValueCents)}`}
            </button>
          </Modal>
        )}
        {detail && (
          <Modal title="Your collectible" onClose={() => setDetail(null)}>
            <div className="card-detail">
              <img src={detail.card.imageAsset} alt={detail.card.name} />
              <h3>{detail.card.name}</h3>
              <p>
                {detail.pack.category.label} ·{" "}
                {money(detail.outcomeMarketValueCents)} estimated value
              </p>
              {detail.card.grade && (
                <p>
                  Demo grade {detail.card.grade} · {detail.card.certNumber}
                </p>
              )}
              <p>Acquired {date(detail.createdAt)}</p>
              <Badge>{detail.card.status.replaceAll("_", " ")}</Badge>
              {detail.outcomeMarketValueCents >
                player.settings.shippingThresholdCents &&
                detail.card.status === "collected" &&
                !detail.fulfillment && (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => requestShipping(detail)}
                  >
                    <Truck size={17} /> Request shipping (demo)
                  </button>
                )}
              {detail.fulfillment && (
                <p>
                  Demo shipping: {detail.fulfillment.status}. No real shipment.
                </p>
              )}
              <p className="muted">
                Shipping eligibility requires value strictly above{" "}
                {money(player.settings.shippingThresholdCents)}. Estimated
                values are not guaranteed.
              </p>
            </div>
          </Modal>
        )}
      </div>
      <Link href="/admin" className="desktop-admin-link">
        Demo back office <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}
function DemoWallet({ onClose }: { onClose: () => void }) {
  const { player, post, toast } = useRips();
  const [amount, setAmount] = useState(5000),
    [busy, setBusy] = useState(false);
  const inFlight = useRef(false),
    requestKey = useRef(crypto.randomUUID());
  const add = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await post("topup", { amountCents: amount, key: requestKey.current });
      toast(`${money(amount)} added to your demo wallet.`);
      onClose();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal title="Demo Wallet" onClose={onClose}>
      <p className="muted">
        Demo — no real money. Top-ups are simulated and cannot be withdrawn.
      </p>
      <div className="wallet-modal-balance">
        <span>Your balance</span>
        <strong>{money(player?.wallet.balanceCents ?? 0)}</strong>
      </div>
      <div className="amount-options">
        {[2500, 5000, 10000].map((a) => (
          <button
            className={amount === a ? "selected" : ""}
            key={a}
            disabled={busy}
            onClick={() => {
              setAmount(a);
              requestKey.current = crypto.randomUUID();
            }}
          >
            {money(a)}
          </button>
        ))}
      </div>
      <button className="button primary" disabled={busy} onClick={add}>
        {busy ? "Adding demo funds…" : `Add ${money(amount)} demo funds`}
      </button>
    </Modal>
  );
}
