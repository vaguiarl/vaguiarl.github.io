use crate::{Config, Environment, PopulationStats, Simulation, StepReport};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct MoralLife {
    simulation: Simulation,
    stats: PopulationStats,
    last_report: Option<StepReport>,
    seed: u32,
    exploitation_ewma: f64,
    peak_exploitation: f64,
    peak_generation: Option<u32>,
    first_exploitation: Option<u32>,
    first_moral_response: Option<u32>,
    first_sanction: Option<u32>,
    first_recovery: Option<u32>,
    recovery_streak: u32,
    cumulative_exploitations: u64,
    cumulative_true_sanctions: u64,
    cumulative_false_sanctions: u64,
    cumulative_forgiveness: u64,
}

#[wasm_bindgen]
impl MoralLife {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32, seed: u32) -> Result<MoralLife, JsValue> {
        let simulation = build_simulation(width, height, seed, Environment::Public)?;
        let stats = simulation.population();
        Ok(Self {
            simulation,
            stats,
            last_report: None,
            seed,
            exploitation_ewma: 0.0,
            peak_exploitation: 0.0,
            peak_generation: None,
            first_exploitation: None,
            first_moral_response: None,
            first_sanction: None,
            first_recovery: None,
            recovery_streak: 0,
            cumulative_exploitations: 0,
            cumulative_true_sanctions: 0,
            cumulative_false_sanctions: 0,
            cumulative_forgiveness: 0,
        })
    }

    pub fn restart(&mut self, seed: u32) -> Result<(), JsValue> {
        let environment = self.simulation.config().environment;
        self.simulation = build_simulation(self.width(), self.height(), seed, environment)?;
        self.stats = self.simulation.population();
        self.last_report = None;
        self.seed = seed;
        self.exploitation_ewma = 0.0;
        self.peak_exploitation = 0.0;
        self.peak_generation = None;
        self.first_exploitation = None;
        self.first_moral_response = None;
        self.first_sanction = None;
        self.first_recovery = None;
        self.recovery_streak = 0;
        self.cumulative_exploitations = 0;
        self.cumulative_true_sanctions = 0;
        self.cumulative_false_sanctions = 0;
        self.cumulative_forgiveness = 0;
        Ok(())
    }

    pub fn step_many(&mut self, steps: u32) {
        for _ in 0..steps {
            if self.stats.alive == 0 {
                break;
            }
            let report = self.simulation.step();
            self.record_report(&report);
            self.stats = report.after.clone();
            self.last_report = Some(report);
        }
    }

    pub fn set_environment(&mut self, code: u8) {
        self.simulation
            .set_environment(Environment::from_code(code));
        self.stats = self.simulation.population();
        self.last_report = None;
    }

    pub fn environment(&self) -> u8 {
        self.simulation.config().environment as u8
    }

    pub fn introduce_exploiters(&mut self, share: f64) -> u32 {
        let introduced = self.simulation.introduce_exploiters(share);
        self.stats = self.simulation.population();
        introduced.min(u32::MAX as usize) as u32
    }

    pub fn cells(&self) -> Vec<u8> {
        self.simulation.packed_cells()
    }

    pub fn reputations(&self) -> Vec<i8> {
        self.simulation.reputations()
    }

    pub fn acts(&self) -> Vec<u8> {
        self.simulation.acts().to_vec()
    }

    pub fn social_events(&self) -> Vec<u8> {
        self.simulation.social_events().to_vec()
    }

    pub fn ecology_events(&self) -> Vec<u8> {
        self.simulation.ecology_events().to_vec()
    }

    pub fn edges(&self) -> Vec<u16> {
        self.simulation
            .edges()
            .iter()
            .take(260)
            .flat_map(|edge| {
                [
                    edge.left.min(u16::MAX as usize) as u16,
                    edge.right.min(u16::MAX as usize) as u16,
                    u16::from(edge.kind),
                ]
            })
            .collect()
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
        count(self.stats.alive)
    }

    pub fn empty(&self) -> u32 {
        let sites = usize::try_from(self.width())
            .unwrap_or(usize::MAX)
            .saturating_mul(usize::try_from(self.height()).unwrap_or(usize::MAX));
        count(sites.saturating_sub(self.stats.alive))
    }

    pub fn open_hand_share(&self) -> f64 {
        self.stats.share(self.stats.open_hands)
    }

    pub fn exploiter_share(&self) -> f64 {
        self.stats.share(self.stats.exploiters)
    }

    pub fn conditional_share(&self) -> f64 {
        self.stats.share(self.stats.conditionals)
    }

    pub fn enforcer_share(&self) -> f64 {
        self.stats.share(self.stats.enforcers)
    }

    pub fn institution_share(&self) -> f64 {
        self.stats.share(self.stats.active_institutions)
    }

    pub fn capacity_share(&self) -> f64 {
        self.stats.share(self.stats.moral_capacity)
    }

    pub fn bad_reputation_share(&self) -> f64 {
        self.stats.share(self.stats.bad_reputations)
    }

    pub fn mean_q(&self) -> f64 {
        self.stats.mean_q
    }

    pub fn mean_reputation(&self) -> f64 {
        self.stats.mean_reputation
    }

    pub fn cooperation_rate(&self) -> f64 {
        self.last_report
            .as_ref()
            .map_or(0.0, StepReport::cooperation_rate)
    }

    pub fn exploitation_rate(&self) -> f64 {
        self.last_report
            .as_ref()
            .map_or(0.0, StepReport::exploitation_rate)
    }

    pub fn exploitation_ewma(&self) -> f64 {
        self.exploitation_ewma
    }

    pub fn refusal_rate(&self) -> f64 {
        self.last_report
            .as_ref()
            .map_or(0.0, StepReport::refusal_rate)
    }

    pub fn sanction_coverage(&self) -> f64 {
        self.last_report
            .as_ref()
            .map_or(0.0, StepReport::sanction_coverage)
    }

    pub fn observation_accuracy(&self) -> f64 {
        self.last_report
            .as_ref()
            .map_or(0.0, StepReport::observation_accuracy)
    }

    pub fn observations(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.observations)
    }

    pub fn mean_welfare(&self) -> f64 {
        self.last_report
            .as_ref()
            .map_or(0.0, |report| report.mean_welfare)
    }

    pub fn net_exploit_advantage(&self) -> f64 {
        self.last_report
            .as_ref()
            .map_or(0.0, |report| report.net_exploit_advantage)
    }

    pub fn true_sanctions(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.true_sanctions)
    }

    pub fn false_sanctions(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.false_sanctions)
    }

    pub fn forgiveness_events(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| {
            report.forgiveness_events
        })
    }

    pub fn matches(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.matches)
    }

    pub fn births(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.births)
    }

    pub fn deaths(&self) -> u32 {
        report_count(self.last_report.as_ref(), |report| report.deaths)
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

    pub fn peak_exploitation(&self) -> f64 {
        self.peak_exploitation
    }

    pub fn peak_generation(&self) -> i32 {
        optional_generation(self.peak_generation)
    }

    pub fn first_exploitation_generation(&self) -> i32 {
        optional_generation(self.first_exploitation)
    }

    pub fn first_moral_response_generation(&self) -> i32 {
        optional_generation(self.first_moral_response)
    }

    pub fn first_sanction_generation(&self) -> i32 {
        optional_generation(self.first_sanction)
    }

    pub fn first_recovery_generation(&self) -> i32 {
        optional_generation(self.first_recovery)
    }

    pub fn cumulative_exploitations(&self) -> f64 {
        self.cumulative_exploitations as f64
    }

    pub fn cumulative_true_sanctions(&self) -> f64 {
        self.cumulative_true_sanctions as f64
    }

    pub fn cumulative_false_sanctions(&self) -> f64 {
        self.cumulative_false_sanctions as f64
    }

    pub fn cumulative_forgiveness(&self) -> f64 {
        self.cumulative_forgiveness as f64
    }
}

