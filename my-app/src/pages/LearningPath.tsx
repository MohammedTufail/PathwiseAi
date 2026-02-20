import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  BarChart3,
  BookOpen,
  Sparkles,
  Menu,
  X,
  LogOut,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../components/button";
import ProgressRing from "../components/ProgressRing";

type ResourceItem = {
  title?: string;
  url: string;
  name?: string;
  stars?: number;
};

type WeekData = {
  week: number;
  title: string;
  topics: string[];
  project: string;
  resources?: {
    [topic: string]: {
      videos: ResourceItem[];
      repos: ResourceItem[];
    };
  };
};

type CurriculumData = {
  weeks: WeekData[];
};

const LearningPath = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("curriculum");
    if (!stored) {
      navigate("/");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.weeks || !Array.isArray(parsed.weeks) || parsed.weeks.length === 0) {
        setError("Curriculum data is invalid or incomplete. Please regenerate.");
        return;
      }
      setCurriculum(parsed);
    } catch (e) {
      setError("Failed to load curriculum. Please regenerate.");
    }
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <p className="text-red-500 font-medium">{error}</p>
        <Button
          onClick={() => {
            localStorage.removeItem("curriculum");
            navigate("/");
          }}
        >
          Go Back & Regenerate
        </Button>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading your learning path...
      </div>
    );
  }

  const totalWeeks = curriculum.weeks.length;
  const completedWeeks = 1;
  const overallProgress = Math.round((completedWeeks / totalWeeks) * 100);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-300 lg:translate-x-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="gradient-primary rounded-lg p-1.5">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">PathwiseAI</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-1">
          {[
            { icon: BookOpen, label: "Learning Path", to: "/learning-path" },
            { icon: BarChart3, label: "Progress", to: "/dashboard" },
            { icon: Sparkles, label: "AI Assistant", to: "#" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Profile summary */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              U
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">User</p>
              <p className="text-xs text-muted-foreground">Personalized Curriculum</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing progress={overallProgress} size={36} strokeWidth={3} />
            <div>
              <p className="text-xs font-medium text-card-foreground">Overall Progress</p>
              <p className="text-[10px] text-muted-foreground">
                {completedWeeks} of {totalWeeks} weeks started
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen">
        <header className="sticky top-0 z-30 glass border-b px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Your Weekly Curriculum</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              localStorage.removeItem("curriculum");
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
          {/* Top Banner */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Generated Learning Path
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your personalized curriculum has been generated based on your profile.
              Follow weekly milestones to reach your goal faster.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-5.25 top-6 bottom-6 w-0.5 bg-border" />
            <div className="space-y-5">
              {curriculum.weeks.map((week, index) => (
                <motion.div
                  key={week.week}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="relative"
                >
                  {/* Timeline Dot */}
                  <div
                    className={`absolute left-4.25 top-8 w-2.5 h-2.5 rounded-full border-2 z-10 ${
                      index === 0
                        ? "bg-primary border-primary animate-pulse"
                        : "bg-card border-border"
                    }`}
                  />

                  {/* Week Card */}
                  <div className="ml-10 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          WEEK {week.week}
                        </p>
                        <h3 className="text-lg font-bold text-foreground mt-1">
                          {week.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Project:{" "}
                          <span className="font-semibold text-foreground">
                            {week.project}
                          </span>
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          navigate(`/week/${week.week}`, { state: { week } })
                        }
                        className="rounded-xl"
                      >
                        View Details
                      </Button>
                    </div>

                    {/* Topics Preview */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {week.topics.map((topic, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-muted"
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-foreground">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LearningPath;