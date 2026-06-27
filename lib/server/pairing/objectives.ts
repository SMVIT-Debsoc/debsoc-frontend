import type { ObjectiveMetricMultipliers } from "./types.ts";
import type { PairingObjective } from "../../../types/pairing.ts";

const objectiveMultipliers: Record<PairingObjective, ObjectiveMetricMultipliers> = {
  DEVELOPMENT: {
    speaker_total_score: 0.9,
    speaker_motion_type_score: 0.95,
    speaker_strength: 0.9,
    partner_dynamics_overall: 0.9,
    partner_dynamics_by_motion_type: 0.95,
    bp_position_history: 1.5,
    internal_speaking_role_history: 1.5,
    role_score: 1.1,
    motion_type_x_role_score: 1.05,
    repeat_partner_penalty: 0.8,
    room_balance_score: 1,
    chair_score: 0.95,
  },
  BALANCED: {
    speaker_total_score: 1,
    speaker_motion_type_score: 1,
    speaker_strength: 1,
    partner_dynamics_overall: 1,
    partner_dynamics_by_motion_type: 1,
    bp_position_history: 1,
    internal_speaking_role_history: 1,
    role_score: 1,
    motion_type_x_role_score: 1,
    repeat_partner_penalty: 1,
    room_balance_score: 1,
    chair_score: 1,
  },
  COMPETITIVE: {
    speaker_total_score: 1.2,
    speaker_motion_type_score: 1.2,
    speaker_strength: 1.15,
    partner_dynamics_overall: 1.15,
    partner_dynamics_by_motion_type: 1.1,
    bp_position_history: 0.8,
    internal_speaking_role_history: 0.8,
    role_score: 1.15,
    motion_type_x_role_score: 1.2,
    repeat_partner_penalty: 1,
    room_balance_score: 1.05,
    chair_score: 1.15,
  },
};

export function getObjectiveMultipliers(objective: PairingObjective): ObjectiveMetricMultipliers {
  return objectiveMultipliers[objective];
}

export function applyObjectiveMultiplier(weight: number, multiplier: number): number {
  return weight * multiplier;
}