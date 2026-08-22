use crate::{Config, EconomicType, MoralVoice, PopulationStats, Simulation, Species, StepReport};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ConsciousLife {
    simulation: Simulation,
    stats: PopulationStats,
    last_report: Option<StepReport>,
    first_good_generation: Option<u32>,
    first_evil_generation: Option<u32>,
    first_prey_good_generation: Option<u32>,
    first_prey_evil_generation: Option<u32>,
    first_predator_good_generation: Option<u32>,
    first_predator_evil_generation: Option<u32>,
    seed: u32,
}

#[wasm_bindgen]
impl ConsciousLife {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32, seed: u32) -> Result<ConsciousLife, JsValue> {
        let simulation = build_simulation(width, height, seed)?;
        let stats = simulation.population();
        Ok(Self {
            simulation,
            stats,
            last_report: None,
            first_good_generation: None,
            first_evil_generation: None,
            first_prey_good_generation: None,
            first_prey_evil_generation: None,
            first_predator_good_generation: None,
            first_predator_evil_generation: None,
            seed,
        })
    }

    pub fn restart(&mut self, seed: u32) -> Result<(), JsValue> {
        self.simulation = build_simulation(self.width(), self.height(), seed)?;
        self.stats = self.simulation.population();
        self.last_report = None;
        self.first_good_generation = None;
        self.first_evil_generation = None;
        self.first_prey_good_generation = None;
        self.first_prey_evil_generation = None;
        self.first_predator_good_generation = None;
        self.first_predator_evil_generation = None;
        self.seed = seed;
        Ok(())
    }

    pub fn step_many(&mut self, steps: u32) {
        for _ in 0..steps {
            if self.stats.alive == 0 {
                break;
            }
            let report = self.simulation.step();
            let generation = report.from_tick.min(u64::from(u32::MAX)) as u32;
            if report.good > 0 && self.first_good_generation.is_none() {
                self.first_good_generation = Some(generation);
            }
            if report.evil > 0 && self.first_evil_generation.is_none() {
                self.first_evil_generation = Some(generation);
            }
            if report.prey_good > 0 && self.first_prey_good_generation.is_none() {
                self.first_prey_good_generation = Some(generation);
            }
            if report.prey_evil > 0 && self.first_prey_evil_generation.is_none() {
                self.first_prey_evil_generation = Some(generation);
            }
            if report.predator_good > 0 && self.first_predator_good_generation.is_none() {
                self.first_predator_good_generation = Some(generation);
            }
            if report.predator_evil > 0 && self.first_predator_evil_generation.is_none() {
                self.first_predator_evil_generation = Some(generation);
            }
            self.stats = report.after.clone();
            self.last_report = Some(report);
        }
    }

    pub fn cells(&self) -> Vec<u8> {
        self.simulation.packed_cells()
    }

    pub fn events(&self) -> Vec<u8> {
        self.simulation.packed_events()
    }

    pub fn width(&self) -> u32 {
        self.simulation.config().width.min(u32::MAX as usize) as u32
    }

    pub fn height(&self) -> u32 {
        self.simulation.config().height.min(u32::MAX as usize) as u32
    }

    pub fn seed(&self) -> u32 {
        self.seed
    }

    pub fn generation(&self) -> u32 {
        self.simulation.tick().min(u64::from(u32::MAX)) as u32
    }

    pub fn alive(&self) -> u32 {
        self.stats.alive.min(u32::MAX as usize) as u32
    }

    pub fn prey(&self) -> u32 {
        self.stats.prey.min(u32::MAX as usize) as u32
    }

    pub fn predators(&self) -> u32 {
        self.stats.predators.min(u32::MAX as usize) as u32
    }

    pub fn empty(&self) -> u32 {
        let sites = usize::try_from(self.width())
            .unwrap_or(usize::MAX)
            .saturating_mul(usize::try_from(self.height()).unwrap_or(usize::MAX));
        sites
            .saturating_sub(self.stats.alive)
            .min(u32::MAX as usize) as u32
    }

    pub fn cooperator_share(&self) -> f64 {
        self.stats.cooperator_share()
    }

    pub fn prey_cooperator_share(&self) -> f64 {
        self.stats.prey_cooperator_share()
    }

    pub fn predator_cooperator_share(&self) -> f64 {
        self.stats.predator_cooperator_share()
    }

    pub fn mean_q(&self) -> f64 {
        self.stats.mean_consciousness
    }

    pub fn max_q(&self) -> u32 {
        u32::from(self.stats.max_consciousness)
    }

    pub fn inner_life_share(&self) -> f64 {
        share_at_or_above(&self.stats, 1)
    }

    pub fn differentiated_share(&self) -> f64 {
        share_at_or_above(&self.stats, 2)
    }

    pub fn activity_share(&self) -> f64 {
        let sites = f64::from(self.width()) * f64::from(self.height());
        if sites == 0.0 {
            0.0
        } else {
            self.last_report
                .as_ref()
                .map_or(0.0, |report| report.changed_sites as f64 / sites)
        }
    }

    pub fn prey_births(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.prey_births)
    }

    pub fn captures(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.captures)
    }

    pub fn predator_deaths(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.predator_deaths)
    }

    pub fn good_reports(&self) -> u32 {
        self.last_report
            .as_ref()
            .map_or(0, |report| report.good.min(u32::MAX as usize) as u32)
    }

    pub fn evil_reports(&self) -> u32 {
        self.last_report
            .as_ref()
            .map_or(0, |report| report.evil.min(u32::MAX as usize) as u32)
    }

    pub fn prey_good_reports(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.prey_good)
    }

    pub fn prey_evil_reports(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.prey_evil)
    }

    pub fn predator_good_reports(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.predator_good)
    }

    pub fn predator_evil_reports(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.predator_evil)
    }

    pub fn first_good_generation(&self) -> i32 {
        self.first_good_generation.map_or(-1, |value| value as i32)
    }

    pub fn first_evil_generation(&self) -> i32 {
        self.first_evil_generation.map_or(-1, |value| value as i32)
    }

    pub fn first_prey_good_generation(&self) -> i32 {
        optional_generation(self.first_prey_good_generation)
    }

    pub fn first_prey_evil_generation(&self) -> i32 {
        optional_generation(self.first_prey_evil_generation)
    }

    pub fn first_predator_good_generation(&self) -> i32 {
        optional_generation(self.first_predator_good_generation)
    }

    pub fn first_predator_evil_generation(&self) -> i32 {
        optional_generation(self.first_predator_evil_generation)
    }

    pub fn voice_code(&self) -> i32 {
        match self
            .last_report
            .as_ref()
            .and_then(|report| report.voice.as_ref())
            .map(|voice| voice.moral_voice)
        {
            Some(MoralVoice::Good) => 1,
            Some(MoralVoice::Evil) => -1,
            _ => 0,
        }
    }

    pub fn voice_text(&self) -> String {
        self.last_report
            .as_ref()
            .and_then(|report| report.voice.as_ref())
            .map_or_else(String::new, |voice| voice.utterance.to_string())
    }

    pub fn voice_x(&self) -> i32 {
        self.voice().map_or(-1, |voice| voice.x as i32)
    }

    pub fn voice_y(&self) -> i32 {
        self.voice().map_or(-1, |voice| voice.y as i32)
    }

    pub fn voice_q(&self) -> i32 {
        self.voice()
            .map_or(-1, |voice| i32::from(voice.consciousness))
    }

    pub fn voice_is_cooperator(&self) -> bool {
        self.voice()
            .is_some_and(|voice| voice.economic_type == EconomicType::Cooperator)
    }

    pub fn voice_is_predator(&self) -> bool {
        self.voice()
            .is_some_and(|voice| voice.species == Species::Predator)
    }
}

impl ConsciousLife {
    fn voice(&self) -> Option<&crate::VoiceReport> {
        self.last_report
            .as_ref()
            .and_then(|report| report.voice.as_ref())
    }
}

fn build_simulation(width: u32, height: u32, seed: u32) -> Result<Simulation, JsValue> {
    let config = Config {
        width: width as usize,
        height: height as usize,
        seed: u64::from(seed),
        ..Config::default()
    };
    Simulation::random(config).map_err(|error| JsValue::from_str(&error))
}

fn share_at_or_above(stats: &PopulationStats, minimum_q: usize) -> f64 {
    if stats.alive == 0 {
        return 0.0;
    }
    let count = stats
        .consciousness_histogram
        .iter()
        .enumerate()
        .filter(|(q, _)| *q >= minimum_q)
        .map(|(_, count)| count)
        .sum::<usize>();
    count as f64 / stats.alive as f64
}

fn report_count(report: Option<&StepReport>, select: impl FnOnce(&StepReport) -> usize) -> u32 {
    report.map_or(0, |value| select(value).min(u32::MAX as usize) as u32)
}

fn optional_generation(generation: Option<u32>) -> i32 {
    generation.map_or(-1, |value| value.min(i32::MAX as u32) as i32)
}
