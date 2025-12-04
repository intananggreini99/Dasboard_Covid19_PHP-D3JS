renderResponsive("#line-chart", (width, height) => {
    const container = d3.select("#line-chart");
    container.selectAll("*").remove();

    // Hapus tooltip lama kalau ada (karena renderResponsive bisa dipanggil ulang)
    d3.selectAll(".line-tooltip").remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "line-tooltip")
        .style("position", "fixed")
        .style("pointer-events", "none")
        .style("background", "#020617")
        .style("color", "#e5e7eb")
        .style("border", "1px solid #4b5563")
        .style("border-radius", "0.25rem")
        .style("padding", "0.4rem 0.6rem")
        .style("font-size", "11px")
        .style("opacity", 0)
        .style("z-index", 50);

    d3.json("connectDB/get_time_series_newcases.php").then(raw => {
        if (!Array.isArray(raw)) {
            console.error("Line data error:", raw);
            return;
        }

        const parseMDY = d3.timeParse("%m/%d/%Y");
        const parseDMY = d3.timeParse("%d/%m/%Y");

        function parseAnyDate(s) {
            return parseMDY(s) || parseDMY(s) || new Date(s);
        }

        const data = raw.map(d => ({
            date: parseAnyDate(d.time),
            value: +d.totalNewCases
        })).filter(d => d.date && !isNaN(d.value));

        if (!data.length) {
            console.warn("Line chart: tidak ada data setelah parsing.");
            return;
        }

        // Pastikan data terurut
        data.sort((a, b) => d3.ascending(a.date, b.date));

        const x = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)]).nice()
            .range([innerHeight, 0]);

        // Grid horizontal
        g.append("g")
            .call(
                d3.axisLeft(y)
                    .ticks(6)
                    .tickSize(-innerWidth)
                    .tickFormat("")
            )
            .selectAll("line")
            .attr("stroke", "#1f2937")
            .attr("stroke-dasharray", "2,2");

        // Line utama
        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.value));

        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#ef4444")
            .attr("stroke-width", 2)
            .attr("d", line);

        const xAxis = d3.axisBottom(x)
            .ticks(8)
            .tickFormat(d3.timeFormat("%m/%d"));

        const yAxis = d3.axisLeft(y)
            .ticks(6);

        // Axis X
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("fill", "#e5e7eb")
            .attr("font-size", "10px");

        // Axis Y
        g.append("g")
            .call(yAxis)
            .selectAll("text")
            .attr("fill", "#e5e7eb")
            .attr("font-size", "10px");

        g.selectAll(".domain, .tick line")
            .attr("stroke", "#4b5563");

        // Label sumbu Y
        g.append("text")
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left + 12)
            .attr("transform", "rotate(-90)")
            .attr("fill", "#e5e7eb")
            .attr("font-size", "10px")
            .attr("text-anchor", "middle")
            .text("Total New Cases");

        // Legend kecil kiri bawah
        const legend = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${height - 10})`);

        legend.append("line")
            .attr("x1", 0)
            .attr("y1", -4)
            .attr("x2", 40)
            .attr("y2", -4)
            .attr("stroke", "#ef4444")
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 48)
            .attr("y", 0)
            .attr("fill", "#e5e7eb")
            .attr("font-size", "10px")
            .text("Total Daily New Cases");

        // ===== Tooltip interaktif (ala Grafana) =====
        const bisectDate = d3.bisector(d => d.date).left;

        const focusGroup = g.append("g")
            .style("display", "none");

        const focusLine = focusGroup.append("line")
            .attr("class", "focus-line")
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");

        const focusCircle = focusGroup.append("circle")
            .attr("r", 4)
            .attr("fill", "#ef4444")
            .attr("stroke", "#111827")
            .attr("stroke-width", 1.5);

        // overlay untuk menangkap mouse
        g.append("rect")
            .attr("class", "overlay")
            .attr("width", innerWidth)
            .attr("height", innerHeight)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", () => {
                focusGroup.style("display", null);
                tooltip.style("opacity", 1);
            })
            .on("mouseout", () => {
                focusGroup.style("display", "none");
                tooltip.style("opacity", 0);
            })
            .on("mousemove", function (event) {
                const [mx] = d3.pointer(event, this);
                const xDate = x.invert(mx);
                const idx = bisectDate(data, xDate, 1);
                const a = data[idx - 1];
                const b = data[idx];
                const d = !b ? a : (!a ? b :
                    (xDate - a.date > b.date - xDate ? b : a));

                const px = x(d.date);
                const py = y(d.value);

                focusGroup.attr("transform", `translate(${px},0)`);
                focusCircle.attr("cy", py);

                const fmtDate = d3.timeFormat("%Y-%m-%d");
                const dateStr = fmtDate(d.date);

                tooltip
                    .html(`
                        <div style="font-weight:600;margin-bottom:2px;">${dateStr}</div>
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="display:inline-block;width:12px;height:3px;border-radius:9999px;background:#ef4444;"></span>
                            <span>Total Daily New Cases</span>
                            <span style="font-weight:600;margin-left:4px;">${d.value.toLocaleString()}</span>
                        </div>
                    `)
                    .style("left", (event.clientX + 12) + "px")
                    .style("top", (event.clientY + 12) + "px");
            });
    }).catch(err => {
        console.error("Error muat line chart:", err);
    });
});
