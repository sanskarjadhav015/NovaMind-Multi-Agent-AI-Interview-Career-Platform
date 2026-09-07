import React from "react";

function ModernTemplate({ data = {}, themeColor = "#2563eb" }) {
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
      return <p className="text-xs text-neutral-600 leading-relaxed mt-1">{lines[0]}</p>;
    }

    return (
      <ul className="list-disc ml-4 space-y-1 mt-1 text-xs text-neutral-600 leading-relaxed">
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
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ----------------- HEADER ----------------- */}
      <header className="pb-5 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: themeColor }}
            >
              {name || "Your Full Name"}
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              {location || "Location not specified"}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1 text-xs text-neutral-600">
            {email && (
              <a href={`mailto:${email}`} className="hover:text-neutral-950 hover:underline">
                {email}
              </a>
            )}
            {phone && <span>{phone}</span>}
            <div className="flex items-center gap-2 pt-0.5">
              {linkedin && (
                <a
                  href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                  style={{ color: themeColor }}
                >
                  LinkedIn
                </a>
              )}
              {linkedin && github && <span>•</span>}
              {github && (
                <a
                  href={github.startsWith("http") ? github : `https://${github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                  style={{ color: themeColor }}
                >
                  GitHub
                </a>
              )}
              {github && portfolio && <span>•</span>}
              {portfolio && (
                <a
                  href={portfolio.startsWith("http") ? portfolio : `https://${portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                  style={{ color: themeColor }}
                >
                  Portfolio
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ----------------- SUMMARY ----------------- */}
      {summary && (
        <section className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColor }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Professional Summary
            </h2>
          </div>
          <p className="text-xs text-neutral-700 leading-relaxed bg-neutral-50/70 p-3 rounded-lg border border-neutral-100">
            {summary}
          </p>
        </section>
      )}

      {/* ----------------- SKILLS ----------------- */}
      {skillsList.length > 0 && (
        <section className="mt-5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColor }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Skills & Expertise
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillsList.map((skill, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200/80"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ----------------- EXPERIENCE ----------------- */}
      {experience && experience.length > 0 && (
        <section className="mt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColor }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Work Experience
            </h2>
          </div>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="break-inside-avoid border-l-2 pl-3.5" style={{ borderColor: `${themeColor}40` }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <span className="font-bold text-xs text-neutral-900">
                    {exp.role || "Job Title"}
                    {exp.company && (
                      <span className="font-semibold text-neutral-700 ml-1.5">
                        @ {exp.company}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-medium text-neutral-500">
                    {exp.duration || "Duration"} {exp.location ? `• ${exp.location}` : ""}
                  </span>
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
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColor }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Featured Projects
            </h2>
          </div>
          <div className="space-y-3.5">
            {projects.map((proj, idx) => (
              <div key={idx} className="break-inside-avoid border-l-2 pl-3.5" style={{ borderColor: `${themeColor}40` }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-neutral-900">
                      {proj.name || "Project Name"}
                    </span>
                    {proj.techstack && (
                      <span className="text-[11px] text-neutral-500 font-medium ml-2">
                        [{proj.techstack}]
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-600 font-medium">
                    {proj.github && (
                      <a
                        href={proj.github.startsWith("http") ? proj.github : `https://${proj.github}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                        style={{ color: themeColor }}
                      >
                        Code
                      </a>
                    )}
                    {proj.github && proj.liveUrl && <span>•</span>}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl.startsWith("http") ? proj.liveUrl : `https://${proj.liveUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                        style={{ color: themeColor }}
                      >
                        Live Demo
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
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeColor }} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Education
            </h2>
          </div>
          <div className="space-y-2.5">
            {education.map((edu, idx) => (
              <div key={idx} className="break-inside-avoid flex flex-col sm:flex-row sm:items-baseline justify-between text-xs">
                <div>
                  <span className="font-bold text-neutral-900">{edu.college}</span>
                  <p className="text-[11px] text-neutral-600">
                    {edu.degree}
                    {edu.branch ? ` in ${edu.branch}` : ""}
                    {edu.cgpa ? ` • CGPA: ${edu.cgpa}` : ""}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-neutral-500">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ModernTemplate;
