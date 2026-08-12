import { useEffect, useMemo, useState } from "react";

type ResearchKind = "working" | "publication" | "short" | "chapter";

type ResearchItem = {
  year: string;
  kind: ResearchKind;
  title: string;
  authors: string;
  venue: string;
  href?: string;
  note?: string;
};

const cvUrl = "./AguiarCV_2026.pdf";

const featuredResearch = [
  {
    number: "01",
    year: "2026",
    status: "New working paper",
    title: "Tabular Foundation Models and the Unity of Economic Behaviour",
    copy: "A unified choice experiment asks whether one learned representation can travel across risk, time, loss, valuation, and social choice domains.",
    illustration: "./illustrations/paper_unity.webp",
    illustrationAlt: "A central geometric sun connecting five distinct systems of choice",
    href: "https://arxiv.org/abs/2608.06842",
  },
  {
    number: "02",
    year: "2026",
    status: "Working paper",
    title: "GARP-EFM: Improving Foundation Models with Revealed Preference Structure",
    copy: "Economic structure meets foundation models. Revealed preference restrictions improve prediction while preserving interpretable discipline.",
    illustration: "./illustrations/paper_garp_efm.webp",
    illustrationAlt: "A structured lattice organizing tabular decisions into a coherent model",
    href: "https://arxiv.org/abs/2603.23993",
  },
  {
    number: "03",
    year: "2025",
    status: "Revise & resubmit",
    title: "A Rationalization of the Weak Axiom of Revealed Preference",
    copy: "An Afriat style foundation for weak revealed preference, allowing coherent intransitive choice and counterfactual analysis.",
    illustration: "./illustrations/paper_weak_axiom.webp",
    illustrationAlt: "A circular choice system opening into a clear ordered path",
    href: "https://www.researchgate.net/publication/333547091_A_Rationalization_of_the_Weak_Axiom_of_Revealed_Preference",
  },
];

