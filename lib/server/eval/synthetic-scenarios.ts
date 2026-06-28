import type { EvalScenarioDefinition } from "./types.ts";

export function getSyntheticPairingScenarios(): EvalScenarioDefinition[] {
  return [
    {
      scenarioId: "synthetic-exactly-8-speakers-1-chair",
      scenarioType: "synthetic",
      name: "Exactly 8 speakers and 1 chair",
      difficulty: "basic",
      sessionId: null,
      inputJson: {
        speakerCount: 8,
        adjudicatorCount: 1,
        objective: "BALANCED",
      },
      expectedSignalsJson: {
        requiresFullRoom: true,
        expectsNoLeftovers: true,
      },
    },
    {
      scenarioId: "synthetic-10-speakers-2-leftovers",
      scenarioType: "synthetic",
      name: "10 speakers with 2 leftovers",
      difficulty: "edge",
      sessionId: null,
      inputJson: {
        speakerCount: 10,
        adjudicatorCount: 2,
        objective: "DEVELOPMENT",
      },
      expectedSignalsJson: {
        expectsLeftovers: 2,
      },
    },
    {
      scenarioId: "synthetic-repeated-strong-pair",
      scenarioType: "synthetic",
      name: "Repeated strong pair pressure",
      difficulty: "edge",
      sessionId: null,
      inputJson: {
        repeatedPairPressure: true,
        objective: "COMPETITIVE",
      },
      expectedSignalsJson: {
        repeatControlMatters: true,
      },
    },
  ];
}
