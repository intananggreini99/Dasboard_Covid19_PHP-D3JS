renderResponsive("#bar-chart", (width, height) => {
    const container = d3.select("#bar-chart");
    container.selectAll("*").remove();

    d3.selectAll(".bar-tooltip").remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 120 };
    const innerWidth = Math.max(width - margin.left - margin.right, 50);
    const innerHeight = Math.max(height - margin.top - margin.bottom, 50);

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "bar-tooltip")
        .style("position", "fixed")
        .style("pointer-events", "none")
        .style("background", "#020617")
        .style("color", "#e5e7eb")
        .style("border", "1px solid #4b5563")
        .style("border-radius", "0.25rem")
        .style("padding", "0.4rem 0.6rem")
        .style("font-size", "11px")
        .style("opacity", 0)
        .style("z-index", 60);

    d3.json("connectDB/get_total_newcases_province.php").then(data => {
        if (!Array.isArray(data)) {
            console.error("Bar data error:", data);
            return;
        }

        // Mengurutkan Data Secara Descending
        data.sort((a, b) => d3.descending(a.totalNewCases, b.totalNewCases));

        const provinces = data.map(d => d.province);
        const maxValue = d3.max(data, d => d.totalNewCases) || 1;

        const x = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, innerWidth])
            .nice();

        const y = d3.scaleBand()
            .domain(provinces)
            .range([0, innerHeight])
            .paddingInner(0.25);

        // Grid vertikal
        g.append("g")
            .attr("class", "grid")
            .call(
                d3.axisTop(x)
                    .ticks(5)
                    .tickSize(-innerHeight)
                    .tickFormat("")
            )
            .selectAll("line")
            .attr("stroke", "#1f2937")
            .attr("stroke-dasharray", "2,2");

        // Bars
        const bars = g.selectAll("rect.bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d.province))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.totalNewCases))
            .attr("fill", "rgba(248, 113, 113, 0.08)")   
            .attr("stroke", "#ef4444")                     
            .attr("stroke-width", 1.5)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("fill", "rgba(248, 113, 113, 0.3)");

                tooltip
                    .html(`
                        <div style="margin-bottom:4px;">
                            <span style="color:#9ca3af;">Province</span>
                            &nbsp;&nbsp;<span style="font-weight:600;">${d.province}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="display:inline-block;width:12px;height:3px;border-radius:9999px;background:#ef4444;"></span>
                            <span>Total New Cases</span>
                            <span style="margin-left:4px;font-weight:600;">${d.totalNewCases.toLocaleString()}</span>
                        </div>
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
                    .attr("fill", "rgba(248, 113, 113, 0.08)");
                tooltip.style("opacity", 0);
            });

        // Axis Y (nama provinsi)
        g.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .selectAll("text")
            .attr("fill", "#e5e7eb")
            .attr("font-size", "11px");

        g.selectAll(".domain").attr("stroke", "#4b5563");
    }).catch(err => {
        console.error("Error muat bar chart:", err);
    });
});
