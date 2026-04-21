import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { cid } = await pinata.upload.public.file(file);
    return NextResponse.json({ cid }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[upload] FATAL:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}