/*
* Data Visualization - Framework
* Copyright (C) University of Passau
*   Faculty of Computer Science and Mathematics
*   Chair of Cognitive sensor systems
* Maintenance:
*   2024, Alexander Gall <alexander.gall@uni-passau.de>
*
* All rights reserved.
*/

// TODO: File for Part 2
// TODO: You can edit this file as you wish - add new methods, variables etc. or change/delete existing ones.

// TODO: use descriptive names for variables
let chart1, chart2, chart3, chart4;
// Extracts specified columns from the input data.

function extractColumns(data, columns) {
    return data.map(row => {
        let extracted = {};
        columns.forEach(col => {
            extracted[col] = row[col];
        });
        return extracted;
    });
}
//Groups data by a key column and sums the values of another column for each group.
function groupAndSumColumn(data, keyColumn, valueColumn) {
    return data.reduce((acc, item) => {
        const keyValue = item[keyColumn];
        if (keyValue !== undefined) {
            if (!acc[keyValue]) {
                acc[keyValue] = 0;
            }
            acc[keyValue] += item[valueColumn];
        }
        return acc;
    }, {});
}
//Groups data by a key column, taking the first part of a comma or space-separated string, and sums the values of another column for each group.
function groupAndSumColumnForMultiple(data, keyColumn, valueColumn) {
    return data.reduce((acc, item) => {
        if (typeof item[keyColumn] === 'string') {
            var keyValue = item[keyColumn].split(',')[0].split(' ')[0].toLowerCase();
            if (keyValue !== undefined) {
                if (!acc[keyValue]) {
                    acc[keyValue] = 0;
                }
                acc[keyValue] += item[valueColumn];
            }
        }
        return acc;
    }, {});
}
/**
 * Removes duplicates from an array of objects based on two properties, and returns a new array with renamed properties.
 *
 * @param {Array<Object>} arr - The input array of objects.
 * @param {string} prop1 - The first property to check for duplicates.
 * @param {string} prop2 - The second property to check for duplicates.
 * @param {string} newProp1 - The new property name for the first property.
 * @param {string} newProp2 - The new property name for the second property.
 * @returns {Array<Object>} A new array of objects with duplicates removed and properties renamed.
 */
function removeDuplicates(arr, prop1, prop2, newProp1, newProp2) {
    let seen = new Set();
    let uniqueArr = arr.filter(item => {
        let key = `${item[prop1]}|${item[prop2]}`;
        return seen.has(key) ? false : seen.add(key);
    });

    return uniqueArr.map(item => {
        return {
            [newProp1]: item[prop1],
            [newProp2]: item[prop2]
        };
    });
}

function initDashboard(_data) {

    // Extract data for each chart
    dataforChart1 = groupAndSumColumn(extractColumns(_data, ['region of incident', 'number of dead']), 'region of incident', 'number of dead');
    dataforChart2 = groupAndSumColumn(extractColumns(_data, ['cause of death', 'number of dead']), 'cause of death', 'number of dead');
    dataforChart3 = groupAndSumColumnForMultiple(extractColumns(_data, ['country of origin', 'number of dead']), 'country of origin', 'number of dead');
    dataforChart4 = removeDuplicates(extractColumns(_data, ['region of origin', 'region of incident']), 'region of origin', 'region of incident', 'source', 'target' ) ;


    //  SVG container
    chart1 = d3.select("#chart1").append("svg")
        .attr("width", width + 300)
        .attr("height", height + 100)
        .append("g");

    //  SVG container
    chart2 = d3.select("#chart2").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");


    //  SVG container
    chart3 = d3.select("#chart3").append("svg")
        .attr("width", width + 300)
        .attr("height", height + 100)
        .append("g");


    //  SVG container
    chart4 = d3.select("#chart4").append("svg")
        .attr("width", width)
        .attr("height", height + 400)
        .append("g");


    createChart1(dataforChart1);
    createChart2(dataforChart2);
    createChart3(dataforChart3);
    createChart4(dataforChart4);
}

