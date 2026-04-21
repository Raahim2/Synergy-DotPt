// lib/upload-service.ts

/** Step 1: Upload raw file through YOUR API route (never directly from browser) */
async function uploadRawToIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  // ✅ /api/upload has the JWT server-side — browser never touches Pinata directly
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.cid as string;
}

/** Step 2: Ask server to encrypt the CID string with Lit */
async function encryptCidOnServer(
  rawCid: string,
  modelId: string,
  contractAddress: string
): Promise<{ encryptedCid: string; encryptionHash: string }> {
  const res = await fetch("/api/encrypt-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawCid, modelId, contractAddress }),
  });

  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`Server returned empty body (HTTP ${res.status}). Check terminal.`);
  }

  let json: any;
  try { json = JSON.parse(text); }
  catch { throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`); }

  if (!res.ok) throw new Error(json?.error ?? `Server error ${res.status}`);
  return json;
}

/** Public entry point — called from CreateModelPage */
export async function secureUpload(
  file: File,
  modelId: string,
  contractAddress: string
): Promise<{ cid: string; encryptionHash: string }> {
  const rawCid = await uploadRawToIPFS(file);
  const { encryptedCid, encryptionHash } = await encryptCidOnServer(
    rawCid,
    modelId,
    contractAddress
  );
  return { cid: encryptedCid, encryptionHash };
}