import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + "honsulmap_salt_mode")
    .digest("hex")
    .slice(0, 24);
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { barId, mode, voterId } = body ?? {};

  if (!barId || !mode || !voterId) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const ipHash = hashIp(getIp(req));

  // voter_id로 중복 확인
  const { data: byVoter } = await supabaseAdmin
    .from("mode_votes")
    .select("id")
    .eq("bar_id", barId)
    .eq("voter_id", voterId)
    .maybeSingle();

  if (byVoter) return NextResponse.json({ alreadyVoted: true });

  // ip_hash로 중복 확인 (보조)
  const { data: byIp } = await supabaseAdmin
    .from("mode_votes")
    .select("id")
    .eq("bar_id", barId)
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (byIp) return NextResponse.json({ alreadyVoted: true });

  const { error } = await supabaseAdmin
    .from("mode_votes")
    .insert({ bar_id: barId, mode, voter_id: voterId, ip_hash: ipHash });

  if (error?.code === "23505") return NextResponse.json({ alreadyVoted: true });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
