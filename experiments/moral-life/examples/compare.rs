use moral_life::{Config, Environment, Simulation};

fn main() {
    for environment in [
        Environment::Anonymous,
        Environment::DirectRecord,
        Environment::Public,
    ] {
        let mut world = Simulation::random(Config {
            environment,
            ..Config::default()
        })
        .expect("valid model configuration");
        println!("\n{environment:?}");
        for generation in 1..=1_200 {
            let report = world.step();
            if generation % 100 == 0 {
                let population = world.population();
                println!(
                    "t={generation:4} alive={:4} C={:5.1}% E={:5.1}% inst={:5.1}% q2={:5.1}% bad={:5.1}% guard={:5.1}% adv={:+.3} welfare={:+.3} sanctions={}/{}",
                    population.alive,
                    100.0 * report.cooperation_rate(),
                    100.0 * report.exploitation_rate(),
                    100.0 * population.share(population.active_institutions),
                    100.0 * population.share(population.moral_capacity),
                    100.0 * population.share(population.bad_reputations),
                    100.0 * population.share(population.enforcers),
                    report.net_exploit_advantage,
                    report.mean_welfare,
                    report.true_sanctions,
                    report.false_sanctions,
                );
            }
        }
    }
}
