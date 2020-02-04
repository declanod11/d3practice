// Chart dimensions.
var margin = { top: 19.5, right: 19.5, bottom: 19.5, left: 39.5 },
    width = 960 - margin.right,
    height = 500 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.log().domain([300, 1e5]).range([0, width]),
    yScale = d3.scale.linear().domain([10, 85]).range([height, 0]),
    radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
    colorScale = d3.scale.category10();

// The x & y axes.
var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(12, d3.format(",d"));
var yAxis = d3.svg.axis().scale(yScale).orient("left");

// Create the SVG container and set the origin.
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Add the y-axis.
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// Add an x-axis label.
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("income per capita, inflation-adjusted (dollars)");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("life expectancy (years)");

// Add the year label; the value is set on transition.
var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(1800);
 var format = d3.format(".2s");
// var tip = d3.tip()
//   .attr('class', 'd3-tip')
//   .direction('s')
//   .html(function(d) {
//     return "<p><strong>" + d.name + "</strong></p><p><strong>Population: </strong>" + format(d.population) + "</p>";
//   })
// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.income; }
function y(d) { return d.lifeExpectancy; }
function radius(d) { return d.population; }
function color(d) { return d.region; }
function key(d) { return d.name; }

// Load the data.
d3.json("../data/nations.json", function(nations) {
  	// A bisector since many nation's data is sparsely-defined.
  	var bisect = d3.bisector(function(d) { return d[0]; });

  	// Add a dot per nation. Initialize the data at 1800, and set the colors.
  	var dot = svg.append("g")
    		// .call(tip)
    		.attr("class", "dots")
    	.selectAll(".dot")
    		.data(interpolateData(1800))
    	.enter().append("circle")
    		// .on('mouseover', tip.show)
     		// .on('mouseout', tip.hide)
    		.attr("class", function (d) { return "dot " + d.name; })
      	.style("fill", function(d) { return colorScale(color(d)); })
      	.call(position)
      	.sort(order);
  
  	// Add an overlay for the year label.
  	// var box = label.node().getBBox();
  
  	// var overlay = svg.append("rect")
    // 		.attr("class", "overlay")
    // 		.attr("x", box.x)
    // 		.attr("y", box.y)
    // 		.attr("width", box.width)
    // 		.attr("height", box.height)
    // 		.on("mouseover", enableInteraction);
  
  	// Start a transition that interpolates the data based on year.
  	svg.transition()
      	.duration(15000)
      	.ease("linear")
      	.tween("year", tweenYear)
      	.each("end", enableInteraction);
  
  	// Positions the dots based on data.
  	function position(dot) {
      	dot.attr("cx", function(d) { return xScale(x(d)); })
          	.attr("cy", function(d) { return yScale(y(d)); })
          	.attr("r", function(d) { return radiusScale(radius(d)); });
    		}
  
  	// Defines a sort order so that the smallest dots are drawn on top.
  	function order(a, b) { return radius(b) - radius(a); }
  
  	// After the transition finishes, you can mouseover to change the year.
  	function enableInteraction() {
      	var yearScale = d3.scale.linear()
        	.domain([1800, 2009])
        	.range([box.x + 10, box.x + box.width - 10])
        	.clamp(true);

      	// Cancel the current transition, if any.
      	svg.transition().duration(0);

      	// overlay
        //   	.on("mouseover", mouseover)
        //   	.on("mouseout", mouseout)
        //   	.on("mousemove", mousemove)
        //   	.on("touchmove", mousemove);

      	// function mouseover() { label.classed("active", true); }
      	// function mouseout() { label.classed("active", false); }
      	// function mousemove() { displayYear(yearScale.invert(d3.mouse(this)[0])); }
  	}

  	// Tweens the entire chart by first tweening the year, and then the data.
  	// For the interpolated data, the dots and label are redrawn.
  	function tweenYear() {
      	var year = d3.interpolateNumber(1800, 2009);
      	return function(t) { displayYear(year(t)); };
    }

  	// Updates the display to show the specified year.
  	function displayYear(year) {
      	console.log(dot.data(interpolateData(year), key).call(position).sort(order))
        dot.data(interpolateData(year), key).call(position).sort(order);
      	label.text(Math.round(year));
    }

  	// Interpolates the dataset for the given (fractional) year.
  	function interpolateData(year) {
      	return nations.map(function(d) {
          	return {
              	name: d.name,
              	region: d.region,
              	income: interpolateValues(d.income, year),
                population: interpolateValues(d.population, year),
                // population: interpolateValues(d.lifeExpectancy/d.income,year),
                lifeExpectancy: interpolateValues(d.lifeExpectancy, year)
            };
        });
    }

  	// Finds (and possibly interpolates) the value for the specified year.
  	function interpolateValues(values, year) {
      	var i = bisect.left(values, year, 0, values.length - 1),
            a = values[i];
      	if (i > 0) {
          	var b = values[i - 1],
                t = (year - a[0]) / (b[0] - a[0]);
          	return a[1] * (1 - t) + b[1] * t;
        }
      return a[1];
    }
});


