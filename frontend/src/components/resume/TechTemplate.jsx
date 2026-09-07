import React from "react";

function TechTemplate({ data = {}, themeColor = "#0f172a" }) {
  const {
    name = "",
    email = "",
    phone = "",
    location = "",
    linkedin = "",
    github = "",
    portfolio = "",
    summary = "",
    skills = "",
    experience = [],
    projects = [],
    education = [],
  } = data || {};

  const skillsList = Array.isArray(skills)
    ? skills
    : typeof skills === "string" && skills.trim()
    ? skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const renderBullets = (text) => {
    if (!text) return null;
    const lines = text
      .split("\n")
      .map((l) => l.trim().replace(/^[•\-\*]\s*/, ""))
      .filter(Boolean);

    if (lines.length === 1 && !text.includes("\n")) {
      return <p className="text-[12.5px] text-neutral-700 leading-relaxed mt-1">{lines[0]}</p>;
    }

    return (
      <ul className="list-disc ml-4 space-y-1 mt-1 text-[12.5px] text-neutral-700 leading-relaxed">
        {lines.map((line, idx) => (
          <li key={idx} className="pl-0.5">
            {line}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div
      className="bg-white text-neutral-900 shadow-lg print:shadow-none w-full max-w-[800px] min-h-[1050px] mx-auto p-8 sm:p-12 box-border select-text"
      style={{
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
      }}
    >
      {/* ----------------- HEADER ----------------- */}
      <header className="border-b-2 pb-4" style={{ borderColor: themeColor }}>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: themeColor }}>
              {name || "Your Full Name"}
            </h1>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mt-0.5">
              Software Engineer / Developer
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600 sm:text-right">
            {location && <span>{location}</span>}
            {email && (
              <a href={`mailto:${email}`} className="hover:underline font-medium text-neutral-800">
                {email}
              </a>
            )}
            {phone && <span>{phone}</span>}
          </div>
        </div>

        {/* Links bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2.5 mt-2 border-t border-neutral-100 text-xs font-medium">
          {github && (
            <a
              href={github.startsWith("http") ? github : `https://${github}`}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-700 hover:underline flex items-center gap-1"
            >
              <span className="font-mono font-bold">git:</span> {github.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          )}
          {linkedin && (
            <a
              href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-700 hover:underline flex items-center gap-1"
            >
              <span className="font-mono font-bold">in:</span> {linkedin.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          )}
          {portfolio && (
            <a
              href={portfolio.startsWith("http") ? portfolio : `https://${portfolio}`}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-700 hover:underline flex items-center gap-1"
            >
              <span className="font-mono font-bold">web:</span> {portfolio.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          )}
        </div>
      </header>

      {/* ----------------- SUMMARY ----------------- */}
      {summary && (
        <section className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
            // Profile
          </h2>
          <p className="text-[12.5px] text-neutral-700 leading-relaxed border-l-2 pl-3 py-0.5" style={{ borderColor: themeColor }}>
            {summary}
          </p>
        </section>
      )}

      {/* ----------------- TECHNICAL SKILLS ----------------- */}
      {skillsList.length > 0 && (
        <section className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1.5">
            // Technical Arsenal
          </h2>
          <div className="bg-neutral-50 p-2.5 rounded border border-neutral-200/80 text-[12px] text-neutral-800">
            <span className="font-mono font-bold text-neutral-600">const skills = [ </span>
            <span className="font-medium">{skillsList.join(", ")}</span>
            <span className="font-mono font-bold text-neutral-600"> ];</span>
          </div>
        </section>
      )}

      {/* ----------------- EXPERIENCE ----------------- */}
      {experience && experience.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
            // Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <div className="text-[13.5px] font-bold text-neutral-900">
                    {exp.role || "Role"} <span className="font-semibold text-neutral-600">@ {exp.company || "Company"}</span>
                  </div>
                  <div className="text-[11.5px] text-neutral-500 font-mono">
                    {exp.duration || "Duration"} {exp.location ? `| ${exp.location}` : ""}
                  </div>
                </div>
                {renderBullets(exp.description)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ----------------- PROJECTS ----------------- */}
      {projects && projects.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
            // Selected Projects
          </h2>
          <div className="space-y-3.5">
            {projects.map((proj, idx) => (
              <div key={idx} className="break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-[13.5px] text-neutral-900">
                      {proj.name || "Project"}
                    </span>
                    {proj.techstack && (
                      <span className="text-[11px] font-mono text-neutral-500">
                        ({proj.techstack})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11.5px] font-mono">
                    {proj.github && (
                      <a
                        href={proj.github.startsWith("http") ? proj.github : `https://${proj.github}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-700 hover:underline"
                      >
                        [source]
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl.startsWith("http") ? proj.liveUrl : `https://${proj.liveUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-700 hover:underline"
                      >
                        [demo]
                      </a>
                    )}
                  </div>
                </div>
                {renderBullets(proj.description)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ----------------- EDUCATION ----------------- */}
      {education && education.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
            // Education
          </h2>
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={idx} className="break-inside-avoid flex flex-col sm:flex-row sm:items-baseline justify-between text-xs">
                <div>
                  <span className="font-bold text-neutral-900">{edu.college}</span>
                  <span className="text-neutral-600 ml-1.5">
                    — {edu.degree} {edu.branch ? `(${edu.branch})` : ""} {edu.cgpa ? `| GPA: ${edu.cgpa}` : ""}
                  </span>
                </div>
                <span className="text-neutral-500 font-mono text-[11px]">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default TechTemplate;
