// lib/voyage.ts
// Cliente HTTP minimalista para Voyage AI Embeddings.
// Reemplaza al SDK voyageai por incompatibilidad con ESM en Node 20+.

export const MODEL_EMBED = "voyage-3";
export const DIM = 1024;

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

interface VoyageEmbedParams {
  input: string | string[];
  model?: string;
  inputType?: "document" | "query";
}

interface VoyageEmbedResponse {
  data: Array<{ embedding: number[]; index: number }>;
  model: string;
  usage: { total_tokens: number };
}

class VoyageClient {
  private apiKey: string;

  constructor() {
    const key = process.env.VOYAGE_API_KEY;
    if (!key) {
      throw new Error(
        "VOYAGE_API_KEY no está definida en las variables de entorno"
      );
    }
    this.apiKey = key;
  }

  async embed(
    params: VoyageEmbedParams
  ): Promise<{ data: Array<{ embedding: number[] }> }> {
    const body = {
      input: params.input,
      model: params.model ?? MODEL_EMBED,
      input_type: params.inputType ?? "document",
    };

    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Voyage API error (${response.status}): ${errorText}`
      );
    }

    const json = (await response.json()) as VoyageEmbedResponse;
    return { data: json.data };
  }
}

const globalForVoyage = globalThis as unknown as {
  voyage: VoyageClient | undefined;
};

export const voyage: VoyageClient =
  globalForVoyage.voyage ?? new VoyageClient();

if (process.env.NODE_ENV !== "production") {
  globalForVoyage.voyage = voyage;
}