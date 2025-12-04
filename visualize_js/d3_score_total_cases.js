async function loadScoreCard() {
    try {
        const data = await d3.json("connectDB/get_total_cases.php");

        const totalCases = data.total_cases || 0;

        d3.select("#score-card")
            .html(`<p class="text-[30px] md:text-[45px] text-red-600 font-semibold">${totalCases.toLocaleString()}</p>`);
    } catch (error) {
        console.error("Error loading score card:", error);
    }
}

loadScoreCard();