// For the map

var index = 0;

mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kcmVhcGVsbGVncmluIiwiYSI6ImNrczBvbGVubTFtMjUyd3M3ejVxb2UzN2oifQ.aUfvB_KmGO9JDT3FPf4Ikg';
const map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/satellite-streets-v11', // style URL
  center: [11.1865, 46.6771], // starting position [lng, lat] Lido di Schenna [inverted from Google Maps]
  zoom: 16 // starting zoom
});
map.addControl(new mapboxgl.NavigationControl());

// For the draw

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var x = [112, 112, 370.5, 370.5, 882, 882, 120, 362.5, 362.5, 120];
var y = [335, 273.5, 273.5, 312.25, 312.25, 335, 281.5, 281.5, 312.25, 312.25];

var redPoint;
var greenPoint;

document.addEventListener("click", getMousePos);

function next() {
  if (index == 0) {
    getDXFObject();
  } else if (index == 1 || index == 2) {
    setAnchor();
  } else if (index == 3) {
    showWeather();
  }
  index += 1;
}

function getDXFObject() {

  var dxf = null;
  var reader = new FileReader(); // Setup object reader
  reader.readAsText(document.getElementById("filePicker").files[0]); // Read file text
  reader.onload = function(e) {
    var fileText = e.target.result;
    var parser = new DxfParser(); // Setup parser
    try {
      dxf = parser.parseSync(fileText); // Save object
    } catch(err) {
      return console.error(err.stack);
    }
    console.log('Success!');
    drawPoints(dxf); // Start drawing points
    // console.log(JSON.stringify(dxf, null, 4));
  };
}

