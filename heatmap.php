<?php ?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Dashboard Covid-19 D3JS</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Tailwind CDN (OK untuk development) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        /* hapus scrollbar horizontal jika ada */
        body, html {
            overflow-x: hidden;
        }
    </style>
</head>
<body class="bg-slate-950 text-slate-100">

<div class="relative min-h-screen">

    <!-- SIDEBAR -->
    <aside class="fixed inset-y-0 left-0 w-64 bg-red-800 text-white z-50 shadow-lg flex flex-col">
        <div class="space-y-4">
            <div class="mx-3 py-3 border-b border-white border-slate-700">
                <h1 class="my-2 text-lg text-white font-semibold">Visualization Chart</h1>
            </div>

            <nav class="flex flex-wrap justify-centerspace-y-2 space-y-4 text-sm px-[25px]">
                <button class="btn-nav w-full bg-black hover:bg-gray-700 text-white py-2 rounded-md"
                        onclick="scrollToSection('map-section')"><a href="index.php">Home</a></button>
                <button class="btn-nav w-full bg-black hover:bg-gray-700 text-white py-2 rounded-md"
                        onclick="scrollToSection('map-section')"><a href="maps.php">Map Distibution Cases</a></button>
                <button class="btn-nav w-full bg-black hover:bg-gray-700 text-white py-2 rounded-md"
                        onclick="scrollToSection('heatmap-section')"><a href="heatmap.php">Cluster Cases by Province</a></button>
                <button class="btn-nav w-full bg-black hover:bg-gray-700 text-white py-2 rounded-md"
                        onclick="scrollToSection('line-section')"><a href="lineChart.php">Total New Cases by Date</a></button>
                <button class="btn-nav w-full bg-black hover:bg-gray-700 text-white py-2 rounded-md"
                        onclick="scrollToSection('bar-section')"><a href="barChart.php">Total New Cases by Province</a></button>
                <button class="btn-nav w-full bg-black hover:bg-gray-700 text-white py-2 rounded-md"
                        onclick="scrollToSection('donut-section')"><a href="donuts.php">Total Recovered VS Total Deaths</button>
                <button class=" btn-nav w-full bg-black hover:bg-gray-700 text-white py-2 rounded-md"
                        onclick="scrollToSection('score-section')"><a href="scoreCard.php">Total Cases Confirmed</button>
            </nav>
            <footer class="absolute inset-x-0 bottom-0 bg-red-900  text-center py-3 text-xs text-white">
                © 2025 Intan Dwi Anggreini | SDT A
            </footer>
        </div>
    </aside>

    <!-- KONTEN UTAMA -->
    <main class="bg-black min-h-screen ml-[25px] p-3 md:p-4 overflow-auto md:pl-64">
        <header class="mb-4">
            <h2 class="text-red-600 text-xl md:text-2xl font-semibold hover:text-white"><a href="index.php">Distribution Covid19 Cases</a></h2>
            <p class="text-xs text-slate-400">In Indonesia Country</p>
        </header>

        <div class="min-w-full ">
            <!-- HEATMAP CLUSTER – kiri tengah (penuh 2 kolom) -->
            <section id="heatmap-section"
                     class="bg-black border border-slate-700 rounded-lg p-3 md:p-4 flex flex-col
                            xl:col-span-2 xl:row-span-1 h-[50%] py-5">
                <div class="mb-2">
                    <h3 class="text-center text-sm md:text-base font-semibold">Cluster Cases by Province</h3>
                </div>
                <div id="heatmap-cluster" class="flex-1 "></div>
            </section>

        </div><!-- end grid -->
    </main>
</div>

<!-- D3 -->
<script src="https://d3js.org/d3.v7.min.js"></script>

<!-- Helper: renderResponsive (dipakai semua grafik) -->
<script>
if (!window.renderResponsive) {
    window.renderResponsive = function (selector, drawFn) {
        const container = document.querySelector(selector);
        if (!container) return;

        function render() {
            const rect = container.getBoundingClientRect();
            const width = rect.width || container.clientWidth || 400;
            const height = rect.height || 300;
            drawFn(width, height);
        }

        // pertama kali
        render();

        // update saat resize
        const observer = new ResizeObserver(render);
        observer.observe(container);
    };
}

// helper scroll ke section
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
</script>

<!-- Script JavaScript Visualisasi dengan D3JS -->
<script src="visualize_js/d3_heatmap_cluster.js"></script>

</body>
</html>
