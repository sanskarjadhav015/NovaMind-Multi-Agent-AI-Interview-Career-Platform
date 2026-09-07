import React, { useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLinkedin,
  FiGithub,
  FiGlobe,
  FiBriefcase,
  FiCode,
  FiBookOpen,
  FiLayers,
  FiInfo,
  FiCheck,
  FiX,
} from "react-icons/fi";

/* -------------------------------------------------------------------------- */
/*                               FORM INPUT ATOMS                             */
/* -------------------------------------------------------------------------- */
function Input({
  label,
  value = "",
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  required = false,
  helperText = "",
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
          {Icon && <Icon className="text-neutral-500 text-xs shrink-0" />}
          <span>{label}</span>
          {required && <span className="text-rose-500 text-xs">*</span>}
        </label>
        {helperText && <span className="text-[10px] text-neutral-400">{helperText}</span>}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200/90 bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all"
      />
    </div>
  );
}

function TextArea({
  label,
  value = "",
  onChange,
  placeholder,
  rows = 4,
  icon: Icon,
  helperText = "",
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
          {Icon && <Icon className="text-neutral-500 text-xs shrink-0" />}
          <span>{label}</span>
        </label>
        {helperText && <span className="text-[10px] text-neutral-400">{helperText}</span>}
      </div>
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200/90 bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all resize-y leading-relaxed"
      />
    </div>
  );
}