// -------------------------------------------------------

// // Chart dimensions.
// var margin = { top: 19.5, right: 19.5, bottom: 19.5, left: 39.5 },
//     width = 960 - margin.right,
//     height = 500 - margin.top - margin.bottom;

// // Various scales. These domains make assumptions of data, naturally.
// var xScale = d3.scaleLog().domain([300, 1e5]).range([0, width]),
//     yScale = d3.scaleLinear().domain([10, 85]).range([height, 0]),
//     radiusScale = d3.scaleSqrt().domain([0, 5e8]).range([0, 40]),
//     colorScale = d3.scaleOrdinal();

// // The x & y axes.
// var xAxis = d3.axisBottom(xScale).ticks(12,',d');
// var yAxis = d3.axisLeft(yScale)

// // Create the SVG container and set the origin.
// var svg = d3.select("#chart").append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//   .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// // Add the x-axis.
// svg.append("g")
//     .attr("class", "x axis")
//     .attr("transform", "translate(0," + height + ")")
//     .call(xAxis);

// // Add the y-axis.
// svg.append("g")
//     .attr("class", "y axis")
//     .call(yAxis);

// // Add an x-axis label.
// svg.append("text")
//     .attr("class", "x label")
//     .attr("text-anchor", "end")
//     .attr("x", width)
//     .attr("y", height - 6)
//     .text("income per capita, inflation-adjusted (dollars)");

// // Add a y-axis label.
// svg.append("text")
//     .attr("class", "y label")
//     .attr("text-anchor", "end")
//     .attr("y", 6)
//     .attr("dy", ".75em")
//     .attr("transform", "rotate(-90)")
//     .text("life expectancy (years)");

// // Add the year label; the value is set on transition.
// var label = svg.append("text")
//     .attr("class", "year label")
//     .attr("text-anchor", "end")
//     .attr("y", height - 24)
//     .attr("x", width)
//     .text(1800);
//  var format = d3.format(".2s");
// // var tip = d3.tip()
// //   .attr('class', 'd3-tip')
// //   .direction('s')
// //   .html(function(d) {
// //     return "<p><strong>" + d.name + "</strong></p><p><strong>Population: </strong>" + format(d.population) + "</p>";
// //   })
// // Various accessors that specify the four dimensions of data to visualize.
// function x(d) { return d.income; }
// function y(d) { return d.lifeExpectancy; }
// function radius(d) { return d.population; }
// function color(d) { return d.region; }
// function key(d) { return d.name; }

// // Load the data.
// d3.json("../data/nations.json", function(nations) {
//   	// A bisector since many nation's data is sparsely-defined.
//   	var bisect = d3.bisector(function(d) { return d[0]; });

