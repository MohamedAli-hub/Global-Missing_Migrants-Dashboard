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

// scatterplot axes
let xAxis, yAxis, xAxisLabel, yAxisLabel;
// radar chart axes
let radarAxes, radarAxesAngle;

let dimensions = ["dimension 1", "dimension 2", "dimension 3", "dimension 4", "dimension 5", "dimension 6"];
let legendLabel = ""
//*HINT: the first dimension is often a label; you can simply remove the first dimension with
// dimensions.splice(0, 1);

// the visual channels we can use for the scatterplot
let channels = ["scatterX", "scatterY", "size"];

// size of the plots
let margin, width, height, radius;
// svg containers
let scatter, radar, dataTable;
// Add additional variables
let minScale = []
let maxScale = [];
let data;
let colors = ["red", "green", "blue", "purple", "yellow", "pink"];
let selectedPoints = []

function getLabel(arr1, arr2) {
    for (let i = 0; i < arr1.length; i++) {
        if (!arr2.includes(arr1[i])) {
            return arr1[i];
        }
    }
    return arr1[0];
}

function splitCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }

    fields.push(currentField.trim());

    return fields.map(field => field.replace(/^"|"$/g, '').trim());
}

function init() {
    // define size of plots
    margin = {top: 20, right: 20, bottom: 20, left: 50};
    width = 600;
    height = 500;
    radius = width / 2;

    // Start at default tab
    document.getElementById("defaultOpen").click();

	// data table
	dataTable = d3.select('#dataTable');
 
    // scatterplot SVG container and axes
    scatter = d3.select("#sp").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    // radar chart SVG container and axes
    radar = d3.select("#radar").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");


    // read and parse input file
    let fileInput = document.getElementById("upload"), readFile = function () {

        // clear existing visualizations
        clear();

        let reader = new FileReader();
        reader.onloadend = function () {
            console.log("data loaded: ");
            res = reader.result;
            //console.log(res)
            dimensions = []
            data = []
            res = res.split("\n");
            columns = res[0].toLowerCase().trim().split(",");
            res.shift();
            while(res.length > 0){
                let line = splitCSVLine(res[0]);

                const insertedData = {}
                for (let j = 0; j < line.length; j++) {
                    if(!isNaN(line[j])) {
                        insertedData[columns[j]] = parseFloat(line[j]);
                        if(res.length === columns.length){
                            dimensions.push(columns[j]);
                        }
                    } else {
                        insertedData[columns[j]] = line[j];
                    }
                }
                data.push(insertedData);
                res.shift();
            }
            legendLabel = getLabel(columns, dimensions)
            console.log(dimensions)
            console.log(data)
            initVis(data);
            CreateDataTable(data);
            // TODO: possible place to call the dashboard file for Part 2
            initDashboard(data);
        };
        reader.readAsText(fileInput.files[0], 'ISO-8859-1');

    };
    fileInput.addEventListener('change', readFile);
}


function initVis(_data){

    // TODO: parse dimensions (i.e., attributes) from input file


    // y scalings for scatterplot
    // TODO: set y domain for each dimension
    for(let i=0; i<dimensions.length; i++){
        let dimension = dimensions[i];
        minScale[dimension] = Math.min(..._data.filter(o => (o[dimension] !== undefined && !isNaN(o[dimension]))).map(o => {
            return o[dimension];
        }));
        maxScale[dimension] = Math.max(..._data.filter(o => (o[dimension] !== undefined && !isNaN(o[dimension])))
            .map(o => {
            return o[dimension];
        }));
    }
    // radar chart axes
    radarAxesAngle = Math.PI * 2 / dimensions.length;
    let axisRadius = d3.scaleLinear()
        .range([0, radius]);
    let maxAxisRadius = 0.75,
        textRadius = 0.8;
    gridRadius = 0.1;

    // radar axes
    radarAxes = radar.selectAll(".axis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis");

    radarAxes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function(d, i){ return radarX(axisRadius(maxAxisRadius), i); })
        .attr("y2", function(d, i){ return radarY(axisRadius(maxAxisRadius), i); })
        .attr("class", "line")
        .style("stroke", "black");

    // TODO: render grid lines in gray

    for(let j=0; j<dimensions.length; j++){
        radarLines = radar.selectAll(".axis")
            .data(d3.range(gridRadius, maxAxisRadius, gridRadius))
            .append("line")
            .attr("x1", function(d) { return radarX(axisRadius(d), j); }) // Starting point x-coordinate
            .attr("y1", function(d) { return radarY(axisRadius(d), j); }) // Starting point y-coordinate
            .attr("x2", function(d) { return radarX(axisRadius(d), (j + 1) % dimensions.length); }) // Ending point x-coordinate (wrap around to the first dimension)
            .attr("y2", function(d) { return radarY(axisRadius(d), (j + 1) % dimensions.length); }) // Ending point y-coordinate (wrap around to the first dimension)
            .style("stroke", "gray") // Line color
            .style("stroke-dasharray", "2,2"); // Make the line dashed
    }
    // TODO: render correct axes labels
    radar.selectAll(".axisLabel")
        .data(dimensions)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function(d, i){ return radarX(axisRadius(textRadius), i); })
        .attr("y", function(d, i){ return radarY(axisRadius(textRadius), i); })
        .text(function(d){ return d; });



    // init menu for the visual channels
    channels.forEach(function(c){
        initMenu(c, dimensions);
    });

    // refresh all select menus
    channels.forEach(function(c){
        refreshMenu(c);
    });

    renderScatterplot();
    renderRadarChart();
}

