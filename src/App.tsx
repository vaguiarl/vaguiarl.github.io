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

const blogArticles = [
  {
    number: "01",
    date: "Aug 21, 2026",
    dateTime: "2026-08-21",
    topic: "AI · agency · revealed preference",
    title: "Can an AI Reveal an Inner Life?",
    copy: "How social incentives could produce functional inner organization in AI agents, and why revealed agency should be a consistency test rather than a one shot performance.",
    href: "https://www.linkedin.com/pulse/can-ai-reveal-inner-life-victor-aguiar-ph-d--0fn2c/",
    latest: true,
  },
  {
    number: "02",
    date: "Aug 12, 2026",
    dateTime: "2026-08-12",
    topic: "Agentic markets · security",
    title: "Can Agents Collude Undetectably?",
    copy: "Why marginal audits can miss coordinated AI agents, and how Bell inequalities can test social independence before agents bid, buy, and sell at scale.",
    href: "https://www.linkedin.com/pulse/can-agents-collude-undetectably-victor-aguiar-ph-d--tykrc",
  },
  {
    number: "03",
    date: "Aug 7, 2026",
    dateTime: "2026-08-07",
    topic: "AI · bounded rationality",
    title: "Can Generative AI Give Economics a Unified Model of Bounded Rationality?",
    copy: "How one learned representation and one random utility structure can connect choice across risk, time, valuation, and social domains.",
    href: "https://www.linkedin.com/pulse/can-generative-ai-give-economics-unified-model-victor-aguiar-ph-d--vejqc",
  },
  {
    number: "04",
    date: "Jul 31, 2026",
    dateTime: "2026-07-31",
    topic: "Ecuador · labor · foundation models",
    title: "An Addendum on Tabular Foundation Models: Reading Ecuador’s Hidden Labor Market",
    copy: "A bilingual reading of Ecuador’s labor market that looks beyond headline unemployment through economic structure and foundation models.",
    href: "https://www.linkedin.com/pulse/addendum-tabular-foundation-models-reading-ecuadors-aguiar-ph-d--sza2c",
  },
  {
    number: "05",
    date: "Jun 11, 2026",
    dateTime: "2026-06-11",
    topic: "GenAI for Social Science · Part II",
    title: "Tabular Data, Pretrained Foundation Time Series Models, and the Future of Forecasting",
    copy: "What pretrained tabular and time series models change about forecasting, and where economic structure can improve their training signal.",
    href: "https://www.linkedin.com/pulse/genai-social-science-part-ii-tabular-data-pretrained-aguiar-ph-d--c8uve",
  },
  {
    number: "06",
    date: "Jun 10, 2026",
    dateTime: "2026-06-10",
    topic: "GenAI for Social Science · Part I",
    title: "Unstructured Data, Verbalization, and Counterfactual Prediction",
    copy: "A nontechnical case for verbalizing rich histories and using LLM world models as counterfactual tools, with experiments as the credibility standard.",
    href: "https://www.linkedin.com/pulse/genai-social-science-part-i-unstructured-data-victor-aguiar-ph-d--40wne",
  },
];

const seminars = [
  {
    number: "01",
    status: "Scheduled",
    dateLead: "November 10",
    year: "2026",
    dateTime: "2026-11-10",
    format: "In person · Pasadena, California",
    institution: "California Institute of Technology",
    title: "Invited research seminar",
    unit: "Division of the Humanities and Social Sciences",
    copy: "A visit to share new work with Caltech’s economics and social science community. The talk title and final logistics will be announced by the host.",
    href: "https://www.hss.caltech.edu/news-and-events/seminars-and-conferences",
    linkLabel: "Caltech HSS",
  },
  {
    number: "02",
    status: "Dates forthcoming",
    dateLead: "February or March",
    year: "2027",
    dateTime: "2027-02",
    format: "Two-week intensive · Ecuador",
    institution: "FLACSO Ecuador",
    title: "Economics of AI",
    unit: "Doctoral Program in Development Economics",
    copy: "A two-week invited course connecting economic reasoning, data, and contemporary artificial intelligence for doctoral researchers. Final dates are being coordinated.",
    href: "https://www.flacso.edu.ec/sites/default/files/2026-04/Doctorado_Economia_del_Desarrollo_2026_2029_final.pdf",
    linkLabel: "Doctoral program",
  },
];

