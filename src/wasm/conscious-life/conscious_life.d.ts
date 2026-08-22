/* tslint:disable */
/* eslint-disable */

export class ConsciousLife {
    free(): void;
    [Symbol.dispose](): void;
    activity_share(): number;
    alive(): number;
    captures(): number;
    cells(): Uint8Array;
    cooperator_share(): number;
    differentiated_share(): number;
    empty(): number;
    events(): Uint8Array;
    evil_reports(): number;
    first_evil_generation(): number;
    first_good_generation(): number;
    first_predator_evil_generation(): number;
    first_predator_good_generation(): number;
    first_prey_evil_generation(): number;
    first_prey_good_generation(): number;
    generation(): number;
    good_reports(): number;
    height(): number;
    inner_life_share(): number;
    max_q(): number;
    mean_q(): number;
    constructor(width: number, height: number, seed: number);
    predator_cooperator_share(): number;
    predator_deaths(): number;
    predator_evil_reports(): number;
    predator_good_reports(): number;
    predators(): number;
    prey(): number;
    prey_births(): number;
    prey_cooperator_share(): number;
    prey_evil_reports(): number;
    prey_good_reports(): number;
    restart(seed: number): void;
    seed(): number;
    step_many(steps: number): void;
    voice_code(): number;
    voice_is_cooperator(): boolean;
    voice_is_predator(): boolean;
    voice_q(): number;
    voice_text(): string;
    voice_x(): number;
    voice_y(): number;
    width(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_consciouslife_free: (a: number, b: number) => void;
    readonly consciouslife_new: (a: number, b: number, c: number) => [number, number, number];
    readonly consciouslife_restart: (a: number, b: number) => [number, number];
    readonly consciouslife_step_many: (a: number, b: number) => void;
    readonly consciouslife_cells: (a: number) => [number, number];
    readonly consciouslife_events: (a: number) => [number, number];
    readonly consciouslife_width: (a: number) => number;
    readonly consciouslife_height: (a: number) => number;
    readonly consciouslife_seed: (a: number) => number;
    readonly consciouslife_generation: (a: number) => number;
    readonly consciouslife_alive: (a: number) => number;
    readonly consciouslife_prey: (a: number) => number;
    readonly consciouslife_predators: (a: number) => number;
    readonly consciouslife_empty: (a: number) => number;
    readonly consciouslife_cooperator_share: (a: number) => number;
    readonly consciouslife_prey_cooperator_share: (a: number) => number;
    readonly consciouslife_predator_cooperator_share: (a: number) => number;
    readonly consciouslife_mean_q: (a: number) => number;
    readonly consciouslife_max_q: (a: number) => number;
    readonly consciouslife_inner_life_share: (a: number) => number;
    readonly consciouslife_differentiated_share: (a: number) => number;
    readonly consciouslife_activity_share: (a: number) => number;
    readonly consciouslife_prey_births: (a: number) => number;
    readonly consciouslife_captures: (a: number) => number;
    readonly consciouslife_predator_deaths: (a: number) => number;
    readonly consciouslife_good_reports: (a: number) => number;
    readonly consciouslife_evil_reports: (a: number) => number;
    readonly consciouslife_prey_good_reports: (a: number) => number;
    readonly consciouslife_prey_evil_reports: (a: number) => number;
    readonly consciouslife_predator_good_reports: (a: number) => number;
    readonly consciouslife_predator_evil_reports: (a: number) => number;
    readonly consciouslife_first_good_generation: (a: number) => number;
    readonly consciouslife_first_evil_generation: (a: number) => number;
    readonly consciouslife_first_prey_good_generation: (a: number) => number;
    readonly consciouslife_first_prey_evil_generation: (a: number) => number;
    readonly consciouslife_first_predator_good_generation: (a: number) => number;
    readonly consciouslife_first_predator_evil_generation: (a: number) => number;
    readonly consciouslife_voice_code: (a: number) => number;
    readonly consciouslife_voice_text: (a: number) => [number, number];
    readonly consciouslife_voice_x: (a: number) => number;
    readonly consciouslife_voice_y: (a: number) => number;
    readonly consciouslife_voice_q: (a: number) => number;
    readonly consciouslife_voice_is_cooperator: (a: number) => number;
    readonly consciouslife_voice_is_predator: (a: number) => number;
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
