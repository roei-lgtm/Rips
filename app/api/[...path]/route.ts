import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import * as domain from "@/lib/domain";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname.replace("/api/", "");
    if (path === "catalog") return NextResponse.json(await domain.catalog());
    if (path === "player") return NextResponse.json(await domain.playerState());
    if (path === "admin")
      return NextResponse.json(
        await domain.adminState(
          Number(req.nextUrl.searchParams.get("days") ?? 0),
        ),
      );
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (e) {
    return error(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host"))
      throw new domain.DomainError("Cross-origin mutations are blocked.", 403);
    const path = req.nextUrl.pathname.replace("/api/", "");
    const body = await req.json();
    const actor =
      req.headers.get("x-demo-role") === "analyst" ? "analyst" : "admin";
    if (path.startsWith("admin/") && actor === "analyst")
      throw new domain.DomainError(
        "Analyst is read-only. Switch to the demo admin role to edit.",
        403,
      );
    let result;
    switch (path) {
      case "purchase":
        result = await domain.purchase("demo", body.packId, body.key);
        break;
      case "resolve":
        if (!["sold", "collected"].includes(body.action))
          throw new domain.DomainError("Invalid action");
        result = await domain.resolveOpening("demo", body.id, body.action);
        break;
      case "topup":
        result = await domain.topup("demo", body.amountCents, body.key);
        break;
      case "shipping":
        result = await domain.fulfillment("demo", body.id);
        break;
      case "admin/pack":
        result = await domain.savePack(actor, body.id, body.data);
        break;
      case "admin/duplicate":
        result = await domain.duplicatePack(actor, body.id);
        break;
      case "admin/odds":
        result = await domain.publishOdds(actor, body.packId, body.rows);
        break;
      case "admin/simulate": {
        const pack = (await domain.catalog()).find((p) => p.id === body.packId);
        if (!pack) throw new domain.DomainError("Pack not found");
        result = domain.simulate(
          pack.rows,
          pack.priceCents,
          Number(body.seed ?? 42),
        );
        break;
      }
      case "admin/stock":
        result = await domain.adjustStock(
          actor,
          body.id,
          body.delta,
          body.reason,
        );
        break;
      case "admin/pool":
        result = await domain.savePool(actor, body.id, body.data);
        break;
      case "admin/card":
        result = await domain.saveCard(actor, body.id, body.data);
        break;
      case "admin/settings":
        result = await domain.updateSettings(actor, body);
        break;
      case "admin/shipping":
        result = await domain.advanceShipping(actor, body.id, body.status);
        break;
      case "admin/adjustment":
        result = await domain.manualAdjustment(
          actor,
          body.userId,
          body.amountCents,
          body.reason,
          body.key,
        );
        break;
      case "admin/reset":
        result = await domain.resetDemo(actor, body.confirmation);
        break;
      default:
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result ?? { ok: true });
  } catch (e) {
    return error(e);
  }
}
function error(e: unknown) {
  if (e instanceof domain.DomainError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError)
    return NextResponse.json(
      {
        error: e.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    if (e.code === "P2002")
      return NextResponse.json(
        {
          error:
            "A unique record already exists. Retry the original request or use a different slug.",
        },
        { status: 409 },
      );
  }
  console.error(e);
  return NextResponse.json(
    { error: "Unable to complete this request. Please retry." },
    { status: 500 },
  );
}