//   	// Add a dot per nation. Initialize the data at 1800, and set the colors.
//   	var dot = svg.append("g")
//     		// .call(tip)
//     		.attr("class", "dots")
//     	.selectAll(".dot")
//     		.data(interpolateData(1800))
//     	.enter().append("circle")
//     		// .on('mouseover', tip.show)
//      		// .on('mouseout', tip.hide)
//     		.attr("class", function (d) { return "dot " + d.name; })
//       	.style("fill", function(d) { return colorScale(color(d)); })
//       	.call(position)
//       	.sort(order);
  
//   	// Add an overlay for the year label.
//   	// var box = label.node().getBBox();
  
//   	// var overlay = svg.append("rect")
//     // 		.attr("class", "overlay")
//     // 		.attr("x", box.x)
//     // 		.attr("y", box.y)
//     // 		.attr("width", box.width)
//     // 		.attr("height", box.height)
//     // 		.on("mouseover", enableInteraction);
  
//   	// Start a transition that interpolates the data based on year.
//   	svg.transition()
//       	.duration(15000)
//       	.ease("linear")
//       	.tween("year", tweenYear)
//       	.each("end", enableInteraction);
  
//   	// Positions the dots based on data.
//   	function position(dot) {
//       	dot.attr("cx", function(d) { return xScale(x(d)); })
//           	.attr("cy", function(d) { return yScale(y(d)); })
//           	.attr("r", function(d) { return radiusScale(radius(d)); });
//     		}
  
//   	// Defines a sort order so that the smallest dots are drawn on top.
//   	function order(a, b) { return radius(b) - radius(a); }
  
//   	// After the transition finishes, you can mouseover to change the year.
//   	function enableInteraction() {
//       	var yearScale = d3.scale.linear()
//         	.domain([1800, 2009])
//         	.range([50 + 10, 600 - 10])
//         	.clamp(true);

//       	// Cancel the current transition, if any.
//       	svg.transition().duration(0);

//       	// // overlay
//         // //   	.on("mouseover", mouseover)
//         // //   	.on("mouseout", mouseout)
//         // //   	.on("mousemove", mousemove)
//         // //   	.on("touchmove", mousemove);

//       	// function mouseover() { label.classed("active", true); }
//       	// function mouseout() { label.classed("active", false); }
//       	// function mousemove() { displayYear(yearScale.invert(d3.mouse(this)[0])); }
//   	}

//   	// Tweens the entire chart by first tweening the year, and then the data.
//   	// For the interpolated data, the dots and label are redrawn.
//   	function tweenYear() {
//       	var year = d3.interpolateNumber(1800, 2009);
//       	return function(t) { displayYear(year(t)); };
//     }

//   	// Updates the display to show the specified year.
//   	function displayYear(year) {
//       	// console.log(dot.data(interpolateData(year), key).call(position).sort(order))
//         dot.data(interpolateData(year), key).call(position).sort(order);
//       	label.text(Math.round(year));
//     }

//   	// Interpolates the dataset for the given (fractional) year.
//   	function interpolateData(year) {
//       	return nations.map(function(d) {
//           	return {
//               	name: d.name,
//               	region: d.region,
//               	income: interpolateValues(d.income, year),
//               	population: interpolateValues(d.population, year),
//               	lifeExpectancy: interpolateValues(d.lifeExpectancy, year)
//             };
//         });
//     }

//   	// Finds (and possibly interpolates) the value for the specified year.
//   	function interpolateValues(values, year) {
//       	var i = bisect.left(values, year, 0, values.length - 1),
//             a = values[i];
//       	if (i > 0) {
//           	var b = values[i - 1],
//                 t = (year - a[0]) / (b[0] - a[0]);
//           	return a[1] * (1 - t) + b[1] * t;
//         }
//       return a[1];
//     }
// });



// -----------------------------------------------------------

// d3.json("../data/nations.json", main)

// function main(data){

