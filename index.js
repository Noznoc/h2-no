window.onload = function() {init()}; // initialize TableTop on window load
			
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1IKvJUsED-w9hAmnbId3OqVCqRS_jMgyr-2rXaZ8L7mY/edit?usp=sharing';

mapboxgl.accessToken = 'pk.eyJ1IjoianVsY29ueiIsImEiOiJjaWo1eHJqd2YwMDFkMXdtM3piZndjNzlxIn0.3fMbo8z3SxitKnkoNkZ2jw';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/julconz/cja00smvy92252sob26ardnrv',
  center: [-99.93, 54.32],
  zoom: 4,
  maxZoom: 10,
  minZoom: 3,
  hash: true,
  maxBounds: [-168.39312,40.713956,-50.971241,83.359511]
});

function init() { // function that initializes TableTop. Tabletop will pull the data from the Google Sheet that stores all the da
	Tabletop.init( { 
		key: public_spreadsheet_url,
		callback: showInfo,
		simpleSheet: true 
	} )
}

var features = [];
var years = [];

function showInfo(data, tabletop) { // function to show data from Google Sheet
	data.forEach(function(data) {
		if (data.coordinates !== "#ERROR!") {
			console.log()
			// store all lat, lng as geojson features
			var coordinates = [parseFloat(data.coordinates.split(",")[0]), parseFloat(data.coordinates.split(",")[1])];
			var year = parseInt(data.date_set.substr(0, 4));
			features.push(JSON.parse('{"type":"Feature","properties":{"description":"' + data.community + '","date_revoked":"' + data.date_revoked + '","advisory_type":"' + data.advisory_type + '","year":' + year + ',"date_set":"' + data.date_set + '","system_name":"' + toString(data.system_name) + '"},"geometry":{"type":"Point","coordinates":[' +  coordinates + ']}}'));
			// store all years
			if (years.indexOf(year) == -1){
				years.push(year);
			}
		}
	});

	// sort years
	years.sort(function(a, b){return a-b})

	map.on('load', function(){
		// load map
		renderMap(features);
	})

	// filter by time
	function filterBy(year, total){
		var filters = ['<=', 'year', year];
		map.setFilter('water-advisories', filters);
		document.getElementById('year').textContent = 'Recorded advisories since ' + year;
		if (total == 1) {
			document.getElementById('stats').innerHTML = total + ' advisory in ' + year;
		} else {
			document.getElementById('stats').innerHTML = total + ' advisories in ' + year;
		}
	}

	// render map
	function renderMap(features) {
		
		// add data as a geojson source
		map.addSource('markers', {
			type: 'geojson',
			data: {
				'type': 'FeatureCollection',
				'features': features
			}
		});

		// make labels on top of new layer
		var labels,
			layers = map.getStyle().layers;

	    for (var i = 0; i < layers.length; i++) {
	        if (layers[i].type === 'symbol') {
	            labels = layers[i].id;
	            break;
	        }
	    }

		// add water advisory data as a layer
		map.addLayer({
			id: 'water-advisories',
			type: 'circle',
			source: 'markers',
			paint: {
				'circle-stroke-color': {
					property: 'date_revoked',
					default: '#1494A8',
					type: 'categorical',
					stops: [
						['None', '#e04763'],
					]
				},
				'circle-color': {
					property: 'advisory_type',
					type: 'categorical',
					default: '#e04763',
					stops: [
						['BWA', '#C6BDB0'],
						['DNC', '#635F58'],
						['BWO', '#C6BDB0']
					]
				},
				'circle-stroke-width': {
					property: 'advisory_type',
					type: 'categorical',
					default: 3,
					stops: [
						['BWA', 3],
						['DNC', 3]
					]
				}
			}
		}, labels);

		// initial filter
		filterBy(years[0], 1);

		// create popup
		var popup = new mapboxgl.Popup({
	        closeButton: false,
	        closeOnClick: false
	    });

		// hover events for popup
		map.on('mouseenter', 'water-advisories', function(e) {
			var text;
			map.getCanvas().style.cursor = 'pointer';
			// set popup text
			if (e.features[0].properties.date_revoked !== 'None'){
				text = '<h2>' + e.features[0].properties.description + '</h2><h3>Date Set: ' + e.features[0].properties.date_set + '<br>Date Revoked: ' + e.features[0].properties.date_revoked + '</h3>';
			} else {
				text = '<h2>' + e.features[0].properties.description + '</h2><h3>Date Set: ' + e.features[0].properties.date_set + '</h3>';
			}

			// populate popup content
			popup.setLngLat(e.features[0].geometry.coordinates)
				.setHTML(text)
				.addTo(map);
		});

		map.on('mouseleave', 'water-advisories', function(e) {
			map.getCanvas().style.cursor = '';
			popup.remove();
		});

		// when time slider is moved filter the data
        document.getElementById('slider').addEventListener('input', function(e) {
            var total = 0;
            features.forEach(function(feature) {
            	if (feature.properties.year == years[e.target.value]){
            		total +=  1;
            	}
            });
            filterBy(years[e.target.value], total);
        });
	}
}