const featuredResearch = [
  {
    number: "01",
    year: "2026",
    status: "New working paper",
    title: "Tabular Foundation Models and the Unity of Economic Behaviour",
    copy: "Eight choice domains enter one frozen tabular representation; a shared utility ruler reconstructs the domain held out for each person.",
    illustration: "./illustrations/paper_unity_v2.webp",
    illustrationAlt: "Eight behavioral choice ladders feeding a frozen tabular encoder that reconstructs one hidden domain with a common utility ruler",
    href: "https://arxiv.org/abs/2608.06842",
  },
  {
    number: "02",
    year: "2026",
    status: "Working paper · July 2026",
    title: "Entangled vs. Separable Choice",
    copy: "Finite, nonparametric tests distinguish genuinely separate local choice from coordinated joint patterns that can hide behind identical marginals. CHSH characterizes the binary case; virtual replicas handle general finite domains.",
    illustration: "./illustrations/paper_entangled_v1.webp",
    illustrationAlt: "Two mirrored local choice rooms share a latent source while four balanced joint-outcome tiles reveal one crossed CHSH pattern that separates hidden coordination from ordinary correlation",
    href: "https://www.researchgate.net/publication/378938384_Entangled_vs_Separable_Choice",
  },
  {
    number: "03",
    year: "2026",
    status: "Working paper",
    title: "GARP-EFM: Improving Foundation Models with Revealed Preference Structure",
    copy: "GARP filters synthetic three-good demand histories before they adapt a forecasting model, turning revealed preference into a predictive prior.",
    illustration: "./illustrations/paper_garp_efm_v2.webp",
    illustrationAlt: "Three-good budget histories passing through a GARP coherence filter into a time-series model and probabilistic demand forecasts",
    href: "https://arxiv.org/abs/2603.23993",
  },
  {
    number: "04",
    year: "2026",
    status: "Conditionally accepted · ReStat",
    title: "A Rationalization of the Weak Axiom of Revealed Preference",
    copy: "An Afriat theorem for WGARP: coherent utility coalitions forbid binary reversals while allowing longer cycles and admissible counterfactual demand.",
    illustration: "./illustrations/paper_weak_axiom_v2.webp",
    illustrationAlt: "Overlapping utility coalitions allowing a three-choice cycle without binary reversals beside an admissible bundle on a new budget",
    href: "https://arxiv.org/abs/1906.00296",
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
    title: "Entangled vs. Separable Choice",
    authors: "Nail Kashaev, Martin Plávala & Victor H. Aguiar",
    venue: "Working paper · July 2026 version",
    href: "https://www.researchgate.net/publication/378938384_Entangled_vs_Separable_Choice",
    note: "Updated",
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
    year: "2026",
    kind: "working",
    title: "A Rationalization of the Weak Axiom of Revealed Preference",
    authors: "Victor H. Aguiar, Per Hjertstrand, Roberto Serrano & Özgür Evren",
    venue: "Conditionally accepted, Review of Economics and Statistics",
    href: "https://arxiv.org/abs/1906.00296",
  },
  {
    year: "2023",
    kind: "working",
    title: "Dynamic and Stochastic Rational Behavior",
    authors: "Victor H. Aguiar, Charles Gauthier, Nail Kashaev & Martin Plávala",
    venue: "Working paper",
    href: "https://arxiv.org/abs/2302.04417",
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
    href: "https://doi.org/10.1086/732650",
  },
  {
    year: "2025",
    kind: "publication",
    title: "Identification and Estimation of Discrete Choice Models with Unobserved Choice Sets",
    authors: "Victor H. Aguiar & Nail Kashaev",
    venue: "Journal of Business & Economic Statistics, 43(1), 204–215",
    href: "https://doi.org/10.1080/07350015.2024.2342731",
  },
  {
    year: "2023",
    kind: "publication",
    title: "Random Utility and Limited Consideration",
    authors: "Victor H. Aguiar, María José Boccardi, Nail Kashaev & Jeongbin Kim",
    venue: "Quantitative Economics, 14(1), 71–116",
    href: "https://doi.org/10.3982/QE1861",
    note: "Wiley recognition",
  },
  {
    year: "2023",
    kind: "publication",
    title: "Prices, Profits, Proxies, and Production",
    authors: "Victor H. Aguiar, Nail Kashaev & Roy Allen",
    venue: "Journal of Econometrics, 235(2), 666–693",
    href: "https://doi.org/10.1016/j.jeconom.2022.06.007",
  },
  {
    year: "2022",
    kind: "publication",
    title: "A Random Attention and Utility Model",
    authors: "Victor H. Aguiar & Nail Kashaev",
    venue: "Journal of Economic Theory, 105487",
    href: "https://doi.org/10.1016/j.jet.2022.105487",
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
    href: "https://doi.org/10.1016/j.geb.2018.06.003",
  },
  {
    year: "2017",
    kind: "publication",
    title: "Slutsky Matrix Norms: The Size, Classification, and Comparative Statics of Bounded Rationality",
    authors: "Victor H. Aguiar & Roberto Serrano",
    venue: "Journal of Economic Theory, 172, 163–201",
    href: "https://doi.org/10.1016/j.jet.2017.08.007",
  },
  {
    year: "2016",
    kind: "publication",
    title: "Satisficing and Stochastic Choice",
    authors: "Victor H. Aguiar, María José Boccardi & Mark Dean",
    venue: "Journal of Economic Theory, 166, 445–482",
    href: "https://doi.org/10.1016/j.jet.2016.08.008",
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
    href: "https://doi.org/10.1007/s13209-018-0178-0",
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
    href: "https://doi.org/10.1201/9781351241410-3",
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
          if (active) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      { rootMargin: "-35% 0px -55%", threshold: [0, 0.2, 0.6] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scrollToCurrentHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      const header = document.querySelector<HTMLElement>(".site-header");
      const top = window.scrollY + target.getBoundingClientRect().top - (header?.offsetHeight ?? 0);
      window.scrollTo({ top, behavior: "instant" });
    };

    scrollToCurrentHash();
    window.addEventListener("hashchange", scrollToCurrentHash);
    return () => window.removeEventListener("hashchange", scrollToCurrentHash);
  }, []);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 800px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) setMenuOpen(false);
    };
    mobileQuery.addEventListener("change", closeAtDesktop);
    return () => mobileQuery.removeEventListener("change", closeAtDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const mobileQuery = window.matchMedia("(max-width: 800px)");
    if (!mobileQuery.matches) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (!mobileQuery.matches) return;
      const menuToggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
      const navigation = document.getElementById("primary-navigation");
      const navLinks = navigation
        ? Array.from(navigation.querySelectorAll<HTMLAnchorElement>("a[href]")).filter(
            (link) => link.getClientRects().length > 0,
          )
        : [];
      const focusable = menuToggle ? [menuToggle, ...navLinks] : navLinks;

      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggle?.focus();
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.classList.add("menu-open");
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
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
          <a className="wordmark" href="#home" onClick={closeMenu} aria-label="VA, Victor H. Aguiar, home">
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
            <a className="nav-link" href="/conscious-life/" onClick={closeMenu}>Experiments</a>
            <a className="nav-link" href="#blogging" onClick={closeMenu}>Blogging</a>
            <a className="nav-link" href="#seminars" onClick={closeMenu}>Seminars</a>
            <a className="nav-link" href="#teaching" onClick={closeMenu}>Teaching</a>
            <a className="nav-link" href="#industry" onClick={closeMenu}>Industry / Consulting</a>
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
                    <img
                      src={paper.illustration}
                      alt={paper.illustrationAlt}
                      width="1536"
                      height="1024"
                      loading="lazy"
                      decoding="async"
                    />
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

        <section id="blogging" className="section blogging-section" aria-labelledby="blogging-title">
          <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
          <div className="blog-sun" aria-hidden="true" />
          <div className="page-shell">
            <div className="section-intro">
              <p className="section-number">03</p>
              <div>
                <p className="eyebrow"><span /> Blogging · public science</p>
                <h2 id="blogging-title">Ideas should<br /><em>travel.</em></h2>
              </div>
              <p className="section-summary">
                I write for a wider public about economics, AI, data, and the new forms of agency they are creating.
              </p>
            </div>

            <div className="blog-grid">
              {blogArticles.map((article) => (
                <a className="blog-card" href={article.href} target="_blank" rel="noreferrer" key={article.title}>
                  <div className="blog-card-head">
                    <span className="blog-number">{article.number}</span>
                    <time dateTime={article.dateTime}>{article.date}</time>
                  </div>
                  <div className="blog-card-topic">
                    <span aria-hidden="true" />
                    {article.topic}
                    {article.latest && <strong>Latest</strong>}
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.copy}</p>
                  <span className="blog-action">Read on LinkedIn <ExternalArrow /></span>
                </a>
              ))}
            </div>

            <a
              className="blog-profile-link text-link"
              href="https://www.linkedin.com/in/victor-aguiar-ph-d-698b792a/recent-activity/articles/"
              target="_blank"
              rel="noreferrer"
            >
              View all LinkedIn articles <ExternalArrow />
            </a>
          </div>
        </section>

        <section id="seminars" className="section seminars-section" aria-labelledby="seminars-title">
          <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
          <div className="seminar-orbit" aria-hidden="true" />
          <div className="page-shell">
            <div className="section-intro">
              <p className="section-number">04</p>
              <div>
                <p className="eyebrow"><span /> Seminars &amp; external lectures</p>
                <h2 id="seminars-title">The work,<br /><em>in the world.</em></h2>
              </div>
              <p className="section-summary">
                Invited seminars and external teaching are where ideas meet a live room, questions sharpen, and new collaborations begin.
              </p>
            </div>

            <div className="seminar-grid">
              {seminars.map((seminar) => (
                <article className="seminar-card" key={`${seminar.institution}-${seminar.year}`}>
                  <div className="seminar-card-head">
                    <span className="seminar-number">{seminar.number}</span>
                    <span className="seminar-status">{seminar.status}</span>
                  </div>
                  <time className="seminar-date" dateTime={seminar.dateTime}>
                    <span>{seminar.dateLead}</span>
                    {seminar.year}
                  </time>
                  <p className="seminar-format">{seminar.format}</p>
                  <div className="seminar-card-body">
                    <p className="seminar-institution">{seminar.institution}</p>
                    <h3>{seminar.title}</h3>
                    <p>{seminar.copy}</p>
                  </div>
                  <footer className="seminar-card-foot">
                    <span>{seminar.unit}</span>
                    <a href={seminar.href} target="_blank" rel="noreferrer">
                      {seminar.linkLabel} <ExternalArrow />
                    </a>
                  </footer>
                </article>
              ))}
            </div>

            <div className="seminar-invitation">
              <p><span>Seminars · executive sessions · intensive courses</span>Bring a difficult idea and a room ready to think.</p>
              <a href="mailto:vaguiarl@sfu.ca?subject=Seminar%20or%20external%20lecture">
                Invite Victor to speak <ExternalArrow />
              </a>
            </div>
          </div>
        </section>

        <section id="teaching" className="section teaching-section" aria-labelledby="teaching-title">
          <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
          <div className="page-shell">
            <div className="section-intro light-intro">
              <p className="section-number">05</p>
              <div>
                <p className="eyebrow"><span /> Teaching</p>
                <h2 id="teaching-title">Ideas become clear<br /><em>when they are used.</em></h2>
              </div>
              <p className="section-summary">
                I teach economics through open inquiry cases: current research, made tractable without losing its edge.
              </p>
            </div>

            <div className="teaching-layout">
              <article className="teaching-feature">
                <p className="paper-status">Teaching practice</p>
                <h3>Case studies for the age of AI</h3>
                <p>
                  My intermediate microeconomics materials turn novel research into cases grounded in calculus and exploratory exams completed at home. The format rewards reasoning over recall and makes rich feedback practical.
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

        <section id="industry" className="section industry-section" aria-labelledby="industry-title">
          <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
          <div className="page-shell">
            <div className="section-intro">
              <p className="section-number">06</p>
              <div>
                <p className="eyebrow"><span /> Industry &amp; consulting</p>
                <h2 id="industry-title">Economic structure,<br /><em>applied at scale.</em></h2>
              </div>
              <p className="section-summary">
                Industry work and consulting across technology, multilateral institutions, government, and public interest programs.
              </p>
            </div>

            <div className="industry-layout">
              <article className="industry-card industry-amazon">
                <div className="industry-card-head">
                  <p className="industry-kicker">Former Senior Economist, Amazon</p>
                  <time>May 2025 to May 2026</time>
                </div>
                <p className="industry-org">Amazon Stores Economics &amp; Science</p>
                <h3>Senior Economist</h3>
                <p className="industry-lead">
                  Decision theory, structural econometrics, and AI brought together for customer and product decisions at scale.
                </p>
                <ul>
                  <li>Algorithms that model consideration and scalable substitution systems.</li>
                  <li>Customer modelling for markets with millions of products and continuous experimentation.</li>
                  <li>Work spanning Stores Economics &amp; Science, Core AI, and Central Economics.</li>
                </ul>
              </article>

              <article className="industry-card industry-world-bank">
                <div className="industry-card-head">
                  <p className="industry-kicker">World Bank consulting</p>
                  <time>2012 · 2014 to 2016</time>
                </div>
                <p className="industry-org">Economic analysis &amp; development strategy</p>
                <h3>World Bank</h3>
                <p className="industry-lead">
                  Technical economic work supporting development strategy, country analysis, and social inclusion in Ecuador.
                </p>
                <ul>
                  <li>Ecuador Skills Development Strategy for Social Inclusion.</li>
                  <li>Ecuador Country Economic Memorandum and supporting technical notes.</li>
                  <li>Labor forces, markets, local and international migration, and economic analysis.</li>
                </ul>
              </article>

              <aside className="industry-practice">
                <div>
                  <p className="industry-kicker">Earlier public &amp; multilateral work</p>
                  <h3>Ecuador and European Union partnerships</h3>
                  <p>
                    Advisory, research, and evaluation work with government, multilateral, and nonprofit institutions from 2009 to 2012.
                  </p>
                </div>
                <div className="practice-tags" aria-label="Selected consulting capabilities">
                  <span>Labor &amp; income mobility</span>
                  <span>Trade &amp; early warning systems</span>
                  <span>Tax policy &amp; decentralization</span>
                  <span>Program monitoring &amp; evaluation</span>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="about" className="section about-section" aria-labelledby="about-title">
          <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
          <div className="page-shell">
            <div className="about-grid">
              <div className="about-heading">
                <p className="section-number">07</p>
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
                  From May 2025 to May 2026, I was a Senior Economist with Amazon Stores Economics and Science, working across decision theory, structural econometrics, and AI on algorithms that model consideration, scalable substitution systems, and continuous experimentation. I hold a PhD in Economics from Brown University and served as an Associate Editor at the Journal of Economic Behavior & Organization through March 2026.
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
              <article><time>2024 to present</time><span /><p><strong>Simon Fraser University</strong>Associate Professor of Economics</p></article>
              <article><time>2025 to 2026</time><span /><p><strong>Amazon SEAS</strong>Senior Economist</p></article>
              <article><time>2012 to 2016</time><span /><p><strong>World Bank</strong>Economic consulting in Ecuador</p></article>
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
            <p className="section-number">08</p>
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
          <a className="wordmark footer-mark" href="#home" aria-label="VA, back to top">
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
