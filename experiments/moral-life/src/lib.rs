#[cfg(target_arch = "wasm32")]
mod wasm;

pub const ACT_HELP: u8 = 1;
pub const ACT_EXPLOIT: u8 = 2;
pub const ACT_REFUSE: u8 = 3;
pub const ACT_MUTUAL_EXPLOIT: u8 = 4;

pub const SOCIAL_OBSERVED: u8 = 1 << 0;
pub const SOCIAL_REPUTATION_UP: u8 = 1 << 1;
pub const SOCIAL_REPUTATION_DOWN: u8 = 1 << 2;
pub const SOCIAL_SANCTIONED: u8 = 1 << 3;
pub const SOCIAL_FALSE_SANCTION: u8 = 1 << 4;
pub const SOCIAL_FORGIVEN: u8 = 1 << 5;
pub const SOCIAL_ENFORCED: u8 = 1 << 6;

pub const ECOLOGY_BIRTH: u8 = 1;
pub const ECOLOGY_DEATH: u8 = 2;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum Policy {
    OpenHand = 0,
    Exploiter = 1,
    Conditional = 2,
}

impl Policy {
    fn mutated(self, draw: usize) -> Self {
        match (self, draw % 2) {
            (Self::OpenHand, 0) => Self::Exploiter,
            (Self::OpenHand, _) => Self::Conditional,
            (Self::Exploiter, 0) => Self::OpenHand,
            (Self::Exploiter, _) => Self::Conditional,
            (Self::Conditional, 0) => Self::OpenHand,
            (Self::Conditional, _) => Self::Exploiter,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum Environment {
    Anonymous = 0,
    DirectRecord = 1,
    Public = 2,
}

impl Environment {
    pub fn from_code(code: u8) -> Self {
        match code {
            0 => Self::Anonymous,
            1 => Self::DirectRecord,
            _ => Self::Public,
        }
    }

    fn has_memory(self) -> bool {
        !matches!(self, Self::Anonymous)
    }

    fn is_public(self) -> bool {
        matches!(self, Self::Public)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Agent {
    pub policy: Policy,
    pub enforcer: bool,
    pub q: u8,
    pub reputation: i8,
    pub age: u32,
}

impl Agent {
    pub fn new(policy: Policy, enforcer: bool, q: u8) -> Self {
        Self {
            policy,
            enforcer,
            q,
            reputation: 0,
            age: 0,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Action {
    Help,
    Exploit,
    Refuse,
}

#[derive(Clone, Copy, Debug)]
pub struct Dilemma {
    pub sucker: f64,
    pub punishment: f64,
    pub reward: f64,
    pub temptation: f64,
}

impl Default for Dilemma {
    fn default() -> Self {
        Self {
            sucker: 0.0,
            punishment: 1.0,
            reward: 3.0,
            temptation: 5.0,
        }
    }
}

impl Dilemma {
    fn validate(self) -> Result<(), String> {
        if self.sucker <= self.punishment
            && self.punishment <= self.reward
            && self.reward <= self.temptation
        {
            Ok(())
        } else {
            Err("payoffs must satisfy S <= P <= R <= T".into())
        }
    }
}

#[derive(Clone, Debug)]
pub struct Config {
    pub width: usize,
    pub height: usize,
    pub seed: u64,
    pub environment: Environment,
    pub initial_density: f64,
    pub initial_exploiter_share: f64,
    pub initial_conditional_share: f64,
    pub initial_enforcer_share: f64,
    pub initial_q_one_share: f64,
    pub initial_q_two_share: f64,
    pub max_q: u8,
    pub birth_rate: f64,
    pub death_rate: f64,
    pub selection_strength: f64,
    pub policy_mutation_rate: f64,
    pub enforcer_mutation_rate: f64,
    pub q_mutation_rate: f64,
    pub refusal_payoff: f64,
    pub active_conditional_cost: f64,
    pub observation_opportunity: f64,
    pub forgiveness_rate: f64,
    pub positive_memory_decay_rate: f64,
    pub sanction_fine: f64,
    pub enforcement_cost: f64,
    pub dilemma: Dilemma,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            width: 96,
            height: 54,
            seed: 19,
            environment: Environment::Public,
            initial_density: 0.72,
            initial_exploiter_share: 0.04,
            initial_conditional_share: 0.12,
            initial_enforcer_share: 0.08,
            initial_q_one_share: 0.06,
            initial_q_two_share: 0.25,
            max_q: 8,
            birth_rate: 0.035,
            death_rate: 0.055,
            selection_strength: 0.85,
            policy_mutation_rate: 0.003,
            enforcer_mutation_rate: 0.002,
            q_mutation_rate: 0.006,
            refusal_payoff: 0.60,
            active_conditional_cost: 0.05,
            observation_opportunity: 0.85,
            forgiveness_rate: 0.04,
            positive_memory_decay_rate: 0.025,
            sanction_fine: 3.20,
            enforcement_cost: 0.25,
            dilemma: Dilemma::default(),
        }
    }
}

impl Config {
    pub fn validate(&self) -> Result<(), String> {
        if self.width < 5 || self.height < 5 {
            return Err("width and height must both be at least 5".into());
        }
        self.width
            .checked_mul(self.height)
            .ok_or_else(|| "grid dimensions are too large".to_string())?;
        for (name, value) in [
            ("initial density", self.initial_density),
            ("initial exploiter share", self.initial_exploiter_share),
            ("initial conditional share", self.initial_conditional_share),
            ("initial enforcer share", self.initial_enforcer_share),
            ("initial q=1 share", self.initial_q_one_share),
            ("initial q=2 share", self.initial_q_two_share),
            ("birth rate", self.birth_rate),
            ("death rate", self.death_rate),
            ("policy mutation rate", self.policy_mutation_rate),
            ("enforcer mutation rate", self.enforcer_mutation_rate),
            ("q mutation rate", self.q_mutation_rate),
            ("observation opportunity", self.observation_opportunity),
            ("forgiveness rate", self.forgiveness_rate),
            (
                "positive memory decay rate",
                self.positive_memory_decay_rate,
            ),
        ] {
            if !(0.0..=1.0).contains(&value) {
                return Err(format!("{name} must be between 0 and 1"));
            }
        }
        if self.initial_exploiter_share + self.initial_conditional_share > 1.0 {
            return Err("initial policy shares cannot exceed one".into());
        }
        if self.initial_q_one_share + self.initial_q_two_share > 1.0 {
            return Err("initial q shares cannot exceed one".into());
        }
        if self.max_q < 2 || self.max_q > 15 {
            return Err("max q must be between 2 and 15".into());
        }
        for (name, value) in [
            ("selection strength", self.selection_strength),
            ("refusal payoff", self.refusal_payoff),
            ("active conditional cost", self.active_conditional_cost),
            ("sanction fine", self.sanction_fine),
            ("enforcement cost", self.enforcement_cost),
        ] {
            if !value.is_finite() || value < 0.0 {
                return Err(format!("{name} must be finite and non-negative"));
            }
        }
        self.dilemma.validate()
    }

    pub fn cognitive_cost(&self, q: u8) -> f64 {
        if q == 0 {
            0.0
        } else {
            0.02 + 0.015 * f64::from(q - 1)
        }
    }

    pub fn classification_accuracy(&self, q: u8) -> f64 {
        if q < 2 {
            0.5
        } else {
            (0.93 + 0.01 * f64::from(q - 2)).min(0.99)
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct PopulationStats {
    pub alive: usize,
    pub open_hands: usize,
    pub exploiters: usize,
    pub conditionals: usize,
    pub enforcers: usize,
    pub active_institutions: usize,
    pub moral_capacity: usize,
    pub bad_reputations: usize,
    pub mean_q: f64,
    pub mean_reputation: f64,
}

impl PopulationStats {
    pub fn share(&self, count: usize) -> f64 {
        if self.alive == 0 {
            0.0
        } else {
            count as f64 / self.alive as f64
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct SocialEdge {
    pub left: usize,
    pub right: usize,
    pub kind: u8,
}

#[derive(Clone, Debug)]
pub struct StepReport {
    pub from_tick: u64,
    pub tick: u64,
    pub before: PopulationStats,
    pub after: PopulationStats,
    pub matches: usize,
    pub help_actions: usize,
    pub exploitations: usize,
    pub refusals: usize,
    pub mutual_exploitations: usize,
    pub observations: usize,
    pub correct_observations: usize,
    pub true_sanctions: usize,
    pub false_sanctions: usize,
    pub forgiveness_events: usize,
    pub mean_welfare: f64,
    pub exploiter_fitness: f64,
    pub prosocial_fitness: f64,
    pub net_exploit_advantage: f64,
    pub births: usize,
    pub deaths: usize,
    pub changed_sites: usize,
}

impl StepReport {
    pub fn cooperation_rate(&self) -> f64 {
        let actions = self.matches.saturating_mul(2);
        if actions == 0 {
            0.0
        } else {
            self.help_actions as f64 / actions as f64
        }
    }

    pub fn exploitation_rate(&self) -> f64 {
        if self.matches == 0 {
            0.0
        } else {
            self.exploitations as f64 / self.matches as f64
        }
    }

    pub fn refusal_rate(&self) -> f64 {
        let actions = self.matches.saturating_mul(2);
        if actions == 0 {
            0.0
        } else {
            self.refusals as f64 / actions as f64
        }
    }

    pub fn sanction_coverage(&self) -> f64 {
        if self.exploitations == 0 {
            0.0
        } else {
            self.true_sanctions as f64 / self.exploitations as f64
        }
    }

    pub fn observation_accuracy(&self) -> f64 {
        if self.observations == 0 {
            0.0
        } else {
            self.correct_observations as f64 / self.observations as f64
        }
    }
}

#[derive(Clone, Copy, Debug, Default)]
struct Assessment {
    fitness: f64,
}

#[derive(Clone, Debug)]
struct Rng64 {
    state: u64,
}

impl Rng64 {
    fn new(seed: u64) -> Self {
        Self {
            state: if seed == 0 {
                0x9e37_79b9_7f4a_7c15
            } else {
                seed
            },
        }
    }

    fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.state = x;
        x.wrapping_mul(0x2545_f491_4f6c_dd1d)
    }

    fn unit(&mut self) -> f64 {
        ((self.next_u64() >> 11) as f64) * (1.0 / ((1_u64 << 53) as f64))
    }

    fn index(&mut self, upper: usize) -> usize {
        debug_assert!(upper > 0);
        (self.next_u64() as usize) % upper
    }
}

fn stream_seed(seed: u64, stream: u64) -> u64 {
    let mut value = seed.wrapping_add(0x9e37_79b9_7f4a_7c15_u64.wrapping_mul(stream + 1));
    value = (value ^ (value >> 30)).wrapping_mul(0xbf58_476d_1ce4_e5b9);
    value = (value ^ (value >> 27)).wrapping_mul(0x94d0_49bb_1331_11eb);
    value ^ (value >> 31)
}

pub struct Simulation {
    config: Config,
    grid: Vec<Option<Agent>>,
    acts: Vec<u8>,
    social_events: Vec<u8>,
    ecology_events: Vec<u8>,
    edges: Vec<SocialEdge>,
    matching_rng: Rng64,
    observation_rng: Rng64,
    ecology_rng: Rng64,
    inheritance_rng: Rng64,
    tick: u64,
}

impl Simulation {
    pub fn random(config: Config) -> Result<Self, String> {
        config.validate()?;
        let seed = config.seed;
        let size = config.width * config.height;
        let mut initial_rng = Rng64::new(stream_seed(seed, 0));
        let mut grid = Vec::with_capacity(size);
        for _ in 0..size {
            if initial_rng.unit() >= config.initial_density {
                grid.push(None);
                continue;
            }
            let policy_draw = initial_rng.unit();
            let policy = if policy_draw < config.initial_exploiter_share {
                Policy::Exploiter
            } else if policy_draw
                < config.initial_exploiter_share + config.initial_conditional_share
            {
                Policy::Conditional
            } else {
                Policy::OpenHand
            };
            let enforcer = initial_rng.unit() < config.initial_enforcer_share;
            let q_draw = initial_rng.unit();
            let mut q = if q_draw < config.initial_q_two_share {
                2
            } else if q_draw < config.initial_q_two_share + config.initial_q_one_share {
                1
            } else {
                0
            };
            // A tiny founding cadre can enforce from the beginning; the trait and
            // the broader capacity distribution still evolve independently.
            if enforcer {
                q = q.max(2);
            }
            grid.push(Some(Agent::new(policy, enforcer, q)));
        }
        Ok(Self {
            grid,
            acts: vec![0; size],
            social_events: vec![0; size],
            ecology_events: vec![0; size],
            edges: Vec::new(),
            matching_rng: Rng64::new(stream_seed(seed, 1)),
            observation_rng: Rng64::new(stream_seed(seed, 2)),
            ecology_rng: Rng64::new(stream_seed(seed, 3)),
            inheritance_rng: Rng64::new(stream_seed(seed, 4)),
            config,
            tick: 0,
        })
    }

    pub fn empty(config: Config) -> Result<Self, String> {
        let mut simulation = Self::random(Config {
            initial_density: 0.0,
            ..config
        })?;
        simulation.grid.fill(None);
        Ok(simulation)
    }

    pub fn config(&self) -> &Config {
        &self.config
    }

    pub fn set_environment(&mut self, environment: Environment) {
        self.config.environment = environment;
        self.acts.fill(0);
        self.social_events.fill(0);
        self.ecology_events.fill(0);
        self.edges.clear();
        if !environment.has_memory() {
            for agent in self.grid.iter_mut().flatten() {
                agent.reputation = 0;
            }
        }
    }

    pub fn tick(&self) -> u64 {
        self.tick
    }

    pub fn cell(&self, x: usize, y: usize) -> Option<Agent> {
        self.grid[self.offset(x % self.config.width, y % self.config.height)]
    }

    pub fn set_cell(&mut self, x: usize, y: usize, agent: Option<Agent>) {
        let index = self.offset(x % self.config.width, y % self.config.height);
        self.grid[index] = agent.map(|mut value| {
            value.q = value.q.min(self.config.max_q);
            value.reputation = value.reputation.clamp(-4, 4);
            value
        });
    }

    pub fn population(&self) -> PopulationStats {
        self.population_summary()
    }

    pub fn packed_cells(&self) -> Vec<u8> {
        self.grid
            .iter()
            .map(|agent| match agent {
                None => 0,
                Some(agent) => {
                    0b1000_0000
                        | ((agent.policy as u8) << 5)
                        | (u8::from(agent.enforcer) << 4)
                        | agent.q.min(0b0000_1111)
                }
            })
            .collect()
    }

    pub fn reputations(&self) -> Vec<i8> {
        self.grid
            .iter()
            .map(|agent| agent.map_or(0, |value| value.reputation))
            .collect()
    }

    pub fn acts(&self) -> &[u8] {
        &self.acts
    }

    pub fn social_events(&self) -> &[u8] {
        &self.social_events
    }

    pub fn ecology_events(&self) -> &[u8] {
        &self.ecology_events
    }

    pub fn edges(&self) -> &[SocialEdge] {
        &self.edges
    }

    pub fn introduce_exploiters(&mut self, share: f64) -> usize {
        let mut candidates = self
            .grid
            .iter()
            .enumerate()
            .filter_map(|(index, agent)| {
                agent
                    .as_ref()
                    .filter(|value| value.policy != Policy::Exploiter)
                    .map(|_| index)
            })
            .collect::<Vec<_>>();
        self.shuffle_matching(&mut candidates);
        let target = ((self.population_summary().alive as f64 * share.clamp(0.0, 1.0)).ceil()
            as usize)
            .min(candidates.len());
        for index in candidates.into_iter().take(target) {
            if let Some(agent) = self.grid[index].as_mut() {
                agent.policy = Policy::Exploiter;
                agent.reputation = 0;
            }
        }
        target
    }

    pub fn step(&mut self) -> StepReport {
        let current = self.grid.clone();
        let before = self.population_summary();
        let size = current.len();
        let mut payoffs = vec![0.0_f64; size];
        let mut matched = vec![false; size];
        let mut rep_delta = vec![0_i8; size];
        let mut acts = vec![0_u8; size];
        let mut social_events = vec![0_u8; size];
        let mut edges = Vec::new();

        let mut order = current
            .iter()
            .enumerate()
            .filter_map(|(index, agent)| agent.map(|_| index))
            .collect::<Vec<_>>();
        self.shuffle_matching(&mut order);

        let mut pairs = Vec::new();
        for left in order {
            if matched[left] {
                continue;
            }
            let mut candidates = self
                .neighbors_within_two(left)
                .into_iter()
                .filter(|candidate| !matched[*candidate] && current[*candidate].is_some())
                .collect::<Vec<_>>();
            if candidates.is_empty() {
                continue;
            }
            self.shuffle_matching(&mut candidates);
            let left_agent = current[left].expect("living focal");
            let right = if self.config.environment.is_public() && left_agent.q >= 2 {
                candidates
                    .into_iter()
                    .max_by_key(|candidate| {
                        current[*candidate].expect("living candidate").reputation
                    })
                    .expect("non-empty candidate set")
            } else {
                candidates[0]
            };
            matched[left] = true;
            matched[right] = true;
            pairs.push((left, right));
        }

        let mut help_actions = 0;
        let mut exploitations = 0;
        let mut refusals = 0;
        let mut mutual_exploitations = 0;
        let mut observed_cases = Vec::<PerceivedCase>::new();

        for (left, right) in pairs.iter().copied() {
            let left_agent = current[left].expect("matched left");
            let right_agent = current[right].expect("matched right");
            let left_action = choose_action(left_agent, right_agent, self.config.environment);
            let right_action = choose_action(right_agent, left_agent, self.config.environment);

            let mut actual_evil = None;
            let edge_kind;
            match (left_action, right_action) {
                (Action::Refuse, _) | (_, Action::Refuse) => {
                    payoffs[left] += self.config.refusal_payoff;
                    payoffs[right] += self.config.refusal_payoff;
                    // Refusal cancels the exchange. Record the realized outcome
                    // for both participants rather than counting an unrealized
                    // offer to help or exploit.
                    refusals += 2;
                    acts[left] = ACT_REFUSE;
                    acts[right] = ACT_REFUSE;
                    edge_kind = 4;
                }
                (Action::Help, Action::Help) => {
                    payoffs[left] += self.config.dilemma.reward;
                    payoffs[right] += self.config.dilemma.reward;
                    help_actions += 2;
                    acts[left] = ACT_HELP;
                    acts[right] = ACT_HELP;
                    edge_kind = 1;
                }
                (Action::Exploit, Action::Help) => {
                    payoffs[left] += self.config.dilemma.temptation;
                    payoffs[right] += self.config.dilemma.sucker;
                    help_actions += 1;
                    acts[left] = ACT_EXPLOIT;
                    acts[right] = ACT_HELP;
                    exploitations += 1;
                    actual_evil = Some(left);
                    edge_kind = 2;
                }
                (Action::Help, Action::Exploit) => {
                    payoffs[left] += self.config.dilemma.sucker;
                    payoffs[right] += self.config.dilemma.temptation;
                    help_actions += 1;
                    acts[left] = ACT_HELP;
                    acts[right] = ACT_EXPLOIT;
                    exploitations += 1;
                    actual_evil = Some(right);
                    edge_kind = 3;
                }
                (Action::Exploit, Action::Exploit) => {
                    payoffs[left] += self.config.dilemma.punishment;
                    payoffs[right] += self.config.dilemma.punishment;
                    acts[left] = ACT_MUTUAL_EXPLOIT;
                    acts[right] = ACT_MUTUAL_EXPLOIT;
                    mutual_exploitations += 1;
                    edge_kind = 5;
                }
            }
            edges.push(SocialEdge {
                left,
                right,
                kind: edge_kind,
            });

            match self.config.environment {
                Environment::Anonymous => {}
                Environment::DirectRecord => {
                    self.remember_directly(
                        DirectEncounter {
                            left,
                            right,
                            left_agent,
                            right_agent,
                            left_action,
                            right_action,
                        },
                        &mut rep_delta,
                        &mut social_events,
                    );
                }
                Environment::Public => {
                    if let Some(perceived) = self.observe_publicly(
                        &current,
                        left,
                        right,
                        left_action,
                        right_action,
                        actual_evil,
                    ) {
                        social_events[left] |= SOCIAL_OBSERVED;
                        social_events[right] |= SOCIAL_OBSERVED;
                        observed_cases.push(perceived);
                    }
                }
            }
        }

        let mut observations = 0;
        let mut correct_observations = 0;
        let mut true_sanctions = 0;
        let mut false_sanctions = 0;
        let mut enforcement_load = vec![0_u8; size];

        for case in observed_cases {
            observations += 1;
            correct_observations += usize::from(case.correct);
            if case.perceived_good {
                rep_delta[case.target] = rep_delta[case.target].saturating_add(1);
                social_events[case.target] |= SOCIAL_REPUTATION_UP;
                continue;
            }
            rep_delta[case.target] = rep_delta[case.target].saturating_sub(2);
            social_events[case.target] |= SOCIAL_REPUTATION_DOWN;

            let mut enforcers = self
                .neighbors_within_two(case.target)
                .into_iter()
                .filter(|candidate| {
                    enforcement_load[*candidate] < 3
                        && current[*candidate].is_some_and(|agent| agent.enforcer && agent.q >= 2)
                })
                .collect::<Vec<_>>();
            if current[case.observer].is_some_and(|agent| agent.enforcer && agent.q >= 2)
                && enforcement_load[case.observer] < 3
            {
                enforcers.push(case.observer);
            }
            if enforcers.is_empty() {
                continue;
            }
            self.shuffle_observation(&mut enforcers);
            let enforcer = enforcers
                .into_iter()
                .max_by_key(|index| current[*index].expect("enforcer").q)
                .expect("non-empty enforcer set");
            enforcement_load[enforcer] = enforcement_load[enforcer].saturating_add(1);
            payoffs[case.target] -= self.config.sanction_fine;
            payoffs[enforcer] -= self.config.enforcement_cost;
            social_events[case.target] |= SOCIAL_SANCTIONED;
            social_events[enforcer] |= SOCIAL_ENFORCED;
            if case.correct && case.actual_evil == Some(case.target) {
                true_sanctions += 1;
                rep_delta[enforcer] = rep_delta[enforcer].saturating_add(1);
                social_events[enforcer] |= SOCIAL_REPUTATION_UP;
            } else {
                false_sanctions += 1;
                social_events[case.target] |= SOCIAL_FALSE_SANCTION;
                social_events[enforcer] |= SOCIAL_FALSE_SANCTION | SOCIAL_REPUTATION_DOWN;
                rep_delta[enforcer] = rep_delta[enforcer].saturating_sub(2);
            }
        }

        let mut socially_updated = current.clone();
        let mut forgiveness_events = 0;
        for (index, slot) in socially_updated.iter_mut().enumerate() {
            let Some(agent) = slot.as_mut() else {
                continue;
            };
            if !self.config.environment.has_memory() {
                agent.reputation = 0;
                continue;
            }
            agent.reputation = agent
                .reputation
                .saturating_add(rep_delta[index])
                .clamp(-4, 4);
            if agent.reputation < 0 && self.observation_rng.unit() < self.config.forgiveness_rate {
                agent.reputation += 1;
                forgiveness_events += 1;
                social_events[index] |= SOCIAL_FORGIVEN;
            } else if agent.reputation > 0
                && self.observation_rng.unit() < self.config.positive_memory_decay_rate
            {
                agent.reputation -= 1;
            }
        }

        let mut assessments = vec![Assessment::default(); size];
        let mut total_welfare = 0.0;
        let mut exploit_fitness_total = 0.0;
        let mut exploiters_evaluated = 0;
        let mut prosocial_fitness_total = 0.0;
        let mut prosocial_evaluated = 0;
        for (index, agent) in current.iter().enumerate() {
            let Some(agent) = agent else {
                continue;
            };
            if !matched[index] {
                payoffs[index] += self.config.refusal_payoff;
            }
            let conditional_cost = if self.config.environment.has_memory()
                && agent.policy == Policy::Conditional
                && agent.q >= 2
            {
                self.config.active_conditional_cost
            } else {
                0.0
            };
            let fitness = payoffs[index] - self.config.cognitive_cost(agent.q) - conditional_cost;
            assessments[index].fitness = fitness;
            total_welfare += fitness;
            if agent.policy == Policy::Exploiter {
                exploit_fitness_total += fitness;
                exploiters_evaluated += 1;
            } else {
                prosocial_fitness_total += fitness;
                prosocial_evaluated += 1;
            }
        }
        let exploiter_fitness = safe_mean(exploit_fitness_total, exploiters_evaluated);
        let prosocial_fitness = safe_mean(prosocial_fitness_total, prosocial_evaluated);

        let mut next = socially_updated.clone();
        let mut ecology_events = vec![0_u8; size];
        let mut births = 0;
        let mut deaths = 0;
        for index in 0..size {
            match socially_updated[index] {
                Some(_) if self.ecology_rng.unit() < self.config.death_rate => {
                    next[index] = None;
                    ecology_events[index] = ECOLOGY_DEATH;
                    deaths += 1;
                }
                Some(mut survivor) => {
                    survivor.age = survivor.age.saturating_add(1);
                    next[index] = Some(survivor);
                }
                None => {
                    let parents = self
                        .neighbors(index)
                        .into_iter()
                        .filter(|neighbor| current[*neighbor].is_some())
                        .collect::<Vec<_>>();
                    if !parents.is_empty()
                        && self.ecology_rng.unit()
                            < contact_probability(self.config.birth_rate, parents.len())
                    {
                        let parent_index = self.select_parent(&parents, &assessments);
                        let parent = current[parent_index].expect("birth parent");
                        next[index] = Some(self.mutated_child(parent));
                        ecology_events[index] = ECOLOGY_BIRTH;
                        births += 1;
                    }
                }
            }
        }

        // "Activity" is ecological turnover. Reputation and policy records can
        // change without implying that a site was born or died.
        let changed_sites = births + deaths;

        self.grid = next;
        self.acts = acts;
        self.social_events = social_events;
        self.ecology_events = ecology_events;
        self.edges = edges;
        let from_tick = self.tick;
        self.tick += 1;
        let after = self.population_summary();

        StepReport {
            from_tick,
            tick: self.tick,
            before,
            after,
            matches: pairs.len(),
            help_actions,
            exploitations,
            refusals,
            mutual_exploitations,
            observations,
            correct_observations,
            true_sanctions,
            false_sanctions,
            forgiveness_events,
            mean_welfare: safe_mean(total_welfare, current.iter().flatten().count()),
            exploiter_fitness,
            prosocial_fitness,
            net_exploit_advantage: exploiter_fitness - prosocial_fitness,
            births,
            deaths,
            changed_sites,
        }
    }

    fn remember_directly(
        &mut self,
        encounter: DirectEncounter,
        rep_delta: &mut [i8],
        events: &mut [u8],
    ) {
        let DirectEncounter {
            left,
            right,
            left_agent,
            right_agent,
            left_action,
            right_action,
        } = encounter;
        // A refused exchange produces no realized help or exploitation to
        // remember, even if the other participant intended an action.
        if left_action == Action::Refuse || right_action == Action::Refuse {
            return;
        }
        for (observer, target, observer_agent, target_action, other_action) in [
            (left, right, left_agent, right_action, left_action),
            (right, left, right_agent, left_action, right_action),
        ] {
            if observer_agent.q < 2
                || self.observation_rng.unit() >= self.config.observation_opportunity
            {
                continue;
            }
            events[observer] |= SOCIAL_OBSERVED;
            let accurate =
                self.observation_rng.unit() < self.config.classification_accuracy(observer_agent.q);
            let target_was_good = target_action == Action::Help;
            let target_was_evil = target_action == Action::Exploit && other_action == Action::Help;
            let (perceived_good, perceived_evil) = if accurate {
                (target_was_good, target_was_evil)
            } else if target_was_evil {
                (true, false)
            } else {
                (false, true)
            };
            if perceived_good {
                rep_delta[target] = rep_delta[target].saturating_add(1);
                events[target] |= SOCIAL_REPUTATION_UP;
            } else if perceived_evil {
                rep_delta[target] = rep_delta[target].saturating_sub(2);
                events[target] |= SOCIAL_REPUTATION_DOWN;
            }
        }
    }

    fn observe_publicly(
        &mut self,
        current: &[Option<Agent>],
        left: usize,
        right: usize,
        left_action: Action,
        right_action: Action,
        actual_evil: Option<usize>,
    ) -> Option<PerceivedCase> {
        let mut observers = self.neighbors_within_two(left);
        observers.extend(self.neighbors_within_two(right));
        observers.sort_unstable();
        observers.dedup();
        observers.retain(|index| {
            *index != left && *index != right && current[*index].is_some_and(|agent| agent.q >= 2)
        });
        if observers.is_empty()
            || self.observation_rng.unit() >= self.config.observation_opportunity
        {
            return None;
        }
        self.shuffle_observation(&mut observers);
        let observer = observers
            .into_iter()
            .max_by_key(|index| current[*index].expect("observer").q)
            .expect("non-empty observer set");
        let observer_q = current[observer].expect("observer").q;
        let correct = self.observation_rng.unit() < self.config.classification_accuracy(observer_q);
        if let Some(perpetrator) = actual_evil {
            let victim = if perpetrator == left { right } else { left };
            return Some(PerceivedCase {
                observer,
                target: if correct { perpetrator } else { victim },
                actual_evil,
                correct,
                perceived_good: false,
            });
        }

        let mutual_help = left_action == Action::Help && right_action == Action::Help;
        if correct && mutual_help {
            let target = if self.observation_rng.unit() < 0.5 {
                left
            } else {
                right
            };
            Some(PerceivedCase {
                observer,
                target,
                actual_evil: None,
                correct: true,
                perceived_good: true,
            })
        } else if !correct {
            let target = if self.observation_rng.unit() < 0.5 {
                left
            } else {
                right
            };
            Some(PerceivedCase {
                observer,
                target,
                actual_evil: None,
                correct: false,
                perceived_good: false,
            })
        } else {
            None
        }
    }

    fn offset(&self, x: usize, y: usize) -> usize {
        y * self.config.width + x
    }

    fn coordinates(&self, index: usize) -> (usize, usize) {
        (index % self.config.width, index / self.config.width)
    }

    fn neighbors(&self, index: usize) -> [usize; 8] {
        let (x, y) = self.coordinates(index);
        let width = self.config.width as isize;
        let height = self.config.height as isize;
        let x = x as isize;
        let y = y as isize;
        let deltas = [
            (-1, -1),
            (0, -1),
            (1, -1),
            (-1, 0),
            (1, 0),
            (-1, 1),
            (0, 1),
            (1, 1),
        ];
        std::array::from_fn(|slot| {
            let (dx, dy) = deltas[slot];
            let nx = (x + dx).rem_euclid(width) as usize;
            let ny = (y + dy).rem_euclid(height) as usize;
            self.offset(nx, ny)
        })
    }

    fn neighbors_within_two(&self, index: usize) -> Vec<usize> {
        let (x, y) = self.coordinates(index);
        let width = self.config.width as isize;
        let height = self.config.height as isize;
        let mut neighbors = Vec::with_capacity(24);
        for dy in -2_isize..=2 {
            for dx in -2_isize..=2 {
                if dx == 0 && dy == 0 {
                    continue;
                }
                let nx = (x as isize + dx).rem_euclid(width) as usize;
                let ny = (y as isize + dy).rem_euclid(height) as usize;
                neighbors.push(self.offset(nx, ny));
            }
        }
        neighbors
    }

    fn shuffle_matching(&mut self, values: &mut [usize]) {
        shuffle(&mut self.matching_rng, values);
    }

    fn shuffle_observation(&mut self, values: &mut [usize]) {
        shuffle(&mut self.observation_rng, values);
    }

    fn select_parent(&mut self, parents: &[usize], assessments: &[Assessment]) -> usize {
        debug_assert!(!parents.is_empty());
        let max_fitness = parents
            .iter()
            .map(|index| assessments[*index].fitness)
            .fold(f64::NEG_INFINITY, f64::max);
        let mut weights = [0.0_f64; 8];
        let mut total = 0.0;
        for (slot, parent) in parents.iter().copied().enumerate() {
            let scaled = self.config.selection_strength
                * (assessments[parent].fitness - max_fitness).clamp(-60.0, 0.0);
            let weight = scaled.exp();
            weights[slot] = weight;
            total += weight;
        }
        let mut draw = self.inheritance_rng.unit() * total;
        for (slot, parent) in parents.iter().copied().enumerate() {
            if draw <= weights[slot] {
                return parent;
            }
            draw -= weights[slot];
        }
        parents[parents.len() - 1]
    }

    fn mutated_child(&mut self, parent: Agent) -> Agent {
        let mut policy = parent.policy;
        if self.inheritance_rng.unit() < self.config.policy_mutation_rate {
            policy = policy.mutated(self.inheritance_rng.index(2));
        }
        let mut enforcer = parent.enforcer;
        if self.inheritance_rng.unit() < self.config.enforcer_mutation_rate {
            enforcer = !enforcer;
        }
        let mut q = parent.q;
        if self.inheritance_rng.unit() < self.config.q_mutation_rate {
            if q == 0 {
                q = 1;
            } else if q == self.config.max_q || self.inheritance_rng.unit() < 0.5 {
                q -= 1;
            } else {
                q += 1;
            }
        }
        Agent::new(policy, enforcer, q)
    }

    fn population_summary(&self) -> PopulationStats {
        let mut stats = PopulationStats::default();
        let mut total_q = 0_usize;
        let mut total_reputation = 0_i64;
        for agent in self.grid.iter().flatten() {
            stats.alive += 1;
            match agent.policy {
                Policy::OpenHand => stats.open_hands += 1,
                Policy::Exploiter => stats.exploiters += 1,
                Policy::Conditional => stats.conditionals += 1,
            }
            stats.enforcers += usize::from(agent.enforcer);
            stats.moral_capacity += usize::from(agent.q >= 2);
            stats.active_institutions += usize::from(match self.config.environment {
                Environment::Anonymous => false,
                Environment::DirectRecord => agent.q >= 2 && agent.policy == Policy::Conditional,
                Environment::Public => {
                    agent.q >= 2 && (agent.policy == Policy::Conditional || agent.enforcer)
                }
            });
            stats.bad_reputations += usize::from(agent.reputation < 0);
            total_q += usize::from(agent.q);
            total_reputation += i64::from(agent.reputation);
        }
        if stats.alive > 0 {
            stats.mean_q = total_q as f64 / stats.alive as f64;
            stats.mean_reputation = total_reputation as f64 / stats.alive as f64;
        }
        stats
    }
}

#[derive(Clone, Copy, Debug)]
struct PerceivedCase {
    observer: usize,
    target: usize,
    actual_evil: Option<usize>,
    correct: bool,
    perceived_good: bool,
}

#[derive(Clone, Copy, Debug)]
struct DirectEncounter {
    left: usize,
    right: usize,
    left_agent: Agent,
    right_agent: Agent,
    left_action: Action,
    right_action: Action,
}

fn choose_action(focal: Agent, partner: Agent, environment: Environment) -> Action {
    match focal.policy {
        Policy::OpenHand => Action::Help,
        Policy::Exploiter => Action::Exploit,
        Policy::Conditional
            if environment.has_memory() && focal.q >= 2 && partner.reputation < 0 =>
        {
            Action::Refuse
        }
        Policy::Conditional => Action::Help,
    }
}

fn safe_mean(total: f64, count: usize) -> f64 {
    if count == 0 {
        0.0
    } else {
        total / count as f64
    }
}

fn shuffle(rng: &mut Rng64, values: &mut [usize]) {
    for upper in (1..values.len()).rev() {
        let other = rng.index(upper + 1);
        values.swap(upper, other);
    }
}

fn contact_probability(rate: f64, neighbors: usize) -> f64 {
    1.0 - (1.0 - rate).powi(neighbors.min(i32::MAX as usize) as i32)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    fn small_config() -> Config {
        Config {
            width: 7,
            height: 7,
            initial_density: 0.0,
            birth_rate: 0.0,
            death_rate: 0.0,
            policy_mutation_rate: 0.0,
            enforcer_mutation_rate: 0.0,
            q_mutation_rate: 0.0,
            observation_opportunity: 1.0,
            ..Config::default()
        }
    }

    #[test]
    fn conditional_action_needs_memory_capacity_and_a_bad_record() {
        let conditional = Agent::new(Policy::Conditional, false, 2);
        let mut bad_partner = Agent::new(Policy::Exploiter, false, 0);
        bad_partner.reputation = -1;
        assert_eq!(
            choose_action(conditional, bad_partner, Environment::Public),
            Action::Refuse
        );
        assert_eq!(
            choose_action(conditional, bad_partner, Environment::Anonymous),
            Action::Help
        );
        assert_eq!(
            choose_action(
                Agent::new(Policy::Conditional, false, 1),
                bad_partner,
                Environment::Public
            ),
            Action::Help
        );
    }

    #[test]
    fn cognition_costs_more_as_q_rises() {
        let config = Config::default();
        assert_eq!(config.cognitive_cost(0), 0.0);
        assert!(config.cognitive_cost(2) > config.cognitive_cost(1));
        assert!(config.classification_accuracy(8) > config.classification_accuracy(2));
    }

    #[test]
    fn child_has_no_inherited_reputation() {
        let mut simulation = Simulation::empty(small_config()).unwrap();
        let mut parent = Agent::new(Policy::Conditional, true, 4);
        parent.reputation = -4;
        let child = simulation.mutated_child(parent);
        assert_eq!(child.policy, Policy::Conditional);
        assert!(child.enforcer);
        assert_eq!(child.q, 4);
        assert_eq!(child.reputation, 0);
    }

    #[test]
    fn packed_cells_keep_policy_enforcement_and_q_separate() {
        let mut simulation = Simulation::empty(small_config()).unwrap();
        simulation.set_cell(0, 0, Some(Agent::new(Policy::Conditional, true, 7)));
        let packed = simulation.packed_cells()[0];
        assert_ne!(packed & 0b1000_0000, 0);
        assert_eq!((packed >> 5) & 0b11, Policy::Conditional as u8);
        assert_ne!(packed & 0b0001_0000, 0);
        assert_eq!(packed & 0b0000_1111, 7);
    }

    #[test]
    fn reputation_is_bounded_during_long_runs() {
        let mut simulation = Simulation::random(Config {
            width: 32,
            height: 18,
            ..Config::default()
        })
        .unwrap();
        for _ in 0..400 {
            simulation.step();
        }
        assert!(
            simulation
                .reputations()
                .into_iter()
                .all(|value| (-4..=4).contains(&value))
        );
    }

    #[test]
    fn anonymous_q_zero_world_cannot_form_reputation_or_sanctions() {
        let mut simulation = Simulation::random(Config {
            width: 32,
            height: 18,
            environment: Environment::Anonymous,
            initial_q_one_share: 0.0,
            initial_q_two_share: 0.0,
            initial_enforcer_share: 0.0,
            q_mutation_rate: 0.0,
            ..Config::default()
        })
        .unwrap();
        for _ in 0..100 {
            let report = simulation.step();
            assert_eq!(report.observations, 0);
            assert_eq!(report.true_sanctions + report.false_sanctions, 0);
        }
        assert!(simulation.reputations().into_iter().all(|value| value == 0));
    }

    #[test]
    fn q_zero_public_world_cannot_observe_or_enforce_signed_norms() {
        let mut simulation = Simulation::random(Config {
            width: 32,
            height: 18,
            environment: Environment::Public,
            initial_q_one_share: 0.0,
            initial_q_two_share: 0.0,
            initial_enforcer_share: 0.0,
            q_mutation_rate: 0.0,
            ..Config::default()
        })
        .unwrap();
        for _ in 0..100 {
            let report = simulation.step();
            assert_eq!(report.observations, 0);
            assert_eq!(report.true_sanctions + report.false_sanctions, 0);
        }
        assert!(simulation.reputations().into_iter().all(|value| value == 0));
    }

    #[test]
    fn a_generation_never_pairs_an_agent_twice_or_with_itself() {
        let mut simulation = Simulation::random(Config {
            width: 48,
            height: 27,
            ..Config::default()
        })
        .unwrap();
        simulation.step();
        let mut matched = HashSet::new();
        for edge in simulation.edges() {
            assert_ne!(edge.left, edge.right);
            assert!(matched.insert(edge.left));
            assert!(matched.insert(edge.right));
        }
    }

    #[test]
    fn refusal_cancels_unrealized_help_for_both_participants() {
        let mut simulation = Simulation::empty(Config {
            environment: Environment::DirectRecord,
            forgiveness_rate: 0.0,
            positive_memory_decay_rate: 0.0,
            ..small_config()
        })
        .unwrap();
        let conditional = Agent::new(Policy::Conditional, false, 2);
        let mut recorded_exploiter = Agent::new(Policy::OpenHand, false, 0);
        recorded_exploiter.reputation = -1;
        simulation.set_cell(0, 0, Some(conditional));
        simulation.set_cell(1, 0, Some(recorded_exploiter));

        let report = simulation.step();

        assert_eq!(report.matches, 1);
        assert_eq!(report.help_actions, 0);
        assert_eq!(report.exploitations, 0);
        assert_eq!(report.refusals, 2);
        assert_eq!(report.cooperation_rate(), 0.0);
        assert_eq!(report.refusal_rate(), 1.0);
        assert_eq!(simulation.acts()[0], ACT_REFUSE);
        assert_eq!(simulation.acts()[1], ACT_REFUSE);
        assert_eq!(simulation.reputations()[1], -1);
    }

    #[test]
    fn institution_share_counts_only_traits_the_environment_can_express() {
        let mut simulation = Simulation::empty(small_config()).unwrap();
        simulation.set_cell(0, 0, Some(Agent::new(Policy::Conditional, false, 2)));
        simulation.set_cell(1, 0, Some(Agent::new(Policy::OpenHand, true, 2)));

        simulation.set_environment(Environment::Anonymous);
        assert_eq!(simulation.population().active_institutions, 0);

        simulation.set_environment(Environment::DirectRecord);
        assert_eq!(simulation.population().active_institutions, 1);

        simulation.set_environment(Environment::Public);
        assert_eq!(simulation.population().active_institutions, 2);
    }

    #[test]
    fn zero_observation_opportunity_keeps_public_records_inert() {
        let mut simulation = Simulation::random(Config {
            width: 32,
            height: 18,
            environment: Environment::Public,
            observation_opportunity: 0.0,
            ..Config::default()
        })
        .unwrap();
        for _ in 0..100 {
            let report = simulation.step();
            assert_eq!(report.observations, 0);
            assert_eq!(report.true_sanctions + report.false_sanctions, 0);
        }
        assert!(simulation.reputations().into_iter().all(|value| value == 0));
    }

    #[test]
    fn population_accounting_is_exact() {
        let mut simulation = Simulation::random(Config {
            width: 48,
            height: 27,
            ..Config::default()
        })
        .unwrap();
        for _ in 0..200 {
            let report = simulation.step();
            assert_eq!(
                report.after.alive,
                report.before.alive + report.births - report.deaths
            );
            assert_eq!(report.changed_sites, report.births + report.deaths);
            assert!(report.true_sanctions <= report.exploitations);
        }
    }

    #[test]
    fn seeded_runs_are_deterministic() {
        let config = Config {
            width: 32,
            height: 18,
            seed: 88,
            ..Config::default()
        };
        let mut first = Simulation::random(config.clone()).unwrap();
        let mut second = Simulation::random(config).unwrap();
        for _ in 0..150 {
            let first_report = first.step();
            let second_report = second.step();
            assert_eq!(first.packed_cells(), second.packed_cells());
            assert_eq!(first.reputations(), second.reputations());
            assert_eq!(first_report.exploitations, second_report.exploitations);
            assert_eq!(first_report.true_sanctions, second_report.true_sanctions);
            assert_eq!(first_report.false_sanctions, second_report.false_sanctions);
        }
    }

    #[test]
    fn social_environment_does_not_change_the_ecological_occupancy_path() {
        let base = Config {
            width: 32,
            height: 18,
            seed: 42,
            ..Config::default()
        };
        let mut anonymous = Simulation::random(Config {
            environment: Environment::Anonymous,
            ..base.clone()
        })
        .unwrap();
        let mut public = Simulation::random(Config {
            environment: Environment::Public,
            ..base
        })
        .unwrap();
        for _ in 0..200 {
            anonymous.step();
            public.step();
            let anonymous_occupancy = anonymous
                .packed_cells()
                .into_iter()
                .map(|cell| cell & 0b1000_0000)
                .collect::<Vec<_>>();
            let public_occupancy = public
                .packed_cells()
                .into_iter()
                .map(|cell| cell & 0b1000_0000)
                .collect::<Vec<_>>();
            assert_eq!(anonymous_occupancy, public_occupancy);
        }
    }

    #[test]
    fn default_world_stays_alive_and_socially_active() {
        let mut simulation = Simulation::random(Config {
            width: 64,
            height: 36,
            ..Config::default()
        })
        .unwrap();
        let mut matches = 0;
        let mut exploitations = 0;
        for _ in 0..300 {
            let report = simulation.step();
            matches += report.matches;
            exploitations += report.exploitations;
        }
        let population = simulation.population();
        assert!(population.alive > 400);
        assert!(matches > 10_000);
        assert!(exploitations > 0);
    }
}