function EntryCard({ title, subtitle, onRemove, children }) {
  return (
    <div className="relative rounded-2xl border border-neutral-200/90 bg-neutral-50/60 p-4 sm:p-5 transition-all hover:border-neutral-300">
      <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-neutral-200/60">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900">{title || "Entry"}</h4>
          {subtitle && <p className="text-[11px] text-neutral-500">{subtitle}</p>}
        </div>
        <button
          onClick={onRemove}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
          title="Remove entry"
        >
          <FiTrash2 size={12} />
          <span>Remove</span>
        </button>
      </div>
      <div className="flex flex-col gap-3.5">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                SKILLS STEP                                 */
/* -------------------------------------------------------------------------- */
function SkillsStep({ data, setData }) {
  const [customInput, setCustomInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showRawEditor, setShowRawEditor] = useState(false);

  const skillList = (data.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const handleAddSkill = (skillText) => {
    const text = (skillText !== undefined ? skillText : customInput).trim();
    if (!text) return;

    // Support comma-separated batch adding e.g. "Docker, AWS, Kubernetes"
    const newItems = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedList = [...skillList];
    let addedCount = 0;

    newItems.forEach((item) => {
      // Case-insensitive duplicate check
      const alreadyExists = updatedList.some(
        (existing) => existing.toLowerCase() === item.toLowerCase()
      );
      if (!alreadyExists) {
        updatedList.push(item);
        addedCount++;
      }
    });

    if (addedCount === 0) {
      setErrorMsg(`"${text}" is already added.`);
      setTimeout(() => setErrorMsg(""), 2500);
      return;
    }

    setData({ ...data, skills: updatedList.join(", ") });
    setCustomInput("");
    setErrorMsg("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const removeSkill = (skillToRemove) => {
    const updated = skillList.filter((s) => s !== skillToRemove).join(", ");
    setData({ ...data, skills: updated });
  };

  const clearAllSkills = () => {
    if (window.confirm("Clear all skills from resume?")) {
      setData({ ...data, skills: "" });
    }
  };

  const suggestedCategories = [
    {
      title: "Frontend",
      skills: ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind CSS", "Redux", "Vue.js", "HTML/CSS"],
    },
    {
      title: "Backend & APIs",
      skills: ["Node.js", "Express", "Python", "Django", "Java", "Go", "GraphQL", "REST APIs", "FastAPI"],
    },
    {
      title: "Databases",
      skills: ["MongoDB", "PostgreSQL", "MySQL", "Redis", "Supabase", "Firebase", "Prisma"],
    },
    {
      title: "DevOps & Cloud",
      skills: ["Docker", "Kubernetes", "AWS", "Git", "GitHub Actions", "CI/CD", "Linux", "Vite"],
    },
    {
      title: "Core & Soft Skills",
      skills: ["System Design", "Agile / Scrum", "Problem Solving", "Code Review", "Team Leadership"],
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* 1. MANUAL SKILL INPUT BAR */}
      <div className="flex flex-col gap-2 p-4 rounded-2xl bg-purple-50/40 border border-purple-100">
        <label className="text-xs font-bold text-neutral-900 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FiCode className="text-purple-600" />
            <span>Add Custom Skill</span>
          </span>
          <span className="text-[11px] text-neutral-400 font-normal">
            Press Enter or click Add
          </span>
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type any skill (e.g. Flutter, Kafka, AWS, Solidity, Go, Figma)..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all"
          />
          <button
            type="button"
            onClick={() => handleAddSkill()}
            disabled={!customInput.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <FiPlus size={14} />
            <span>Add Skill</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
          <span>💡 You can type any custom skill or type multiple separated by commas.</span>
          {errorMsg && (
            <span className="text-rose-600 font-semibold animate-pulse">{errorMsg}</span>
          )}
        </div>
      </div>

      {/* 2. CURRENT ACTIVE SKILLS (CHIPS) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <span>Your Skills</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-800">
              {skillList.length}
            </span>
          </span>
          {skillList.length > 0 && (
            <button
              type="button"
              onClick={clearAllSkills}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {skillList.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-center text-xs text-neutral-400">
            No skills added yet. Type a custom skill above or click recommendations below.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 max-h-44 overflow-y-auto">
            {skillList.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-neutral-800 border border-neutral-200/80 shadow-2xs hover:border-neutral-300 transition-all"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title={`Remove ${skill}`}
                >
                  <FiX size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. QUICK-ADD SUGGESTIONS */}
      <div className="flex flex-col gap-3 pt-1 border-t border-neutral-100">
        <span className="text-xs font-semibold text-neutral-700">
          Or click to add popular industry skills:
        </span>
        <div className="space-y-3">
          {suggestedCategories.map((cat, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase w-32 shrink-0 sm:pt-1">
                {cat.title}
              </span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {cat.skills.map((item, sIdx) => {
                  const isAdded = skillList.some(
                    (s) => s.toLowerCase() === item.toLowerCase()
                  );
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => (isAdded ? removeSkill(item) : handleAddSkill(item))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        isAdded
                          ? "bg-purple-50 text-purple-700 border-purple-200 font-semibold"
                          : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {isAdded && <FiCheck size={11} />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. OPTIONAL RAW TEXTAREA */}
      <div className="pt-2 border-t border-neutral-100">
        <button
          type="button"
          onClick={() => setShowRawEditor(!showRawEditor)}
          className="text-xs font-semibold text-purple-600 hover:text-purple-700 cursor-pointer"
        >
          {showRawEditor ? "Hide Raw Text Editor" : "Edit as Comma-Separated Raw Text"}
        </button>

        {showRawEditor && (
          <div className="mt-3">
            <TextArea
              label="Raw Skills String"
              placeholder="e.g. JavaScript, React, Docker..."
              rows={3}
              helperText="Changes here sync with your skills list above"
              value={data.skills || ""}
              onChange={(v) => setData({ ...data, skills: v })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MAIN FORM                                   */
/* -------------------------------------------------------------------------- */
function ResumeForm({ step, data, setData }) {
  /* ------------------------------ STEP 1 ------------------------------ */
  if (step === 1) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder="e.g. Alex Morgan"
            icon={FiUser}
            required
            value={data.name || ""}
            onChange={(v) => setData({ ...data, name: v })}
          />
          <Input
            label="Email Address"
            placeholder="e.g. alex.morgan@email.com"
            type="email"
            icon={FiMail}
            required
            value={data.email || ""}
            onChange={(v) => setData({ ...data, email: v })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            placeholder="e.g. +1 (555) 342-8921"
            icon={FiPhone}
            value={data.phone || ""}
            onChange={(v) => setData({ ...data, phone: v })}
          />
          <Input
            label="Location (City, Country/State)"
            placeholder="e.g. San Francisco, CA"
            icon={FiMapPin}
            value={data.location || ""}
            onChange={(v) => setData({ ...data, location: v })}
          />
        </div>

        <div className="border-t border-neutral-200/80 pt-4 mt-2">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Online Presence & Links
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Input
              label="LinkedIn URL"
              placeholder="linkedin.com/in/username"
              icon={FiLinkedin}
              value={data.linkedin || ""}
              onChange={(v) => setData({ ...data, linkedin: v })}
            />
            <Input
              label="GitHub URL"
              placeholder="github.com/username"
              icon={FiGithub}
              value={data.github || ""}
              onChange={(v) => setData({ ...data, github: v })}
            />
            <Input
              label="Portfolio / Website"
              placeholder="yourportfolio.com"
              icon={FiGlobe}
              value={data.portfolio || ""}
              onChange={(v) => setData({ ...data, portfolio: v })}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ STEP 2 ------------------------------ */
  if (step === 2) {
    const summaryTemplates = [
      "Results-driven Full Stack Engineer with 3+ years of experience building scalable web applications with React, Node.js, and cloud architectures.",
      "Passionate Software Engineer skilled in modern JavaScript, clean UI/UX development, and RESTful API integration with a focus on performance.",
      "Computer Science graduate with hands-on experience in full-stack web technologies, algorithms, and agile product development.",
    ];

    return (
      <div className="flex flex-col gap-5">
        <TextArea
          label="Professional Summary"
          placeholder="Write a concise 3-4 sentence overview highlighting your background, core technical strengths, and professional accomplishments..."
          rows={6}
          helperText={`${(data.summary || "").length} characters`}
          value={data.summary || ""}
          onChange={(v) => setData({ ...data, summary: v })}
        />

        {/* Quick Tips */}
        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2.5 text-xs text-purple-900">
          <FiInfo className="text-purple-600 mt-0.5 shrink-0" size={15} />
          <div>
            <span className="font-bold">ATS Tip: </span>
            Include your target job title, total years of experience, and 3-4 keywords matching the
            job description you want to apply for.
          </div>
        </div>

        {/* Quick Starters */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-neutral-600">Quick Starters (Click to use):</span>
          <div className="space-y-2">
            {summaryTemplates.map((template, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setData({ ...data, summary: template })}
                className="w-full text-left p-3 rounded-xl border border-neutral-200 bg-white hover:border-purple-300 hover:bg-purple-50/30 text-xs text-neutral-700 transition-all cursor-pointer leading-relaxed"
              >
                "{template}"
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ STEP 3 ------------------------------ */
  if (step === 3) {
    return <SkillsStep data={data} setData={setData} />;
  }

  /* ------------------------------ STEP 4 ------------------------------ */
  if (step === 4) {
    const experienceList = data.experience || [];

    const addExp = () => {
      setData({
        ...data,
        experience: [
          ...experienceList,
          {
            company: "",
            role: "",
            duration: "",
            location: "",
            description: "",
          },
        ],
      });
    };

    const removeExp = (index) => {
      setData({
        ...data,
        experience: experienceList.filter((_, i) => i !== index),
      });
    };

    const updateExp = (index, field, value) => {
      const updated = experienceList.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      );
      setData({ ...data, experience: updated });
    };

    return (
      <div className="flex flex-col gap-4">
        {experienceList.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <FiBriefcase size={20} />
            </div>
            <p className="text-sm font-bold text-neutral-800">No work experience added</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Add your internships, full-time roles, or contract work to show your track record.
            </p>
            <button
              type="button"
              onClick={addExp}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FiPlus size={14} />
              <span>Add Your First Experience</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {experienceList.map((exp, index) => (
              <EntryCard
                key={index}
                title={exp.role || `Experience #${index + 1}`}
                subtitle={exp.company ? `@ ${exp.company}` : "Click fields below to edit"}
                onRemove={() => removeExp(index)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Company / Employer"
                    placeholder="e.g. Apex Cloud Technologies"
                    value={exp.company || ""}
                    onChange={(v) => updateExp(index, "company", v)}
                  />
                  <Input
                    label="Job Title / Role"
                    placeholder="e.g. Full Stack Software Engineer"
                    value={exp.role || ""}
                    onChange={(v) => updateExp(index, "role", v)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Duration / Dates"
                    placeholder="e.g. Jan 2023 - Present"
                    value={exp.duration || ""}
                    onChange={(v) => updateExp(index, "duration", v)}
                  />
                  <Input
                    label="Location"
                    placeholder="e.g. San Francisco, CA (or Remote)"
                    value={exp.location || ""}
                    onChange={(v) => updateExp(index, "location", v)}
                  />
                </div>

                <TextArea
                  label="Key Achievements & Responsibilities"
                  placeholder="• Spearheaded feature development reducing query times by 35%...&#10;• Led sprint planning and mentored junior developers..."
                  rows={4}
                  helperText="Use bullet points starting with strong action verbs"
                  value={exp.description || ""}
                  onChange={(v) => updateExp(index, "description", v)}
                />
              </EntryCard>
            ))}

            <button
              type="button"
              onClick={addExp}
              className="w-full py-2.5 rounded-xl border border-neutral-300/80 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FiPlus size={14} />
              <span>Add Another Experience</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------ STEP 5 ------------------------------ */
  if (step === 5) {
    const projectList = data.projects || [];

    const addProj = () => {
      setData({
        ...data,
        projects: [
          ...projectList,
          {
            name: "",
            techstack: "",
            github: "",
            liveUrl: "",
            description: "",
          },
        ],
      });
    };

    const removeProj = (index) => {
      setData({
        ...data,
        projects: projectList.filter((_, i) => i !== index),
      });
    };

    const updateProj = (index, field, value) => {
      const updated = projectList.map((pro, i) =>
        i === index ? { ...pro, [field]: value } : pro
      );
      setData({ ...data, projects: updated });
    };

    return (
      <div className="flex flex-col gap-4">
        {projectList.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <FiLayers size={20} />
            </div>
            <p className="text-sm font-bold text-neutral-800">No projects added yet</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Showcase 2-3 of your top software applications, open source contributions, or capstones.
            </p>
            <button
              type="button"
              onClick={addProj}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FiPlus size={14} />
              <span>Add First Project</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projectList.map((proj, index) => (
              <EntryCard
                key={index}
                title={proj.name || `Project #${index + 1}`}
                subtitle={proj.techstack ? `Stack: ${proj.techstack}` : "Project Details"}
                onRemove={() => removeProj(index)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Project Title"
                    placeholder="e.g. NovaMind AI Interview Platform"
                    value={proj.name || ""}
                    onChange={(v) => updateProj(index, "name", v)}
                  />
                  <Input
                    label="Tech Stack Used"
                    placeholder="e.g. React, Node.js, Express, MongoDB, Tailwind"
                    value={proj.techstack || ""}
                    onChange={(v) => updateProj(index, "techstack", v)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="GitHub Repository Link"
                    placeholder="e.g. https://github.com/user/project"
                    icon={FiGithub}
                    value={proj.github || ""}
                    onChange={(v) => updateProj(index, "github", v)}
                  />
                  <Input
                    label="Live Demo Link"
                    placeholder="e.g. https://myproject.com"
                    icon={FiGlobe}
                    value={proj.liveUrl || ""}
                    onChange={(v) => updateProj(index, "liveUrl", v)}
                  />
                </div>

                <TextArea
                  label="Description & Highlights"
                  placeholder="• Developed full-stack web application featuring real-time AI interview practice...&#10;• Integrated Redis caching to achieve sub-second response times..."
                  rows={3}
                  helperText="Highlight technical challenges solved and measurable impact"
                  value={proj.description || ""}
                  onChange={(v) => updateProj(index, "description", v)}
                />
              </EntryCard>
            ))}

            <button
              type="button"
              onClick={addProj}
              className="w-full py-2.5 rounded-xl border border-neutral-300/80 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FiPlus size={14} />
              <span>Add Another Project</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------ STEP 6 ------------------------------ */
  if (step === 6) {
    const educationList = data.education || [];

    const addEdu = () => {
      setData({
        ...data,
        education: [
          ...educationList,
          {
            college: "",
            degree: "",
            branch: "",
            cgpa: "",
            year: "",
          },
        ],
      });
    };

    const removeEdu = (index) => {
      setData({
        ...data,
        education: educationList.filter((_, i) => i !== index),
      });
    };

    const updateEdu = (index, field, value) => {
      const updated = educationList.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      );
      setData({ ...data, education: updated });
    };

    return (
      <div className="flex flex-col gap-4">
        {educationList.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <FiBookOpen size={20} />
            </div>
            <p className="text-sm font-bold text-neutral-800">No education entries added</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              List your university, college, or certifications.
            </p>
            <button
              type="button"
              onClick={addEdu}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FiPlus size={14} />
              <span>Add Education</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {educationList.map((edu, index) => (
              <EntryCard
                key={index}
                title={edu.college || `Education #${index + 1}`}
                subtitle={edu.degree ? `${edu.degree} in ${edu.branch || "General"}` : "Degree info"}
                onRemove={() => removeEdu(index)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="College / University Name"
                    placeholder="e.g. University of California, Berkeley"
                    value={edu.college || ""}
                    onChange={(v) => updateEdu(index, "college", v)}
                  />
                  <Input
                    label="Degree"
                    placeholder="e.g. Bachelor of Science, B.Tech, M.S."
                    value={edu.degree || ""}
                    onChange={(v) => updateEdu(index, "degree", v)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <Input
                    label="Major / Branch"
                    placeholder="e.g. Computer Science"
                    value={edu.branch || ""}
                    onChange={(v) => updateEdu(index, "branch", v)}
                  />
                  <Input
                    label="CGPA / Grade"
                    placeholder="e.g. 3.85 / 4.0 or 8.5 CGPA"
                    value={edu.cgpa || ""}
                    onChange={(v) => updateEdu(index, "cgpa", v)}
                  />
                  <Input
                    label="Graduation Year / Period"
                    placeholder="e.g. 2020 - 2024"
                    value={edu.year || ""}
                    onChange={(v) => updateEdu(index, "year", v)}
                  />
                </div>
              </EntryCard>
            ))}

            <button
              type="button"
              onClick={addEdu}
              className="w-full py-2.5 rounded-xl border border-neutral-300/80 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FiPlus size={14} />
              <span>Add Another Education</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default ResumeForm;