const research: ResearchItem[] = [
  {
    year: "2026",
    kind: "working",
    title: "Tabular Foundation Models and the Unity of Economic Behaviour",
    authors: "Victor H. Aguiar",
    venue: "Working paper",
    href: "https://arxiv.org/abs/2608.06842",
    note: "New",
  },
  {
    year: "2026",
    kind: "working",
    title: "GARP-EFM: Improving Foundation Models with Revealed Preference Structure",
    authors: "Victor H. Aguiar & Nail Kashaev",
    venue: "Working paper",
    href: "https://arxiv.org/abs/2603.23993",
    note: "New",
  },
  {
    year: "2025",
    kind: "working",
    title: "A Rationalization of the Weak Axiom of Revealed Preference",
    authors: "Victor H. Aguiar, Per Hjertstrand, Roberto Serrano & Özgür Evren",
    venue: "Second round revision, The Economic Journal",
    href: "https://www.researchgate.net/publication/333547091_A_Rationalization_of_the_Weak_Axiom_of_Revealed_Preference",
  },
  {
    year: "2024",
    kind: "working",
    title: "Entangled vs. Separable Choice",
    authors: "Victor H. Aguiar, Nail Kashaev & Martin Plávala",
    venue: "Working paper",
    href: "https://www.researchgate.net/publication/378938384_Entangled_vs_Separable_Choice",
  },
  {
    year: "2023",
    kind: "working",
    title: "Dynamic and Stochastic Rational Behavior",
    authors: "Victor H. Aguiar, Charles Gauthier, Nail Kashaev & Martin Plávala",
    venue: "Working paper",
    href: "https://www.researchgate.net/publication/370026321_Dynamic_and_Stochastic_Rational_Behavior",
  },
  {
    year: "2020",
    kind: "working",
    title: "Estimating High Dimensional Demand under Bounded Rationality: The ESMAX Demand System",
    authors: "Victor H. Aguiar & Nickolai Riabov",
    venue: "Working paper",
    href: "https://www.researchgate.net/publication/341685961_Estimating_High_Dimensional_Demand_under_Bounded_Rationality_The_ESMAX_Demand_System",
  },
  {
    year: "2025",
    kind: "publication",
    title: "A New Look at the Symmetry of the Slutsky Matrix",
    authors: "Victor H. Aguiar & Roberto Serrano",
    venue: "Journal of Political Economy Microeconomics, 3(2), 289–302",
    href: "https://www.researchgate.net/publication/363373617_Slutsky_Matrix_Symmetry_A_New_Behavioral_Condition",
  },
  {
    year: "2024",
    kind: "publication",
    title: "Identification and Estimation of Discrete Choice Models with Unobserved Choice Sets",
    authors: "Victor H. Aguiar & Nail Kashaev",
    venue: "Journal of Business & Economic Statistics",
    href: "https://www.researchgate.net/publication/352780243_Identification_and_Estimation_of_Discrete_Choice_Models_with_Unobserved_Choice_Sets",
  },
  {
    year: "2023",
    kind: "publication",
    title: "Random Utility and Limited Consideration",
    authors: "Victor H. Aguiar, María José Boccardi, Nail Kashaev & Jeongbin Kim",
    venue: "Quantitative Economics, 14(1), 71–116",
    href: "https://doi.org/10.3982/QE1861",
    note: "Top cited",
  },
  {
    year: "2022",
    kind: "publication",
    title: "Prices, Profits, Proxies and Production",
    authors: "Victor H. Aguiar, Roy Allen & Nail Kashaev",
    venue: "Journal of Econometrics",
    href: "https://arxiv.org/abs/1810.04697",
  },
  {
    year: "2022",
    kind: "publication",
    title: "A Random Attention and Utility Model",
    authors: "Victor H. Aguiar & Nail Kashaev",
    venue: "Journal of Economic Theory, 105487",
    href: "https://www.researchgate.net/publication/351840460_A_Random_Attention_and_Utility_Model",
  },
  {
    year: "2021",
    kind: "publication",
    title: "Stochastic Revealed Preferences with Measurement Error",
    authors: "Victor H. Aguiar & Nail Kashaev",
    venue: "Review of Economic Studies, 88(4), 2042–2093",
    href: "https://doi.org/10.1093/restud/rdaa067",
  },
  {
    year: "2021",
    kind: "publication",
    title: "Cardinal Revealed Preference: Disentangling Transitivity and Consistent Binary Choice",
    authors: "Victor H. Aguiar & Roberto Serrano",
    venue: "Journal of Mathematical Economics, 94, 102462",
    href: "https://doi.org/10.1016/j.jmateco.2020.102462",
  },
  {
    year: "2019",
    kind: "publication",
    title: "Adaptive Stochastic Search",
    authors: "Victor H. Aguiar & Mert Kimya",
    venue: "Journal of Mathematical Economics, 81, 74–83",
    href: "https://doi.org/10.1016/j.jmateco.2019.01.003",
  },
  {
    year: "2018",
    kind: "publication",
    title: "A Non-Parametric Approach to Testing the Axioms of the Shapley Value with Limited Data",
    authors: "Victor H. Aguiar, Roland Pongou & Jean-Baptiste Tondji",
    venue: "Games and Economic Behavior, 111, 41–63",
  },
  {
    year: "2017",
    kind: "publication",
    title: "Slutsky Matrix Norms: The Size, Classification, and Comparative Statics of Bounded Rationality",
    authors: "Victor H. Aguiar & Roberto Serrano",
    venue: "Journal of Economic Theory, 172, 163–201",
  },
  {
    year: "2016",
    kind: "publication",
    title: "Satisficing and Stochastic Choice",
    authors: "Victor H. Aguiar, María José Boccardi & Mark Dean",
    venue: "Journal of Economic Theory, 166, 445–482",
  },
  {
    year: "2022",
    kind: "short",
    title: "Random Rank-Dependent Expected Utility",
    authors: "Victor H. Aguiar & Nail Kashaev",
    venue: "Games, 13(1), 13",
    href: "https://doi.org/10.3390/g13010013",
  },
  {
    year: "2018",
    kind: "short",
    title: "Classifying Bounded Rationality in Limited Data Sets: A Slutsky Matrix Approach",
    authors: "Victor H. Aguiar & Roberto Serrano",
    venue: "SERIEs, 9(4), 389–421",
  },
  {
    year: "2017",
    kind: "short",
    title: "Random Categorization and Bounded Rationality",
    authors: "Victor H. Aguiar",
    venue: "Economics Letters, 159, 46–52",
    href: "https://doi.org/10.1016/j.econlet.2017.07.006",
  },
  {
    year: "2019",
    kind: "chapter",
    title: "An Index of Unfairness",
    authors: "Victor H. Aguiar, Roland Pongou, Roberto Serrano & Jean-Baptiste Tondji",
    venue: "Handbook of the Shapley Value, CRC Press",
  },
];

