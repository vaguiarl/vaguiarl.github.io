use conscious_life::{Config, Simulation, StepReport};
use std::env;
use std::fs::File;
use std::io::{BufWriter, Write};
use std::path::PathBuf;

#[derive(Debug)]
struct RunOptions {
    config: Config,
    steps: u64,
    summary_every: u64,
    render_every: u64,
    voice_every: u64,
    csv: Option<PathBuf>,
}

impl Default for RunOptions {
    fn default() -> Self {
        Self {
            config: Config::default(),
            steps: 500,
            summary_every: 10,
            render_every: 0,
            voice_every: 25,
            csv: None,
        }
    }
}

fn main() {
    if let Err(error) = run() {
        eprintln!("error: {error}");
        std::process::exit(2);
    }
}

fn run() -> Result<(), String> {
    let options = parse_args()?;
    options.config.validate()?;
    let mut simulation = Simulation::random(options.config.clone())?;
    let mut csv = match options.csv.as_ref() {
        Some(path) => {
            let file = File::create(path)
                .map_err(|error| format!("could not create {}: {error}", path.display()))?;
            let mut writer = BufWriter::new(file);
            writeln!(
                writer,
                "{}",
                StepReport::csv_header(options.config.max_consciousness)
            )
            .map_err(|error| format!("could not write CSV header: {error}"))?;
            Some(writer)
        }
        None => None,
    };

    println!("CONSCIOUS LIFE 0.2 | predator-prey ecological + social laboratory");
    println!(
        "grid={}x{} seed={} initial_alive={} prey={} predators={} ecology={} PD=[S:{:.1}, P:{:.1}, R:{:.1}, T:{:.1}]",
        options.config.width,
        options.config.height,
        options.config.seed,
        simulation.alive_count(),
        simulation.population().prey,
        simulation.population().predators,
        if options.config.predator_prey_ecology {
            "contact-process"
        } else {
            "classic-conway"
        },
        options.config.game.sucker,
        options.config.game.punishment,
        options.config.game.reward,
        options.config.game.temptation,
    );
    println!(
        "q=0 silent | q=1 felt | q>=2 can report GOOD/EVIL | prey O/o/X/x | predators V/v/W/w"
    );
    println!();

    if options.render_every > 0 {
        println!("tick 0\n{}", simulation.render());
    }

    let mut completed = 0;
    let mut epoch = 1_u64;
    while options.steps == 0 || completed < options.steps {
        let report = simulation.step();
        completed += 1;
        if let Some(writer) = csv.as_mut() {
            writeln!(writer, "{}", report.csv_row())
                .map_err(|error| format!("could not write CSV row: {error}"))?;
        }
        if options.summary_every > 0 && report.tick % options.summary_every == 0 {
            print_summary(&report);
        }
        if options.voice_every > 0
            && report.tick % options.voice_every == 0
            && let Some(voice) = report.voice.as_ref()
        {
            println!(
                "  voice @ t={} ({},{}), {} {}, q={}, s_q={} [{}]: \"{}\"",
                report.from_tick,
                voice.x,
                voice.y,
                voice.species,
                voice.economic_type,
                voice.consciousness,
                voice.experience_level,
                voice.moral_voice,
                voice.utterance,
            );
        }
        if options.render_every > 0 && report.tick % options.render_every == 0 {
            println!("\ntick {}\n{}", report.tick, simulation.render());
        }
        let ecological_collapse = options.config.predator_prey_ecology
            && (report.after.prey == 0 || report.after.predators == 0);
        if report.after.alive == 0 || ecological_collapse {
            if options.steps == 0 {
                epoch = epoch.saturating_add(1);
                let mut next_config = options.config.clone();
                next_config.seed = epoch_seed(options.config.seed, epoch);
                simulation = Simulation::random(next_config)?;
                println!(
                    "epoch {epoch} began after ecological collapse; seed={} prey={} predators={}",
                    simulation.config().seed,
                    simulation.population().prey,
                    simulation.population().predators,
                );
            } else if report.after.alive == 0 {
                println!("population extinct at tick {}", report.tick);
                break;
            }
        }
    }

    if let Some(writer) = csv.as_mut() {
        writer
            .flush()
            .map_err(|error| format!("could not flush CSV: {error}"))?;
    }
    println!();
    println!(
        "Interpretation: this is a toy selection mechanism, not evidence that simulated cells feel anything."
    );
    println!(
        "Good and evil refer to cooperation or free-riding within a species; predation is ecological, not moral."
    );
    Ok(())
}