// clear visualizations before loading a new file
function clear(){
    scatter.selectAll("*").remove();
    radar.selectAll("*").remove();
    dataTable.selectAll("*").remove();
}

//Create Table
function CreateDataTable(_data) {

    // TODO: create table and add class
    var table = d3.select('#dataTable');
    table.attr('class', 'container dataTableClass');
    // TODO: add headers, row & columns
    var headers = table.append('thead').append('tr');
    var headerColumns = Object.keys(data[0]);
    headers.selectAll('th').data(headerColumns)
        .enter()
        .append('th')
        .attr('class', 'tableHeaderClass')
        .text(function (d) { return d;})

    var rows = table.append('tbody').selectAll('tr')
        .data(data)
        .enter()
        .append('tr')

    var cells = rows.selectAll('td')
        .data(function(row) {
            return headerColumns.map(function(column) {
                return { column: column, value: row[column] };
            });
        })
        .enter()
        .append('td')
        .attr('class', 'tableBodyClass')
        .text(function(d) { return d.value; });

    // TODO: add mouseover event
    cells.on('mouseover', function() {
        d3.select(this).style('background-color', '#7db9e8');
    }).on('mouseout', function() {
        d3.select(this).style('background-color', 'white');
    });
}
function renderScatterplot(){

    // TODO: get domain names from menu and label x- and y-axis
    let scatterx = document.getElementById("scatterX").value
    let scattery = document.getElementById("scatterY").value
    let size = document.getElementById("size").value

    // TODO: re-render axes

    let y = d3.scaleLinear()
        .domain([minScale[scattery], maxScale[scattery]])
        .range([height - margin.bottom - margin.top, margin.top]);

    let x = d3.scaleLinear()
        .domain([minScale[scatterx], maxScale[scatterx]])
        .range([margin.left, width - margin.left - margin.right]);

    let r = d3.scaleLinear()
        .domain([minScale[size], maxScale[size]])
        .range([5, 10]);

    scatter.selectAll("*").remove();
    d3.select("#legend").select("svg").remove();
    radar.selectAll("g[item]").remove()
    if(selectedPoints !== undefined) {
        for (const [key, value] of Object.entries(selectedPoints)) {
            colors.push(value);
        }
    }

    yAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ")")
        .call(d3.axisLeft(y));

    yAxisLabel = yAxis.append("text")
        .style("text-anchor", "middle")
        .attr("y", margin.top / 2)
        .text(scatterx);

    xAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, " + (height - margin.bottom - margin.top) + ")")
        .call(d3.axisBottom(x));

    xAxisLabel = xAxis.append("text")
        .style("text-anchor", "middle")
        .attr("x", width - margin.right)
        .text(scattery);

    let legend = d3.select("#legend").append("svg").attr("width", 590)

    selectedPoints = []
    selectedPointsInverted = []
    // TODO: render dots
    scatter.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => {
            return x(d[scatterx]);
        })
        .attr("cy", d => y(d[scattery]))
        .attr("r", d => r(d[size]))
        .style("opacity", d => Math.min(0.6, r(d[size]) / 10))
        .style("fill", "black")
        .on("click", (event, d , i) => {
            if(colors.length >0 && event.currentTarget.style.cssText.trim().indexOf("black") !== -1) {
                d3.select(event.currentTarget)
                    .style("fill", colors[0]);
                //selectedpts[colors[0]] = d;
                selectedPoints[colors[0]] = d;
                selectedPointsInverted[d[legendLabel]] = colors[0];

                let newLegend = legend
                    .append("g")
                    .attr("index", Object.keys(selectedPointsInverted).length)
                    .attr("deleted", 0)

                newLegend
                    .append("circle")
                    .attr("class", "color-circle")
                    .attr("cx", d => 10)
                    .attr("cy", (Object.keys(selectedPointsInverted).length - 1) * 15 + 10)
                    .attr("r", d => 5)
                    .style("fill", colors[0])

                newLegend
                        .append("text")
                        .attr("x", 30)
                        .attr("y", (Object.keys(selectedPointsInverted).length - 1) * 15 + 13)
                        .text(function() { return d[legendLabel];});
                newLegend
                    .append("text")
                    .attr("class", "close")
                    .attr("x", 580)
                    .attr("y", (Object.keys(selectedPointsInverted).length - 1) * 15 + 13)
                    .text("x")
                    .on("click", function() {
                        colors.push(selectedPointsInverted[d[legendLabel]]);
                        delete selectedPoints[selectedPointsInverted[d[legendLabel]]]
                        delete selectedPointsInverted[d[legendLabel]];

                        scatter.selectAll(".dot")
                            .filter(dot => dot[legendLabel] === d[legendLabel])
                            .style("fill", "black");
                        let deletedLegend = d3.select(this.parentNode);
                        let deletedIndex = deletedLegend.attr("index");
                        deletedLegend.remove();

                        legend.selectAll("g")
                            .filter((c, i) => {
                                    return i + 1 >= deletedIndex
                                })
                            .transition()
                            .duration(500)
                            .attr("transform", function(c,i) {
                                return "translate(0,-" + (parseInt(d3.select(this).attr("deleted")) +1) *15 + ")";
                            })
                            .attr("index", function() {return parseInt(d3.select(this).attr("index")) -1;})
                            .attr("deleted", function() {return parseInt(d3.select(this).attr("deleted"))+1;});

                        renderRadarChart()

                    });
                renderRadarChart()

                colors.shift();
            }

        })
}

