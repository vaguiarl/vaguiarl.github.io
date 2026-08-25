/* tslint:disable */
/* eslint-disable */

export class MoralLife {
    free(): void;
    [Symbol.dispose](): void;
    activity_share(): number;
    acts(): Uint8Array;
    alive(): number;
    bad_reputation_share(): number;
    births(): number;
    capacity_share(): number;
    cells(): Uint8Array;
    conditional_share(): number;
    cooperation_rate(): number;
    cumulative_exploitations(): number;
    cumulative_false_sanctions(): number;
    cumulative_forgiveness(): number;
    cumulative_true_sanctions(): number;
    deaths(): number;
    ecology_events(): Uint8Array;
    edges(): Uint16Array;
    empty(): number;
    enforcer_share(): number;
    environment(): number;
    exploitation_ewma(): number;
    exploitation_rate(): number;
    exploiter_share(): number;
    false_sanctions(): number;
    first_exploitation_generation(): number;
    first_moral_response_generation(): number;
    first_recovery_generation(): number;
    first_sanction_generation(): number;
    forgiveness_events(): number;
    generation(): number;
    height(): number;
    institution_share(): number;
    introduce_exploiters(share: number): number;
    matches(): number;
    mean_q(): number;
    mean_reputation(): number;
    mean_welfare(): number;
    net_exploit_advantage(): number;
    constructor(width: number, height: number, seed: number);
    observation_accuracy(): number;
    observations(): number;
    open_hand_share(): number;
    peak_exploitation(): number;
    peak_generation(): number;
    refusal_rate(): number;
    reputations(): Int8Array;
    restart(seed: number): void;
    sanction_coverage(): number;
    seed(): number;
    set_environment(code: number): void;
    social_events(): Uint8Array;
    step_many(steps: number): void;
    true_sanctions(): number;
    width(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_morallife_free: (a: number, b: number) => void;
    readonly morallife_new: (a: number, b: number, c: number) => [number, number, number];
    readonly morallife_restart: (a: number, b: number) => [number, number];
    readonly morallife_step_many: (a: number, b: number) => void;
    readonly morallife_set_environment: (a: number, b: number) => void;
    readonly morallife_environment: (a: number) => number;
    readonly morallife_introduce_exploiters: (a: number, b: number) => number;
    readonly morallife_cells: (a: number) => [number, number];
    readonly morallife_reputations: (a: number) => [number, number];
    readonly morallife_acts: (a: number) => [number, number];
    readonly morallife_social_events: (a: number) => [number, number];
    readonly morallife_ecology_events: (a: number) => [number, number];
    readonly morallife_edges: (a: number) => [number, number];
    readonly morallife_width: (a: number) => number;
    readonly morallife_height: (a: number) => number;
    readonly morallife_seed: (a: number) => number;
    readonly morallife_generation: (a: number) => number;
    readonly morallife_alive: (a: number) => number;
    readonly morallife_empty: (a: number) => number;
    readonly morallife_open_hand_share: (a: number) => number;
    readonly morallife_exploiter_share: (a: number) => number;
    readonly morallife_conditional_share: (a: number) => number;
    readonly morallife_enforcer_share: (a: number) => number;
    readonly morallife_institution_share: (a: number) => number;
    readonly morallife_capacity_share: (a: number) => number;
    readonly morallife_bad_reputation_share: (a: number) => number;
    readonly morallife_mean_q: (a: number) => number;
    readonly morallife_mean_reputation: (a: number) => number;
    readonly morallife_cooperation_rate: (a: number) => number;
    readonly morallife_exploitation_rate: (a: number) => number;
    readonly morallife_exploitation_ewma: (a: number) => number;
    readonly morallife_refusal_rate: (a: number) => number;
    readonly morallife_sanction_coverage: (a: number) => number;
    readonly morallife_observation_accuracy: (a: number) => number;
    readonly morallife_observations: (a: number) => number;
    readonly morallife_mean_welfare: (a: number) => number;
    readonly morallife_net_exploit_advantage: (a: number) => number;
    readonly morallife_true_sanctions: (a: number) => number;
    readonly morallife_false_sanctions: (a: number) => number;
    readonly morallife_forgiveness_events: (a: number) => number;
    readonly morallife_matches: (a: number) => number;
    readonly morallife_births: (a: number) => number;
    readonly morallife_deaths: (a: number) => number;
    readonly morallife_activity_share: (a: number) => number;
    readonly morallife_peak_exploitation: (a: number) => number;
    readonly morallife_peak_generation: (a: number) => number;
    readonly morallife_first_exploitation_generation: (a: number) => number;
    readonly morallife_first_moral_response_generation: (a: number) => number;
    readonly morallife_first_sanction_generation: (a: number) => number;
    readonly morallife_first_recovery_generation: (a: number) => number;
    readonly morallife_cumulative_exploitations: (a: number) => number;
    readonly morallife_cumulative_true_sanctions: (a: number) => number;
    readonly morallife_cumulative_false_sanctions: (a: number) => number;
    readonly morallife_cumulative_forgiveness: (a: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
