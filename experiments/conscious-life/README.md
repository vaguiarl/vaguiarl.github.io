# Conscious Life

Version 0.2 is a fast Rust laboratory for a deliberately small question: can social cooperation select for a graded internal vocabulary inside a changing ecology?

The default world is a synchronous predator-prey contact process on a toroidal grid. Prey and predators are ecological species. Each species separately contains cooperators and defectors, and each cell carries a heritable consciousness grade `q`. The native simulation core has no external dependencies; the browser adapter uses `wasm-bindgen`.

This is a model of a possible selection mechanism. It is **not** evidence that a simulated cell has phenomenal experience, and its operational moral vocabulary should not be mistaken for a claim about sentience.

## Default ecology

Every generation reads one shared snapshot of the eight-cell Moore neighborhood and writes the next snapshot simultaneously. If an empty site has `n` neighboring prey, it becomes prey with probability

```text
P(empty -> prey | n) = 1 - (1 - beta)^n,   beta = 0.12
```

If a prey site has `m` neighboring predators, it is captured and replaced by predator offspring with probability

```text
P(prey -> predator | m) = 1 - (1 - alpha)^m,   alpha = 0.06
```

Every predator independently dies with probability

```text
P(predator -> empty) = delta,   delta = 0.16
```

The default initial live density is `0.48`. Of those living cells, `1/6` are predators, giving expected whole-grid shares of approximately `0.40` prey, `0.08` predators, and `0.52` empty sites. The grid wraps at every edge.

Ecological hazards do not depend on social fitness. When a birth or capture occurs, a neighboring parent of the appropriate species is selected with probability proportional to

```text
exp(selection_strength * fitness)
```

The child inherits that parent's cooperation type and `q`, subject to mutation. Separate random streams drive ecological events and social selection, so changing social parameters does not silently change the species-and-occupancy path for a fixed seed.

For an exact, prey-only Conway baseline, pass `--classic-conway`. This switches the ecology to B3/S23: a live cell survives with two or three live neighbors, and an empty site is born with exactly three. Social fitness still selects which local parent supplies a newborn's traits; it does not alter the B3/S23 occupancy rule.

## The social layer

Every live cell has two heritable social traits:

- an economic type, `theta`, which is either cooperator or defector;
- a consciousness grade, `q` in `{0, 1, ..., q_max}`.

Prey interact socially only with prey; predators interact socially only with predators. Thus the model contains four visible social-ecological types: cooperating prey, defecting prey, cooperating predators, and defecting predators. Predation is not a Prisoner's Dilemma action.

Within each species, cells publish a persona and are randomly paired in the same `(species, q, persona)` market. A match is mutual: both cells play each other once and receive the corresponding Prisoner's Dilemma payoff. Odd market remainders are pooled only within the same species before the random fallback. The default payoffs are

```text
S = 0, P = 1, R = 3, T = 5
```

so `S <= P <= R <= T` and `T - P > R - S`. Let `pi_q` be the cooperator share at grade `q` within the focal species, `delta_D = T - P`, and `p_IM(q) = C_mim(q) / delta_D`. A defector's equilibrium-inspired probability of publishing the cooperative persona is

```text
sigma_q = clamp(
  [pi_q / (1 - pi_q)] * [(1 - p_IM(q)) / p_IM(q)],
  0,
  1
)
```

The cost of imitation is

```text
C_mim(q) = kappa_0 + kappa * (q - 1),   q >= 1
```

and the biological cost of a non-null subjective map is

```text
C_bio(0) = 0
C_bio(q) = psi_0 + psi * (q - 1),       q >= 1
```

The defaults are `kappa_0 = 1.45`, `kappa = 0.12`, `psi_0 = 0.10`, and `psi = 0.10`. In the paper's analytic equilibrium with the default payoffs, that benchmark has an interior optimum at `q = 6`. This finite spatial simulation is not forced to reproduce that value; its evolved distribution of `q` is an output.

## Gradation and operational morality

The cell's local neighborhood, partner, and action form a cognitive state `phi`. A response `R(phi)` and subjective label `s_q(phi)` share that cognitive cause; the label does not directly choose the action.

