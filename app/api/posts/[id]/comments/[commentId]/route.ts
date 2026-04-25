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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const body = await req.json().catch(() => null);
  const { password } = body ?? {};

  if (!password) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { data: comment } = await db()
    .from("comments")
    .select("password_hash")
    .eq("id", params.commentId)
    .eq("post_id", params.id)
    .eq("is_deleted", false)
    .single();

  if (!comment)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (comment.password_hash !== hashPw(password)) {
    return NextResponse.json({ error: "wrong_password" }, { status: 403 });
  }

  await db()
    .from("comments")
    .update({ is_deleted: true })
    .eq("id", params.commentId);

  return NextResponse.json({ ok: true });
}
