// app/api/inference/route.ts
import { NextResponse } from "next/server";
import { secureDecrypt } from "@/lib/decrypt-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { modelId, inputText, authSig } = await req.json();
    const supabase = await createClient();

    const { data: model, error } = await supabase
      .from('models')
      .select('info')
      .filter('info->>model_id', 'eq', modelId)
      .single();

    if (error || !model) return NextResponse.json({ error: "Model not found" }, { status: 404 });

    const weights = await secureDecrypt(
      model.info.ipfs_cid,
      model.info.lit_hash,
      modelId,
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
      authSig
    );

    // FIX: Use .length for Uint8Array
    console.log(`Inference running for model ${modelId}. Weights size: ${weights.length} bytes`);
    
    // In a real scenario, weights (Uint8Array) would be fed into your WASM/ONNX runtime here.
    const result = `Decrypted Inference Result for: "${inputText}"`;

    return NextResponse.json({ result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}