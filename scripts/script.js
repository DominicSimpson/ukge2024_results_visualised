const initialCenter = [54.5, -2];
const initialZoom = 6;

const map = L.map('map').setView(initialCenter, initialZoom);
const tooltip = d3.select("#tooltip");


L.svg().addTo(map);

document.getElementById('reset-zoom').addEventListener('click', () => {
    map.setView(initialCenter, initialZoom); // Reset Zoom function
});
    
const svg = d3.select("#map").select("svg")
    .style("pointer-events", "auto")
    .attr("pointer-events", null);

const g = svg.append("g").attr("class", "");

const highlight = svg.append("path") // This ensures a full black border over each constituency on mouseover
    .attr("class", "highlight") // Otherwise some constituencies don't fully display the black border
    .attr("fill", "none") // Duplicate "highlight" layer above the map
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("pointer-events", "none"); // prevents it from intefering from hover

const projectPoint = function(x, y) {
    const point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}

const projection = d3.geoTransform({ point: projectPoint });
const path = d3.geoPath().projection(projection);

const partyColours = d3.scaleOrdinal()
    .domain([
        "Labour",
        "Conservative", 
        "Liberal Democrat", 
        "Scottish National Party", 
        "Green", 
        "Plaid Cymru", 
        "Reform UK", 
        "Democratic Unionist Party", 
        "Sinn Fein", 
        "Traditional Unionist Voice", 
        "Ulster Unionist Party", 
        "Alliance", 
        "Social Democratic and Labour Party", 
        "Independent", 
        "Other"
    ])
    .range([
        "#E4003B", 
        "#0087DC", 
        "#FAA61A", 
        "#FDF38E", 
        "#02A95B", 
        "#005B54", 
        "#12B6CF",
        "#D46A4C", 
        "#089280", 
        "#0C3A6A", 
        "#8ac6f5", 
        "#F6CB2F", 
        "#35cf37", 
        "#BFB0B0",
        "#130202"
    ]);

map.whenReady(() => {
    Promise.all([
        d3.json('data/uk_constituencies_2024_bsc.geojson'),
        d3.csv('data/ukge_electionresults_2024.csv')
])  
    .then(([geoData, electionData]) => {
        const resultsMap = new Map();
    
    electionData.forEach(d => {
        const id = d.ons_id.trim(); 
        d.votes = +d.votes;
        d.share = +d.share;

        if (d.party_name === 'Labour and Co-operative') {
            d.party_name = 'Labour';
        }

        if (!resultsMap.has(id) || d.votes > resultsMap.get(id).votes) {
            resultsMap.set(id, d);
        }
    });

    geoData.features.forEach(f => {
        const bounds = path.bounds(f);
        const geomWidth = bounds[1][0] - bounds[0][0];
        const geomHeight = bounds[1][1] - bounds[0][1];

        if (geomWidth > 800 || geomHeight > 1000) {
            console.warn(`Suspicious geometry: ${f.properties.PCON24NM} - Width: ${geomWidth}, Height: ${geomHeight}`);
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

    const features = geoData.features.filter(f => f.geometry && f.geometry.coordinates.length > 0)

    let selectedConstituency = null;

    const paths = g.selectAll("path")
        .data(features)
        .enter().append("path")
        .attr("fill", d => {
            const result = resultsMap.get(d.properties.PCON24CD);
            return partyColours(result?.party_name || "Other");
        })
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)
        .style("pointer-events", "visiblePainted")  // ensure interaction
        .on("click", function (event, d) {
            console.log("Clicked on:", d.properties.PCON24NM);

            selectedConstituency = d; // store the selected constituency 

            highlight
                .attr("d", path(d))
                .style("display", "inline");

            //Zoom in
            const featureBounds = path.bounds(d);
            // Convert to LatLngBounds using Leaflet's unproject
            const topLeft = map.layerPointToLatLng(featureBounds[0]);
            const bottomRight = map.layerPointToLatLng(featureBounds[1]);
            const bounds = L.latLngBounds(topLeft, bottomRight);

            map.fitBounds(bounds, {
                padding: [30, 30],
                maxZoom: 10
            });
        })
        .on("mouseover", function (event, d) {
            console.log("Mouse over:", d.properties.PCON24NM);
            highlight
                .attr("d", path(d))
                .style("display", "inline");

            d3.select(this).style("cursor", "pointer");

            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
                .style("display", "block")
                .html(`<strong>${d.properties.PCON24NM}</strong>`);
        })
        .on("mousemove", function (event) {
            tooltip
                .style("left", (event.pageX + 10), "px")
                .style("right", (event.pageY + 10), "px");
        })
        .on("mouseout", function () {
            highlight
                .style("display", "none");
            d3.select(this).style("cursor", "default");
        });

    svg.on("mouseleave", () => {
        d3.selectAll("path").style("cursor", "default");
    });   

    console.log("Number of paths:", paths.size()); // should be > 0
  
    const update = () => {
        paths.attr("d", path);
        if (selectedConstituency) {
            highlight.attr("d", path(selectedConstituency));
        }
    };

    update();

    map.on("zoom move viewreset", () => {
        requestAnimationFrame(update);
        });
    });
});

console.log("SVG is attached to:", svg.node());
