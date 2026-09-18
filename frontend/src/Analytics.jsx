import { useEffect, useRef } from "react";

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Filler,
  Tooltip,
  Legend
);

function Analytics({ site = null }) {
  const carbonCanvas = useRef(null);
  const biodiversityCanvas = useRef(null);

  const carbonChart = useRef(null);
  const biodiversityChart = useRef(null);

  useEffect(() => {
    if (!carbonCanvas.current || !biodiversityCanvas.current) {
      return;
    }

    if (carbonChart.current) {
      carbonChart.current.destroy();
      carbonChart.current = null;
    }

    if (biodiversityChart.current) {
      biodiversityChart.current.destroy();
      biodiversityChart.current = null;
    }

    /*
     * Use the selected site's actual scores.
     * If no site is selected, use the dashboard
     * demonstration values.
     */

    const carbonScore = Number(
      site?.carbon_score ?? 75
    );

    const biodiversityScore = Number(
      site?.biodiversity_score ?? 82
    );

    /*
     * Prototype monitoring trend.
     * The final point represents the current
     * site's actual score.
     */

    const carbonData = [
      Math.max(0, carbonScore - 18),
      Math.max(0, carbonScore - 13),
      Math.max(0, carbonScore - 9),
      Math.max(0, carbonScore - 6),
      Math.max(0, carbonScore - 3),
      carbonScore,
    ];

    const biodiversityData = [
      Math.max(0, biodiversityScore - 20),
      Math.max(0, biodiversityScore - 15),
      Math.max(0, biodiversityScore - 10),
      Math.max(0, biodiversityScore - 6),
      Math.max(0, biodiversityScore - 3),
      biodiversityScore,
    ];

    // =====================================
    // CARBON CHART
    // =====================================

    carbonChart.current = new Chart(
      carbonCanvas.current,
      {
        type: "line",

        data: {
          labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
          ],

          datasets: [
            {
              label: "Carbon Performance",

              data: carbonData,

              borderWidth: 3,

              tension: 0.4,

              fill: true,

              borderColor: "#16a34a",

              backgroundColor:
                "rgba(22, 163, 74, 0.10)",

              pointRadius: 5,

              pointHoverRadius: 8,

              pointBackgroundColor: "#16a34a",

              pointBorderColor: "#ffffff",

              pointBorderWidth: 2,
            },
          ],
        },

        options: {
          responsive: true,

          maintainAspectRatio: false,

          interaction: {
            mode: "index",

            intersect: false,
          },

          plugins: {
            legend: {
              display: true,

              position: "top",

              labels: {
                usePointStyle: true,

                padding: 18,
              },
            },

            tooltip: {
              backgroundColor: "rgba(20, 30, 25, 0.92)",

              padding: 12,

              cornerRadius: 8,

              displayColors: false,

              callbacks: {
                label: (context) =>
                  `Carbon Performance: ${context.parsed.y}%`,
              },
            },
          },

          scales: {
            x: {
              grid: {
                display: false,
              },

              ticks: {
                padding: 8,
              },
            },

            y: {
              min: 0,

              max: 100,

              ticks: {
                stepSize: 20,

                padding: 8,

                callback: (value) =>
                  `${value}%`,
              },

              grid: {
                color: "rgba(0, 0, 0, 0.07)",
              },
            },
          },
        },
      }
    );

    // =====================================
    // BIODIVERSITY CHART
    // =====================================

    biodiversityChart.current = new Chart(
      biodiversityCanvas.current,
      {
        type: "line",

        data: {
          labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
          ],

          datasets: [
            {
              label: "Biodiversity Performance",

              data: biodiversityData,

              borderWidth: 3,

              tension: 0.4,

              fill: true,

              borderColor: "#2563eb",

              backgroundColor:
                "rgba(37, 99, 235, 0.10)",

              pointRadius: 5,

              pointHoverRadius: 8,

              pointBackgroundColor: "#2563eb",

              pointBorderColor: "#ffffff",

              pointBorderWidth: 2,
            },
          ],
        },

        options: {
          responsive: true,

          maintainAspectRatio: false,

          interaction: {
            mode: "index",

            intersect: false,
          },

          plugins: {
            legend: {
              display: true,

              position: "top",

              labels: {
                usePointStyle: true,

                padding: 18,
              },
            },

            tooltip: {
              backgroundColor: "rgba(20, 30, 40, 0.92)",

              padding: 12,

              cornerRadius: 8,

              displayColors: false,

              callbacks: {
                label: (context) =>
                  `Biodiversity Performance: ${context.parsed.y}%`,
              },
            },
          },

          scales: {
            x: {
              grid: {
                display: false,
              },

              ticks: {
                padding: 8,
              },
            },

            y: {
              min: 0,

              max: 100,

              ticks: {
                stepSize: 20,

                padding: 8,

                callback: (value) =>
                  `${value}%`,
              },

              grid: {
                color: "rgba(0, 0, 0, 0.07)",
              },
            },
          },
        },
      }
    );

    return () => {
      if (carbonChart.current) {
        carbonChart.current.destroy();

        carbonChart.current = null;
      }

      if (biodiversityChart.current) {
        biodiversityChart.current.destroy();

        biodiversityChart.current = null;
      }
    };
  }, [site]);

  return (
    <section className="dashboard-section">

      <div className="section-header">
        <div>
          <h2>Environmental Analytics</h2>

          <p>
            Monitor project environmental
            performance over time
          </p>
        </div>

        {site && (
          <div>
            <span
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: "20px",
                background: "#f1f5f9",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {site.name}
            </span>
          </div>
        )}
      </div>

      <div className="analytics-grid">

        {/* Carbon */}

        <div className="chart-card">

          <h3>Carbon Performance</h3>

          <p
            style={{
              marginTop: "-8px",
              marginBottom: "18px",
              fontSize: "13px",
              opacity: 0.7,
            }}
          >
            Current score:{" "}
            <strong>
              {carbonScoreForDisplay(site)}%
            </strong>
          </p>

          <div
            className="chart-container"
            style={{
              position: "relative",
              height: "320px",
              width: "100%",
            }}
          >
            <canvas ref={carbonCanvas}></canvas>
          </div>

        </div>

        {/* Biodiversity */}

        <div className="chart-card">

          <h3>Biodiversity Performance</h3>

          <p
            style={{
              marginTop: "-8px",
              marginBottom: "18px",
              fontSize: "13px",
              opacity: 0.7,
            }}
          >
            Current score:{" "}
            <strong>
              {biodiversityScoreForDisplay(site)}%
            </strong>
          </p>

          <div
            className="chart-container"
            style={{
              position: "relative",
              height: "320px",
              width: "100%",
            }}
          >
            <canvas
              ref={biodiversityCanvas}
            ></canvas>
          </div>

        </div>

      </div>

    </section>
  );
}

function carbonScoreForDisplay(site) {
  return Number(site?.carbon_score ?? 75);
}

function biodiversityScoreForDisplay(site) {
  return Number(
    site?.biodiversity_score ?? 82
  );
}

export default Analytics;