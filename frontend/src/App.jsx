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

  const API_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`);

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();

      setProjects(data);

      if (data.length > 0) {
        await fetchSites(data);

        // Keep currently selected project if it still exists
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

  const fetchSites = async (projectList = projects) => {
    try {
      let allSites = [];

      for (const project of projectList) {
        const response = await fetch(
          `${API_URL}/projects/${project.id}/sites`
        );

        if (response.ok) {
          const projectSites = await response.json();

          const sitesWithProjectId = projectSites.map((site) => ({
            ...site,
            project_id: project.id,
          }));

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

  const createProject = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          carbon_score: 0,
          biodiversity_score: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const createdProject = await response.json();

      setProjectName("");
      setProjectDescription("");
      setShowProjectModal(false);

      // Make newly created project active
      setActiveProject(createdProject);
      setExpandedProject(createdProject.id);

      await fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Could not create project.");
    }
  };

  // Called when a polygon is drawn on the map
  const handleSiteCreated = (feature) => {
    if (projects.length === 0) {
      alert("Please create a project first.");
      return;
    }

    setPendingSiteFeature(feature);
    setSiteName("");
    setShowSiteModal(true);
  };

  // Save site after entering site name
  const createSite = async () => {
    if (!siteName.trim()) {
      alert("Please enter a site name.");
      return;
    }

    if (!pendingSiteFeature) {
      alert("Please draw the site polygon again.");
      return;
    }

    // Add site to the currently active project
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
          headers: {
            "Content-Type": "application/json",
          },
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

      // Keep the selected project expanded
      setActiveProject(selectedProject);
      setExpandedProject(selectedProject.id);

      await fetchProjects();

      alert("Site created successfully!");
    } catch (error) {
      console.error("Error creating site:", error);
      alert("Could not create site.");
    }
  };

  // Click project
  const handleProjectClick = (project) => {
    // Make this project active
    setActiveProject(project);

    // Expand / collapse project
    if (expandedProject === project.id) {
      setExpandedProject(null);
    } else {
      setExpandedProject(project.id);
    }
  };

  // Click site
  const handleSiteClick = (site) => {
    setSelectedSite(site);

    // Make the site's project active
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

            <div>
              <strong>
                Admin
              </strong>

              <span>
                Project Manager
              </span>
            </div>

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

            {/* TOTAL PROJECTS */}

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

            {/* TOTAL SITES */}

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

            {/* ACTIVE PROJECT */}

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

            {/* SITES MONITORED */}

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

          {/* ACTIVE PROJECT DETAILS */}

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

                    {/* PROJECT HEADER */}

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

                    {/* PROJECT SITES */}

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