fn epoch_seed(seed: u64, epoch: u64) -> u64 {
    let mut value =
        seed.wrapping_add(0x9e37_79b9_7f4a_7c15_u64.wrapping_mul(epoch.wrapping_add(1)));
    value = (value ^ (value >> 30)).wrapping_mul(0xbf58_476d_1ce4_e5b9);
    value = (value ^ (value >> 27)).wrapping_mul(0x94d0_49bb_1331_11eb);
    value ^ (value >> 31)
}

fn print_summary(report: &StepReport) {
    let q_histogram = report
        .after
        .consciousness_histogram
        .iter()
        .enumerate()
        .filter(|(_, count)| **count > 0)
        .map(|(q, count)| format!("q{q}:{count}"))
        .collect::<Vec<_>>()
        .join(" ");
    println!(
        "t={:>4}->{:<4} alive={:>5}->{:<5} prey={:>5} pred={:>5} activity={:>4} C={:>5.1}%->{:.1}% mean_q={:.2}->{:.2} max_q={}->{} fit@{}={:>6.3} match_CC={:>5.1}% births={:>4} captures={:>4} deaths={:>4} voices@{}[G:{} E:{} F:{} N:{} S:{}] {}",
        report.from_tick,
        report.tick,
        report.before.alive,
        report.after.alive,
        report.after.prey,
        report.after.predators,
        report.changed_sites,
        100.0 * report.before.cooperator_share(),
        100.0 * report.after.cooperator_share(),
        report.before.mean_consciousness,
        report.after.mean_consciousness,
        report.before.max_consciousness,
        report.after.max_consciousness,
        report.from_tick,
        report.mean_fitness,
        100.0 * report.cooperative_match_rate,
        report.births,
        report.captures,
        report.deaths,
        report.from_tick,
        report.good,
        report.evil,
        report.felt,
        report.neutral,
        report.silent,
        q_histogram,
    );
}

fn parse_args() -> Result<RunOptions, String> {
    let mut options = RunOptions::default();
    let mut args = env::args().skip(1);
    while let Some(flag) = args.next() {
        let value = |args: &mut std::iter::Skip<std::env::Args>, name: &str| {
            args.next()
                .ok_or_else(|| format!("{name} requires a value"))
        };
        match flag.as_str() {
            "-h" | "--help" => {
                print_help();
                std::process::exit(0);
            }
            "--width" => options.config.width = parse(&value(&mut args, "--width")?, "width")?,
            "--height" => options.config.height = parse(&value(&mut args, "--height")?, "height")?,
            "--steps" => options.steps = parse(&value(&mut args, "--steps")?, "steps")?,
            "--seed" => options.config.seed = parse(&value(&mut args, "--seed")?, "seed")?,
            "--density" => {
                options.config.initial_density = parse(&value(&mut args, "--density")?, "density")?
            }
            "--cooperators" => {
                options.config.initial_cooperator_share =
                    parse(&value(&mut args, "--cooperators")?, "cooperators")?
            }
            "--conscious-seeds" => {
                options.config.initial_conscious_share =
                    parse(&value(&mut args, "--conscious-seeds")?, "conscious-seeds")?
            }
            "--predators" => {
                options.config.initial_predator_share =
                    parse(&value(&mut args, "--predators")?, "predators")?
            }
            "--prey-birth" => {
                options.config.prey_birth_rate =
                    parse(&value(&mut args, "--prey-birth")?, "prey-birth")?
            }
            "--predation" => {
                options.config.predation_rate =
                    parse(&value(&mut args, "--predation")?, "predation")?
            }
            "--predator-death" => {
                options.config.predator_starvation_rate =
                    parse(&value(&mut args, "--predator-death")?, "predator-death")?
            }
            "--classic-conway" => {
                options.config.predator_prey_ecology = false;
                options.config.initial_predator_share = 0.0;
            }
            "--max-q" => {
                options.config.max_consciousness = parse(&value(&mut args, "--max-q")?, "max-q")?
            }
            "--selection" => {
                options.config.selection_strength =
                    parse(&value(&mut args, "--selection")?, "selection")?
            }
            "--theta-mutation" => {
                options.config.economic_mutation_rate =
                    parse(&value(&mut args, "--theta-mutation")?, "theta-mutation")?
            }
            "--q-mutation" => {
                options.config.consciousness_mutation_rate =
                    parse(&value(&mut args, "--q-mutation")?, "q-mutation")?
            }
            "--mimic-fixed" => {
                options.config.mimic_fixed_cost =
                    parse(&value(&mut args, "--mimic-fixed")?, "mimic-fixed")?
            }
            "--mimic-slope" => {
                options.config.mimic_slope =
                    parse(&value(&mut args, "--mimic-slope")?, "mimic-slope")?
            }
            "--bio-fixed" => {
                options.config.biological_fixed_cost =
                    parse(&value(&mut args, "--bio-fixed")?, "bio-fixed")?
            }
            "--bio-slope" => {
                options.config.biological_slope =
                    parse(&value(&mut args, "--bio-slope")?, "bio-slope")?
            }
            "--payoff-s" => {
                options.config.game.sucker = parse(&value(&mut args, "--payoff-s")?, "payoff-s")?
            }
            "--payoff-p" => {
                options.config.game.punishment =
                    parse(&value(&mut args, "--payoff-p")?, "payoff-p")?
            }
            "--payoff-r" => {
                options.config.game.reward = parse(&value(&mut args, "--payoff-r")?, "payoff-r")?
            }
            "--payoff-t" => {
                options.config.game.temptation =
                    parse(&value(&mut args, "--payoff-t")?, "payoff-t")?
            }
            "--summary-every" => {
                options.summary_every =
                    parse(&value(&mut args, "--summary-every")?, "summary-every")?
            }
            "--render-every" => {
                options.render_every = parse(&value(&mut args, "--render-every")?, "render-every")?
            }
            "--voice-every" => {
                options.voice_every = parse(&value(&mut args, "--voice-every")?, "voice-every")?
            }
            "--csv" => options.csv = Some(PathBuf::from(value(&mut args, "--csv")?)),
            unknown => return Err(format!("unknown option: {unknown}. Use --help.")),
        }
    }
    Ok(options)
}

