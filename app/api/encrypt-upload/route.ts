import { NextRequest, NextResponse } from "next/server";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { encryptString } from "@lit-protocol/encryption";
import { pinata } from "@/lib/config";

export async function POST(req: NextRequest) {
  let litClient: LitNodeClient | null = null;

  try {
    let body: { rawCid: string; modelId: string; contractAddress: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { rawCid, modelId, contractAddress } = body;

    if (!rawCid || !modelId || !contractAddress) {
      return NextResponse.json(
        { error: "Missing fields: rawCid, modelId, contractAddress" },
        { status: 400 },
      );
    }

    if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_PINATA_JWT env var not set" },
        { status: 500 },
      );
    }

    // ── Connect to Lit ────────────────────────────────────────
    console.log("[encrypt-upload] Connecting to Lit...");
    litClient = new LitNodeClient({
      litNetwork: "datil",
      debug: false,
      checkNodeAttestation: false,
    });

    await Promise.race([
      litClient.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Lit timed out after 15s")), 15_000),
      ),
    ]);
    console.log("[encrypt-upload] Lit connected ✓");

    // ── Access control conditions ─────────────────────────────
    const accessControlConditions = [
      {
        contractAddress,
        standardContractType: "",
        chain: "sepolia",
        method: "hasAccess",
        parameters: [modelId, ":userAddress"],
        returnValueTest: { comparator: "=", value: "true" },
      },
    ];

    // ── Encrypt the raw CID string ────────────────────────────
    const { ciphertext, dataToEncryptHash } = await encryptString(
      { dataToEncrypt: rawCid, accessControlConditions },
      litClient,
    );

    // ── Upload ciphertext to IPFS via SDK ─────────────────────
    // Convert the ciphertext string to a File so the SDK accepts it
    const cipherFile = new File(
      [ciphertext],
      `${modelId}.enc-cid`,
      { type: "text/plain" },
    );

    const { cid: encryptedCid } = await pinata.upload.public.file(cipherFile);
    console.log("[encrypt-upload] Done. encryptedCid:", encryptedCid);

    return NextResponse.json({ encryptedCid, encryptionHash: dataToEncryptHash });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[encrypt-upload] FATAL:", message);
    return NextResponse.json({ error: message }, { status: 500 });

  } finally {
    if (litClient) {
      try { await litClient.disconnect(); } catch (_) {}
    }
  }
}