impl MoralLife {
    fn record_report(&mut self, report: &StepReport) {
        let generation = report.tick.min(u64::from(u32::MAX)) as u32;
        let exploitation = report.exploitation_rate();
        let cooperation = report.cooperation_rate();
        self.exploitation_ewma = if report.tick == 1 {
            exploitation
        } else {
            0.94 * self.exploitation_ewma + 0.06 * exploitation
        };
        if exploitation > self.peak_exploitation {
            self.peak_exploitation = exploitation;
            self.peak_generation = Some(generation);
            self.recovery_streak = 0;
        }
        if report.exploitations > 0 && self.first_exploitation.is_none() {
            self.first_exploitation = Some(generation);
        }
        if self.first_exploitation.is_some()
            && (report.refusals > 0 || report.true_sanctions > 0)
            && self.first_moral_response.is_none()
        {
            self.first_moral_response = Some(generation);
        }
        if report.true_sanctions + report.false_sanctions > 0 && self.first_sanction.is_none() {
            self.first_sanction = Some(generation);
        }
        if self.peak_exploitation >= 0.08
            && exploitation <= self.peak_exploitation * 0.5
            && cooperation >= 0.55
        {
            self.recovery_streak = self.recovery_streak.saturating_add(1);
            if self.recovery_streak >= 16 && self.first_recovery.is_none() {
                self.first_recovery = Some(generation);
            }
        } else {
            self.recovery_streak = 0;
        }
        self.cumulative_exploitations = self
            .cumulative_exploitations
            .saturating_add(report.exploitations as u64);
        self.cumulative_true_sanctions = self
            .cumulative_true_sanctions
            .saturating_add(report.true_sanctions as u64);
        self.cumulative_false_sanctions = self
            .cumulative_false_sanctions
            .saturating_add(report.false_sanctions as u64);
        self.cumulative_forgiveness = self
            .cumulative_forgiveness
            .saturating_add(report.forgiveness_events as u64);
    }
}

fn build_simulation(
    width: u32,
    height: u32,
    seed: u32,
    environment: Environment,
) -> Result<Simulation, JsValue> {
    let sites = u64::from(width).saturating_mul(u64::from(height));
    if sites > u64::from(u16::MAX) {
        return Err(JsValue::from_str(
            "the browser world supports at most 65,535 sites",
        ));
    }
    Simulation::random(Config {
        width: width as usize,
        height: height as usize,
        seed: u64::from(seed),
        environment,
        ..Config::default()
    })
    .map_err(|error| JsValue::from_str(&error))
}

fn count(value: usize) -> u32 {
    value.min(u32::MAX as usize) as u32
}

fn report_count(report: Option<&StepReport>, select: impl FnOnce(&StepReport) -> usize) -> u32 {
    report.map_or(0, |value| count(select(value)))
}

fn optional_generation(value: Option<u32>) -> i32 {
    value.map_or(-1, |generation| generation.min(i32::MAX as u32) as i32)
}
