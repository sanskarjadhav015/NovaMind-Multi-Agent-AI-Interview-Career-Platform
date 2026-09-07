import React from "react";

function ATSTemplate({ data = {}, themeColor = "#111827" }) {
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

  // Clean comma or newline separated skills into array
  const skillsList = Array.isArray(skills)
    ? skills
    : typeof skills === "string" && skills.trim()
    ? skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Helper to render bullet points from description text
  const renderBullets = (text) => {
    if (!text) return null;
    const lines = text
      .split("\n")
      .map((l) => l.trim().replace(/^[•\-\*]\s*/, ""))
      .filter(Boolean);

    if (lines.length === 1 && !text.includes("\n")) {
      return <p className="text-[13px] text-neutral-700 leading-relaxed mt-1">{lines[0]}</p>;
    }

    return (
      <ul className="list-disc ml-4 space-y-1 mt-1 text-[13px] text-neutral-700 leading-relaxed">
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
        fontFamily: "'Times New Roman', Times, serif",
      }}
    >
      {/* ----------------- HEADER ----------------- */}
      <header className="text-center pb-4 border-b-2" style={{ borderColor: themeColor }}>
        <h1
          className="text-2xl sm:text-3xl font-bold uppercase tracking-wider mb-2"
          style={{ color: themeColor }}
        >
          {name || "Your Full Name"}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-neutral-700">
          {phone && <span>{phone}</span>}
          {phone && (email || location || linkedin || github) && <span>•</span>}

          {email && (
            <a href={`mailto:${email}`} className="hover:underline text-neutral-800">
              {email}
            </a>
          )}
          {email && (location || linkedin || github) && <span>•</span>}

          {location && <span>{location}</span>}
          {location && (linkedin || github) && <span>•</span>}

          {linkedin && (
            <a
              href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline text-neutral-800"
            >
              LinkedIn
            </a>
          )}
          {linkedin && (github || portfolio) && <span>•</span>}

          {github && (
            <a
              href={github.startsWith("http") ? github : `https://${github}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline text-neutral-800"
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
              className="hover:underline text-neutral-800"
            >
              Portfolio
            </a>
          )}
        </div>
      </header>

      {/* ----------------- PROFESSIONAL SUMMARY ----------------- */}
      {summary && (
        <section className="mt-5">
          <h2
            className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-neutral-300 mb-2"
            style={{ color: themeColor }}
          >
            Professional Summary
          </h2>
          <p className="text-[13px] text-neutral-800 leading-relaxed text-justify">{summary}</p>
        </section>
      )}

      {/* ----------------- TECHNICAL SKILLS ----------------- */}
      {skillsList.length > 0 && (
        <section className="mt-5">
          <h2
            className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-neutral-300 mb-2"
            style={{ color: themeColor }}
          >
            Technical Skills
          </h2>
          <p className="text-[13px] text-neutral-800 leading-relaxed">
            <span className="font-semibold">Core Competencies: </span>
            {skillsList.join(" • ")}
          </p>
        </section>
      )}

      {/* ----------------- WORK EXPERIENCE ----------------- */}
      {experience && experience.length > 0 && (
        <section className="mt-5">
          <h2
            className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-neutral-300 mb-2.5"
            style={{ color: themeColor }}
          >
            Work Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <div className="font-bold text-[14px] text-neutral-900">
                    {exp.role || "Job Title"}{" "}
                    {exp.company && (
                      <span className="font-normal text-neutral-700">| {exp.company}</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-600 font-semibold sm:text-right">
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
          <h2
            className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-neutral-300 mb-2.5"
            style={{ color: themeColor }}
          >
            Projects
          </h2>
          <div className="space-y-3.5">
            {projects.map((proj, idx) => (
              <div key={idx} className="break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <div className="font-bold text-[14px] text-neutral-900">
                    {proj.name || "Project Name"}
                    {proj.techstack && (
                      <span className="font-normal text-xs text-neutral-600 ml-1.5 italic">
                        ({proj.techstack})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {proj.github && (
                      <a
                        href={proj.github.startsWith("http") ? proj.github : `https://${proj.github}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-neutral-700 hover:text-neutral-950"
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
                        className="underline text-neutral-700 hover:text-neutral-950"
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
          <h2
            className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-neutral-300 mb-2.5"
            style={{ color: themeColor }}
          >
            Education
          </h2>
          <div className="space-y-2.5">
            {education.map((edu, idx) => (
              <div key={idx} className="break-inside-avoid flex flex-col sm:flex-row sm:items-baseline justify-between">
                <div>
                  <div className="font-bold text-[14px] text-neutral-900">
                    {edu.college || "University / College"}
                  </div>
                  <div className="text-xs text-neutral-700">
                    {edu.degree || "Degree"}
                    {edu.branch ? ` in ${edu.branch}` : ""}
                    {edu.cgpa ? ` • CGPA: ${edu.cgpa}` : ""}
                  </div>
                </div>
                <div className="text-xs text-neutral-600 font-semibold sm:text-right">
                  {edu.year || "Year"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ATSTemplate;
