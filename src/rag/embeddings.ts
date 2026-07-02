const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY ?? "";
const VOYAGE_MODEL = "voyage-3-lite"; // 512 dimensões, otimizado para retrieval com Claude

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
  model: string;
  usage: { total_tokens: number };
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input: texts, model: VOYAGE_MODEL }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voyage AI falhou [${response.status}]: ${body}`);
  }

  const result = (await response.json()) as VoyageResponse;
  // Retorna embeddings na ordem original dos textos
  return result.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export async function embedSingle(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding;
}

// Converte array de números para formato aceito pelo pgvector
export function toVectorSql(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
