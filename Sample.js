var qs = Qs;
const city = document.querySelector("#city");
const bikero_city = document.querySelector("#bikero_city");
const getlocat = document.querySelector("#getlocat");
const map = L.map('mapid');
map.setView(new L.LatLng(24.111, 121.219), 8);  
// 設定圖資來源
var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osm = new L.TileLayer(osmUrl, {minZoom: 7, maxZoom: 19});
map.addLayer(osm);
map.locate({setView: true, maxZoom: 18});
  
const markerLayer = L.markerClusterGroup();
var layerGroup = new L.LayerGroup();
layerGroup.addTo(map);


async function GetAuthorizationHeader() {    
  let tokenCode = '';  
  const parameter = {
    grant_type:"client_credentials",
    client_id: "f4981645-e27e7c4f-7fcd-4daa",
    client_secret: "7f013ea8-24a6-40d5-aff9-b003979178e1"
  };
  let auth_url = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';  
  let res = await axios({	  
    method: 'POST',
    url: auth_url,
	/*headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },	*/
	data:qs.stringify(parameter),
    dataType:'JSON',
  })
	tokenCode = res.data.access_token; 
	return {Authorization: `Bearer ${tokenCode}`,}
	
}

async function GetApiResponse_location(current_city){
	
		const url_1 = 'https://tdx.transportdata.tw/api/basic/v2/Bike/Station/City/'+current_city+'?%24top=50&%24format=JSON';
		const url_2 = 'https://tdx.transportdata.tw/api/basic/v2/Bike/Availability/City/'+current_city+'?%24top=50&%24format=JSON'; 	
		axios.all([
			axios.get(url_1, {					
			headers: await GetAuthorizationHeader(),			
			}
			),
			axios.get(url_2,{					
			headers: await GetAuthorizationHeader(),
			}
			)
		])		
		.then(axios.spread((A,B) => {	   
		markerLayer.clearLayers();
		for (let i=0; i<A.data.length; i++) {
			let pos_lat = A.data[i].StationPosition.PositionLat;
			let pos_lon = A.data[i].StationPosition.PositionLon;
			markerLayer.addLayer(L.marker(new L.LatLng(pos_lat, pos_lon))
			.bindPopup("<p>"+A.data[i].StationName.Zh_tw +"</p>"+"<p>可租借數量"+B.data[i].AvailableRentBikes+"</p><p>可歸還數量"+B.data[i].AvailableReturnBikes+"</p>"));
			}
		map.addLayer(markerLayer);
		map.setView(new L.LatLng(A.data[0].StationPosition.PositionLat, A.data[0].StationPosition.PositionLon), 11);	
  }))
		.catch((err) => { console.error(err) })	
}

const bikeRoute = document.querySelector('#bikeRoute');

async function GetApiResponse_road(current_city){
	
		const url_1 = 'https://tdx.transportdata.tw/api/basic/v2/Cycling/Shape/City/'+current_city+'?%24top=50&%24format=JSON';
		
		
			axios.get(url_1, {					
			headers: await GetAuthorizationHeader(),			
			}
			)
				
		.then((res) => {	  
					
		const routeData = res.data;
		 let str = '';
		routeData.forEach((item) => {
        str += `<option value="${item.RouteName}">${item.RouteName}</option>`
		})
		bikeRoute.innerHTML = str;
		bikeRoute.addEventListener('change', (e) => {
		let myLayer = "";	
        const value = e.target.value;    
		//console.log(myLayer);
        
        routeData.forEach((item) => {          
          if (item.RouteName === value) {
            geo = item.Geometry;	
 			
            polyLine(geo);		
			}
        })
			
  })
  })
		.catch((err) => { console.error(err) })	
}



////////////test///////////////


