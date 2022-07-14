var qs = Qs;
const city = document.querySelector("#city");
const getlocat = document.querySelector("#getlocat");
const map = L.map('mapid');
map.setView(new L.LatLng(24.111, 121.219), 8);  
// 設定圖資來源
var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osm = new L.TileLayer(osmUrl, {minZoom: 7, maxZoom: 18});
map.addLayer(osm);
map.locate({setView: true, maxZoom: 18});
  
const markerLayer = L.markerClusterGroup();


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
	headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },	
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
			markerLayer.addLayer(L.marker(new L.LatLng(pos_lat, pos_lon)).bindPopup(A.data[i].StationName.Zh_tw));
			}
		map.addLayer(markerLayer);
		map.setView(new L.LatLng(A.data[0].StationPosition.PositionLat, A.data[0].StationPosition.PositionLon), 11);	
  }))
		.catch((err) => { console.error(err) })	
}


  city.addEventListener("change",(e)=>{
	GetApiResponse_location(e.target.value);
  });


	getlocat.addEventListener("click",(e)=>{
	map.locate({setView: true, maxZoom: 18});
	
  });

function onLocationFound(e) {   
    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + 1000 + " meters from this point").openPopup();
    L.circle(e.latlng, 1000).addTo(map);
}

map.on('locationfound', onLocationFound);




