import { useEffect, useRef } from "react";
import * as mapboxgl from "mapbox-gl/esm";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

function Map({ sites = [], onSiteCreated }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const onSiteCreatedRef = useRef(onSiteCreated);

  useEffect(() => {
    onSiteCreatedRef.current = onSiteCreated;
  }, [onSiteCreated]);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;

    if (!token) {
      console.error("Mapbox token is missing.");
      return;
    }

    if (!mapContainerRef.current) {
      return;
    }

    const map = new mapboxgl.Map({
      accessToken: token,
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [78.9629, 20.5937],
      zoom: 4.5,
    });

    mapRef.current = map;

    map.on("load", () => {
      console.log("Mapbox map loaded successfully.");

      map.addControl(
        new mapboxgl.NavigationControl(),
        "top-right"
      );

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
      });

      drawRef.current = draw;

      map.addControl(draw, "top-left");

      map.on("draw.create", (event) => {
        const feature = event.features?.[0];

        if (feature) {
          console.log("New site polygon:", feature);

          if (onSiteCreatedRef.current) {
            onSiteCreatedRef.current(feature);
          }
        }
      });

      if (sites.length > 0) {
        sites.forEach((site) => {
          if (!site.geometry) {
            return;
          }

          try {
            draw.add({
              type: "Feature",
              properties: {
                site_id: site.id,
                name: site.name,
              },
              geometry: site.geometry,
            });
          } catch (error) {
            console.error(
              "Could not display saved site:",
              error
            );
          }
        });
      }
    });

    map.on("error", (event) => {
      console.error("Mapbox error:", event);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
  }, []);

  useEffect(() => {
    const draw = drawRef.current;

    if (!draw) {
      return;
    }

    try {
      draw.deleteAll();

      sites.forEach((site) => {
        if (!site.geometry) {
          return;
        }

        draw.add({
          type: "Feature",
          properties: {
            site_id: site.id,
            name: site.name,
          },
          geometry: site.geometry,
        });
      });
    } catch (error) {
      console.error(
        "Could not update saved sites:",
        error
      );
    }
  }, [sites]);

  return (
    <div
      ref={mapContainerRef}
      className="map-container"
    />
  );
}

export default Map;