async function GetApiResponse_road_select(current_city){
	
		const url_1 = 'https://tdx.transportdata.tw/api/basic/v2/Cycling/Shape/City/'+current_city+'?%24top=50&%24format=JSON';
		
		
			axios.get(url_1, {					
			headers: await GetAuthorizationHeader(),			
			}
			)
				
		.then((res) => {	  
					
		const routeData = res.data;
		 let str = '';
		routeData.forEach((item) => {
        str += `<option value="${item.RouteName}.${current_city}" >${item.RouteName}</option>`
		})
		bikeRoute.innerHTML = str;
		bikeRoute.addEventListener('change', (e) => {
		let myLayer = "";	
        const value = e.target.value;    
		//console.log(myLayer);
			})
		})		
		.catch((err) => { console.error(err) })	
}
////////////test///////////////
var myLayer;
////////////test-1///////////////
async function GetApiResponse_road_test(current_city,road){
	
		const url_1 = 'https://tdx.transportdata.tw/api/basic/v2/Cycling/Shape/City/'+current_city+'?%24top=50&%24format=JSON';
		
		
			axios.get(url_1, {					
			headers: await GetAuthorizationHeader(),			
			}
			)
				
		.then((res) => {	 					
		const routeData = res.data;
		 
		routeData.forEach((item) => {
        
		if(item.RouteName === road){
			
		geo = item.Geometry;
		const wicket = new Wkt.Wkt();
		const geojsonFeature = wicket.read(geo).toJson()
		const myStyle = {
		"color": "#FFD306",
		"weight": 10,
		"opacity": 0.8
		};
		L.marker([geojsonFeature.coordinates[0][0][1], geojsonFeature.coordinates[0][0][0]])
		.bindPopup("總長"+(item.CyclingLength/1000)+"公里")
		.addTo(map);
		let myLayer = L.geoJSON(geojsonFeature, {
		style: myStyle
		}).addTo(map);	
		console.log(geojsonFeature.coordinates);
		console.log(geojsonFeature.coordinates[0][0][0]);
		console.log(geojsonFeature.coordinates[0][0][1]);
		/*
		var layerPostalcodes=L.geoJSON(geojsonFeature).addTo(map);
		layerPostalcodes.addData(geojsonFeature);
		layerGroup.addLayer(layerPostalcodes);
		layerGroup.removeLayer();
		*/
		myLayer.addData(geojsonFeature);
		map.fitBounds(myLayer.getBounds());
		
		}
		
		})
		/*
		bikeRoute.addEventListener('change', (e) => {
		//let myLayer = "";	
        //const value = e.target.value;    
		//console.log(myLayer);
        
        routeData.forEach((item) => {          
          if (item.RouteName === value) {
            //geo = item.Geometry;	
 			
            //polyLine(geo);		
			}
        })
			
  })*/
  })
		.catch((err) => { console.error(err) })	
}
////////////test-1///////////////



	function polyLine(geo) {
	// 建立一個 wkt 的實體	
	//map.removeLayer();
	const wicket = new Wkt.Wkt();
	const geojsonFeature = wicket.read(geo).toJson()
	const myStyle = {
    "color": "#006600",
    "weight": 5,
    "opacity": 0.8
	};
	let myLayer = L.geoJSON(geojsonFeature, {
    style: myStyle
	}).addTo(map);	
	myLayer.addData(geojsonFeature);
	map.fitBounds(myLayer.getBounds());
	
	//return myLayer;
	//map.removeLayer(myLayer);
	
}


bikeRoute.addEventListener("change",(e)=>{
	//console.log(e.target.value);
	let arr=e.target.value.split('.');	
	GetApiResponse_road_test(arr[1],arr[0]);
	
	
  });

	city.addEventListener("change",(e)=>{
	GetApiResponse_location(e.target.value);
  });

	bikero_city.addEventListener("change",(e)=>{	
	//GetApiResponse_road(e.target.value);
	GetApiResponse_road_select(e.target.value);
	//console.log(e.target.value);
  });

	getlocat.addEventListener("click",(e)=>{
	map.locate({setView: true, maxZoom: 18});
	
	
  });

function onLocationFound(e) {   
    L.marker(e.latlng).addTo(map)
        .bindPopup("你的位置");
    
}

map.on('locationfound', onLocationFound);

