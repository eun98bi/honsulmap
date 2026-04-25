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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await db()
    .from("comments")
    .select("id, created_at, nickname, content")
    .eq("post_id", params.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const { nickname, password, content } = body ?? {};

  if (!nickname?.trim() || !password || !content?.trim()) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "pw_too_short" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  const { data: post } = await db()
    .from("posts")
    .select("id")
    .eq("id", params.id)
    .eq("is_deleted", false)
    .single();

  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data, error } = await db()
    .from("comments")
    .insert({
      post_id: params.id,
      nickname: nickname.trim(),
      password_hash: hashPw(password),
      content: content.trim(),
    })
    .select("id, created_at, nickname, content")
    .single();

  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
