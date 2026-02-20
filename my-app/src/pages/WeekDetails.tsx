import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/button";
import { ArrowLeft, Github, Youtube, BookOpen } from "lucide-react";

const WeekDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const week = location.state?.week;

  if (!week) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        No week data found. Go back.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/learning-path")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <h1 className="text-xl font-bold text-foreground">
            Week {week.week}: {week.title}
          </h1>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Project</h2>
          <p className="text-muted-foreground mt-2">{week.project}</p>
        </div>

        <div className="space-y-4">
          {week.topics.map((topic: string, index: number) => (
            <div
              key={index}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {topic}
              </h3>

              <div className="mt-4 space-y-4">
                {/* Videos */}
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-500" />
                    Videos
                  </p>

                  <ul className="mt-2 space-y-2">
                    {week.resources?.[topic]?.videos?.map(
                      (vid: any, i: number) => (
                        <li key={i}>
                          <a
                            href={vid.url}
                            target="_blank"
                            className="text-primary underline text-sm"
                          >
                            {vid.title}
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {/* Github */}
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub Repos
                  </p>

                  <ul className="mt-2 space-y-2">
                    {week.resources?.[topic]?.repos?.map(
                      (repo: any, i: number) => (
                        <li key={i}>
                          <a
                            href={repo.url}
                            target="_blank"
                            className="text-primary underline text-sm"
                          >
                            {repo.name} ⭐ {repo.stars}
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekDetails;