- `q = 0`: all cognitive states map to the null experience, so the cell is silent.
- `q = 1`: a cooperative or exploitative encounter can matter, but positive and negative cases are not separated.
- `q >= 2`: cooperative and exploitative encounters occupy distinct subjective states. Higher `q` divides them into more context-sensitive grades.

**Good** and **Evil** are role-relative, within-species reports. For prey, Good means contributing a warning and Evil means using another prey's warning without contributing. For predators, Good means contributing to the pack and Evil means taking the pack's gain without contributing. Mutual defection is neutral. A predator capturing prey is an ecological transition, **not** an Evil report.

These labels operationalize behavior inside the model; they do not establish an inner life.

## Relationship to Bidner and François

This is a spatial individual-based experiment, not a numerical solution of their continuum equilibrium:

1. Finite random pairs within `(species, q, persona)` groups replace a continuum matching market.
2. The equilibrium mixing probability is recomputed from each species' realized `pi_q` every generation and sampled independently for each defector.
3. A synchronous local contact process replaces continuous-time replicator dynamics in the default ecology.
4. The Moore neighborhood supplies ecological and cognitive context, while social matching is global within a species.
5. Ecological hazards and social selection are separately identifiable by construction.

These choices keep the experiment small enough to inspect, test, and falsify.

## Run it

From this directory, run 500 generations:

```bash
cargo run --release -- --steps 500 --summary-every 10 --voice-every 25
```

Run continuously until the process is stopped:

```bash
cargo run --release -- --steps 0 --summary-every 100
```

Render a smaller ASCII world every 20 generations:

```bash
cargo run --release -- --width 60 --height 30 --steps 200 --render-every 20
```

Compare with the classic Conway baseline:

```bash
cargo run --release -- --classic-conway --steps 500
```

Write every generation for analysis:

```bash
cargo run --release -- --steps 2000 --csv conscious-life.csv
```

Build the browser adapter used by the website:

```bash
wasm-pack build --target web --release --out-dir ../../src/wasm/conscious-life --out-name conscious_life
```

The simulation is deterministic for a fixed seed. Run `cargo run --release -- --help` for every parameter.

## Output

Every summary labels the transition as `t -> t+1`. Population state is reported before and after the synchronous ecological update; fitness, social matches, and moral reports belong to the pre-update population. The output tracks prey and predator populations, changed sites, aggregate cooperation, mean and maximum `q`, mean fitness, births, captures, deaths, species-specific moral reports, and the post-update `q` distribution. CSV output preserves the before-and-after populations in separate columns.

The periodic voice first looks for a cell able to distinguish a Good or Evil encounter, then selects the richest and longest-lived such cell. If no valenced encounter exists, it falls back to the richest available voice. Examples include:

```text
q=0: "..."
q=1: "Something mattered, but I cannot yet separate good from evil."
prey, q>=2, cooperation: "Good: I shared a warning another prey could use."
prey, q>=2, exploitation: "Evil: I used another prey's warning without contributing."
predator, q>=2, cooperation: "Good: I contributed to the pack."
predator, q>=2, exploitation: "Evil: I took the pack's gain without contributing."
```

## What “continuous” means

The native command with `--steps 0` keeps evolving for as long as that local process and its machine remain running. If the population dies, or either species disappears in the default ecology, it begins a new deterministic epoch instead of stopping.

The GitHub Pages version is a static WebAssembly application. It evolves autonomously in each visitor's browser while the page is open and the browser is allowed to run it, but GitHub Pages does not execute a shared simulation after all browsers close. Background-tab throttling, sleep, or a powered-off device can pause that local instance. A single persistent world shared across visitors would require a continuously running local daemon or hosted backend plus state storage; it cannot be provided by GitHub Pages alone.

## Suggested experiments

1. Sweep `--prey-birth`, `--predation`, and `--predator-death` to map coexistence, extinction, and wave regimes.
2. Compare cooperation and evolved `q` between prey and predator societies without treating predation as a moral act.
3. Compare the default decreasing-differences game with nearby payoff structures using the four `--payoff-*` options.
4. Sweep mimicry and biological-cost slopes and look for an interior peak in evolved `q`.
5. Disable `q` mutation and verify that a non-null subjective mapping cannot appear from an all-zero initial condition.
6. Compare the contact-process ecology with `--classic-conway` to separate ecological turnover from social selection.
