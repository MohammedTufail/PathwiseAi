import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { PieChart, Pie, Cell } from "recharts";
import logo from "../assets/PathWiseAILogo.png";
import { cn } from "../lib/utils";

import {
  ArrowRight,
  Sparkles,
  Map,
  Brain,
  TrendingUp,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const progressData = [
  { name: "Completed", value: 25 },
  { name: "Remaining", value: 75 },
];
const COLORS = ["#22c55e", "#1f2937"];

// ─── Grid Background ──────────────────────────────────────────────────────────

const GridBackground = ({ className }: { className?: string }) => (
  <div className={cn("absolute inset-0 overflow-hidden", className)}>
    <div
      className={cn(
        "absolute inset-0",
        "[background-size:44px_44px]",
        "[background-image:linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)]",
      )}
    />
    {/* Radial fade to make it disappear toward edges */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-gray-900 via-gray-950  to-green-950 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
  </div>
);

// ─── Section fade-in wrapper ──────────────────────────────────────────────────

const FadeIn = ({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Feature card ─────────────────────────────────────────────────────────────

const FeatureCard = ({
  icon,
  title,
  description,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  delay: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative rounded-2xl border border-white/8 bg-gradient-to-br from-gray-900/80 via-black to-gray-950/80 p-6 hover:border-green-500/30 transition-all duration-400 overflow-hidden"
    >
      {/* Top shimmer on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/0 to-transparent group-hover:via-green-500/50 transition-all duration-500" />

      <div
        className={cn(
          "h-11 w-11 rounded-xl flex items-center justify-center mb-5 border",
          accent,
        )}
      >
        {icon}
      </div>

      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-100 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

// ─── Step card ────────────────────────────────────────────────────────────────

const StepCard = ({
  step,
  icon,
  title,
  description,
  delay,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Step number */}
      <div className="text-[10px] font-bold tracking-widest text-green-500 uppercase mb-3">
        Step {step}
      </div>

      {/* Icon ring */}
      <div className="relative mb-5">
        <div className="h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
          {icon}
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-green-500/5 blur-sm" />
      </div>

      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed max-w-[200px]">
        {description}
      </p>
    </motion.div>
  );
};

// ─── Overview (main export) ───────────────────────────────────────────────────

export default function Overview() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full flex justify-between items-center px-8 py-3.5 bg-gradient-to-br from-black to-gray-950 backdrop-blur-xl border-b border-white/8 fixed top-0 z-50"
      >
        <img src={logo} alt="PathwiseAI" className="h-10 w-auto" />

        <div className="hidden md:flex items-center gap-8">
          {["Features", "How It Works", "Preview", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
            >
              {item}
            </a>
          ))}
        </div>

        <Link to="/Signup">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold shadow-[0_0_12px_#16a34a] hover:shadow-[0_0_20px_#22c55e] transition-all duration-300"
          >
            Start Learning
          </motion.button>
        </Link>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-32 overflow-hidden">
        {/* Grid background scoped to hero */}
        <GridBackground />

        {/* Green radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-green-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/25 bg-green-500/8 text-green-400 text-xs font-semibold tracking-wider uppercase mb-8"
          >
            <Zap className="h-3 w-3" />
            AI-Powered Learning Platform
          </motion.div>

          {/* Logo */}
          <motion.img
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            src={logo}
            alt="PathwiseAI"
            className="h-28 w-auto mb-8 drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]"
          />

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-4 max-w-3xl"
          >
            Your{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              AI Learning
            </span>{" "}
            Companion
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-gray-400 text-lg max-w-xl leading-relaxed mb-10"
          >
            Build a personalised curriculum in seconds. Curated resources,
            weekly milestones, quizzes - all generated by AI, for you.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/Signup">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold shadow-[0_0_20px_#16a34a] hover:shadow-[0_0_32px_#22c55e] transition-all duration-300"
              >
                Start Your Pathway
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
            <a href="#features">
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/12 text-gray-300 hover:text-white hover:border-white/25 hover:bg-white/5 text-sm font-medium transition-all duration-200">
                See How It Works
                <ChevronRight className="h-4 w-4" />
              </button>
            </a>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="flex items-center gap-6 mt-12 text-xs text-gray-600"
          >
            {[
              "AI-Generated Paths",
              "YouTube Resources",
              "GitHub References",
              "Weekly Quizzes",
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        id="features"
        className="relative px-6 py-28 bg-gradient-to-br from-black to-gray-950 "
      >
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-xs text-green-400 font-semibold uppercase tracking-widest mb-3">
              Why PathwiseAI
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Everything you need to learn smarter
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              From curriculum generation to quizzes and resource curation - all
              in one place.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FeatureCard
              icon={<Map className="h-5 w-5 text-green-400" />}
              title="Personalised Paths"
              description="AI adapts your curriculum to your pace, goals, and current skill level — no one-size-fits-all."
              accent="bg-green-500/10 border-green-500/20"
              delay={0}
            />
            <FeatureCard
              icon={<Brain className="h-5 w-5 text-blue-400" />}
              title="AI Quizzes"
              description="Generate MCQ, true/false, and scenario-based quizzes for every topic. Three difficulty tiers."
              accent="bg-blue-500/10 border-blue-500/20"
              delay={0.08}
            />
            <FeatureCard
              icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
              title="Progress Tracking"
              description="Visual dashboard to see your weekly progress, strengths, and areas that need more attention."
              accent="bg-purple-500/10 border-purple-500/20"
              delay={0.16}
            />
            <FeatureCard
              icon={<BookOpen className="h-5 w-5 text-amber-400" />}
              title="Curated Resources"
              description="YouTube tutorials and top GitHub repositories fetched live for every topic in your curriculum."
              accent="bg-amber-500/10 border-amber-500/20"
              delay={0.06}
            />
            <FeatureCard
              icon={<Target className="h-5 w-5 text-red-400" />}
              title="Weekly Projects"
              description="Each week includes a hands-on project to cement what you've learned through real building."
              accent="bg-red-500/10 border-red-500/20"
              delay={0.12}
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5 text-green-400" />}
              title="Instant Generation"
              description="Enter your subject, level, and goal — get a full multi-week roadmap in under 90 seconds."
              accent="bg-green-500/10 border-green-500/20"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="relative px-6 py-28 overflow-hidden"
      >
        {/* Subtle grid behind this section */}
        <GridBackground className="opacity-40" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn className="text-center mb-20">
            <p className="text-xs text-green-400 font-semibold uppercase tracking-widest mb-3">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              From idea to roadmap in three steps
            </h2>
          </FadeIn>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-gradient-to-r from-green-500/20 via-green-500/40 to-green-500/20" />

            <StepCard
              step="01"
              icon={<Target className="h-7 w-7" />}
              title="Set Your Goal"
              description="Tell us your subject, skill level, and what you want to build or achieve."
              delay={0}
            />
            <StepCard
              step="02"
              icon={<Sparkles className="h-7 w-7" />}
              title="Get Your Path"
              description="AI generates a full weekly roadmap with topics, projects, and curated resources."
              delay={0.1}
            />
            <StepCard
              step="03"
              icon={<TrendingUp className="h-7 w-7" />}
              title="Learn & Improve"
              description="Study with videos, repos, and quizzes. Track your weekly progress."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ── Preview Dashboard ── */}
      <section id="preview" className="relative px-6 py-28 bg-black/50">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs text-green-400 font-semibold uppercase tracking-widest mb-3">
              Dashboard Preview
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              See your progress at a glance
            </h2>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-gray-950 via-black to-gray-950 p-8 overflow-hidden">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

              <div className="grid md:grid-cols-2 gap-10 items-center">
                {/* Left: stats */}
                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-1">
                      Today's Focus
                    </p>
                    <p className="text-lg font-bold text-white">
                      Functions in Python
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        icon: <Map className="h-4 w-4 text-green-400" />,
                        label: "Next topic",
                        value: "Functions in Python",
                      },
                      {
                        icon: <BookOpen className="h-4 w-4 text-blue-400" />,
                        label: "Quiz ready",
                        value: "5 questions · Mixed difficulty",
                      },
                      {
                        icon: <BarChart3 className="h-4 w-4 text-purple-400" />,
                        label: "Progress",
                        value: "25% completed this week",
                      },
                    ].map(({ icon, label, value }, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/8"
                      >
                        <div className="shrink-0">{icon}</div>
                        <div>
                          <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                            {label}
                          </p>
                          <p className="text-sm text-gray-200 font-medium">
                            {value}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right: pie chart */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">
                    Weekly Progress
                  </p>
                  <div className="relative">
                    <PieChart width={140} height={140}>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={62}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {progressData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">25%</span>
                      <span className="text-[10px] text-gray-500">done</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Completed
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-gray-800" />
                      Remaining
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative px-6 py-28 text-center overflow-hidden">
        <GridBackground className="opacity-30" />

        {/* Central green bloom */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-green-500/8 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <FadeIn>
            <p className="text-xs text-green-400 font-semibold uppercase tracking-widest mb-4">
              Get Started Today
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Ready to build your{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                learning path?
              </span>
            </h2>
            <p className="text-gray-400 text-base mb-10 leading-relaxed">
              Join learners who are levelling up with AI-powered, structured
              curricula tailored exactly to their goals.
            </p>
            <Link to="/Signup">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-base shadow-[0_0_24px_#16a34a] hover:shadow-[0_0_40px_#22c55e] transition-all duration-300"
              >
                <Sparkles className="h-4 w-4" />
                Start for Free
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        id="contact"
        className="bg-black/80 py-10 px-6 border-t border-white/8"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={logo} alt="PathwiseAI" className="h-8 w-auto opacity-70" />
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              © 2025 PathwiseAI · Built by Group 10 — Mohammed, Ramona, Zebin
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Guided by Prof. Saurabh Tejpal
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a
              href="#features"
              className="hover:text-green-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-green-400 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#contact"
              className="hover:text-green-400 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
