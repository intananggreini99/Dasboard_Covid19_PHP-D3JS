renderResponsive("#donut-chart", (width, height) => {
    const container = d3.select("#donut-chart");
    container.selectAll("*").remove();

    // Hapus tooltip lama
    d3.selectAll(".donut-tooltip").remove();

    const size = Math.min(width, height);
    const radius = size / 2 - 10;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "donut-tooltip")
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

    d3.json("connectDB/get_donuts_totals.php").then(totals => {
        if (!totals || totals.error) {
            console.error("Donut data error:", totals);
            return;
        }

        const data = [
            { label: "Total Recovered", value: totals.totalRecovered },
            { label: "Total Deaths",    value: totals.totalDeaths }
        ];

        const totalAll = d3.sum(data, d => d.value);

        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            // merah terang untuk recovered, merah tua untuk deaths
            .range(["#ef4444", "#7f1d1d"]);

        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius);

        const labelArc = d3.arc()
            .innerRadius(radius * 0.8)
            .outerRadius(radius * 0.8);

        const arcs = g.selectAll("g.slice")
            .data(pie(data))
            .enter()
            .append("g")
            .attr("class", "slice");

        arcs.append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.label))
            .attr("stroke", "#020617")
            .attr("stroke-width", 2)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .attr("stroke", "#e5e7eb")
                    .attr("stroke-width", 2.5);

                const pct = d.data.value / totalAll * 100;

                tooltip
                    .html(`
                        <div style="font-weight:600;margin-bottom:2px;">${d.data.label}</div>
                        <div>${d.data.value.toLocaleString()}</div>
                        <div style="color:#9ca3af;">${pct.toFixed(1)}%</div>
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
                    .attr("stroke", "#020617")
                    .attr("stroke-width", 2);
                tooltip.style("opacity", 0);
            });

        // Teks persentase besar di atas arc (seperti contoh 84% dan 16%)
        arcs.append("text")
            .attr("transform", d => `translate(${labelArc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("fill", "#f9fafb")
            .attr("font-size", "12px")
            .attr("font-weight", "700")
            .text(d => {
                const pct = d.data.value / totalAll * 100;
                // hanya tampilkan kalau > 3% supaya tidak menumpuk
                return pct >= 3 ? `${Math.round(pct)}%` : "";
            });

        // Legend di bawah donut (kiri bawah chart)
        const legend = svg.append("g")
            .attr("transform", `translate(${10}, ${height - 18})`);

        const legendItem = legend.selectAll("g")
            .data(data)
            .enter()
            .append("g")
            .attr("transform", (d, i) => `translate(${i * 140}, 0)`);

        legendItem.append("rect")
            .attr("width", 18)
            .attr("height", 4)
            .attr("y", -6)
            .attr("fill", d => color(d.label));

        legendItem.append("text")
            .attr("x", 24)
            .attr("y", 0)
            .attr("fill", "#e5e7eb")
            .attr("font-size", "11px")
            .text(d => d.label);
    }).catch(err => {
        console.error("Error muat donut:", err);
    });
});
