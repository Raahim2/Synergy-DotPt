// lib/decrypt-service.ts
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { decryptToFile } from "@lit-protocol/encryption";
import { LitNetwork } from "@lit-protocol/constants";

export const secureDecrypt = async (
  encCid: string,
  litHash: string,
  modelId: string,
  contractAddress: string,
  authSig: any
): Promise<Uint8Array> => {
  const litNodeClient = new LitJsSdk.LitNodeClient({
    litNetwork: LitNetwork.DatilDev,   // ✅ was "datil-test" — wrong string
    debug: false,
    checkNodeAttestation: false,
  });
  await litNodeClient.connect();

  const gatewayUrl = `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${encCid}`;
  const response = await fetch(gatewayUrl);
  if (!response.ok) throw new Error(`IPFS fetch failed: ${response.statusText}`);

  const encryptedBytes = await response.arrayBuffer();
  const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encryptedBytes)));

  // ─── Access control conditions — matches encrypt-upload route ────────────
  const accessControlConditions = [
    {
      contractAddress,
      standardContractType: "",
      chain: "sepolia",
      method: "hasAccess",
      parameters: [modelId.toString(), ":userAddress"],
      returnValueTest: { comparator: "=", value: "true" },
    },
  ];

  const decryptedFile: Uint8Array = await decryptToFile(
    {
      accessControlConditions,
      ciphertext,
      dataToEncryptHash: litHash,
      authSig,
      chain: "sepolia",
    },
    litNodeClient
  );

  await litNodeClient.disconnect();
  return decryptedFile;
};