/* @ts-self-types="./moral_life.d.ts" */

export class MoralLife {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MoralLifeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_morallife_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    activity_share() {
        const ret = wasm.morallife_activity_share(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Uint8Array}
     */
    acts() {
        const ret = wasm.morallife_acts(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {number}
     */
    alive() {
        const ret = wasm.morallife_alive(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    bad_reputation_share() {
        const ret = wasm.morallife_bad_reputation_share(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    births() {
        const ret = wasm.morallife_births(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    capacity_share() {
        const ret = wasm.morallife_capacity_share(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Uint8Array}
     */
    cells() {
        const ret = wasm.morallife_cells(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {number}
     */
    conditional_share() {
        const ret = wasm.morallife_conditional_share(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    cooperation_rate() {
        const ret = wasm.morallife_cooperation_rate(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    cumulative_exploitations() {
        const ret = wasm.morallife_cumulative_exploitations(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    cumulative_false_sanctions() {
        const ret = wasm.morallife_cumulative_false_sanctions(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    cumulative_forgiveness() {
        const ret = wasm.morallife_cumulative_forgiveness(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    cumulative_true_sanctions() {
        const ret = wasm.morallife_cumulative_true_sanctions(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    deaths() {
        const ret = wasm.morallife_deaths(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {Uint8Array}
     */
    ecology_events() {
        const ret = wasm.morallife_ecology_events(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint16Array}
     */
    edges() {
        const ret = wasm.morallife_edges(this.__wbg_ptr);
        var v1 = getArrayU16FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 2, 2);
        return v1;
    }
    /**
     * @returns {number}
     */
    empty() {
        const ret = wasm.morallife_empty(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    enforcer_share() {
        const ret = wasm.morallife_enforcer_share(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    environment() {
        const ret = wasm.morallife_environment(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    exploitation_ewma() {
        const ret = wasm.morallife_exploitation_ewma(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    exploitation_rate() {
        const ret = wasm.morallife_exploitation_rate(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    exploiter_share() {
        const ret = wasm.morallife_exploiter_share(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    false_sanctions() {
        const ret = wasm.morallife_false_sanctions(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    first_exploitation_generation() {
        const ret = wasm.morallife_first_exploitation_generation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    first_moral_response_generation() {
        const ret = wasm.morallife_first_moral_response_generation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    first_recovery_generation() {
        const ret = wasm.morallife_first_recovery_generation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    first_sanction_generation() {
        const ret = wasm.morallife_first_sanction_generation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    forgiveness_events() {
        const ret = wasm.morallife_forgiveness_events(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    generation() {
        const ret = wasm.morallife_generation(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    height() {
        const ret = wasm.morallife_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    institution_share() {
        const ret = wasm.morallife_institution_share(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} share
     * @returns {number}
     */
    introduce_exploiters(share) {
        const ret = wasm.morallife_introduce_exploiters(this.__wbg_ptr, share);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    matches() {
        const ret = wasm.morallife_matches(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    mean_q() {
        const ret = wasm.morallife_mean_q(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    mean_reputation() {
        const ret = wasm.morallife_mean_reputation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    mean_welfare() {
        const ret = wasm.morallife_mean_welfare(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    net_exploit_advantage() {
        const ret = wasm.morallife_net_exploit_advantage(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} width
     * @param {number} height
     * @param {number} seed
     */
    constructor(width, height, seed) {
        const ret = wasm.morallife_new(width, height, seed);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        MoralLifeFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    observation_accuracy() {
        const ret = wasm.morallife_observation_accuracy(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    observations() {
        const ret = wasm.morallife_observations(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    open_hand_share() {
        const ret = wasm.morallife_open_hand_share(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    peak_exploitation() {
        const ret = wasm.morallife_peak_exploitation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    peak_generation() {
        const ret = wasm.morallife_peak_generation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    refusal_rate() {
        const ret = wasm.morallife_refusal_rate(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Int8Array}
     */
    reputations() {
        const ret = wasm.morallife_reputations(this.__wbg_ptr);
        var v1 = getArrayI8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {number} seed
     */
    restart(seed) {
        const ret = wasm.morallife_restart(this.__wbg_ptr, seed);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {number}
     */
    sanction_coverage() {
        const ret = wasm.morallife_sanction_coverage(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    seed() {
        const ret = wasm.morallife_seed(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} code
     */
    set_environment(code) {
        wasm.morallife_set_environment(this.__wbg_ptr, code);
    }
    /**
     * @returns {Uint8Array}
     */
    social_events() {
        const ret = wasm.morallife_social_events(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {number} steps
     */
    step_many(steps) {
        wasm.morallife_step_many(this.__wbg_ptr, steps);
    }
    /**
     * @returns {number}
     */
    true_sanctions() {
        const ret = wasm.morallife_true_sanctions(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    width() {
        const ret = wasm.morallife_width(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) MoralLife.prototype[Symbol.dispose] = MoralLife.prototype.free;
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_bb96b2010945f0bc: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./moral_life_bg.js": import0,
    };
}

const MoralLifeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_morallife_free(ptr, 1));

function getArrayI8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getArrayU16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedInt8ArrayMemory0 = null;
function getInt8ArrayMemory0() {
    if (cachedInt8ArrayMemory0 === null || cachedInt8ArrayMemory0.byteLength === 0) {
        cachedInt8ArrayMemory0 = new Int8Array(wasm.memory.buffer);
    }
    return cachedInt8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint16ArrayMemory0 = null;
function getUint16ArrayMemory0() {
    if (cachedUint16ArrayMemory0 === null || cachedUint16ArrayMemory0.byteLength === 0) {
        cachedUint16ArrayMemory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedInt8ArrayMemory0 = null;
    cachedUint16ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('moral_life_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
