export type LearnViewPhase = "vocab" | "question" | "feedback" | "answer";

const PHASES = new Set<LearnViewPhase>([
  "vocab",
  "question",
  "feedback",
  "answer",
]);

export function parseLearnViewState(searchParams: URLSearchParams): {
  phase?: LearnViewPhase;
  segIdx?: number;
  pairIdx?: number;
} {
  const rawPhase = searchParams.get("phase");
  const phase =
    rawPhase && PHASES.has(rawPhase as LearnViewPhase)
      ? (rawPhase as LearnViewPhase)
      : undefined;

  const segRaw = searchParams.get("seg");
  const pairRaw = searchParams.get("pair");
  const segIdx =
    segRaw != null && segRaw !== "" && !Number.isNaN(Number(segRaw))
      ? Number(segRaw)
      : undefined;
  const pairIdx =
    pairRaw != null && pairRaw !== "" && !Number.isNaN(Number(pairRaw))
      ? Number(pairRaw)
      : undefined;

  return { phase, segIdx, pairIdx };
}

export function buildLearnViewQuery(
  phase: LearnViewPhase,
  segIdx: number,
  pairIdx: number,
): string {
  const params = new URLSearchParams();
  params.set("phase", phase);
  params.set("seg", String(segIdx));
  params.set("pair", String(pairIdx));
  return params.toString();
}