function drawPoints(dxf) {

  /*
  console.log(dxf) // Bye bye DXF
  for (var points = 0; points < dxf.entities.length; points++) {
    ctx.arc(dxf.entities[points].position.x, dxf.entities[points].position.y, 1, 0, 2 * Math.PI); // Add all dxf points on the draw
    ctx.fill();
  }
  */

  document.getElementById("map").classList.toggle("opacityTransition"); // Opacity effect

  for (var point = 0; point < x.length; point++) {
    ctx.beginPath();
    ctx.fillStyle = "#296d98"
    ctx.arc(x[point], y[point], 8, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
  }

  combine()

}

function combine() {
  document.getElementsByClassName("instructions")[0].innerHTML = "Choose a point of the .dxf file and type its coordinates:"; // Changes instructions
  document.getElementById("filePicker").classList.toggle("hidden"); // Hides file picker
  document.getElementById("button").innerHTML = "Next" // Update next button title

  document.getElementsByClassName("coordinateInputs")[0].classList.toggle("hidden");
}

function clear(x, y, w, h) {
  ctx.beginPath();
  ctx.clearRect(x, y, w, h); // Creates a square big as a circle
  ctx.closePath();
}

function draw(color, x, y) {
  ctx.beginPath();
  ctx.fillStyle = color
  ctx.arc(x, y, 8, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
}

function getMousePos(event) {
  if (event.clientX < canvas.width && event.clientY < canvas.height) { // When user click in drawing
    console.log(event.clientX + " " + event.clientY);
    for (var point = 0; point < x.length; point++) {
      if (event.clientX > (x[point] - 5) && (x[point] + 5) > event.clientX && event.clientY > (y[point] - 5) && (y[point] + 5) > event.clientY) {
        if (redPoint != null) {
          if (x[redPoint] != x[point] || y[redPoint] != y[point]) { // If red point is different, change it
            clear(x[redPoint] - 9, y[redPoint] - 9, 18, 18)
            draw("#296d98", x[redPoint], y[redPoint])
          }
        }

        clear(x[point] - 9, y[point] - 9, 18, 18)
        draw("#c82124", x[point], y[point])

        redPoint = point; // Update new red point

        break;
      }
    }

  }
}

function setAnchor() {

  if (redPoint == null) {
    document.getElementsByClassName("error")[0].innerHTML = "⚠️ You must select a point first!";
    index -= 1;
    return;
  }

  if (document.getElementById("x").value == "" || document.getElementById("y").value == "") {
    document.getElementsByClassName("error")[0].innerHTML = "⚠️ You must set coordinates first!";
    index -= 1;
    return;
  }

  document.getElementsByClassName("error")[0].innerHTML = "";

  var flying = false;
  map.on('flystart', function(){
    flying = true;
  });

  map.on('flyend', function(){
    flying = false;
  });

  map.on('moveend', function(e) { // Call function when movement on map has been stopped
    if (flying) {

      clear(x[redPoint] - 9, y[redPoint] - 9, 18, 18)
      draw("#149414", x[redPoint], y[redPoint])
      map.fire('flyend');

      greenPoint = redPoint
      redPoint = null;

      if (index == 3) { // At the end of movement show info
        next();
      }

    }
  });

  if (index == 1) {

    document.getElementById("map").classList.toggle("opacityTransition"); // Opacity effect
    map.flyTo({
      center: [document.getElementById("x").value, document.getElementById("y").value],
      essential: true // this animation is considered essential with respect to prefers-reduced-motion
    });
    map.fire('flystart'); // Set starting of movement

    document.getElementsByClassName("instructions")[0].innerHTML = "Choose another point of the .dxf file and type its coordinates:"; // Changes instructions
    document.getElementById("x").value = "11.32500";
    document.getElementById("y").value = "46.45695";

  } else if (index == 2) {

    map.easeTo({
      bearing: 100, // Rotation
      zoom: 14.72, // Zoom
      center: [document.getElementById("x").value, document.getElementById("y").value],
      duration: 5000
    });
    map.fire('flystart'); // Set starting of movement

  }

}

function showWeather() {
  document.getElementsByTagName("section")[0].style.height = "90%";
  document.getElementsByClassName("coordinateInputs")[0].classList.toggle("hidden");
  document.getElementById("button").classList.toggle("hidden");
  document.getElementsByClassName("instructions")[0].innerHTML = "Weather statistics (Bolzano Airport)";
  document.getElementById("weatherInfo").classList.toggle("hidden");
  document.getElementById("distance").classList.toggle("chartTitleText")

  var temperatureOptions = {
    series: [{
    name: 'max',
    data: [
      {x: 2010, y: 37},
      {x: 2011, y: 35},
      {x: 2012, y: 36},
      {x: 2013, y: 34},
      {x: 2014, y: 37},
      {x: 2015, y: 37},
      {x: 2016, y: 34},
      {x: 2017, y: 36},
      {x: 2018, y: 37},
      {x: 2019, y: 34},
      {x: 2020, y: 37},
      {x: 2021, y: 36}
    ]
  }, {
    name: 'min',
    data: [
      {x: 2010, y: -22},
      {x: 2011, y: -21},
      {x: 2012, y: -22},
      {x: 2013, y: -19},
      {x: 2014, y: -20},
      {x: 2015, y: -21},
      {x: 2016, y: -18},
      {x: 2017, y: -19},
      {x: 2018, y: -17},
      {x: 2019, y: -15},
      {x: 2020, y: -16},
      {x: 2021, y: -15}
    ]
  }],
    chart: {
    type: 'area',
    height: 200
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'straight'
  },

  title: {
    text: 'Temperatures',
    align: 'left',
    style: {
      fontSize: '14px'
    }
  },
  xaxis: {
    type: 'datetime',
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    }
  },
  yaxis: {
    tickAmount: 4,
    floating: false,

    labels: {
      style: {
        colors: '#8e8da4',
      },
      offsetY: -7,
      offsetX: 0,
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false
    }
  },
  colors: ["#c82124", "#296d98"],
  fill: {
    opacity: 0.5,
    color: ["#296d98"]
  },
  tooltip: {
    x: {
      format: "yyyy",
    },
    fixed: {
      enabled: false,
      position: 'topRight'
    }
  },
  grid: {
    yaxis: {
      lines: {
        offsetX: -30
      }
    },
    padding: {
      left: 20
    }
  }
  };

  var humidityOptions = {
    series: [{
    name: 'max',
    data: [
      {x: 2010, y: 97},
      {x: 2011, y: 95},
      {x: 2012, y: 98},
      {x: 2013, y: 94},
      {x: 2014, y: 95},
      {x: 2015, y: 96},
      {x: 2016, y: 96},
      {x: 2017, y: 93},
      {x: 2018, y: 96},
      {x: 2019, y: 94},
      {x: 2020, y: 96},
      {x: 2021, y: 95}
    ]
  }, {
    name: 'min',
    data: [
      {x: 2010, y: 35},
      {x: 2011, y: 30},
      {x: 2012, y: 35},
      {x: 2013, y: 33},
      {x: 2014, y: 36},
      {x: 2015, y: 33},
      {x: 2016, y: 36},
      {x: 2017, y: 32},
      {x: 2018, y: 34},
      {x: 2019, y: 30},
      {x: 2020, y: 31},
      {x: 2021, y: 30}
    ]
  }],
    chart: {
    type: 'area',
    height: 200
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'straight'
  },

  title: {
    text: 'Humidity',
    align: 'left',
    style: {
      fontSize: '14px'
    }
  },
  xaxis: {
    type: 'datetime',
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    }
  },
  yaxis: {
    tickAmount: 4,
    floating: false,

    labels: {
      style: {
        colors: '#8e8da4',
      },
      offsetY: -7,
      offsetX: 0,
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false
    }
  },
  colors: ["#296d98", "#0643A5"],
  fill: {
    opacity: 0.5,
    color: ["#296d98"]
  },
  tooltip: {
    x: {
      format: "yyyy",
    },
    fixed: {
      enabled: false,
      position: 'topRight'
    }
  },
  grid: {
    yaxis: {
      lines: {
        offsetX: -30
      }
    },
    padding: {
      left: 20
    }
  }
  };

  var windOptions = {
    series: [{
    name: 'wind',
    data: [59, 58, 55, 60, 56, 55, 54, 57, 55, 56, 52, 53]
  }],
    chart: {
    height: 200,
    type: 'area'
  },
  title: {
    text: 'Wind',
    align: 'left',
    style: {
      fontSize: '14px'
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  xaxis: {
    type: 'year',
    categories: ["2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"]
  },
  };

  var UVOptions = {
    series: [{
    name: 'UV index',
    data: [9, 10, 8, 9, 9, 9, 9, 10, 7, 10, 9, 10]
  }],
    chart: {
    height: 200,
    type: 'area'
  },
  title: {
    text: 'UV index',
    align: 'left',
    style: {
      fontSize: '14px'
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  xaxis: {
    type: 'year',
    categories: ["2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"]
  },
  colors: ["#ff6600"],
  };

  var sunDaysOptions = {
    series: [{
    name: 'sun',
    data: [146, 198, 134, 175, 125, 142, 150, 131, 140, 145, 133, 120]
  }],
    chart: {
    height: 200,
    type: 'area'
  },
  title: {
    text: 'Sun days',
    align: 'left',
    style: {
      fontSize: '14px'
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  xaxis: {
    type: 'year',
    categories: ["2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"]
  },
  colors: ["#ffe800"],
  };

  var rainOptions = {
    series: [{
    name: 'rain',
    data: [224, 220, 217, 200, 250, 242, 198, 220, 226, 234, 243, 234]
  }],
    chart: {
    height: 200,
    type: 'area'
  },
  title: {
    text: 'Rain days',
    align: 'left',
    style: {
      fontSize: '14px'
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  xaxis: {
    type: 'year',
    categories: ["2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"]
  },
  colors: ["#0000FF"],
  };

  var chart = new ApexCharts(document.querySelector("#temperature"), temperatureOptions);
  chart.render();

  var chart2 = new ApexCharts(document.querySelector("#humidity"), humidityOptions);
  chart2.render();

  var chart3 = new ApexCharts(document.querySelector("#wind"), windOptions);
  chart3.render();

  var chart4 = new ApexCharts(document.querySelector("#UV"), UVOptions);
  chart4.render();

  var chart5 = new ApexCharts(document.querySelector("#sun"), sunDaysOptions);
  chart5.render();

  var chart6 = new ApexCharts(document.querySelector("#rain"), rainOptions);
  chart6.render();

}
