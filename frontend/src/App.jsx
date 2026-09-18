import { useEffect, useState } from "react";
import Map from "./Map";
import Analytics from "./Analytics";
import "./App.css";

function App() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [activeProject, setActiveProject] = useState(null);

  const [showProjectModal, setShowProjectModal] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [showSiteModal, setShowSiteModal] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [pendingSiteFeature, setPendingSiteFeature] = useState(null);

  /* =========================
     AUTHENTICATION
  ========================= */

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("darukaa_token") !== null
  );

  const [showRegister, setShowRegister] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const API_URL = "https://darukaa-earth-b1vt.onrender.com";

  /* =========================
     LOAD PROJECTS AFTER LOGIN
  ========================= */

  useEffect(() => {
    if (isLoggedIn) {
      fetchProjects();
    }
  }, [isLoggedIn]);

  /* =========================
     AUTH HEADER
  ========================= */

  const getAuthHeaders = () => {
    const token = localStorage.getItem("darukaa_token");

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  /* =========================
     LOGIN
  ========================= */

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Login error:", data);

        const message =
          data?.detail || "Invalid email or password.";

        alert(message);
        return;
      }

      localStorage.setItem(
        "darukaa_token",
        data.access_token
      );

      if (data.user) {
        localStorage.setItem(
          "darukaa_user",
          JSON.stringify(data.user)
        );
      }

      setLoginEmail("");
      setLoginPassword("");
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Could not connect to the server.");
    }
  };

  /* =========================
     REGISTER
  ========================= */

  const handleRegister = async () => {
    if (
      !registerName.trim() ||
      !registerEmail.trim() ||
      !registerPassword.trim()
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (registerPassword.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.trim(),
          password: registerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Registration error:", data);

        const message =
          data?.detail || "Registration failed.";

        alert(message);
        return;
      }

      alert(
        "Registration successful! Please login with your account."
      );

      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");

      setLoginEmail(data.email || registerEmail.trim());
      setLoginPassword("");

      setShowRegister(false);
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Could not connect to the server.");
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem("darukaa_token");
    localStorage.removeItem("darukaa_user");

    setIsLoggedIn(false);

    setProjects([]);
    setSites([]);
    setSelectedSite(null);
    setActiveProject(null);
    setExpandedProject(null);
  };

  /* =========================
     FETCH PROJECTS
  ========================= */

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();

      setProjects(data);

      if (data.length > 0) {
        await fetchSites(data);

        setActiveProject((currentActive) => {
          if (currentActive) {
            const updatedProject = data.find(
              (project) => project.id === currentActive.id
            );

            return updatedProject || data[0];
          }

          return data[0];
        });
      } else {
        setSites([]);
        setActiveProject(null);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  /* =========================
     FETCH SITES
  ========================= */

  const fetchSites = async (projectList = projects) => {
    try {
      let allSites = [];

      for (const project of projectList) {
        const response = await fetch(
          `${API_URL}/projects/${project.id}/sites`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (response.ok) {
          const projectSites = await response.json();

          const sitesWithProjectId = projectSites.map(
            (site) => ({
              ...site,
              project_id: project.id,
            })
          );

          allSites = [
            ...allSites,
            ...sitesWithProjectId,
          ];
        }
      }

      setSites(allSites);
    } catch (error) {
      console.error("Error loading sites:", error);
    }
  };

  /* =========================
     CREATE PROJECT
  ========================= */

  const createProject = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          carbon_score: 0,
          biodiversity_score: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        console.error(
          "Project creation error:",
          errorData
        );

        throw new Error("Failed to create project");
      }

      const createdProject = await response.json();

      setProjectName("");
      setProjectDescription("");
      setShowProjectModal(false);

      setActiveProject(createdProject);
      setExpandedProject(createdProject.id);

      await fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Could not create project.");
    }
  };

  /* =========================
     MAP SITE CREATED
  ========================= */

  const handleSiteCreated = (feature) => {
    if (projects.length === 0) {
      alert("Please create a project first.");
      return;
    }

    setPendingSiteFeature(feature);
    setSiteName("");
    setShowSiteModal(true);
  };

  /* =========================
     CREATE SITE
  ========================= */

  const createSite = async () => {
    if (!siteName.trim()) {
      alert("Please enter a site name.");
      return;
    }

    if (!pendingSiteFeature) {
      alert("Please draw the site polygon again.");
      return;
    }

    const selectedProject =
      activeProject || projects[0];

    if (!selectedProject) {
      alert("Please create a project first.");
      return;
    }

    try {
      const newSite = {
        name: siteName.trim(),
        area_hectares: 0,
        carbon_score: 0,
        biodiversity_score: 0,
        geometry: pendingSiteFeature.geometry,
      };

      const response = await fetch(
        `${API_URL}/projects/${selectedProject.id}/sites`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(newSite),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        console.error(
          "Backend error:",
          errorData
        );

        throw new Error("Failed to create site");
      }

      setSiteName("");
      setPendingSiteFeature(null);
      setShowSiteModal(false);

      setActiveProject(selectedProject);
      setExpandedProject(selectedProject.id);

      await fetchProjects();

      alert("Site created successfully!");
    } catch (error) {
      console.error("Error creating site:", error);
      alert("Could not create site.");
    }
  };

  /* =========================
     PROJECT CLICK
  ========================= */

  const handleProjectClick = (project) => {
    setActiveProject(project);

    if (expandedProject === project.id) {
      setExpandedProject(null);
    } else {
      setExpandedProject(project.id);
    }
  };

  /* =========================
     SITE CLICK
  ========================= */

  const handleSiteClick = (site) => {
    setSelectedSite(site);

    const project = projects.find(
      (item) => item.id === site.project_id
    );

    if (project) {
      setActiveProject(project);
      setExpandedProject(project.id);
    }

    setTimeout(() => {
      document
        .getElementById("site-details")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  const totalSites = sites.length;

  const activeProjectSites = activeProject
    ? sites.filter(
        (site) =>
          site.project_id === activeProject.id
      )
    : [];

  /* =====================================================
     LOGIN / REGISTER SCREEN
     DASHBOARD BELOW THIS REMAINS UNCHANGED
  ===================================================== */

  if (!isLoggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f7f5",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px",
            boxSizing: "border-box",
            boxShadow:
              "0 10px 40px rgba(18, 59, 40, 0.12)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 16px",
                borderRadius: "16px",
                background: "#123b28",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
              }}
            >
              🌍
            </div>

            <h1
              style={{
                margin: "0 0 8px",
                color: "#123b28",
                fontSize: "28px",
              }}
            >
              Darukaa.Earth
            </h1>

            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Environmental Intelligence Platform
            </p>
          </div>

          {!showRegister ? (
            <>
              <h2
                style={{
                  margin: "0 0 8px",
                  color: "#1f2937",
                  fontSize: "22px",
                }}
              >
                Welcome back
              </h2>

              <p
                style={{
                  margin: "0 0 24px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Login to access your environmental
                dashboard.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  marginBottom: "18px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Email
                </label>

                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) =>
                    setLoginEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleLogin();
                    }
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  marginBottom: "22px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Password
                </label>

                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) =>
                    setLoginPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleLogin();
                    }
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <button
                onClick={handleLogin}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "8px",
                  padding: "13px",
                  background: "#123b28",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Login
              </button>

              <p
                style={{
                  textAlign: "center",
                  margin: "22px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Don't have an account?{" "}
                <button
                  onClick={() => setShowRegister(true)}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#123b28",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "14px",
                  }}
                >
                  Register
                </button>
              </p>
            </>
          ) : (
            <>
              <h2
                style={{
                  margin: "0 0 8px",
                  color: "#1f2937",
                  fontSize: "22px",
                }}
              >
                Create account
              </h2>

              <p
                style={{
                  margin: "0 0 24px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Register to use the Darukaa.Earth
                platform.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  marginBottom: "18px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Name
                </label>

                <input
                  type="text"
                  value={registerName}
                  onChange={(event) =>
                    setRegisterName(event.target.value)
                  }
                  placeholder="Enter your name"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  marginBottom: "18px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Email
                </label>

                <input
                  type="email"
                  value={registerEmail}
                  onChange={(event) =>
                    setRegisterEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  marginBottom: "22px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Password
                </label>

                <input
                  type="password"
                  value={registerPassword}
                  onChange={(event) =>
                    setRegisterPassword(event.target.value)
                  }
                  placeholder="Minimum 6 characters"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <button
                onClick={handleRegister}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "8px",
                  padding: "13px",
                  background: "#123b28",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Create Account
              </button>

              <p
                style={{
                  textAlign: "center",
                  margin: "22px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Already have an account?{" "}
                <button
                  onClick={() => setShowRegister(false)}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#123b28",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "14px",
                  }}
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <div className="app-layout">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="logo-icon">
            🌍
          </div>

          <div>
            <h1>
              Darukaa.Earth
            </h1>

            <span>
              Environmental Intelligence
            </span>
          </div>

        </div>

        <nav className="sidebar-nav">

          <a
            href="#overview"
            className="active"
          >
            <span>▦</span>
            Overview
          </a>

          <a href="#geographical-sites">
            <span>⌖</span>
            Geographical Sites
          </a>

          <a href="#projects">
            <span>◈</span>
            Projects
          </a>

          <a href="#analytics">
            <span>◒</span>
            Analytics
          </a>

        </nav>

        <div className="sidebar-bottom">

          <div className="user-box">

            <div className="user-avatar">
              V
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <strong>
                Admin
              </strong>

              <span>
                Project Manager
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                border: "none",
                background: "transparent",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "18px",
                padding: "6px",
              }}
            >
              ↪
            </button>

          </div>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* HEADER */}

        <header className="top-header">

          <div>

            <p className="small-label">
              ENVIRONMENTAL PLATFORM
            </p>

            <h1>
              Project Dashboard
            </h1>

            <p>
              Monitor carbon and biodiversity
              performance across your
              environmental sites.
            </p>

          </div>

          <button
            className="primary-button"
            onClick={() =>
              setShowProjectModal(true)
            }
          >
            + Add Project
          </button>

        </header>

        {/* OVERVIEW */}

        <section
          id="overview"
          className="dashboard-section"
        >

          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-icon">
                ◈
              </div>

              <div>

                <span>
                  Total Projects
                </span>

                <strong>
                  {projects.length}
                </strong>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                ⌖
              </div>

              <div>

                <span>
                  Total Sites
                </span>

                <strong>
                  {totalSites}
                </strong>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                🌱
              </div>

              <div>

                <span>
                  Active Project
                </span>

                <strong>
                  {activeProject
                    ? activeProject.name
                    : projects.length > 0
                      ? projects[0].name
                      : "None"}
                </strong>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                ✓
              </div>

              <div>

                <span>
                  Sites Monitored
                </span>

                <strong>
                  {activeProject
                    ? activeProjectSites.length
                    : totalSites}
                </strong>

              </div>

            </div>

          </div>

          {activeProject && (

            <div
              className="project-card"
              style={{
                marginTop: "24px",
              }}
            >

              <div>

                <p className="small-label">
                  ACTIVE PROJECT
                </p>

                <h3>
                  {activeProject.name}
                </h3>

                <p>
                  {activeProject.description ||
                    "No description available"}
                </p>

                <div
                  className="project-sites"
                  style={{
                    marginTop: "16px",
                  }}
                >

                  <span>
                    {activeProjectSites.length}{" "}
                    {activeProjectSites.length === 1
                      ? "Site"
                      : "Sites"}
                  </span>

                  <span>
                    Carbon:{" "}
                    {activeProject.carbon_score || 0}%
                  </span>

                  <span>
                    Biodiversity:{" "}
                    {activeProject.biodiversity_score || 0}%
                  </span>

                </div>

              </div>

            </div>

          )}

        </section>

        {/* GEOGRAPHICAL SITES */}

        <section
          id="geographical-sites"
          className="dashboard-section"
        >

          <div className="section-header">

            <div>

              <h2>
                Geographical Sites
              </h2>

              <p>
                Draw polygons on the map
                to create environmental
                sites.
              </p>

            </div>

          </div>

          <div className="map-card">

            <Map
              sites={sites}
              onSiteCreated={
                handleSiteCreated
              }
            />

          </div>

        </section>

        {/* PROJECTS */}

        <section
          id="projects"
          className="dashboard-section"
        >

          <div className="section-header">

            <div>

              <h2>
                Projects
              </h2>

              <p>
                Manage your environmental
                projects and sites.
              </p>

            </div>

            <button
              className="secondary-button"
              onClick={() =>
                setShowProjectModal(true)
              }
            >
              + Add Project
            </button>

          </div>

          <div className="projects-grid">

            {projects.length === 0 ? (

              <div className="empty-state">
                No projects created yet.
              </div>

            ) : (

              projects.map((project) => {

                const projectSites =
                  sites.filter(
                    (site) =>
                      site.project_id ===
                      project.id
                  );

                const isExpanded =
                  expandedProject ===
                  project.id;

                const isActive =
                  activeProject?.id ===
                  project.id;

                return (

                  <div
                    className={`project-card ${
                      isActive
                        ? "active-project"
                        : ""
                    }`}
                    key={project.id}
                  >

                    <div
                      onClick={() =>
                        handleProjectClick(
                          project
                        )
                      }
                      style={{
                        cursor: "pointer",
                      }}
                    >

                      <h3>
                        {project.name}
                      </h3>

                      <p>
                        {project.description ||
                          "No description available"}
                      </p>

                      <div className="project-sites">

                        <span>
                          {projectSites.length}{" "}
                          {projectSites.length === 1
                            ? "Site"
                            : "Sites"}
                        </span>

                        <span className="project-arrow">
                          {isExpanded
                            ? "↑"
                            : "→"}
                        </span>

                      </div>

                    </div>

                    {isExpanded && (

                      <div
                        className="project-site-list"
                        style={{
                          marginTop: "18px",
                          borderTop:
                            "1px solid #e5e7eb",
                          paddingTop: "14px",
                        }}
                      >

                        {projectSites.length === 0 ? (

                          <p>
                            No sites added to
                            this project yet.
                          </p>

                        ) : (

                          projectSites.map(
                            (site) => (

                              <button
                                key={site.id}
                                className={`site-row ${
                                  selectedSite?.id ===
                                  site.id
                                    ? "selected-site"
                                    : ""
                                }`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleSiteClick(site);
                                }}
                                style={{
                                  width: "100%",
                                  marginBottom:
                                    "8px",
                                }}
                              >

                                <div className="site-location">

                                  <div className="site-icon">
                                    ⌖
                                  </div>

                                  <div>

                                    <strong>
                                      {site.name}
                                    </strong>

                                    <span>
                                      {site.area_hectares}{" "}
                                      ha
                                    </span>

                                  </div>

                                </div>

                                <span className="site-arrow">
                                  →
                                </span>

                              </button>

                            )
                          )

                        )}

                      </div>

                    )}

                  </div>

                );
              })

            )}

          </div>

        </section>

        {/* SITE INFORMATION */}

        {selectedSite && (

          <section
            id="site-details"
            className="dashboard-section site-details-section"
          >

            <div className="section-header">

              <div>

                <p className="small-label">
                  SITE INFORMATION
                </p>

                <h2>
                  {selectedSite.name}
                </h2>

                <p>
                  Site information and
                  environmental performance.
                </p>

              </div>

            </div>

            <div className="site-details-grid">

              <div className="detail-card">

                <span>
                  Site ID
                </span>

                <strong>
                  #{selectedSite.id}
                </strong>

              </div>

              <div className="detail-card">

                <span>
                  Area
                </span>

                <strong>
                  {selectedSite.area_hectares} ha
                </strong>

              </div>

              <div className="detail-card">

                <span>
                  Carbon Score
                </span>

                <strong>
                  {selectedSite.carbon_score}%
                </strong>

              </div>

              <div className="detail-card">

                <span>
                  Biodiversity Score
                </span>

                <strong>
                  {selectedSite.biodiversity_score}%
                </strong>

              </div>

            </div>

          </section>

        )}

        {/* ANALYTICS */}

        <section id="analytics">

          <Analytics
            site={selectedSite}
          />

        </section>

        {/* FOOTER */}

        <footer className="footer">

          <span>
            Darukaa.Earth © 2026
          </span>

          <span>
            Environmental Intelligence
            Platform
          </span>

        </footer>

      </main>

      {/* PROJECT MODAL */}

      {showProjectModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowProjectModal(false)
          }
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Create New Project
                </h2>

                <p>
                  Add a new environmental
                  project.
                </p>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowProjectModal(false)
                }
              >
                ×
              </button>

            </div>

            <div className="form-group">

              <label>
                Project Name
              </label>

              <input
                type="text"
                value={projectName}
                onChange={(event) =>
                  setProjectName(
                    event.target.value
                  )
                }
                placeholder="Enter project name"
              />

            </div>

            <div className="form-group">

              <label>
                Description
              </label>

              <textarea
                value={projectDescription}
                onChange={(event) =>
                  setProjectDescription(
                    event.target.value
                  )
                }
                placeholder="Enter project description"
                rows="4"
              />

            </div>

            <div className="modal-actions">

              <button
                className="cancel-button"
                onClick={() =>
                  setShowProjectModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={createProject}
              >
                Create Project
              </button>

            </div>

          </div>

        </div>

      )}

      {/* SITE NAME MODAL */}

      {showSiteModal && (

        <div
          className="modal-overlay"
          onClick={() => {
            setShowSiteModal(false);
            setPendingSiteFeature(null);
            setSiteName("");
          }}
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Add Site
                </h2>

                <p>
                  Enter a name for this
                  geographical site.
                </p>

              </div>

              <button
                className="close-button"
                onClick={() => {
                  setShowSiteModal(false);
                  setPendingSiteFeature(null);
                  setSiteName("");
                }}
              >
                ×
              </button>

            </div>

            <div className="form-group">

              <label>
                Site Name
              </label>

              <input
                type="text"
                value={siteName}
                onChange={(event) =>
                  setSiteName(
                    event.target.value
                  )
                }
                placeholder="e.g. Site A - Western Ghats"
                autoFocus
              />

            </div>

            <div className="modal-actions">

              <button
                className="cancel-button"
                onClick={() => {
                  setShowSiteModal(false);
                  setPendingSiteFeature(null);
                  setSiteName("");
                }}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={createSite}
              >
                Save Site
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;