function createChart1(bubbleData) {

    const projection = d3.geoNaturalEarth1()
        .scale(160)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const regionCoordinates = {
        "Caribbean": { lat: 18.5, lon: -66.5 },       // Near Puerto Rico
        "Central America": { lat: 15, lon: -90 },      // Near Guatemala
        "Eastern Africa": { lat: 0, lon: 37 },         // Near Kenya
        "Eastern Asia": { lat: 35, lon: 105 },         // Near China
        "Europe": { lat: 54, lon: 15 },                // Near Central Europe
        "Mediterranean": { lat: 35, lon: 18 },         // Near Central Mediterranean
        "North America": { lat: 45, lon: -100 },       // Near Central USA
        "Northern Africa": { lat: 25, lon: 13 },       // Near Libya
        "South America": { lat: -15, lon: -60 },       // Near Brazil
        "South-eastern Asia": { lat: 5, lon: 110 },    // Near Indonesia
        "Southern Africa": { lat: -30, lon: 25 },      // Near South Africa
        "Southern Asia": { lat: 20, lon: 80 },         // Near India
        "Western Africa": { lat: 10, lon: -10 },       // Near Mali
        "Western Asia": { lat: 35, lon: 45 }
    };

// Load and display the world
    d3.json("https://d3js.org/world-110m.v1.json").then(world => {
        chart1
            .selectAll("path")
            .data(topojson.feature(world, world.objects.countries).features)
            .enter().append("path")
            .attr("d", path)
            .attr("fill", "#ccc")
            .attr("stroke", "#333");
        bubbleData = Object.entries(bubbleData).map(([region, value]) => ({ region, value }));
        const colorScale = d3.scaleSequential(d3.interpolateCool)
            .domain([0, d3.max(bubbleData, d => d.value)]);
        chart1
            .selectAll("circle")
            .data(bubbleData)
            .enter().append("circle")
            .attr("index", d => d.value)
            .attr("cx", d => projection([regionCoordinates[d.region].lon, regionCoordinates[d.region].lat])[0])
            .attr("cy", d => projection([regionCoordinates[d.region].lon, regionCoordinates[d.region].lat])[1])
            .attr("r", d => {
                return Math.sqrt(d.value) /2
            }) 
            .attr("class", "bubble")
            .attr("fill", d => colorScale(d.value))
            .attr("fill-opacity", 0.5);
    });

}

function createChart2(data){
    const keys = Object.keys(data);
    const values = Object.values(data);

    const margin = { top: 20, right: 30, bottom: 40, left: 100 };

    chart2.attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(values)])
        .nice()
        .range([0, width - margin.left - margin.right]);

    const y = d3.scaleBand()
        .domain(keys)
        .range([0, height - margin.top - margin.bottom])
        .padding(0.1);

    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(d3.schemeCategory10);

    chart2.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5));

    chart2.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    chart2.selectAll(".bar")
        .data(keys)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d))
        .attr("x", 0)
        .attr("width", d => x(data[d]))
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d));

    chart2.append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", 0 - (margin.top / 3))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        ;
}

function createChart3(dataMap){

    const projection = d3.geoMercator()
        .translate([width / 1.3, height / 1.3]);

    const path = d3.geoPath().projection(projection);

    const color = d3.scaleQuantize()
        .domain([1, 100])
        .range(d3.schemeBlues[9]);
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function(world) {

        // Draw the map
        chart3.append("g")
            .selectAll("path")
            .data(world.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => {
                const value = dataMap[d.properties.name.toLowerCase()];
                return value ? color(value) : "#ccc";
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5);
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(d.properties.name + "<br>" + (dataMap[d.properties.name.toLowerCase()] || "No data"))
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Add tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    });

}

function createChart4(links){const margin = { top: 50, right: 50, bottom: 50, left: -130 };
    const svg = chart4
        .attr("transform", `translate(${margin.left},${margin.top})`);
    //  get all the nodes of arc Diagram
    let nodeSet = new Set();
    links.forEach(entry => {
        if (entry["source"]) {
            nodeSet.add(entry["source"]);
        }
        if (entry["target"]) {
            nodeSet.add(entry["target"]);
        }
    });
    let nodes = [...nodeSet];

// Create scales (you may need to adjust the domain and range based on your data)
    const yScale = d3.scalePoint()
        .domain(nodes)
        .range([0, height + 300]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Create links as arcs
    svg.selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d => {
            const sourceY = yScale(d.source);
            const targetY = yScale(d.target);
            const midpointY = (sourceY + targetY) / 2;
            const curvature = 5 ;

            return `M${width / 2},${sourceY} 
        C${width / 2 + curvature * 50},${sourceY} 
         ${width / 2 + curvature * 50},${targetY} 
         ${width / 2},${targetY}`;
        })
        .style("fill", "none")
        .style("stroke", d => colorScale(d.source))
        .style("stroke-width", 2)
        .on("pointerover", function(event, d) {
            d3.select(this)
                .style("stroke-width", 4);

            svg.append("text")
                .attr("class", "link-label")
                .attr("x", width / 2 + 200) 
                .attr("y", (yScale(d.source) + yScale(d.target)) / 2)
                .text(`${d.source} -> ${d.target}`)
                .style("fill", colorScale(d.source));
        })
        .on("pointerout", function(event, d) {
            d3.select(this)
                .style("stroke-width", 2);

            svg.selectAll(".link-label").remove();
        });

    svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("cx", width / 2)
        .attr("cy", d => yScale(d))
        .attr("r", 5)
        .style("fill", d => colorScale(d))
    svg.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2 - 100)
        .attr("y", function(d){ return yScale(d) })
        .text(function(d){ return d; })
        .style("fill", function(d) { return colorScale(d)});
}

// clear files if changes (dataset) occur
function clearDashboard() {

    chart1.selectAll("*").remove();
    chart2.selectAll("*").remove();
    chart3.selectAll("*").remove();
    chart4.selectAll("*").remove();
}