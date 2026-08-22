use crate::{Config, EconomicType, MoralVoice, PopulationStats, Simulation, StepReport};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ConsciousLife {
    simulation: Simulation,
    stats: PopulationStats,
    last_report: Option<StepReport>,
    first_good_generation: Option<u32>,
    first_evil_generation: Option<u32>,
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
            seed,
        })
    }

    pub fn restart(&mut self, seed: u32) -> Result<(), JsValue> {
        self.simulation = build_simulation(self.width(), self.height(), seed)?;
        self.stats = self.simulation.population();
        self.last_report = None;
        self.first_good_generation = None;
        self.first_evil_generation = None;
        self.seed = seed;
        Ok(())
    }

    pub fn step_many(&mut self, steps: u32) {
        for _ in 0..steps {
            if self.stats.alive == 0 {
                break;
            }
            let report = self.simulation.step();
            let generation = report.tick.min(u64::from(u32::MAX)) as u32;
            if report.good > 0 && self.first_good_generation.is_none() {
                self.first_good_generation = Some(generation);
            }
            if report.evil > 0 && self.first_evil_generation.is_none() {
                self.first_evil_generation = Some(generation);
            }
            self.stats = report.after.clone();
            self.last_report = Some(report);
        }
    }

    pub fn cells(&self) -> Vec<u8> {
        self.simulation.packed_cells()
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

    pub fn cooperator_share(&self) -> f64 {
        self.stats.cooperator_share()
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

    pub fn first_good_generation(&self) -> i32 {
        self.first_good_generation.map_or(-1, |value| value as i32)
    }

    pub fn first_evil_generation(&self) -> i32 {
        self.first_evil_generation.map_or(-1, |value| value as i32)
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