const coauthors = [
  { name: "Nail Kashaev", href: "https://nail.kashaev.ru/" },
  { name: "Per Hjertstrand", href: "https://www.ifn.se/en/researchers/affiliated-researchers/per-hjertstrand/" },
  { name: "Roberto Serrano", href: "https://economics.brown.edu/people/roberto-serrano" },
  { name: "Özgür Evren", href: "https://www.nes.ru/about/profiles/faculty/tenure-line/Ozgur-Evren" },
  { name: "Martin Plávala", href: "https://mplavala.github.io/" },
  { name: "Charles Gauthier", href: "https://www.charlesgauthier.me/" },
  { name: "Nickolai Riabov", href: "https://www.linkedin.com/in/causal-ml/" },
  { name: "María José Boccardi", href: "https://www.mariajoseboccardi.com/" },
  { name: "Jeongbin Kim", href: "https://cosspp.fsu.edu/economics/faculty/jeongbin-kim/" },
  { name: "Roy Allen", href: "https://sites.google.com/view/royallen" },
  { name: "Mert Kimya", href: "https://profiles.sydney.edu.au/mert.kimya" },
  { name: "Roland Pongou", href: "https://uniweb.uottawa.ca/network/profile/members/1005?lang=en" },
  { name: "Jean-Baptiste Tondji", href: "https://sites.google.com/site/jbtondjicom/" },
  { name: "Mark Dean", href: "https://econ.columbia.edu/econpeople/mark-dean/" },
] satisfies ReadonlyArray<{ name: string; href: string }>;

const kindLabels: Record<ResearchKind, string> = {
  working: "Working paper",
  publication: "Publication",
  short: "Short paper",
  chapter: "Book chapter",
};