function renderRadarChart(){
    radar.selectAll("g[item]").remove()

    // TODO: show selected items in legend
    let radarDomains = []
    for (let i = 0; i < dimensions.length; i++) {
        radarDomains[dimensions[i]] = d3.scaleLinear()
            .domain([minScale[dimensions[i]], maxScale[dimensions[i]]])
            .range([0, 225]);
    }
    for (const [key, value] of Object.entries(selectedPoints)) {
        radarItem =  radar.append("g")
                    .attr("class", "axis")
                    .attr("item",key)

            radarItem.selectAll("line")
            .data(dimensions)
            .enter()
            .append("line")
            .attr("x1", function(d, i) {
                return radarX(radarDomains[d](value[d]), i); }) // Starting point x-coordinate
            .attr("y1", function(d, i) { return radarY(radarDomains[d](value[d]), i); }) // Starting point y-coordinate
            .attr("x2", function(d, i) { return radarX(radarDomains[dimensions[(i + 1) % dimensions.length]](value[dimensions[(i + 1) % dimensions.length]]), (i + 1) % dimensions.length); }) // Ending point x-coordinate (wrap around to the first dimension)
            .attr("y2", function(d, i) { return radarY(radarDomains[dimensions[(i + 1) % dimensions.length]](value[dimensions[(i + 1) % dimensions.length]]), (i + 1) % dimensions.length); }) // Ending point y-coordinate (wrap around to the first dimension)
            .style("stroke", key) // Line color
            .style("stroke-width", 2.5);

        radarItem.selectAll("circle")
            .data(dimensions)
            .enter()
            .append("circle")
            .attr("cx", function(d, i) { return radarX(radarDomains[d](value[d]), i); }) // Circle center x-coordinate
            .attr("cy", function(d, i) { return radarY(radarDomains[d](value[d]), i); }) // Circle center y-coordinate
            .attr("r", 3) // Circle radius, adjust as needed for the size of the endpoints
            .style("fill", key);
    }


}


function radarX(radius, index){
    return radius * Math.cos(radarAngle(index));
}

function radarY(radius, index){
    return radius * Math.sin(radarAngle(index));
}

function radarAngle(index){
    return radarAxesAngle * index - Math.PI / 2;
}

// init scatterplot select menu
function initMenu(id, entries) {
    $("select#" + id).empty();

    entries.forEach(function (d) {
        $("select#" + id).append("<option>" + d + "</option>");
    });

    $("#" + id).selectmenu({
        select: function () {
            renderScatterplot();
        }
    });
}

// refresh menu after reloading data
function refreshMenu(id){
    $( "#"+id ).selectmenu("refresh");
}

// read current scatterplot parameters
function readMenu(id){
    return $( "#" + id ).val();
}

// switches and displays the tabs
function openPage(pageName,elmnt,color) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    document.getElementById(pageName).style.display = "block";
    elmnt.style.backgroundColor = color;
}
