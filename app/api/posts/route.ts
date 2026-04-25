import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

const PW_SALT = "honsulspot_community_salt_2024";
function hashPw(pw: string) {
  return createHash("sha256").update(pw + PW_SALT).digest("hex");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, count, error } = await db()
    .from("posts_with_meta")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });

  return NextResponse.json({ posts: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { nickname, password, title, content, barId } = body ?? {};

  if (!nickname?.trim() || !password || !title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "pw_too_short" }, { status: 400 });
  }

  const { data, error } = await db()
    .from("posts")
    .insert({
      nickname: nickname.trim(),
      password_hash: hashPw(password),
      title: title.trim(),
      content: content.trim(),
      bar_id: barId ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
