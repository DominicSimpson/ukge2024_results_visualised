console.log("Hello World!");

const width = 960, height = 1160;

const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "white");

const projection = d3.geoMercator()
    .scale(4000)
    .center([-2, 54.5])
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const partyColours = d3.scaleOrdinal()
    .domain(["Labour", "Conservative", "Liberal Democrats", "SNP", "Green", "Others"])
    .range(["#E4003B", "#0087DC", "#FAA61A", "#FFF95D", "#6AB023", "#CCCCCC"]);

Promise.all([
    d3.json('data/uk_constituencies_2024.geojson'),
    d3.csv('data/ukge_electionresults_2024.csv')
])
.then(([geoData, electionData]) => {
    const resultsMap = new Map();
    
    electionData.forEach(d => {
        const id = d.ons_id.trim(); 
        d.votes = +d.votes;
        d.share = +d.share;

        if (!resultsMap.has(id) || d.votes > resultsMap.get(id).votes) {
        resultsMap.set(id, d);
        }
    });

    console.log("First 5 election entries:", electionData.slice(0, 5));
    console.log("Sample GeoJSON ID:", geoData.features[0].properties.PCON24CD);
    console.log("Sample CSV ID:", electionData[0].ons_id);


    let matches = 0;
    geoData.features.forEach(f => {
        if (resultsMap.has(f.properties.PCON24CD)) matches++;
    });
    console.log(`Matched ${matches} constituencies with results`);

    svg.selectAll("path")
        .data(geoData.features.filter(f => f.geometry && f.geometry.coordinates.length > 0))
        .enter().append("path")
            .attr("class", "constituency")
            .attr("d", path)
            .attr("fill", d => {
                const result = resultsMap.get(d.properties.PCON24CD);
                return partyColours(result?.party_name || "Others");
            })
            .append("title")
            .text(d => {
                const result = resultsMap.get(d.properties.PCON24CD);
                return result
                    ? `${d.properties.PCON24NM}
    Winner: ${result.candidate_first_name} ${result.candidate_surname}
    Party:  ${result.party_name}
    Votes:  ${result.votes}
    Share   ${(result.share * 100).toFixed(2)}%`
                        : `${d.properties.PCON24NM}: No result`;
            });
});