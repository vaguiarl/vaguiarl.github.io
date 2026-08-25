# Moral Life

Moral Life is the second Conscious Life experiment: a fast Rust and WebAssembly society built to ask how rare exploitation can spread through a trusting population and why memory, reputation, sanction, and forgiveness may become adaptive responses.

The initial population contains standing variation in social policies, enforcement, and capacity. The model studies selection on that variation; it does not claim that either exploitation or morality appears from nothing.

The model makes three distinctions explicit:

- **Evil is an act:** one agent defects while its partner cooperates.
- **Moral capacity is a capability:** `q >= 2` lets an agent distinguish helping from exploitation, with accuracy increasing in `q`.
- **Morality is a response technology:** conditional cooperation, public reputation, enforcement, and forgiveness can change the future payoff to exploitation.

These are operational model variables. None is evidence of phenomenal consciousness or a probability that a simulated agent feels.

## Society

Each living site carries:

```text
Agent {
  policy: OpenHand | Exploiter | Conditional,
  enforcer: bool,
  q: 0..8,
  reputation: -4..4,
  age
}
```

Policy, enforcement, and `q` are inherited with mutation. Reputation is an acquired social record and resets to zero at birth.

Agents meet at most one partner per generation within toroidal radius two. An OpenHand agent helps. An Exploiter defects. A Conditional agent with `q >= 2` helps a partner with nonnegative reputation and refuses a partner with negative reputation; below `q = 2`, that conditional policy cannot be expressed and defaults to helping.

Accepted encounters use a Prisoner's Dilemma with

```text
S = 0, P = 1, R = 3, T = 5.
```

Refusal gives both agents an outside-option payoff of `0.60`. Mutual defection and refusal are neutral rather than Evil. Punishment is recorded separately and is never automatically classified as Good.

## Observation, reputation, and enforcement

In the public-reputation environment, a nearby third-party agent with `q >= 2` has an `0.85` opportunity to observe an encounter. Its classification accuracy is

```text
A(q) = min(0.99, 0.93 + 0.01 * (q - 2)).
```

A perceived helpful act adds one reputation point. A perceived exploitative act removes two, with all records clipped to `[-4, 4]`. Classification errors remain visible as errors; the model does not let an institution assume its own correctness.

A capable nearby enforcer may sanction a perceived exploiter. The target loses `3.20` fitness and the enforcer pays `0.25`. Correct and unjust sanctions are reported separately. Every negative record has a `0.04` chance per generation of moving one point toward zero. This is forgiveness: neither erasure nor permanent exclusion.

The cognitive cost is

```text
Cq(0) = 0
Cq(q) = 0.02 + 0.015 * (q - 1), q >= 1.
```

An active Conditional policy pays a further monitoring cost of `0.05`. Moral machinery can therefore spread when it prevents costly exploitation and erode again when its cost exceeds its benefit. Recovery is not scripted.

## Three counterfactual environments

The browser can change the informational environment without resetting the population:

1. **Anonymous:** no durable record, conditional refusal, or sanction.
2. **Direct record:** a scalar record produced by direct encounters travels with the recorded agent. Capable agents may refuse a bad record, but there is no third-party observation, public sorting, or sanction. This is a deliberately portable record, not pair-specific dyadic memory.
3. **Public reputation:** reputation travels, capable agents prefer better-reputed local partners, observers classify acts, and enforcers may sanction perceived exploitation.

The `Introduce 2% exploiters` control is an explicit, time-stamped intervention. All other policy, enforcement, and `q` changes arise through inheritance, selection, and mutation.

## Ecology and selection

The society occupies a `96 x 54` torus. Initial density is `0.72`. Every occupied site dies independently with probability `0.055`. An empty site with `n` living Moore neighbors receives a birth with probability

```text
1 - (1 - 0.035)^n.
```

The parent is selected from those neighbors with probability proportional to

```text
exp(0.85 * fitness).
```

The initial social composition is `84%` OpenHand, `4%` Exploiter, and `12%` Conditional; `8%` carry the enforcer trait. Before the enforcement floor is applied, the initial `q` draw is `69%` at zero, `6%` at one, and `25%` at two. Founding enforcers are then guaranteed the minimum capacity needed to act, so the realized `q >= 2` share is approximately `31%`. These are calibrated starting conditions, not empirical estimates.

Separate deterministic random streams drive initialization, matching, observation, ecology, and inheritance. A fixed seed reproduces the same world.

## Run and compare

Run the native three-environment comparison:

```bash
cargo run --release --example compare
```

Run the tests:

```bash
cargo test
cargo clippy --all-targets -- -D warnings
```

Build the browser package used by the website:

```bash
wasm-pack build --target web --release --out-dir ../../src/wasm/moral-life --out-name moral_life
```

The public installation is at [vaguiarl.github.io/moral-life](https://vaguiarl.github.io/moral-life/).

## What to watch

The dashboard separates realized acts from capabilities and active institutions. A refused exchange records refusal for both participants and does not count an unrealized offer as cooperation or exploitation. The dashboard reports cooperation, exploitation, refusal, `q >= 2`, Conditional and enforcer shares, bad reputation, observation accuracy, correct and unjust sanctions, forgiveness, welfare, and the realized fitness advantage of exploiters.

The essential counterfactual is not “did morality win?” It is whether changing the information and enforcement environment changes the sign of the exploit advantage—and whether the costly machinery survives after the immediate threat recedes.
