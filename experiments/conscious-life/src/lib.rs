use std::fmt;

#[cfg(target_arch = "wasm32")]
mod wasm;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Species {
    Prey,
    Predator,
}

impl Species {
    const COUNT: usize = 2;

    fn slot(self) -> usize {
        match self {
            Self::Prey => 0,
            Self::Predator => 1,
        }
    }
}

impl fmt::Display for Species {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Prey => write!(f, "prey"),
            Self::Predator => write!(f, "predator"),
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EconomicType {
    Cooperator,
    Defector,
}

impl EconomicType {
    fn flipped(self) -> Self {
        match self {
            Self::Cooperator => Self::Defector,
            Self::Defector => Self::Cooperator,
        }
    }
}

impl fmt::Display for EconomicType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Cooperator => write!(f, "cooperator"),
            Self::Defector => write!(f, "defector"),
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MoralVoice {
    Silent,
    Felt,
    Good,
    Evil,
    Neutral,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Persona {
    Null,
    Cooperative,
    Defective,
}

impl Persona {
    const COUNT: usize = 3;

    fn slot(self) -> usize {
        match self {
            Self::Null => 0,
            Self::Cooperative => 1,
            Self::Defective => 2,
        }
    }
}

impl fmt::Display for MoralVoice {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Silent => write!(f, "silent"),
            Self::Felt => write!(f, "felt but undifferentiated"),
            Self::Good => write!(f, "good"),
            Self::Evil => write!(f, "evil"),
            Self::Neutral => write!(f, "neutral"),
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Cell {
    pub species: Species,
    pub economic_type: EconomicType,
    pub consciousness: u8,
    pub age: u32,
}

impl Cell {
    pub fn new(economic_type: EconomicType, consciousness: u8) -> Self {
        Self::new_species(Species::Prey, economic_type, consciousness)
    }

    pub fn new_species(species: Species, economic_type: EconomicType, consciousness: u8) -> Self {
        Self {
            species,
            economic_type,
            consciousness,
            age: 0,
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct PrisonersDilemma {
    pub sucker: f64,
    pub punishment: f64,
    pub reward: f64,
    pub temptation: f64,
}

impl Default for PrisonersDilemma {
    fn default() -> Self {
        // S <= P <= R <= T and (T - P) > (R - S): decreasing differences.
        Self {
            sucker: 0.0,
            punishment: 1.0,
            reward: 3.0,
            temptation: 5.0,
        }
    }
}

impl PrisonersDilemma {
    pub fn payoff(self, focal: EconomicType, partner: EconomicType) -> f64 {
        match (focal, partner) {
            (EconomicType::Cooperator, EconomicType::Cooperator) => self.reward,
            (EconomicType::Cooperator, EconomicType::Defector) => self.sucker,
            (EconomicType::Defector, EconomicType::Cooperator) => self.temptation,
            (EconomicType::Defector, EconomicType::Defector) => self.punishment,
        }
    }

    pub fn benefit_of_cooperator_for(self, kind: EconomicType) -> f64 {
        match kind {
            EconomicType::Cooperator => self.reward - self.sucker,
            EconomicType::Defector => self.temptation - self.punishment,
        }
    }

    pub fn has_decreasing_differences(self) -> bool {
        self.benefit_of_cooperator_for(EconomicType::Defector)
            > self.benefit_of_cooperator_for(EconomicType::Cooperator)
    }

    fn validate(self) -> Result<(), String> {
        if !(self.sucker <= self.punishment
            && self.punishment <= self.reward
            && self.reward <= self.temptation)
        {
            return Err("payoffs must satisfy sucker <= punishment <= reward <= temptation".into());
        }
        if !self.has_decreasing_differences() {
            return Err(
                "this first experiment requires decreasing differences: T-P must exceed R-S".into(),
            );
        }
        Ok(())
    }
}

#[derive(Clone, Debug)]
pub struct Config {
    pub width: usize,
    pub height: usize,
    pub initial_density: f64,
    pub initial_cooperator_share: f64,
    pub initial_conscious_share: f64,
    pub initial_predator_share: f64,
    pub predator_prey_ecology: bool,
    pub prey_birth_rate: f64,
    pub predation_rate: f64,
    pub predator_starvation_rate: f64,
    pub max_consciousness: u8,
    pub seed: u64,
    pub selection_strength: f64,
    pub economic_mutation_rate: f64,
    pub consciousness_mutation_rate: f64,
    pub mimic_fixed_cost: f64,
    pub mimic_slope: f64,
    pub biological_fixed_cost: f64,
    pub biological_slope: f64,
    pub game: PrisonersDilemma,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            width: 256,
            height: 256,
            initial_density: 0.48,
            initial_cooperator_share: 0.55,
            initial_conscious_share: 0.02,
            initial_predator_share: 1.0 / 6.0,
            predator_prey_ecology: true,
            prey_birth_rate: 0.12,
            predation_rate: 0.06,
            predator_starvation_rate: 0.16,
            max_consciousness: 8,
            seed: 7,
            selection_strength: 0.85,
            economic_mutation_rate: 0.002,
            consciousness_mutation_rate: 0.005,
            mimic_fixed_cost: 1.45,
            mimic_slope: 0.12,
            biological_fixed_cost: 0.10,
            biological_slope: 0.10,
            game: PrisonersDilemma::default(),
        }
    }
}

impl Config {
    pub fn validate(&self) -> Result<(), String> {
        if self.width < 3 || self.height < 3 {
            return Err("width and height must both be at least 3".into());
        }
        if self.width.checked_mul(self.height).is_none() {
            return Err("grid dimensions are too large".into());
        }
        for (name, value) in [
            ("initial density", self.initial_density),
            ("initial cooperator share", self.initial_cooperator_share),
            ("initial conscious share", self.initial_conscious_share),
            ("initial predator share", self.initial_predator_share),
            ("prey birth rate", self.prey_birth_rate),
            ("predation rate", self.predation_rate),
            ("predator starvation rate", self.predator_starvation_rate),
            ("economic mutation rate", self.economic_mutation_rate),
            (
                "consciousness mutation rate",
                self.consciousness_mutation_rate,
            ),
        ] {
            if !(0.0..=1.0).contains(&value) {
                return Err(format!("{name} must be between 0 and 1"));
            }
        }
        if self.max_consciousness < 2 {
            return Err(
                "max consciousness must be at least 2 so good and evil can separate".into(),
            );
        }
        for (name, value) in [
            ("selection strength", self.selection_strength),
            ("mimic fixed cost", self.mimic_fixed_cost),
            ("mimic slope", self.mimic_slope),
            ("biological fixed cost", self.biological_fixed_cost),
            ("biological slope", self.biological_slope),
        ] {
            if !value.is_finite() || value < 0.0 {
                return Err(format!("{name} must be finite and non-negative"));
            }
        }
        self.game.validate()
    }

    pub fn mimic_cost(&self, q: u8) -> f64 {
        if q == 0 {
            0.0
        } else {
            self.mimic_fixed_cost + self.mimic_slope * f64::from(q - 1)
        }
    }

    pub fn biological_cost(&self, q: u8) -> f64 {
        if q == 0 {
            0.0
        } else {
            self.biological_fixed_cost + self.biological_slope * f64::from(q - 1)
        }
    }

    pub fn mimic_probability(&self, q: u8, cooperator_share_at_q: f64) -> f64 {
        if q == 0 || cooperator_share_at_q <= 0.0 || cooperator_share_at_q >= 1.0 {
            return 0.0;
        }
        let gain = self.game.benefit_of_cooperator_for(EconomicType::Defector);
        let indifference_belief = self.mimic_cost(q) / gain;
        if indifference_belief >= 1.0 {
            return 0.0;
        }
        if indifference_belief <= 0.0 {
            return 1.0;
        }
        let population_odds = cooperator_share_at_q / (1.0 - cooperator_share_at_q);
        let belief_odds = (1.0 - indifference_belief) / indifference_belief;
        (population_odds * belief_odds).clamp(0.0, 1.0)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct CognitiveState {
    pub living_neighbors: u8,
    pub cooperative_neighbors: u8,
    pub partner_type: Option<EconomicType>,
    pub action: EconomicType,
}

#[derive(Clone, Copy, Debug)]
pub struct Assessment {
    pub cognitive_state: CognitiveState,
    pub experience_level: u8,
    pub voice: MoralVoice,
    pub economic_payoff: f64,
    pub mimic_cost: f64,
    pub biological_cost: f64,
    pub fitness: f64,
}

impl Default for Assessment {
    fn default() -> Self {
        Self {
            cognitive_state: CognitiveState {
                living_neighbors: 0,
                cooperative_neighbors: 0,
                partner_type: None,
                action: EconomicType::Defector,
            },
            experience_level: 0,
            voice: MoralVoice::Silent,
            economic_payoff: 0.0,
            mimic_cost: 0.0,
            biological_cost: 0.0,
            fitness: 0.0,
        }
    }
}

#[derive(Clone, Debug)]
pub struct VoiceReport {
    pub x: usize,
    pub y: usize,
    pub species: Species,
    pub economic_type: EconomicType,
    pub consciousness: u8,
    pub experience_level: u8,
    pub moral_voice: MoralVoice,
    pub utterance: &'static str,
}

#[derive(Clone, Debug)]
pub struct PopulationStats {
    pub alive: usize,
    pub prey: usize,
    pub predators: usize,
    pub cooperators: usize,
    pub defectors: usize,
    pub prey_cooperators: usize,
    pub predator_cooperators: usize,
    pub mean_consciousness: f64,
    pub max_consciousness: u8,
    pub consciousness_histogram: Vec<usize>,
}

impl PopulationStats {
    pub fn cooperator_share(&self) -> f64 {
        if self.alive == 0 {
            0.0
        } else {
            self.cooperators as f64 / self.alive as f64
        }
    }

    pub fn prey_cooperator_share(&self) -> f64 {
        if self.prey == 0 {
            0.0
        } else {
            self.prey_cooperators as f64 / self.prey as f64
        }
    }

    pub fn predator_cooperator_share(&self) -> f64 {
        if self.predators == 0 {
            0.0
        } else {
            self.predator_cooperators as f64 / self.predators as f64
        }
    }
}

#[derive(Clone, Debug)]
pub struct StepReport {
    pub from_tick: u64,
    pub tick: u64,
    pub before: PopulationStats,
    pub after: PopulationStats,
    pub mean_fitness: f64,
    pub births: usize,
    pub deaths: usize,
    pub survivors: usize,
    pub prey_births: usize,
    pub predator_births: usize,
    pub prey_deaths: usize,
    pub predator_deaths: usize,
    pub captures: usize,
    pub changed_sites: usize,
    pub cooperative_match_rate: f64,
    pub good: usize,
    pub evil: usize,
    pub prey_good: usize,
    pub prey_evil: usize,
    pub predator_good: usize,
    pub predator_evil: usize,
    pub neutral: usize,
    pub felt: usize,
    pub silent: usize,
    pub voice: Option<VoiceReport>,
}

impl StepReport {
    pub fn csv_header(max_q: u8) -> String {
        let mut columns = vec![
            "from_tick",
            "tick",
            "alive_before",
            "prey_before",
            "predators_before",
            "cooperators_before",
            "defectors_before",
            "cooperator_share_before",
            "mean_q_before",
            "max_q_before",
            "alive_after",
            "prey_after",
            "predators_after",
            "cooperators_after",
            "defectors_after",
            "cooperator_share_after",
            "mean_q_after",
            "max_q_after",
            "mean_fitness",
            "births",
            "deaths",
            "survivors",
            "prey_births",
            "predator_births",
            "prey_deaths",
            "predator_deaths",
            "captures",
            "changed_sites",
            "cooperative_match_rate",
            "good",
            "evil",
            "prey_good",
            "prey_evil",
            "predator_good",
            "predator_evil",
            "neutral",
            "felt",
            "silent",
        ]
        .into_iter()
        .map(str::to_string)
        .collect::<Vec<_>>();
        columns.extend((0..=max_q).map(|q| format!("q_before_{q}")));
        columns.extend((0..=max_q).map(|q| format!("q_after_{q}")));
        columns.join(",")
    }

    pub fn csv_row(&self) -> String {
        let mut values = vec![
            self.from_tick.to_string(),
            self.tick.to_string(),
            self.before.alive.to_string(),
            self.before.prey.to_string(),
            self.before.predators.to_string(),
            self.before.cooperators.to_string(),
            self.before.defectors.to_string(),
            format!("{:.6}", self.before.cooperator_share()),
            format!("{:.6}", self.before.mean_consciousness),
            self.before.max_consciousness.to_string(),
            self.after.alive.to_string(),
            self.after.prey.to_string(),
            self.after.predators.to_string(),
            self.after.cooperators.to_string(),
            self.after.defectors.to_string(),
            format!("{:.6}", self.after.cooperator_share()),
            format!("{:.6}", self.after.mean_consciousness),
            self.after.max_consciousness.to_string(),
            format!("{:.6}", self.mean_fitness),
            self.births.to_string(),
            self.deaths.to_string(),
            self.survivors.to_string(),
            self.prey_births.to_string(),
            self.predator_births.to_string(),
            self.prey_deaths.to_string(),
            self.predator_deaths.to_string(),
            self.captures.to_string(),
            self.changed_sites.to_string(),
            format!("{:.6}", self.cooperative_match_rate),
            self.good.to_string(),
            self.evil.to_string(),
            self.prey_good.to_string(),
            self.prey_evil.to_string(),
            self.predator_good.to_string(),
            self.predator_evil.to_string(),
            self.neutral.to_string(),
            self.felt.to_string(),
            self.silent.to_string(),
        ];
        values.extend(
            self.before
                .consciousness_histogram
                .iter()
                .map(usize::to_string),
        );
        values.extend(
            self.after
                .consciousness_histogram
                .iter()
                .map(usize::to_string),
        );
        values.join(",")
    }
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
    grid: Vec<Option<Cell>>,
    events: Vec<u8>,
    social_rng: Rng64,
    ecology_rng: Rng64,
    tick: u64,
}

impl Simulation {
    pub fn random(config: Config) -> Result<Self, String> {
        config.validate()?;
        let seed = config.seed;
        let mut rng = Rng64::new(stream_seed(seed, 0));
        let mut grid = Vec::with_capacity(config.width * config.height);
        for _ in 0..(config.width * config.height) {
            if rng.unit() < config.initial_density {
                let species =
                    if config.predator_prey_ecology && rng.unit() < config.initial_predator_share {
                        Species::Predator
                    } else {
                        Species::Prey
                    };
                let economic_type = if rng.unit() < config.initial_cooperator_share {
                    EconomicType::Cooperator
                } else {
                    EconomicType::Defector
                };
                let consciousness = if rng.unit() < config.initial_conscious_share {
                    1
                } else {
                    0
                };
                grid.push(Some(Cell::new_species(
                    species,
                    economic_type,
                    consciousness,
                )));
            } else {
                grid.push(None);
            }
        }
        let events = vec![0; grid.len()];
        Ok(Self {
            config,
            grid,
            events,
            social_rng: Rng64::new(stream_seed(seed, 1)),
            ecology_rng: Rng64::new(stream_seed(seed, 2)),
            tick: 0,
        })
    }

    pub fn empty(config: Config) -> Result<Self, String> {
        config.validate()?;
        let seed = config.seed;
        let size = config.width * config.height;
        Ok(Self {
            grid: vec![None; size],
            events: vec![0; size],
            social_rng: Rng64::new(stream_seed(seed, 1)),
            ecology_rng: Rng64::new(stream_seed(seed, 2)),
            config,
            tick: 0,
        })
    }

    pub fn config(&self) -> &Config {
        &self.config
    }

    pub fn tick(&self) -> u64 {
        self.tick
    }

    pub fn cell(&self, x: usize, y: usize) -> Option<Cell> {
        self.grid[self.offset(x % self.config.width, y % self.config.height)]
    }

    pub fn set_cell(&mut self, x: usize, y: usize, cell: Option<Cell>) {
        let index = self.offset(x % self.config.width, y % self.config.height);
        self.events[index] = 0;
        self.grid[index] = cell.map(|mut value| {
            value.consciousness = value.consciousness.min(self.config.max_consciousness);
            value
        });
    }

    pub fn alive_count(&self) -> usize {
        self.grid.iter().filter(|cell| cell.is_some()).count()
    }

    pub fn population(&self) -> PopulationStats {
        self.population_summary()
    }

    pub fn packed_cells(&self) -> Vec<u8> {
        self.grid
            .iter()
            .enumerate()
            .map(|(index, cell)| match cell {
                None => 0,
                Some(cell) => {
                    let kind = u8::from(cell.economic_type == EconomicType::Defector) << 6;
                    let species = u8::from(cell.species == Species::Predator) << 5;
                    let changed = u8::from(self.events[index] != 0) << 4;
                    0b1000_0000 | kind | species | changed | cell.consciousness.min(0b0000_1111)
                }
            })
            .collect()
    }

    pub fn packed_events(&self) -> Vec<u8> {
        self.events.clone()
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

    fn shuffle(&mut self, values: &mut [usize]) {
        for upper in (1..values.len()).rev() {
            let other = self.social_rng.index(upper + 1);
            values.swap(upper, other);
        }
    }

    pub fn step(&mut self) -> StepReport {
        let current = self.grid.clone();
        let before = self.population_summary();
        let size = current.len();
        let mut partner_types = vec![None; size];
        let mut payoff_sums = vec![0.0_f64; size];
        let mut interaction_counts = vec![0_usize; size];
        let mut mimic_costs: Vec<f64> = vec![0.0; size];

        let grades = usize::from(self.config.max_consciousness) + 1;
        let mut population_at_q = vec![0_usize; Species::COUNT * grades];
        let mut cooperators_at_q = vec![0_usize; Species::COUNT * grades];
        for cell in current.iter().flatten() {
            let q = usize::from(cell.consciousness);
            let market = cell.species.slot() * grades + q;
            population_at_q[market] += 1;
            cooperators_at_q[market] += usize::from(cell.economic_type == EconomicType::Cooperator);
        }

        let mut match_groups = vec![Vec::<usize>::new(); Species::COUNT * grades * Persona::COUNT];
        for (index, cell) in current.iter().enumerate() {
            let Some(cell) = cell else {
                continue;
            };
            let q = usize::from(cell.consciousness);
            let persona = if cell.consciousness == 0 {
                Persona::Null
            } else if cell.economic_type == EconomicType::Cooperator {
                Persona::Cooperative
            } else {
                let market = cell.species.slot() * grades + q;
                let cooperator_share =
                    cooperators_at_q[market] as f64 / population_at_q[market] as f64;
                if self.social_rng.unit()
                    < self
                        .config
                        .mimic_probability(cell.consciousness, cooperator_share)
                {
                    mimic_costs[index] = self.config.mimic_cost(cell.consciousness);
                    Persona::Cooperative
                } else {
                    Persona::Defective
                }
            };
            let market = cell.species.slot() * grades + q;
            match_groups[market * Persona::COUNT + persona.slot()].push(index);
        }

        let living_indices = current
            .iter()
            .enumerate()
            .filter_map(|(index, cell)| cell.map(|_| index))
            .collect::<Vec<_>>();
        let mut living_by_species = vec![Vec::<usize>::new(); Species::COUNT];
        for &index in &living_indices {
            let cell = current[index].expect("living index");
            living_by_species[cell.species.slot()].push(index);
        }
        let mut interactions = Vec::<(usize, usize)>::new();
        let mut singleton_markets = vec![Vec::<usize>::new(); Species::COUNT];
        for (group_index, group) in match_groups.iter_mut().enumerate() {
            let species_slot = group_index / (grades * Persona::COUNT);
            self.shuffle(group);
            match group.len() {
                0 => {}
                1 => singleton_markets[species_slot].push(group[0]),
                length if length % 2 == 0 => {
                    interactions.extend(group.chunks_exact(2).map(|pair| (pair[0], pair[1])));
                }
                length => {
                    let paired_length = length - 1;
                    interactions.extend(
                        group[..paired_length]
                            .chunks_exact(2)
                            .map(|pair| (pair[0], pair[1])),
                    );
                    singleton_markets[species_slot].push(group[length - 1]);
                }
            }
        }

        // The paper falls back to random population matching when a persona market
        // is empty. Pairing the remainders together gives every rare mutant a match
        // without making all members of an odd market play twice.
        for species_slot in 0..Species::COUNT {
            let mut remainders = std::mem::take(&mut singleton_markets[species_slot]);
            self.shuffle(&mut remainders);
            interactions.extend(remainders.chunks_exact(2).map(|pair| (pair[0], pair[1])));
            if remainders.len() % 2 == 1
                && living_by_species[species_slot].len() > 1
                && let Some(&singleton) = remainders.last()
            {
                let candidates = &living_by_species[species_slot];
                let mut partner = candidates[self.social_rng.index(candidates.len())];
                while partner == singleton {
                    partner = candidates[self.social_rng.index(candidates.len())];
                }
                interactions.push((singleton, partner));
            }
        }

        let mut cooperator_matches = 0;
        let mut cooperator_partnered = 0;
        for (left, right) in interactions {
            debug_assert_ne!(left, right);
            let left_cell = current[left].expect("matched cell must be alive");
            let right_cell = current[right].expect("matched cell must be alive");
            payoff_sums[left] += self
                .config
                .game
                .payoff(left_cell.economic_type, right_cell.economic_type);
            payoff_sums[right] += self
                .config
                .game
                .payoff(right_cell.economic_type, left_cell.economic_type);
            interaction_counts[left] += 1;
            interaction_counts[right] += 1;

            if left_cell.economic_type == EconomicType::Cooperator {
                cooperator_partnered += 1;
                cooperator_matches +=
                    usize::from(right_cell.economic_type == EconomicType::Cooperator);
            }
            if right_cell.economic_type == EconomicType::Cooperator {
                cooperator_partnered += 1;
                cooperator_matches +=
                    usize::from(left_cell.economic_type == EconomicType::Cooperator);
            }

            remember_partner_type(&mut partner_types[left], left_cell, right_cell);
            remember_partner_type(&mut partner_types[right], right_cell, left_cell);
        }
        debug_assert!(
            living_indices.len() <= 1
                || living_indices.iter().all(|index| {
                    let species = current[*index].expect("living cell").species;
                    living_by_species[species.slot()].len() == 1 || interaction_counts[*index] > 0
                })
        );

        let mut assessments = vec![Assessment::default(); size];
        let mut total_fitness = 0.0;
        let mut evaluated = 0;
        let mut good = 0;
        let mut evil = 0;
        let mut prey_good = 0;
        let mut prey_evil = 0;
        let mut predator_good = 0;
        let mut predator_evil = 0;
        let mut neutral = 0;
        let mut felt = 0;
        let mut silent = 0;

        for index in 0..size {
            let Some(cell) = current[index] else {
                continue;
            };
            let neighbors = self.neighbors(index);
            let living_neighbors = neighbors
                .iter()
                .filter(|neighbor| current[**neighbor].is_some())
                .count() as u8;
            let cooperative_neighbors = neighbors
                .iter()
                .filter(|neighbor| {
                    current[**neighbor].is_some_and(|candidate| {
                        candidate.species == cell.species
                            && candidate.economic_type == EconomicType::Cooperator
                    })
                })
                .count() as u8;
            let partner_type = partner_types[index];
            let payoff = if interaction_counts[index] == 0 {
                0.0
            } else {
                payoff_sums[index] / interaction_counts[index] as f64
            };
            let biological_cost = self.config.biological_cost(cell.consciousness);
            let fitness = payoff - mimic_costs[index] - biological_cost;
            let ethical_signal = match (cell.economic_type, partner_type) {
                (EconomicType::Cooperator, Some(_)) => 1,
                (EconomicType::Defector, Some(EconomicType::Cooperator)) => -1,
                _ => 0,
            };
            let experience_level = subjective_level(
                cell.consciousness,
                ethical_signal,
                cooperative_neighbors,
                living_neighbors,
            );
            let voice = moral_voice(cell.consciousness, ethical_signal);
            match voice {
                MoralVoice::Good => {
                    good += 1;
                    match cell.species {
                        Species::Prey => prey_good += 1,
                        Species::Predator => predator_good += 1,
                    }
                }
                MoralVoice::Evil => {
                    evil += 1;
                    match cell.species {
                        Species::Prey => prey_evil += 1,
                        Species::Predator => predator_evil += 1,
                    }
                }
                MoralVoice::Neutral => neutral += 1,
                MoralVoice::Felt => felt += 1,
                MoralVoice::Silent => silent += 1,
            }
            assessments[index] = Assessment {
                cognitive_state: CognitiveState {
                    living_neighbors,
                    cooperative_neighbors,
                    partner_type,
                    action: cell.economic_type,
                },
                experience_level,
                voice,
                economic_payoff: payoff,
                mimic_cost: mimic_costs[index],
                biological_cost,
                fitness,
            };
            total_fitness += fitness;
            evaluated += 1;
        }

        let voice = current
            .iter()
            .enumerate()
            .filter_map(|(index, cell)| cell.map(|cell| (index, cell)))
            .max_by_key(|(index, cell)| {
                (
                    matches!(
                        assessments[*index].voice,
                        MoralVoice::Good | MoralVoice::Evil
                    ),
                    cell.consciousness,
                    cell.age,
                    usize::MAX - *index,
                )
            })
            .map(|(index, cell)| {
                let assessment = assessments[index];
                let (x, y) = self.coordinates(index);
                VoiceReport {
                    x,
                    y,
                    species: cell.species,
                    economic_type: cell.economic_type,
                    consciousness: cell.consciousness,
                    experience_level: assessment.experience_level,
                    moral_voice: assessment.voice,
                    utterance: utterance(cell.species, assessment.voice),
                }
            });

        let mut next = if self.config.predator_prey_ecology {
            current.clone()
        } else {
            vec![None; size]
        };
        let mut births = 0;
        let mut deaths = 0;
        let mut prey_births = 0;
        let mut predator_births = 0;
        let mut prey_deaths = 0;
        let mut predator_deaths = 0;
        let mut captures = 0;
        let mut events = vec![0_u8; size];

        if !self.config.predator_prey_ecology {
            for index in 0..size {
                let neighbors = self.neighbors(index);
                let mut living = [0_usize; 8];
                let mut living_count = 0;
                for neighbor in neighbors {
                    if current[neighbor].is_some() {
                        living[living_count] = neighbor;
                        living_count += 1;
                    }
                }
                match current[index] {
                    Some(mut cell) if living_count == 2 || living_count == 3 => {
                        cell.age = cell.age.saturating_add(1);
                        next[index] = Some(cell);
                    }
                    Some(cell) => {
                        events[index] = 3;
                        deaths += 1;
                        match cell.species {
                            Species::Prey => prey_deaths += 1,
                            Species::Predator => predator_deaths += 1,
                        }
                    }
                    None if living_count == 3 => {
                        let parent_index =
                            self.select_parent(&living[..living_count], &assessments);
                        let parent = current[parent_index].expect("birth parent");
                        let child = self.mutated_child(parent);
                        match child.species {
                            Species::Prey => prey_births += 1,
                            Species::Predator => predator_births += 1,
                        }
                        next[index] = Some(child);
                        events[index] = 1;
                        births += 1;
                    }
                    None => {}
                }
            }
        } else {
            // A synchronous spatial contact process on Conway's torus. Every
            // transition reads the same snapshot, so each site changes at most
            // once per generation and all flows have an exact accounting.
            for index in 0..size {
                let neighbors = self.neighbors(index);
                let prey = neighbors
                    .iter()
                    .copied()
                    .filter(|neighbor| {
                        current[*neighbor].is_some_and(|cell| cell.species == Species::Prey)
                    })
                    .collect::<Vec<_>>();
                let predators = neighbors
                    .iter()
                    .copied()
                    .filter(|neighbor| {
                        current[*neighbor].is_some_and(|cell| cell.species == Species::Predator)
                    })
                    .collect::<Vec<_>>();

                match current[index] {
                    None if !prey.is_empty() => {
                        let probability =
                            contact_probability(self.config.prey_birth_rate, prey.len());
                        if self.ecology_rng.unit() < probability {
                            let parent_index = self.select_parent(&prey, &assessments);
                            let parent = current[parent_index].expect("prey parent");
                            next[index] = Some(self.mutated_child(parent));
                            events[index] = 1;
                            births += 1;
                            prey_births += 1;
                        }
                    }
                    Some(cell) if cell.species == Species::Prey && !predators.is_empty() => {
                        let probability =
                            contact_probability(self.config.predation_rate, predators.len());
                        if self.ecology_rng.unit() < probability {
                            let parent_index = self.select_parent(&predators, &assessments);
                            let parent = current[parent_index].expect("predator parent");
                            next[index] = Some(self.mutated_child(parent));
                            events[index] = 2;
                            births += 1;
                            deaths += 1;
                            predator_births += 1;
                            prey_deaths += 1;
                            captures += 1;
                        } else {
                            let mut survivor = cell;
                            survivor.age = survivor.age.saturating_add(1);
                            next[index] = Some(survivor);
                        }
                    }
                    Some(cell) if cell.species == Species::Predator => {
                        if self.ecology_rng.unit() < self.config.predator_starvation_rate {
                            next[index] = None;
                            events[index] = 3;
                            deaths += 1;
                            predator_deaths += 1;
                        } else {
                            let mut survivor = cell;
                            survivor.age = survivor.age.saturating_add(1);
                            next[index] = Some(survivor);
                        }
                    }
                    Some(mut cell) => {
                        cell.age = cell.age.saturating_add(1);
                        next[index] = Some(cell);
                    }
                    None => {}
                }
            }
        }

        let survivors = before.alive.saturating_sub(deaths);
        let changed_sites = current
            .iter()
            .zip(&next)
            .filter(|(before_cell, after_cell)| {
                visible_cell_state(**before_cell) != visible_cell_state(**after_cell)
            })
            .count();

        self.grid = next;
        self.events = events;
        let from_tick = self.tick;
        self.tick += 1;
        let after = self.population_summary();
        StepReport {
            from_tick,
            tick: self.tick,
            before,
            after,
            mean_fitness: if evaluated == 0 {
                0.0
            } else {
                total_fitness / evaluated as f64
            },
            births,
            deaths,
            survivors,
            prey_births,
            predator_births,
            prey_deaths,
            predator_deaths,
            captures,
            changed_sites,
            cooperative_match_rate: if cooperator_partnered == 0 {
                0.0
            } else {
                cooperator_matches as f64 / cooperator_partnered as f64
            },
            good,
            evil,
            prey_good,
            prey_evil,
            predator_good,
            predator_evil,
            neutral,
            felt,
            silent,
            voice,
        }
    }

    fn select_parent(&mut self, parents: &[usize], assessments: &[Assessment]) -> usize {
        debug_assert!(!parents.is_empty());
        let max_fitness = parents
            .iter()
            .map(|parent| assessments[*parent].fitness)
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
        let mut draw = self.social_rng.unit() * total;
        for (slot, parent) in parents.iter().copied().enumerate() {
            if draw <= weights[slot] {
                return parent;
            }
            draw -= weights[slot];
        }
        parents[parents.len() - 1]
    }

    fn mutated_child(&mut self, parent: Cell) -> Cell {
        let mut economic_type = parent.economic_type;
        if self.social_rng.unit() < self.config.economic_mutation_rate {
            economic_type = economic_type.flipped();
        }
        let mut consciousness = parent.consciousness;
        if self.social_rng.unit() < self.config.consciousness_mutation_rate {
            if consciousness == 0 {
                consciousness = 1;
            } else if consciousness == self.config.max_consciousness || self.social_rng.unit() < 0.5
            {
                consciousness -= 1;
            } else {
                consciousness += 1;
            }
        }
        Cell::new_species(parent.species, economic_type, consciousness)
    }

    fn population_summary(&self) -> PopulationStats {
        let mut alive = 0;
        let mut prey = 0;
        let mut predators = 0;
        let mut cooperators = 0;
        let mut prey_cooperators = 0;
        let mut predator_cooperators = 0;
        let mut max_q = 0;
        let mut total_q = 0;
        let mut histogram = vec![0; usize::from(self.config.max_consciousness) + 1];
        for cell in self.grid.iter().flatten() {
            alive += 1;
            let is_cooperator = cell.economic_type == EconomicType::Cooperator;
            cooperators += usize::from(is_cooperator);
            match cell.species {
                Species::Prey => {
                    prey += 1;
                    prey_cooperators += usize::from(is_cooperator);
                }
                Species::Predator => {
                    predators += 1;
                    predator_cooperators += usize::from(is_cooperator);
                }
            }
            max_q = max_q.max(cell.consciousness);
            total_q += usize::from(cell.consciousness);
            histogram[usize::from(cell.consciousness)] += 1;
        }
        PopulationStats {
            alive,
            prey,
            predators,
            cooperators,
            defectors: alive - cooperators,
            prey_cooperators,
            predator_cooperators,
            mean_consciousness: if alive == 0 {
                0.0
            } else {
                total_q as f64 / alive as f64
            },
            max_consciousness: max_q,
            consciousness_histogram: histogram,
        }
    }

    pub fn render(&self) -> String {
        let mut output = String::with_capacity((self.config.width + 1) * self.config.height);
        for y in 0..self.config.height {
            for x in 0..self.config.width {
                let glyph = match self.cell(x, y) {
                    None => ' ',
                    Some(Cell {
                        species: Species::Prey,
                        economic_type: EconomicType::Cooperator,
                        consciousness: 0,
                        ..
                    }) => 'o',
                    Some(Cell {
                        species: Species::Prey,
                        economic_type: EconomicType::Cooperator,
                        ..
                    }) => 'O',
                    Some(Cell {
                        species: Species::Prey,
                        economic_type: EconomicType::Defector,
                        consciousness: 0,
                        ..
                    }) => 'x',
                    Some(Cell {
                        species: Species::Prey,
                        economic_type: EconomicType::Defector,
                        ..
                    }) => 'X',
                    Some(Cell {
                        species: Species::Predator,
                        economic_type: EconomicType::Cooperator,
                        consciousness: 0,
                        ..
                    }) => 'v',
                    Some(Cell {
                        species: Species::Predator,
                        economic_type: EconomicType::Cooperator,
                        ..
                    }) => 'V',
                    Some(Cell {
                        species: Species::Predator,
                        economic_type: EconomicType::Defector,
                        consciousness: 0,
                        ..
                    }) => 'w',
                    Some(Cell {
                        species: Species::Predator,
                        economic_type: EconomicType::Defector,
                        ..
                    }) => 'W',
                };
                output.push(glyph);
            }
            output.push('\n');
        }
        output
    }
}

fn visible_cell_state(cell: Option<Cell>) -> Option<(Species, EconomicType, u8)> {
    cell.map(|cell| (cell.species, cell.economic_type, cell.consciousness))
}

fn contact_probability(rate: f64, neighbors: usize) -> f64 {
    1.0 - (1.0 - rate).powi(neighbors.min(i32::MAX as usize) as i32)
}

fn remember_partner_type(slot: &mut Option<EconomicType>, focal: Cell, partner: Cell) {
    debug_assert_eq!(focal.species, partner.species);
    let exploitation_is_more_salient = focal.economic_type == EconomicType::Defector
        && partner.economic_type == EconomicType::Cooperator;
    if slot.is_none() || exploitation_is_more_salient {
        *slot = Some(partner.economic_type);
    }
}

pub fn moral_voice(q: u8, ethical_signal: i8) -> MoralVoice {
    match (q, ethical_signal.cmp(&0)) {
        (0, _) => MoralVoice::Silent,
        (1, std::cmp::Ordering::Equal) => MoralVoice::Neutral,
        (1, _) => MoralVoice::Felt,
        (_, std::cmp::Ordering::Greater) => MoralVoice::Good,
        (_, std::cmp::Ordering::Less) => MoralVoice::Evil,
        (_, std::cmp::Ordering::Equal) => MoralVoice::Neutral,
    }
}

pub fn subjective_level(
    q: u8,
    ethical_signal: i8,
    cooperative_neighbors: u8,
    living_neighbors: u8,
) -> u8 {
    if q == 0 || ethical_signal == 0 {
        return 0;
    }
    if q == 1 {
        return 1;
    }
    let negative_levels = (q / 2).max(1);
    let positive_levels = q - negative_levels;
    let context = if living_neighbors == 0 {
        0.0
    } else {
        f64::from(cooperative_neighbors) / f64::from(living_neighbors)
    };
    if ethical_signal < 0 {
        1 + ((context * f64::from(negative_levels - 1)).round() as u8).min(negative_levels - 1)
    } else {
        negative_levels
            + 1
            + ((context * f64::from(positive_levels - 1)).round() as u8).min(positive_levels - 1)
    }
}

pub fn utterance(species: Species, voice: MoralVoice) -> &'static str {
    match (species, voice) {
        (_, MoralVoice::Silent) => "...",
        (_, MoralVoice::Felt) => "Something mattered, but I cannot yet separate good from evil.",
        (Species::Prey, MoralVoice::Good) => "Good: I shared a warning another prey could use.",
        (Species::Prey, MoralVoice::Evil) => {
            "Evil: I used another prey's warning without contributing."
        }
        (Species::Predator, MoralVoice::Good) => "Good: I contributed to the pack.",
        (Species::Predator, MoralVoice::Evil) => {
            "Evil: I took the pack's gain without contributing."
        }
        (_, MoralVoice::Neutral) => "Neither: no cooperative act occurred in this encounter.",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn small_config() -> Config {
        Config {
            width: 7,
            height: 7,
            initial_density: 0.0,
            initial_cooperator_share: 1.0,
            initial_conscious_share: 0.0,
            initial_predator_share: 0.0,
            predator_prey_ecology: false,
            economic_mutation_rate: 0.0,
            consciousness_mutation_rate: 0.0,
            ..Config::default()
        }
    }

    #[test]
    fn default_game_is_a_decreasing_differences_prisoners_dilemma() {
        let game = PrisonersDilemma::default();
        assert!(game.validate().is_ok());
        assert!(game.has_decreasing_differences());
        assert_eq!(game.benefit_of_cooperator_for(EconomicType::Defector), 4.0);
        assert_eq!(
            game.benefit_of_cooperator_for(EconomicType::Cooperator),
            3.0
        );
    }

    #[test]
    fn production_payoff_does_not_depend_on_consciousness() {
        let game = PrisonersDilemma::default();
        for focal in [EconomicType::Cooperator, EconomicType::Defector] {
            for partner in [EconomicType::Cooperator, EconomicType::Defector] {
                let payoff_at_q_zero = game.payoff(focal, partner);
                let payoff_at_q_eight = game.payoff(focal, partner);
                assert_eq!(payoff_at_q_zero, payoff_at_q_eight);
            }
        }
    }

    #[test]
    fn consciousness_zero_collapses_every_state_to_null() {
        for signal in [-1, 0, 1] {
            assert_eq!(subjective_level(0, signal, 7, 8), 0);
            assert_eq!(moral_voice(0, signal), MoralVoice::Silent);
        }
    }

    #[test]
    fn q_two_can_say_good_and_evil() {
        assert_eq!(subjective_level(2, -1, 1, 3), 1);
        assert_eq!(subjective_level(2, 1, 1, 3), 2);
        assert_eq!(moral_voice(2, -1), MoralVoice::Evil);
        assert_eq!(moral_voice(2, 1), MoralVoice::Good);
    }

    #[test]
    fn q_one_feels_salience_without_distinguishing_valence() {
        assert_eq!(subjective_level(1, -1, 1, 3), 1);
        assert_eq!(subjective_level(1, 1, 1, 3), 1);
        assert_eq!(moral_voice(1, -1), MoralVoice::Felt);
        assert_eq!(moral_voice(1, 1), MoralVoice::Felt);
        assert_eq!(moral_voice(1, 0), MoralVoice::Neutral);
    }

    #[test]
    fn contact_hazards_accumulate_over_neighbors() {
        assert!((contact_probability(0.12, 0) - 0.0).abs() < 1e-12);
        assert!((contact_probability(0.12, 2) - 0.2256).abs() < 1e-12);
        assert!((contact_probability(0.06, 2) - 0.1164).abs() < 1e-12);
    }

    #[test]
    fn mimicry_gets_harder_and_biology_costlier_as_q_rises() {
        let config = Config::default();
        for q in 1..config.max_consciousness {
            assert!(config.mimic_probability(q + 1, 0.2) < config.mimic_probability(q, 0.2));
            assert!(config.biological_cost(q + 1) > config.biological_cost(q));
        }
    }

    #[test]
    fn conway_blinker_still_oscillates() {
        let mut simulation = Simulation::empty(small_config()).unwrap();
        for y in 2..=4 {
            simulation.set_cell(3, y, Some(Cell::new(EconomicType::Cooperator, 0)));
        }
        simulation.step();
        assert!(simulation.cell(2, 3).is_some());
        assert!(simulation.cell(3, 3).is_some());
        assert!(simulation.cell(4, 3).is_some());
        assert!(simulation.cell(3, 2).is_none());
        assert!(simulation.cell(3, 4).is_none());
        simulation.step();
        assert!(simulation.cell(3, 2).is_some());
        assert!(simulation.cell(3, 3).is_some());
        assert!(simulation.cell(3, 4).is_some());
    }

    #[test]
    fn births_inherit_traits_without_mutation() {
        let mut simulation = Simulation::empty(small_config()).unwrap();
        for y in 2..=4 {
            simulation.set_cell(3, y, Some(Cell::new(EconomicType::Cooperator, 2)));
        }
        simulation.step();
        assert_eq!(
            simulation.cell(2, 3).unwrap().economic_type,
            EconomicType::Cooperator
        );
        assert_eq!(simulation.cell(2, 3).unwrap().consciousness, 2);
    }

    #[test]
    fn singleton_conscious_market_uses_population_fallback() {
        let mut simulation = Simulation::empty(small_config()).unwrap();
        simulation.set_cell(2, 3, Some(Cell::new(EconomicType::Defector, 0)));
        simulation.set_cell(3, 3, Some(Cell::new(EconomicType::Cooperator, 2)));
        simulation.set_cell(4, 3, Some(Cell::new(EconomicType::Defector, 0)));

        let report = simulation.step();
        let voice = report
            .voice
            .expect("the q=2 singleton should receive a fallback match");
        assert_eq!(voice.consciousness, 2);
        assert_eq!(voice.moral_voice, MoralVoice::Good);
        assert_eq!(
            report.before.alive - report.deaths + report.births,
            report.after.alive
        );
    }

    #[test]
    fn social_matching_never_crosses_species() {
        let mut simulation = Simulation::empty(small_config()).unwrap();
        simulation.set_cell(1, 1, Some(Cell::new(EconomicType::Cooperator, 2)));
        simulation.set_cell(
            5,
            5,
            Some(Cell::new_species(
                Species::Predator,
                EconomicType::Defector,
                2,
            )),
        );

        let report = simulation.step();
        assert_eq!(report.good, 0);
        assert_eq!(report.evil, 0);
    }

    #[test]
    fn predator_society_can_report_good_and_evil_without_moralizing_predation() {
        let mut simulation = Simulation::empty(small_config()).unwrap();
        simulation.set_cell(
            2,
            3,
            Some(Cell::new_species(
                Species::Predator,
                EconomicType::Cooperator,
                2,
            )),
        );
        simulation.set_cell(
            4,
            3,
            Some(Cell::new_species(
                Species::Predator,
                EconomicType::Defector,
                2,
            )),
        );

        let report = simulation.step();
        assert_eq!(report.predator_good, 1);
        assert_eq!(report.predator_evil, 1);
        assert_eq!(report.prey_good, 0);
        assert_eq!(report.prey_evil, 0);
    }

    #[test]
    fn packed_cells_encode_species_strategy_and_q_separately() {
        let mut simulation = Simulation::empty(small_config()).unwrap();
        simulation.set_cell(0, 0, Some(Cell::new(EconomicType::Cooperator, 3)));
        simulation.set_cell(1, 0, Some(Cell::new(EconomicType::Defector, 3)));
        simulation.set_cell(
            2,
            0,
            Some(Cell::new_species(
                Species::Predator,
                EconomicType::Cooperator,
                3,
            )),
        );
        simulation.set_cell(
            3,
            0,
            Some(Cell::new_species(
                Species::Predator,
                EconomicType::Defector,
                3,
            )),
        );

        let cells = simulation.packed_cells();
        assert_eq!(cells[0], 0x83);
        assert_eq!(cells[1], 0xc3);
        assert_eq!(cells[2], 0xa3);
        assert_eq!(cells[3], 0xe3);
    }

    #[test]
    fn predator_prey_accounting_is_exact() {
        let config = Config {
            width: 32,
            height: 24,
            seed: 19,
            ..Config::default()
        };
        let mut simulation = Simulation::random(config).unwrap();
        for _ in 0..200 {
            let report = simulation.step();
            assert_eq!(
                report.after.prey + report.captures,
                report.before.prey + report.prey_births
            );
            assert_eq!(
                report.after.predators + report.predator_deaths,
                report.before.predators + report.captures
            );
            assert_eq!(
                report.after.alive + report.deaths,
                report.before.alive + report.births
            );
            assert_eq!(
                report.changed_sites,
                report.prey_births + report.captures + report.predator_deaths
            );
        }
    }

    #[test]
    fn calibrated_ecology_stays_active_with_both_species() {
        for seed in 1..=3 {
            let config = Config {
                width: 32,
                height: 24,
                seed,
                ..Config::default()
            };
            let size = config.width * config.height;
            let mut simulation = Simulation::random(config).unwrap();
            let mut activity = 0;
            for _ in 0..600 {
                activity += simulation.step().changed_sites;
            }
            let population = simulation.population();
            assert!(population.prey > 0, "prey vanished for seed {seed}");
            assert!(
                population.predators > 0,
                "predators vanished for seed {seed}"
            );
            assert!(activity as f64 / (600 * size) as f64 > 0.05);
        }
    }

    #[test]
    fn social_parameters_do_not_change_the_ecological_path() {
        let baseline = Config {
            width: 24,
            height: 18,
            seed: 73,
            ..Config::default()
        };
        let altered = Config {
            selection_strength: 8.0,
            economic_mutation_rate: 1.0,
            consciousness_mutation_rate: 1.0,
            mimic_fixed_cost: 12.0,
            mimic_slope: 4.0,
            biological_fixed_cost: 3.0,
            biological_slope: 2.0,
            ..baseline.clone()
        };
        let mut first = Simulation::random(baseline).unwrap();
        let mut second = Simulation::random(altered).unwrap();

        for _ in 0..100 {
            first.step();
            second.step();
            for y in 0..first.config().height {
                for x in 0..first.config().width {
                    assert_eq!(
                        first.cell(x, y).map(|cell| cell.species),
                        second.cell(x, y).map(|cell| cell.species)
                    );
                }
            }
        }
    }

    #[test]
    fn seeded_runs_are_deterministic() {
        let config = Config {
            width: 32,
            height: 24,
            ..Config::default()
        };
        let mut first = Simulation::random(config.clone()).unwrap();
        let mut second = Simulation::random(config).unwrap();
        for _ in 0..20 {
            let a = first.step();
            let b = second.step();
            assert_eq!(a.after.alive, b.after.alive);
            assert_eq!(a.after.cooperators, b.after.cooperators);
            assert_eq!(
                a.after.consciousness_histogram,
                b.after.consciousness_histogram
            );
        }
        assert_eq!(first.render(), second.render());
    }

    #[test]
    fn social_selection_never_changes_conway_occupancy() {
        let baseline = Config {
            width: 24,
            height: 18,
            seed: 41,
            initial_predator_share: 0.0,
            predator_prey_ecology: false,
            selection_strength: 0.0,
            economic_mutation_rate: 0.0,
            consciousness_mutation_rate: 0.0,
            ..Config::default()
        };
        let selected = Config {
            selection_strength: 8.0,
            economic_mutation_rate: 1.0,
            consciousness_mutation_rate: 1.0,
            mimic_fixed_cost: 12.0,
            mimic_slope: 4.0,
            biological_fixed_cost: 3.0,
            biological_slope: 2.0,
            ..baseline.clone()
        };
        let mut first = Simulation::random(baseline).unwrap();
        let mut second = Simulation::random(selected).unwrap();

        for _ in 0..100 {
            first.step();
            second.step();
            for y in 0..first.config().height {
                for x in 0..first.config().width {
                    assert_eq!(first.cell(x, y).is_some(), second.cell(x, y).is_some());
                }
            }
        }
    }
}
