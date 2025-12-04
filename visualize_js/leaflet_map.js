document.addEventListener("DOMContentLoaded", () => {

    const mapContainer = document.getElementById("leaflet-map");
    if (!mapContainer) return;

    if (typeof L === "undefined") {
        console.error(
            'Leaflet (L) is not loaded. Pastikan <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"> sudah di-include sebelum leaflet_map.js'
        );
        return;
    }

    // KONFIGURASI KONEKSI DATA
    const COVID_API_URL = "connectDB/get_covid_recap.php";
    const GEOJSON_URL =
        "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-province-simple.json";

    // Simpan layer & marker yang sedang dipilih
    let selectedLayer = null;
    let selectedMarker = null;

    // POPUP 
    function hideProvincePopup() {
        const existing = document.getElementById("province-popup-backdrop");
        if (existing) {
            existing.remove();
        }
    }

    function downloadProvinceExcel({ displayName, totalCases, totalRecovered, totalDeaths, lon, lat }) {
        const rows = [
            ["Province", displayName],
            ["Total Cases", totalCases],
            ["Total Recovered", totalRecovered],
            ["Total Deaths", totalDeaths],
            ["Longitude", lon ?? ""],
            ["Latitude", lat ?? ""]
        ];

        let tsv = "";
        rows.forEach((r) => {
            tsv += `${r[0]}\t${r[1]}\n`;
        });

        const blob = new Blob([tsv], {
            type: "application/vnd.ms-excel;charset=utf-8;"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const safeName = (displayName || "province").replace(/\s+/g, "_");
        a.download = `covid_${safeName}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function showProvincePopup(stats) {
        // stats: { displayName, totalCases, totalRecovered, totalDeaths, lon, lat }
        hideProvincePopup(); 

        const { displayName, totalCases, totalRecovered, totalDeaths, lon, lat } = stats;

        const backdrop = document.createElement("div");
        backdrop.id = "province-popup-backdrop";
        backdrop.className =
            "fixed inset-0 z-[9999] flex items-center justify-center bg-black/60";

        backdrop.innerHTML = `
            <div class="bg-slate-900 text-slate-50 rounded-2xl shadow-2xl border border-slate-600 w-full max-w-md mx-4">
                <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                    <h3 class="font-semibold text-lg">${displayName}</h3>
                    <button id="province-popup-close"
                            class="text-slate-400 hover:text-white text-xl leading-none">
                        &times;
                    </button>
                </div>
                <div class="p-4 text-sm">
                    <table class="w-full text-left border-collapse text-[13px]">
                        <tbody>
                            <tr class="border-b border-slate-700/60">
                                <th class="py-1 pr-4 font-semibold text-slate-300">Total Cases</th>
                                <td class="py-1 font-bold text-red-400">
                                    ${Number(totalCases).toLocaleString()}
                                </td>
                            </tr>
                            <tr class="border-b border-slate-700/60">
                                <th class="py-1 pr-4 font-semibold text-slate-300">Total Recovered</th>
                                <td class="py-1 font-semibold text-emerald-400">
                                    ${Number(totalRecovered).toLocaleString()}
                                </td>
                            </tr>
                            <tr class="border-b border-slate-700/60">
                                <th class="py-1 pr-4 font-semibold text-slate-300">Total Deaths</th>
                                <td class="py-1 font-semibold text-orange-300">
                                    ${Number(totalDeaths).toLocaleString()}
                                </td>
                            </tr>
                            <tr>
                                <th class="py-1 pr-4 font-semibold text-slate-300">Longitude</th>
                                <td class="py-1 text-slate-200">${lon ?? "-"}</td>
                            </tr>
                            <tr>
                                <th class="py-1 pr-4 font-semibold text-slate-300">Latitude</th>
                                <td class="py-1 text-slate-200">${lat ?? "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="flex justify-end gap-2 px-4 py-3 border-t border-slate-700">
                    <button id="province-popup-close-bottom"
                            class="px-3 py-1.5 rounded-md text-xs md:text-sm bg-slate-700 hover:bg-slate-600 text-slate-100">
                        Close
                    </button>
                    <button id="province-download-btn"
                            class="px-3 py-1.5 rounded-md text-xs md:text-sm bg-red-600 hover:bg-red-500 text-white font-semibold">
                        Download Excel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);

        const closeEls = [
            backdrop.querySelector("#province-popup-close"),
            backdrop.querySelector("#province-popup-close-bottom")
        ].filter(Boolean);

        closeEls.forEach((btn) =>
            btn.addEventListener("click", () => {
                hideProvincePopup();
            })
        );

        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) {
                hideProvincePopup();
            }
        });

        const downloadBtn = backdrop.querySelector("#province-download-btn");
        if (downloadBtn) {
            downloadBtn.addEventListener("click", () => downloadProvinceExcel(stats));
        }
    }

    // NORMALISASI NAMA PROVINSI
    function normalizeName(nameRaw) {
        if (!nameRaw) return "";
        let n = nameRaw.toString().toLowerCase().trim();

        // buang titik, koma, spasi ganda
        n = n
            .replace(/\./g, "")
            .replace(/,/g, "")
            .replace(/\s+/g, " ")
            .trim();

        // menggabungkan spasi agar mudah dipetakan
        const key = n.replace(/\s+/g, "");

        const mapping = {
            // Aceh
            diaceh: "aceh",
            diah: "aceh",
            daerahistimewaaceh: "aceh",

            // Yogyakarta
            daerahistimewayogyakarta: "yogyakarta",
            diyogyakarta: "yogyakarta",
            diy: "yogyakarta",

            // Jakarta
            dkijakarta: "jakarta",
            jakarta: "jakarta",

            // Papua lama di shapefile
            irianjayatimur: "papua",
            irianjayatengah: "papua",
            irianjayabarat: "papuabarat"

        };

        return mapping[key] || key;
    }

    // INISIALISASI MAP LEAFLET 
    const map = L.map("leaflet-map", {
        zoomControl: true,
        attributionControl: false
    }).setView([-2.5, 118], 4.5); //pusat Indonesia

    // Tile layer 
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18
    }).addTo(map);

    // LOAD DATA (GEOJSON + COVID)
    Promise.all([fetch(GEOJSON_URL).then((r) => r.json()), fetch(COVID_API_URL).then((r) => r.json())])
        .then(([geojson, covidData]) => {
            // mapping data covid per provinsi (normalize nama)
            const covidByKey = {};

            covidData.forEach((row) => {
                const provName = row.province || row.Province || row.provinsi;
                const key = normalizeName(provName);

                if (!covidByKey[key]) {
                    covidByKey[key] = {
                        province: provName,
                        totalCases: 0,
                        totalRecovered: 0,
                        totalDeaths: 0,
                        longitude: row.longitude,
                        latitude: row.latitude
                    };
                }

                covidByKey[key].totalCases += Number(row.totalCases || row.totalcases || row.newCases || 0);
                covidByKey[key].totalRecovered += Number(
                    row.totalRecovered || row.totalrecovered || row.newrecovered || 0
                );
                covidByKey[key].totalDeaths += Number(
                    row.totalDeaths || row.totaldeaths || row.newdeaths || 0
                );

                // update lon/lat 
                if (row.longitude != null) covidByKey[key].longitude = row.longitude;
                if (row.latitude != null) covidByKey[key].latitude = row.latitude;
            });

            // Menampilkan Tooltip data COVID ke setiap feature GeoJSON/provinsi
            geojson.features.forEach((f) => {
                const rawName =
                    f.properties.Propinsi ||
                    f.properties.Provinsi ||
                    f.properties.NAME_1 ||
                    f.properties.name ||
                    f.properties.province;

                const key = normalizeName(rawName);
                const stats = covidByKey[key];

                if (stats) {
                    f.properties.totalCases = stats.totalCases;
                    f.properties.totalRecovered = stats.totalRecovered;
                    f.properties.totalDeaths = stats.totalDeaths;
                    f.properties.longitude = stats.longitude;
                    f.properties.latitude = stats.latitude;
                    f.properties.displayName = stats.province || rawName;
                } else {
                    f.properties.totalCases = 0;
                    f.properties.totalRecovered = 0;
                    f.properties.totalDeaths = 0;
                    f.properties.displayName = rawName || "Unknown";
                }
            });

            // SKALA WARNA AREA WILAYAH (GRADIASI KUNING → MERAH) 
            const maxCases = geojson.features.reduce(
                (max, f) => Math.max(max, Number(f.properties.totalCases) || 0),
                0
            );

            const t1 = maxCases * 0.25;
            const t2 = maxCases * 0.5;
            const t3 = maxCases * 0.75;

            function getColorFromCases(cases) {
                if (cases > t3) return "#cc0000"; // merah tua
                if (cases > t2) return "#ff4444"; // merah
                if (cases > t1) return "#ffbb33"; // kuning-gold
                return "#fff7cc"; // cream
            }

            // AREA PROVINSI
            const geoLayer = L.geoJSON(geojson, {
                style: function (feature) {
                    const totalCases = Number(feature.properties.totalCases) || 0;

                    return {
                        fillColor: getColorFromCases(totalCases),
                        weight: 1,
                        color: "#111827",
                        fillOpacity: 0.9
                    };
                },

                onEachFeature: function (feature, layer) {
                    const p = feature.properties;

                    const displayName =
                        p.displayName || p.Propinsi || p.Provinsi || p.name || "Unknown";

                    const totalCases = Number(p.totalCases) || 0;
                    const totalRecovered = Number(p.totalRecovered) || 0;
                    const totalDeaths = Number(p.totalDeaths) || 0;
                    const lon = p.longitude ?? "-";
                    const lat = p.latitude ?? "-";

                    // TOOLTIP
                    const tooltipHtml = `
                        <div class="text-[11px] leading-tight">
                            <div class="font-semibold text-sm mb-1">${displayName}</div>
                            <div>Total Cases: <span class="font-semibold">
                                ${totalCases.toLocaleString()}
                            </span></div>
                            <div>Total Recovered: <span class="font-semibold">
                                ${totalRecovered.toLocaleString()}
                            </span></div>
                            <div>Total Deaths: <span class="font-semibold">
                                ${totalDeaths.toLocaleString()}
                            </span></div>
                            <div class="mt-[2px] text-[10px] text-slate-400">
                                Lon: ${lon} | Lat: ${lat}
                            </div>
                        </div>
                    `;

                    layer.bindTooltip(tooltipHtml, {
                        sticky: true,
                        direction: "top",
                        opacity: 0.95,
                        className:
                            "covid-tooltip text-xs bg-slate-900/95 text-slate-50 " +
                            "px-3 py-2 rounded-lg shadow-lg border border-slate-600"
                    });

                    // EFEK HOVER
                    layer.on("mouseover", function () {
                        if (layer !== selectedLayer) {
                            layer.setStyle({
                                weight: 2,
                                color: "#f97373"
                            });
                        }
                    });

                    layer.on("mouseout", function () {
                        if (layer !== selectedLayer) {
                            geoLayer.resetStyle(layer);
                        }
                    });

                    // TOGGLE PROVINSI TERPILIH + MARKER + POPUP
                    layer.on("click", function () {
                        const isSameAsSelected = selectedLayer === layer;

                        // reset style & marker sebelumnya
                        if (selectedLayer) {
                            geoLayer.resetStyle(selectedLayer);
                        }
                        if (selectedMarker) {
                            map.removeLayer(selectedMarker);
                            selectedMarker = null;
                        }

                        // Efek klik kedua pada provinsi yang sama -> deselect & tutup popup
                        if (isSameAsSelected) {
                            selectedLayer = null;
                            hideProvincePopup();
                            return;
                        }

                        selectedLayer = layer;

                        // merubah warna provinsi terpilih menjadi merah
                        layer.setStyle({
                            fillColor: "#cc0000",
                            weight: 2,
                            color: "#f97373",
                            fillOpacity: 0.95
                        });

                        // marker di tengah provinsi
                        const center = layer.getBounds().getCenter();
                        selectedMarker = L.circleMarker(center, {
                            radius: 6,
                            weight: 2,
                            color: "#f97373",
                            fillColor: "#f97373",
                            fillOpacity: 1
                        }).addTo(map);

                        // buka tooltip di provinsi yang diklik
                        layer.openTooltip();

                        // fokuskan peta
                        map.flyTo(center, Math.max(map.getZoom(), 5), {
                            duration: 0.5
                        });

                        // tampilkan popup tabel + tombol download
                        showProvincePopup({
                            displayName,
                            totalCases,
                            totalRecovered,
                            totalDeaths,
                            lon,
                            lat
                        });
                    });
                }
            }).addTo(map);
        })
        .catch((err) => {
            console.error("Error loading Leaflet map data:", err);
        });
});