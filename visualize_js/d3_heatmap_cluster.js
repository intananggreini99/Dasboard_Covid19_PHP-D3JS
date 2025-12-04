renderResponsive("#heatmap-cluster", (width, height) => {
    const container = d3.select("#heatmap-cluster");
    container.selectAll("*").remove();

    d3.selectAll(".heatmap-tooltip").remove();

    const margin = { top: 30, right: 20, bottom: 20, left: 20 };
    const innerWidth  = Math.max(width  - margin.left - margin.right, 50);
    const innerHeight = Math.max(height - margin.top  - margin.bottom, 50);

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "heatmap-tooltip")
        .style("position", "fixed")
        .style("pointer-events", "none")
        .style("background", "#f9fafb")
        .style("color", "#111827")
        .style("border", "1px solid #d1d5db")
        .style("border-radius", "0.25rem")
        .style("padding", "0.4rem 0.6rem")
        .style("font-size", "11px")
        .style("box-shadow", "0 10px 15px -3px rgba(0,0,0,0.3)")
        .style("opacity", 0)
        .style("z-index", 60);

    d3.json("connectDB/get_covid_cluster.php").then(raw => {
        if (!Array.isArray(raw)) {
            console.error("Cluster heatmap data error:", raw);
            return;
        }

        // Normalisasi data
        const data = raw.map(d => ({
            province: d.province,
            totalCases: +d.totalCases || 0,
            totalDeaths: +d.totalDeaths || 0,
            totalRecovered: +d.totalRecovered || 0,
            cluster: +d.cluster || 0
        }));

        if (!data.length) return;

        const minCluster = d3.min(data, d => d.cluster);
        const maxCluster = d3.max(data, d => d.cluster);

        // Treemap (luas kotak pakai totalCases, kalau mau sama besar tinggal ganti jadi 1)
        const root = d3.hierarchy({ children: data })
            .sum(d => d.totalCases || 1);

        d3.treemap()
            .size([innerWidth, innerHeight])
            .paddingInner(2)
            .round(true)(root);

        // SKALA WARNA: GOLD → MAROON
        // cluster kecil (1) = kuning gold
        // cluster besar (4) = merah maroon

       const color = d3.scaleLinear()
            .domain([minCluster, maxCluster])
            .range([
                "#ffbb33",
                "#cc0000"  
            ]);


        // Kotak-kotak provinsi
        const nodes = g.selectAll("g.node")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        nodes.append("rect")
            .attr("width", d => Math.max(d.x1 - d.x0, 2))
            .attr("height", d => Math.max(d.y1 - d.y0, 2))
            .attr("rx", 2)
            .attr("ry", 2)
            .attr("fill", d => color(d.data.cluster))
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 0.5)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("stroke-width", 2)
                    .attr("stroke", "#f97316");

                tooltip
                    .html(`
                        <div style="font-weight:600;margin-bottom:4px;">
                            Province: <span style="font-weight:700;">${d.data.province}</span>
                        </div>
                        <div>Cluster: <span style="font-weight:700;">${d.data.cluster}</span></div>
                        <div>Total Cases: <span style="font-weight:700;">
                            ${d.data.totalCases.toLocaleString()}
                        </span></div>
                        <div>Total Deaths: <span style="font-weight:700;">
                            ${d.data.totalDeaths.toLocaleString()}
                        </span></div>
                        <div>Total Recovered: <span style="font-weight:700;">
                            ${d.data.totalRecovered.toLocaleString()}
                        </span></div>
                    `)
                    .style("opacity", 1)
                    .style("left", (event.clientX + 12) + "px")
                    .style("top", (event.clientY + 12) + "px");
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", (event.clientX + 12) + "px")
                    .style("top", (event.clientY + 12) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .attr("stroke-width", 0.5)
                    .attr("stroke", "#0f172a");
                tooltip.style("opacity", 0);
            });

        // Label nama provinsi
        nodes.append("text")
            .attr("x", 4)
            .attr("y", 12)
            .attr("fill", "#000000ff")
            .attr("font-size", "10px")
            .attr("pointer-events", "none")
            .text(d => {
                const w = d.x1 - d.x0;
                const name = d.data.province || "";
                if (w < 40) {
                    return "";
                } else if (w < 80) {
                    return name.length > 8 ? name.slice(0, 8) + "…" : name;
                } else {
                    return name;
                }
            });

        // LEGEND GRADIENT GOLD → MAROON

        const legendWidth = Math.min(innerWidth * 0.5, 260);
        const legendHeight = 10;
        const legendX = margin.left + (innerWidth - legendWidth) / 2;
        const legendY = 8;

        const defs = svg.append("defs");
        const gradientId = "clusterGradient";

        const gradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", color(minCluster));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", color(maxCluster));

        svg.append("rect")
            .attr("x", legendX)
            .attr("y", legendY)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .attr("fill", `url(#${gradientId})`)
            .attr("stroke", "#e5e7eb")
            .attr("stroke-width", 0.5);

        const legendScale = d3.scaleLinear()
            .domain([minCluster, maxCluster])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(maxCluster - minCluster)
            .tickFormat(d3.format("d"))
            .tickSize(0);

        svg.append("g")
            .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
            .call(legendAxis)
            .selectAll("text")
            .attr("fill", "#e5e7eb")
            .attr("font-size", "10px");

        svg.selectAll(".domain").attr("stroke", "none");

        svg.append("text")
            .attr("x", legendX + legendWidth / 2)
            .attr("y", legendY - 4)
            .attr("text-anchor", "middle")
            .attr("fill", "#e5e7eb")
            .attr("font-size", "10px")
            .text("Rentang Cluster");
    }).catch(err => {
        console.error("Error muat heatmap cluster:", err);
    });
});