# Conscious Life

A fast Rust laboratory that puts a minimal social layer inside Conway's Game of Life. The native simulation core remains dependency-free; the browser adapter uses `wasm-bindgen`. Version 0.1 contains only prey-like cells. Predators are reserved for a later extension.

The question is deliberately audacious: can cooperation select for a graded internal vocabulary that becomes harder for exploiters to imitate?

This is a model of a possible selection mechanism. It is **not** evidence that a simulated cell has phenomenal experience.

## The bridge from the paper

Each live cell has two heritable traits:

- an economic type, `theta`, which is either cooperator or defector;
- a consciousness type, `q` in `{0, 1, ..., q_max}`.

Its Moore neighborhood and selected partner form an environment. Together with its action, this produces a cognitive state `phi`. The response `R(phi)` and subjective label `s_q(phi)` share the same cognitive cause. The subjective label does not directly choose the action.

The subjective map follows the paper's gradation idea:

- `q = 0`: every cognitive state maps to the null experience; the cell is silent.
- `q = 1`: cooperation or exploitation can be felt as salient, but positive and negative cases are not yet separated.
- `q >= 2`: exploitative and cooperative encounters occupy distinct subjective states. The cell can report **evil** or **good**. Higher `q` divides those regions into more context-sensitive grades.

Each cell publishes one persona. At `q = 0`, cooperators and defectors share the same null persona. At `q >= 1`, cooperators publish a cooperative persona. A defector may imitate that persona, but the cost of imitation rises with the richness of its own `q`:

```text
C_mim(q) = kappa_0 + kappa * (q - 1)
```

Cells are randomly paired within the same `(q, persona)` market. A match is mutual: the two cells play each other once, and both receive the corresponding Prisoner's Dilemma payoff. Odd market remainders are pooled and randomly paired; if the total population is odd, the final remainder uses a random-population fallback. This prevents a rare new `q` mutant from receiving zero merely because its market initially has one member. The default payoffs are

```text
S = 0, P = 1, R = 3, T = 5
```

so `S <= P <= R <= T` and `T - P > R - S`. The latter is the paper's decreasing-differences condition. Let `pi_q` be the current cooperator share among cells with grade `q`, `delta_D = T - P`, and `p_IM(q) = C_mim(q) / delta_D`. A defector's equilibrium-inspired probability of publishing the cooperative persona is

```text
sigma_q = clamp(
  [pi_q / (1 - pi_q)] * [(1 - p_IM(q)) / p_IM(q)],
  0,
  1
)
```

This makes the public persona an equilibrium object rather than giving conscious cells access to anyone's hidden economic type.

Consciousness also carries a biological cost:

```text
C_bio(0) = 0
C_bio(q) = psi_0 + psi * (q - 1), q >= 1
```

The default costs are `kappa_0 = 1.45`, `kappa = 0.12`, `psi_0 = 0.10`, and `psi = 0.10`. In the paper's analytic equilibrium with the default payoffs, that benchmark has an interior optimum at `q = 6`. The finite Conway simulation is not forced to reproduce that value; whether it approaches it is an empirical output.

The spatial geometry remains exactly Conway B3/S23. Market matching is global within a generation, while death and reproduction remain local on the torus. Fitness never changes which locations live or die. It changes which of the three neighboring cells supplies the heritable traits of a birth. Birth parent probabilities are proportional to `exp(selection_strength * fitness)`.

## Important departures from Bidner and François

This is a spatial individual-based toy model, not a numerical solution of their continuum equilibrium:

1. The paper's continuum matching market is replaced by finite random pairs within each `(q, persona)` group.
2. The equilibrium mixing probability is recomputed from the realized `pi_q` each generation and sampled independently for each defector.
3. Conway birth and survival replace continuous-time replicator dynamics; only trait inheritance is fitness-weighted.
4. The Moore neighborhood supplies ecological context to `phi`, but not the market partner.
5. The words good and evil are operational labels. **Good** means paying the cooperative cost in an encounter. **Evil** means taking the gain created by a cooperator without paying that cost. Mutual defection is neutral, not automatically evil.

Those choices keep the first experiment small enough to understand and falsify.

## Run it

From this directory:

```bash
cargo run --release -- --steps 500 --summary-every 10 --voice-every 25
```

See the grid every 20 generations:

```bash
cargo run --release -- --width 60 --height 30 --steps 200 --render-every 20
```

Build the browser adapter used by the website:

```bash
wasm-pack build --target web --release --out-dir ../../src/wasm/conscious-life --out-name conscious_life
```

Write every generation for analysis:

```bash
cargo run --release -- --steps 2000 --csv conscious-life.csv
```

The simulation is deterministic for a fixed seed. Run `cargo run --release -- --help` for all parameters.

## Output

The summary labels every transition explicitly as `t -> t+1`. Population statistics are shown both before and after the Conway update; fitness, matching, and moral reports belong to the pre-update population. It tracks population size, cooperator share, mean and maximum `q`, mean fitness, cooperator-to-cooperator matching, births, deaths, moral reports, and the full post-update `q` distribution. CSV output records both population snapshots in separate columns.

The periodic voice first looks for a cell that can distinguish a good or evil encounter, then selects the richest and longest-lived such cell. If no valenced encounter exists, it falls back to the richest available voice. Examples are:

```text
q=0: "..."
q=1: "Something mattered, but I cannot yet separate good from evil."
q>=2, cooperation: "Good: I paid a cost that helped another."
q>=2, exploitation: "Evil: I took the gain from another's cooperation without paying its cost."
```

## First experiments

1. Compare the default decreasing-differences game with parameter sets close to equal differences using the four `--payoff-*` options.
2. Sweep mimicry slope and biological slope; look for an interior peak in evolved `q`.
3. Turn off `q` mutation and verify that consciousness cannot appear.
4. Turn off selection and verify that `q` follows drift rather than cooperative advantage.
5. In phase 2, add predators as a second species and keep prey-prey and predator-predator cooperation conceptually separate.
