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
  const { id } = params;

  await db().rpc("increment_post_view", { post_id: id });

  const { data, error } = await db()
    .from("posts")
    .select(
      "id, created_at, nickname, title, content, view_count, bar_id, bars(id, name, districts)"
    )
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.json().catch(() => null);
  const { password, title, content } = body ?? {};

  if (!password || !title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { data: post } = await db()
    .from("posts")
    .select("password_hash")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (post.password_hash !== hashPw(password)) {
    return NextResponse.json({ error: "wrong_password" }, { status: 403 });
  }

  const { error } = await db()
    .from("posts")
    .update({ title: title.trim(), content: content.trim() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.json().catch(() => null);
  const { password } = body ?? {};

  if (!password) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { data: post } = await db()
    .from("posts")
    .select("password_hash")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (post.password_hash !== hashPw(password)) {
    return NextResponse.json({ error: "wrong_password" }, { status: 403 });
  }

  await db().from("posts").update({ is_deleted: true }).eq("id", id);

  return NextResponse.json({ ok: true });
}