fn parse<T>(raw: &str, name: &str) -> Result<T, String>
where
    T: std::str::FromStr,
    T::Err: std::fmt::Display,
{
    raw.parse()
        .map_err(|error| format!("invalid {name} value '{raw}': {error}"))
}

fn print_help() {
    println!(
        "\
conscious-life: predator-prey ecology, cooperation, and graded inner mappings

USAGE
  cargo run --release -- [OPTIONS]

CORE OPTIONS
  --width N                 Grid width (default 256)
  --height N                Grid height (default 256)
  --steps N                 Generations; 0 runs forever (default 500)
  --seed N                  Deterministic seed (default 7)
  --density P               Initial live-cell density (default 0.48)
  --cooperators P           Initial cooperator share (default 0.55)
  --conscious-seeds P       Initial share of live cells with q=1 (default 0.02)
  --predators P             Predator share among living cells (default 0.1667)
  --max-q N                 Maximum consciousness grade (default 8)

ECOLOGY
  --prey-birth P            Birth hazard per neighboring prey (default 0.12)
  --predation P             Capture hazard per neighboring predator (default 0.06)
  --predator-death P        Predator mortality per generation (default 0.16)
  --classic-conway          Use the prey-only B3/S23 baseline

EVOLUTION
  --selection X             Fitness strength in birth inheritance (default 0.85)
  --theta-mutation P        Cooperator/defector mutation probability (default 0.002)
  --q-mutation P            q mutation probability at birth (default 0.005)
  --mimic-fixed X           Fixed mimicry cost (default 1.45)
  --mimic-slope X           Extra mimicry cost per q level (default 0.12)
  --bio-fixed X             Fixed biological cost for q>=1 (default 0.10)
  --bio-slope X             Extra biological cost per q level (default 0.10)
  --payoff-s X              Cooperator payoff against defector (default 0)
  --payoff-p X              Defector payoff against defector (default 1)
  --payoff-r X              Cooperator payoff against cooperator (default 3)
  --payoff-t X              Defector payoff against cooperator (default 5)

OUTPUT
  --summary-every N         Metrics cadence; 0 disables (default 10)
  --voice-every N           Agent voice cadence; 0 disables (default 25)
  --render-every N          ASCII grid cadence; 0 disables (default 0)
  --csv PATH                Write every generation to CSV
  -h, --help                Show this help
"
    );
}
