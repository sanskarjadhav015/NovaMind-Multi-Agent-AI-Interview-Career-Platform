export const initialData = {
  // Step 1: Personal Information
  name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  portfolio: "",

  // Step 2: Professional Summary
  summary: "",

  // Step 3: Skills (comma separated or structured)
  skills: "",

  // Step 4: Work Experience
  experience: [],

  // Step 5: Projects
  projects: [],

  // Step 6: Education
  education: [],
};

export const sampleResumeData = {
  name: "Alex Morgan",
  email: "alex.morgan@email.com",
  phone: "+1 (555) 342-8921",
  location: "San Francisco, CA",
  linkedin: "https://linkedin.com/in/alexmorgan",
  github: "https://github.com/alexmorgan",
  portfolio: "https://alexmorgan.dev",

  summary:
    "Results-driven Full Stack Software Engineer with 3+ years of experience designing, developing, and scaling high-performance web applications. Proficient in React, Node.js, TypeScript, and microservices architecture, with a passion for building user-centric, accessible, and ATS-optimized software solutions.",

  skills:
    "JavaScript, TypeScript, React, Next.js, Node.js, Express, Redux Toolkit, MongoDB, PostgreSQL, Tailwind CSS, Docker, AWS (S3, EC2), RESTful APIs, GraphQL, Git, CI/CD",

  experience: [
    {
      company: "Apex Cloud Technologies",
      role: "Full Stack Engineer",
      duration: "Jan 2023 - Present",
      location: "San Francisco, CA",
      description:
        "• Spearheaded architecture migration of customer portal to Next.js and TypeScript, reducing initial load latency by 42%.\n• Designed and delivered 15+ resilient REST and GraphQL microservices handling over 500k daily transactions with 99.98% uptime.\n• Implemented real-time dashboard analytics utilizing Redis caching and WebSockets, cutting database query overhead by 35%.\n• Mentored 4 junior developers and established automated CI/CD pipelines with GitHub Actions and Docker.",
    },
    {
      company: "Nexus Digital Labs",
      role: "Frontend Developer Intern",
      duration: "Jun 2022 - Dec 2022",
      location: "Austin, TX",
      description:
        "• Collaborated with UX designers to build 20+ responsive UI components using React, Tailwind CSS, and Framer Motion.\n• Conducted end-to-end performance audits with Lighthouse, optimizing accessibility scores from 74 to 98.\n• Integrated third-party payment gateways (Stripe) and OAuth authentication, increasing conversion rate by 18%.",
    },
  ],

  projects: [
    {
      name: "NovaMind AI Interview Platform",
      techstack: "React, Node.js, Express, MongoDB, Tailwind CSS, Redis, Gemini AI",
      github: "https://github.com/alexmorgan/novamind-ai",
      liveUrl: "https://novamind-ai.preview.com",
      description:
        "• Developed full-stack AI interview preparation web application featuring real-time speech-to-text mock interviews and ATS resume scoring.\n• Integrated Gemini LLM agent for intelligent feedback synthesis, processing candidate metrics in under 1.2s.\n• Engineered secure authentication with JWT and Firebase with distributed rate limiting using Redis.",
    },
    {
      name: "DevCollab Real-Time Workspace",
      techstack: "React, TypeScript, WebRTC, Socket.io, Express, PostgreSQL",
      github: "https://github.com/alexmorgan/dev-collab",
      liveUrl: "https://devcollab-app.com",
      description:
        "• Built collaborative markdown editor and code scratchpad supporting low-latency concurrent document editing for up to 50 active users.\n• Implemented Operational Transformation (OT) synchronization algorithm ensuring conflict-free multiplayer editing.",
    },
  ],

  education: [
    {
      college: "University of California, Berkeley",
      degree: "Bachelor of Science",
      branch: "Computer Science",
      cgpa: "3.85 / 4.0",
      year: "2019 - 2023",
    },
  ],
};

export default initialData;