function ExternalArrow() {
  return <span aria-hidden="true">↗</span>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | ResearchKind>("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const visibleResearch = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = research.filter((item) => {
      const matchesKind = filter === "all" || item.kind === filter;
      const searchable = `${item.title} ${item.authors} ${item.venue} ${item.year}`.toLowerCase();
      return matchesKind && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
    return showAll || normalizedQuery || filter !== "all" ? filtered : filtered.slice(0, 8);
  }, [filter, query, showAll]);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("main section[id]");
    const navLinks = document.querySelectorAll<HTMLAnchorElement>(".nav-link");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute("href") === `#${visible.target.id}`;
          link.toggleAttribute("data-active", active);
        });
      },
      { rootMargin: "-35% 0px -55%", threshold: [0, 0.2, 0.6] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText("vaguiarl@sfu.ca");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = "mailto:vaguiarl@sfu.ca";
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="nav-shell">
          <a className="wordmark" href="#home" onClick={closeMenu} aria-label="Victor H. Aguiar, home">
            <span className="monogram" aria-hidden="true"><span>VA</span></span>
            <span className="wordmark-name">Victor H. Aguiar</span>
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>

          <nav id="primary-navigation" className={menuOpen ? "nav-open" : ""} aria-label="Primary navigation">
            <a className="nav-link" href="#research" onClick={closeMenu}>Research</a>
            <a className="nav-link" href="#teaching" onClick={closeMenu}>Teaching</a>
            <a className="nav-link" href="#about" onClick={closeMenu}>About</a>
            <a className="nav-link" href="#contact" onClick={closeMenu}>Contact</a>
            <a className="nav-cv" href={cvUrl} target="_blank" rel="noreferrer">
              CV <ExternalArrow />
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section id="home" className="hero" aria-labelledby="hero-title">
          <div className="hero-orbit orbit-one" aria-hidden="true" />
          <div className="hero-orbit orbit-two" aria-hidden="true" />
          <div className="hero-sun" aria-hidden="true" />
          <div className="page-shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><span /> Economics · Simon Fraser University</p>
              <h1 id="hero-title">Victor H.<br /><em>Aguiar</em></h1>
              <p className="hero-lead">
                I study choice: how to model it, learn why it happens, and turn that understanding into systems and decisions at scale.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#research">Explore research <span aria-hidden="true">↓</span></a>
                <a className="text-link" href={cvUrl} target="_blank" rel="noreferrer">Download CV <ExternalArrow /></a>
              </div>
            </div>

            <div className="hero-role">
              <p>Associate Professor<br />of Economics</p>
              <span>Greater Vancouver Area · BC · Canada</span>
            </div>

            <blockquote className="haiku" aria-label="A haiku about the research">
              <span>Choices become form</span>
              <span>Evidence moves through the frame</span>
              <span>Theory finds its path</span>
            </blockquote>
          </div>

          <div className="hero-status" aria-label="Current role, service, recognition, and languages">
            <div className="page-shell status-grid">
              <p><span>Now</span> Associate Professor, SFU</p>
              <p><span>Editorial service</span> JEBO Associate Editor · through Mar 2026</p>
              <p><span>Recognition</span> Borts · Grimes · REStud</p>
              <p><span>Languages</span> English · French · Spanish</p>
            </div>
          </div>
          <div className="heritage-band" aria-hidden="true" />
        </section>

        <section id="research" className="section research-section" aria-labelledby="research-title">
          <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
          <div className="page-shell">
            <div className="section-intro">
              <p className="section-number">02</p>
              <div>
                <p className="eyebrow"><span /> Research</p>
                <h2 id="research-title">Structure in<br /><em>human choice.</em></h2>
              </div>
              <p className="section-summary">
                My work spans decision theory, structural econometrics, AI, and product science. I build systems that learn what drives people&apos;s choices.
              </p>
            </div>

            <div className="featured-grid">
              {featuredResearch.map((paper) => (
                <a className="featured-paper" href={paper.href} target="_blank" rel="noreferrer" key={paper.title}>
                  <div className="featured-meta">
                    <span>{paper.number}</span>
                    <span>{paper.year}</span>
                  </div>
                  <div className="paper-illustration">
                    <img src={paper.illustration} alt={paper.illustrationAlt} width="1536" height="1024" />
                  </div>
                  <p className="paper-status">{paper.status}</p>
                  <h3>{paper.title}</h3>
                  <p>{paper.copy}</p>
                  <span className="paper-action">Read paper <ExternalArrow /></span>
                </a>
              ))}
            </div>

            <div className="research-library">
              <div className="library-head">
                <div>
                  <p className="eyebrow"><span /> Research library</p>
                  <h3>Selected work, 2016 to 2026</h3>
                </div>
                <label className="research-search">
                  <span className="sr-only">Search research</span>
                  <input
                    type="search"
                    placeholder="Search papers"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <span aria-hidden="true">⌕</span>
                </label>
              </div>

              <div className="filter-row" aria-label="Filter research">
                {(["all", "working", "publication", "short", "chapter"] as const).map((kind) => (
                  <button
                    type="button"
                    key={kind}
                    className={filter === kind ? "active" : ""}
                    aria-pressed={filter === kind}
                    onClick={() => {
                      setFilter(kind);
                      setShowAll(true);
                    }}
                  >
                    {kind === "all" ? "All work" : kindLabels[kind]}
                  </button>
                ))}
              </div>

              <div className="paper-list" aria-live="polite">
                {visibleResearch.map((paper) => {
                  const content = (
                    <>
                      <span className="paper-year">{paper.year}</span>
                      <span className="paper-type">{kindLabels[paper.kind]}</span>
                      <span className="paper-main">
                        <strong>{paper.title}</strong>
                        <small>{paper.authors}</small>
                        <small>{paper.venue}</small>
                      </span>
                      {paper.note && <span className="paper-note">{paper.note}</span>}
                      {paper.href && <span className="paper-arrow" aria-hidden="true">↗</span>}
                    </>
                  );
                  return paper.href ? (
                    <a className="paper-row" href={paper.href} target="_blank" rel="noreferrer" key={paper.title}>{content}</a>
                  ) : (
                    <article className="paper-row" key={paper.title}>{content}</article>
                  );
                })}
                {visibleResearch.length === 0 && (
                  <p className="empty-state">No papers match that search.</p>
                )}
              </div>

              {!showAll && !query && filter === "all" && (
                <button className="button button-outline show-all" type="button" onClick={() => setShowAll(true)}>
                  Show all {research.length} works <span aria-hidden="true">↓</span>
                </button>
              )}

              <p className="library-foot">
                For citations and the most current record, visit my{" "}
                <a href="https://scholar.google.ca/citations?hl=en&user=N2ceyz4AAAAJ" target="_blank" rel="noreferrer">
                  Google Scholar profile <ExternalArrow />
                </a>
              </p>
            </div>
          </div>
        </section>

        <section id="teaching" className="section teaching-section" aria-labelledby="teaching-title">
          <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
          <div className="page-shell">
            <div className="section-intro light-intro">
              <p className="section-number">03</p>
              <div>
                <p className="eyebrow"><span /> Teaching</p>
                <h2 id="teaching-title">Ideas become clear<br /><em>when they are used.</em></h2>
              </div>
              <p className="section-summary">
                I teach economics through open ended cases: current research, made tractable without losing its edge.
              </p>
            </div>

            <div className="teaching-layout">
              <article className="teaching-feature">
                <p className="paper-status">Teaching practice</p>
                <h3>Case studies for the age of AI</h3>
                <p>
                  My intermediate microeconomics materials turn novel research into calculus based cases and open ended take home exams. The format rewards reasoning over recall and makes rich feedback practical.
                </p>
                <div className="teaching-links">
                  <a href="https://github.com/vhaguiar/IntermediateMicro_Case_Studies" target="_blank" rel="noreferrer">
                    View case studies <ExternalArrow />
                  </a>
                  <a href="https://chatgpt.com/g/g-Zx7iKGUvf-intermediate-microeconomics-gpt" target="_blank" rel="noreferrer">
                    Try the course GPT <ExternalArrow />
                  </a>
                </div>
                <blockquote>
                  “The classroom is a laboratory for economic intuition.”
                </blockquote>
              </article>

              <div className="course-column">
                <div className="course-group">
                  <p className="course-label">Fall 2026 · SFU</p>
                  <a href="https://www.sfu.ca/outlines.html?2026/fall/econ/342/d100" target="_blank" rel="noreferrer">
                    <span>ECON 342</span><strong>International Trade</strong><ExternalArrow />
                  </a>
                  <a href="https://www.sfu.ca/outlines.html?2026/fall/econ/803/g100" target="_blank" rel="noreferrer">
                    <span>ECON 803</span><strong>Microeconomic Theory I</strong><ExternalArrow />
                  </a>
                </div>

                <div className="course-group past-courses">
                  <p className="course-label">Teaching portfolio</p>
                  <p>Intermediate Microeconomics</p>
                  <p>Behavioral Economics</p>
                  <p>Behavioral Economics & Revealed Preferences</p>
                  <p>Computational Methods in Economics</p>
                </div>

              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section about-section" aria-labelledby="about-title">
          <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
          <div className="page-shell">
            <div className="about-grid">
              <div className="about-heading">
                <p className="section-number">04</p>
                <p className="eyebrow"><span /> About</p>
                <h2 id="about-title">Solutions, theory,<br />data, <em>and the connecting tissue in between.</em></h2>
                <figure className="about-portrait">
                  <div className="about-portrait-frame">
                    <img
                      src="./victor-aguiar.jpg"
                      alt="Black and white portrait of Victor H. Aguiar"
                      width="1125"
                      height="1118"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <figcaption>
                    Victor H. Aguiar
                    <span>Economist · researcher · problem solver</span>
                  </figcaption>
                </figure>
              </div>

              <div className="about-copy">
                <p className="about-lead">
                  I am an Associate Professor of Economics at Simon Fraser University in the Greater Vancouver Area, BC, Canada.
                </p>
                <p>
                  My research sits at the intersection of microeconomic theory, econometrics, computational economics, and structural microeconometrics. I am especially interested in models that make bounded, stochastic, and evolving choice measurable.
                </p>
                <p>
                  From May 2025 to May 2026, I was a Senior Economist with Amazon Stores Economics and Science, working across decision theory, structural econometrics, and AI on consideration aware algorithms, scalable substitution models, and continuous experimentation. I hold a PhD in Economics from Brown University and served as an Associate Editor at the Journal of Economic Behavior & Organization through March 2026.
                </p>
                <p>
                  My consulting path spans the World Bank and public sector work in policy, taxation, labor markets, program evaluation, trade, and early warning systems. I bring a boutique problem solving approach to this work. I also care deeply about public science diffusion, especially making generative AI legible, useful, and open to a wider public.
                </p>

                <div className="field-list" aria-label="Fields of interest">
                  <span>Microeconomic theory</span>
                  <span>Econometrics</span>
                  <span>Computational economics</span>
                  <span>Structural microeconometrics</span>
                  <span>Decision systems</span>
                  <span>Product science</span>
                  <span>Customer modelling</span>
                  <span>Scalable experimentation</span>
                  <span>Boutique problem solving</span>
                  <span>Public science & GenAI</span>
                </div>

                <aside className="heritage-note">
                  <span className="heritage-sun" aria-hidden="true" />
                  <p>
                    <strong>Roots & visual language</strong>
                    The identity of this site draws from the Inca sun and Andean geometry of my ancestry, the azulejos of Spain, and the light of the Pacific Northwest.
                  </p>
                </aside>
              </div>
            </div>

            <div className="timeline" aria-label="Career timeline">
              <article><time>2026</time><span /><p><strong>Simon Fraser University</strong>Associate Professor of Economics</p></article>
              <article><time>2025 to 2026</time><span /><p><strong>Amazon SEAS</strong>Senior Economist</p></article>
              <article><time>2024</time><span /><p><strong>Simon Fraser University</strong>Joined the Department of Economics</p></article>
              <article><time>2017</time><span /><p><strong>Brown University</strong>PhD in Economics</p></article>
            </div>

            <section className="recognition-block" aria-labelledby="recognition-title">
              <div className="recognition-head">
                <div>
                  <p className="eyebrow"><span /> Recognition</p>
                  <h3 id="recognition-title">Selected <em>distinctions.</em></h3>
                </div>
                <p>Across research, teaching, and academic formation.</p>
              </div>

              <div className="recognition-grid">
                <article className="recognition-card">
                  <span className="recognition-number" aria-hidden="true">01</span>
                  <p className="recognition-kind">Dissertation</p>
                  <h4>George Borts Prize</h4>
                  <p>Outstanding Ph.D. dissertation<br />Brown University · 2016</p>
                </article>
                <article className="recognition-card">
                  <span className="recognition-number" aria-hidden="true">02</span>
                  <p className="recognition-kind">Research fellowship</p>
                  <h4>Christopher J. Grimes Faculty Fellowship</h4>
                  <p>Microeconomic Theory<br />Western University · 2021 to 2026</p>
                </article>
                <article className="recognition-card">
                  <span className="recognition-number" aria-hidden="true">03</span>
                  <p className="recognition-kind">Scholarly service</p>
                  <h4>Excellence in Refereeing</h4>
                  <p>Review of Economic Studies<br />2023 recognition · announced 2025</p>
                </article>
                <article className="recognition-card">
                  <span className="recognition-number" aria-hidden="true">04</span>
                  <p className="recognition-kind">Teaching</p>
                  <h4>Graduate Economics Professor of the Year</h4>
                  <p>Western University · 2017</p>
                </article>
                <article className="recognition-card">
                  <span className="recognition-number" aria-hidden="true">05</span>
                  <p className="recognition-kind">Research reach</p>
                  <h4>Wiley top cited recognition</h4>
                  <p><em>Random Utility and Limited Consideration</em><br />Quantitative Economics</p>
                </article>
                <article className="recognition-card">
                  <span className="recognition-number" aria-hidden="true">06</span>
                  <p className="recognition-kind">Ecuadorian studies</p>
                  <h4>Valedictorian</h4>
                  <p>FLACSO Ecuador · 2012<br />Catholic University of Ecuador · 2010</p>
                </article>
              </div>
            </section>

            <div className="coauthors-block">
              <div>
                <p className="eyebrow"><span /> Coauthors</p>
                <h3>Ideas are<br /><em>collaborative.</em></h3>
              </div>
              <div className="coauthor-cloud">
                {coauthors.map((coauthor) => (
                  <a href={coauthor.href} target="_blank" rel="noreferrer" key={coauthor.name}>
                    {coauthor.name} <ExternalArrow />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section" aria-labelledby="contact-title">
          <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
          <div className="contact-orbit" aria-hidden="true" />
          <div className="page-shell contact-grid">
            <p className="section-number">05</p>
            <div>
              <p className="eyebrow"><span /> Contact</p>
              <h2 id="contact-title">Let’s exchange<br /><em>ideas.</em></h2>
              <p className="contact-copy">For research, seminars, GenAI, consulting, and thoughtful problems.</p>
            </div>

            <div className="contact-actions">
              <a className="contact-email" href="mailto:vaguiarl@sfu.ca">
                vaguiarl@sfu.ca <span aria-hidden="true">↗</span>
              </a>
              <button type="button" className="copy-button" onClick={copyEmail}>
                {copied ? "Copied" : "Copy email"}
              </button>
            </div>

            <div className="contact-links">
              <a href="https://scholar.google.ca/citations?hl=en&user=N2ceyz4AAAAJ" target="_blank" rel="noreferrer">Google Scholar <ExternalArrow /></a>
              <a href="https://www.linkedin.com/in/victor-aguiar-ph-d-698b792a" target="_blank" rel="noreferrer">LinkedIn <ExternalArrow /></a>
              <a href="https://www.sfu.ca/economics/about/faculty/current/victor-aguiar.html" target="_blank" rel="noreferrer">SFU Profile <ExternalArrow /></a>
              <a href={cvUrl} target="_blank" rel="noreferrer">Curriculum Vitae <ExternalArrow /></a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="page-shell footer-grid">
          <a className="wordmark footer-mark" href="#home" aria-label="Back to top">
            <span className="monogram" aria-hidden="true"><span>VA</span></span>
          </a>
          <p>Victor H. Aguiar<br />Economist · Greater Vancouver Area, BC, Canada</p>
          <p className="footer-note">Built with balance, breathing room,<br />and purposeful movement.</p>
          <a href="#home">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
}

export default App;
