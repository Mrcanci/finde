import { VoyageAIClient } from "voyageai";

export const MODEL_EMBED = "voyage-3";
export const DIM = 1024;

const globalForVoyage = globalThis as unknown as {
  voyage: VoyageAIClient | undefined;
};

// VoyageAIClient lee VOYAGE_API_KEY del entorno automáticamente.
export const voyage: VoyageAIClient =
  globalForVoyage.voyage ?? new VoyageAIClient();

if (process.env.NODE_ENV !== "production") {
  globalForVoyage.voyage = voyage;
}
