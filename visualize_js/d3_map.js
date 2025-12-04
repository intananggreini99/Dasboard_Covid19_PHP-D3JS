function normalizeName(name) {
    if (!name) return "";

    let n = name.toLowerCase().trim();

    // Buang prefix umum
    n = n
        .replace(/^provinsi\s+/, "")
        .replace(/^propinsi\s+/, "")
        .replace(/^prov\.\s+/, "")
        .replace(/\s+/g, " ");

    // ====== MAPPING KHUSUS GEOJSON ↔ DB ======

    // Aceh di GeoJSON → "di aceh" (supaya match "DI Aceh" di DB)
    if (n === "aceh" || n === "di. aceh" || n === "d.i. aceh") {
        return "di aceh";
    }

    // Irian Jaya Barat → Papua Barat
    if (n === "irian jaya barat") {
        return "papua barat";
    }

    // Irian Jaya Tengah & Timur → Papua
    if (n === "irian jaya tengah" || n === "irian jaya timur" || n === "irian jaya") {
        return "papua";
    }

    // Kalau DKI Jakarta ditulis beda-beda
    if (n === "daerah khusus ibukota jakarta" || n === "jakarta raya") {
        return "dki jakarta";
    }

    return n;
}

const GEOJSON_URL =
  "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-province-simple.json";

renderResponsive("#map-chart", (width, height) => {
    const container = d3.select("#map-chart");
    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // background gelap
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#020617");

    // tooltip
    d3.selectAll(".map-tooltip").remove();
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "map-tooltip fixed z-50 text-xs p-2 rounded-md border border-slate-700 bg-slate-900 text-slate-50 pointer-events-none hidden");

    Promise.all([
        d3.json(GEOJSON_URL),
        d3.json("connectDB/get_covid_recap.php")   // data aggregate dari covid19_recap
    ]).then(([geoData, covidData]) => {
        if (!geoData || !covidData || covidData.error) {
            console.error("Map data error:", geoData, covidData);
            return;
        }

        // map data per provinsi
        const covidByProv = new Map(
            covidData.map(d => [normalizeName(d.province), d])
        );

        // gabungkan ke GeoJSON
        const features = geoData.features.map(f => {
            const props = f.properties || {};
            const provName = props.Propinsi || props.name || "";
            const norm = normalizeName(provName);
            const covid = covidByProv.get(norm) || {};

            f.properties.displayName    = covid.province       || provName || "Unknown";
            f.properties.totalCases     = covid.totalCases     || 0;
            f.properties.totalDeaths    = covid.totalDeaths    || 0;
            f.properties.totalRecovered = covid.totalRecovered || 0;
            f.properties.longitude      = covid.longitude;
            f.properties.latitude       = covid.latitude;

            return f;
        });

        const projection = d3.geoMercator()
            .fitSize([width, height], { type: "FeatureCollection", features });

        const path = d3.geoPath(projection);

        // warna berdasarkan totalCases
        const maxCases = d3.max(features, d => d.properties.totalCases);
        const color = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([0, maxCases || 1]);

        // gambar polygon
        svg.append("g")
            .selectAll("path")
            .data(features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => color(d.properties.totalCases))
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 0.5)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("stroke-width", 1.5)
                    .attr("stroke", "#f9fafb");

                const p = d.properties;

                tooltip
                    .classed("hidden", false)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px")
                    .html(`
                        <div class="font-semibold mb-1">${p.displayName}</div>
                        <div>Total Cases: <b>${p.totalCases.toLocaleString()}</b></div>
                        <div>Total Recovered: <b>${p.totalRecovered.toLocaleString()}</b></div>
                        <div>Total Deaths: <b>${p.totalDeaths.toLocaleString()}</b></div>
                        <div class="mt-1 text-[10px] text-slate-400">
                            Lon: ${p.longitude ?? "-"} &nbsp; | &nbsp;
                            Lat: ${p.latitude ?? "-"}
                        </div>
                    `);
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .attr("stroke-width", 0.5)
                    .attr("stroke", "#0f172a");
                tooltip.classed("hidden", true);
            });

        // label angka totalCases di tengah provinsi (pakai lon/lat kalau ada)
        svg.append("g")
            .selectAll("text")
            .data(features)
            .enter()
            .append("text")
            .attr("transform", d => {
                const lon = d.properties.longitude;
                const lat = d.properties.latitude;
                let coords = null;
                if (lon != null && lat != null && !isNaN(lon) && !isNaN(lat)) {
                    coords = projection([+lon, +lat]);
                } else {
                    coords = path.centroid(d);
                }
                return coords ? `translate(${coords[0]},${coords[1]})` : null;
            })
            .text(d => d.properties.totalCases
                ? d.properties.totalCases.toLocaleString()
                : ""
            )
            .attr("font-size", 10)
            .attr("text-anchor", "middle")
            .attr("fill", "#e5e7eb")
            .style("pointer-events", "none");
    }).catch(err => {
        console.error("Error muat map:", err);
    });
});