//     var margin = ({top: 20, right: 20, bottom: 35, left: 40}),
//     bisectYear = d3.bisector(([year]) => year).left;

// var grid = g => g
//     .attr("stroke", "currentColor")
//     .attr("stroke-opacity", 0.1)
//     .call(g => g.append("g")
//       .selectAll("line")
//       .data(x.ticks())
//       .join("line")
//         .attr("x1", d => 0.5 + x(d))
//         .attr("x2", d => 0.5 + x(d))
//         .attr("y1", margin.top)
//         .attr("y2", height - margin.bottom))
//     .call(g => g.append("g")
//       .selectAll("line")
//       .data(y.ticks())
//       .join("line")
//         .attr("y1", d => 0.5 + y(d))
//         .attr("y2", d => 0.5 + y(d))
//         .attr("x1", margin.left)
//         .attr("x2", width - margin.right));

// var yAxis = g => g
//     .attr("transform", `translate(${margin.left},0)`)
//     .call(d3.axisLeft(y))
//     .call(g => g.select(".domain").remove())
//     .call(g => g.append("text")
//         .attr("x", -margin.left)
//         .attr("y", 10)
//         .attr("fill", "currentColor")
//         .attr("text-anchor", "start")
//         .text("↑ Life expectancy (years)"))

// var xAxis = g => g
//     .attr("transform", `translate(0,${height - margin.bottom})`)
//     .call(d3.axisBottom(x).ticks(width / 80, ","))
//     .call(g => g.select(".domain").remove())
//     .call(g => g.append("text")
//         .attr("x", width)
//         .attr("y", margin.bottom - 4)
//         .attr("fill", "currentColor")
//         .attr("text-anchor", "end")
//         .text("Income per capita (dollars) →"))

// var color = d3.scaleOrdinal(data.map(d => d.region), d3.schemeCategory10).unknown("black")
// var radius = d3.scaleSqrt([0, 5e8], [0, width / 24])
// var y = d3.scaleLinear([14, 86], [height - margin.bottom, margin.top])
// var x = d3.scaleLog([200, 1e5], [margin.left, width - margin.right])

// var currentData = dataAt(year)

// var svg = d3.select("#chart")
//     .attr("viewBox", [0, 0, width, height])

// svg.append("g")
//     .call(xAxis);

// svg.append("g")
//     .call(yAxis);

// svg.append("g")
//     .call(grid);

// const circle = svg.append("g")
//     .attr("stroke", "black")
//     .selectAll("circle")
//     .data(dataAt(1800), d => d.name)
//     .join("circle")
//     .sort((a, b) => d3.descending(a.population, b.population))
//     .attr("cx", d => x(d.income))
//     .attr("cy", d => y(d.lifeExpectancy))
//     .attr("r", d => radius(d.population))
//     .attr("fill", d => color(d.region))
//     .call(circle => circle.append("title")
//         .text(d => [d.name, d.region].join("\n")));


// var chart = 
//      Object.assign(svg.node(), {
//         update(data) {
//         circle.data(data, d => d.name)
//             .sort((a, b) => d3.descending(a.population, b.population))
//             .attr("cx", d => x(d.income))
//             .attr("cy", d => y(d.lifeExpectancy))
//             .attr("r", d => radius(d.population));
//         }
//     })


// chart.update(currentData)

// function dataAt(year) {
//     return data.map(d => ({
//         name: d.name,
//         region: d.region,
//         income: valueAt(d.income, year),
//         population: valueAt(d.population, year),
//         lifeExpectancy: valueAt(d.lifeExpectancy, year)
//     }));
//     }

// function valueAt(values, year) {
//     const i = bisectYear(values, year, 0, values.length - 1);
//     const a = values[i];
//     if (i > 0) {
//         const b = values[i - 1];
//         const t = (year - a[0]) / (b[0] - a[0]);
//         return a[1] * (1 - t) + b[1] * t;
//     }
//     return a[1];
//     }


// }