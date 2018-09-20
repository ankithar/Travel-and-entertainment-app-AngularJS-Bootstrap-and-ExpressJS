const express = require('express');
//const  request = require('request');
const querystring = require('querystring');
const app = express();
const  bodyParser = require('body-parser');
let request = require('request-promise');
const yelp = require('yelp-fusion');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("./public"));


app.get('/service',(req,res) => {
var next;
let jsonObject;
let keyword = req.query.keyword;
let categorySelected = req.query.categorySelected;
let distance = req.query.distance;
    distance = distance  * 1609.344;
let radio = req.query.radio;
let locationData = req.query.locationData;
var geocodingApi = <GOOGLE_API_KEY> 
let nearbySearchApiKey = <GOOGLE_API_KEY> 

var entertainment = {
  //token: null,
    counter:0,
  
  getGeocode: function() {
      console.log("inside getUser");
      let uri;
      if(radio === 'here'){
          uri = "https://maps.googleapis.com/maps/api/geocode/json?address=University of southern california, LA, CA, USA&API_KEY="+geocodingApi;
      }
      else{
         uri = "https://maps.googleapis.com/maps/api/geocode/json?address="+locationData+"&API_KEY="+geocodingApi;
      }
    console.log(" getUser uri = "+uri);
      
    return request({
      "method":"GET", 
     // "uri": "https://maps.googleapis.com/maps/api/geocode/json?address=University of southern california, LA, CA, USA&API_KEY=<API_KEY>,
        "uri" : uri,
      "json": true,
    
      }
    );
  },
  
  getNearBySearchURL: function(data) {
      console.log("inside getUserReposUrl");
      let latLngVal;
      if(radio === 'here'){
          latLngVal = locationData;
      }
      else{
          let resultArray = data.results;
       
        let zerothElement = resultArray[0]; 
        
        let geometry = zerothElement.geometry;
        let loc = geometry.location;
        let lat = loc.lat;
        let lng = loc.lng;
        latLngVal = lat+','+lng;
      }
   
        console.log("getUserReposUrl latLngVal = "+latLngVal);
      //var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+latLngVal+" &radius=16090&type=default&keyword=usc&key=<API_KEY>";
      var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+latLngVal+" &radius="+distance+"&type="+categorySelected+"&keyword="+keyword+"&key="+nearbySearchApiKey;
      console.log("getUserReposUrl url = "+url);
    return url;
},

  getNearBySearchResult: function(uri, repos) {
      console.log("inside getUserRepos");
     // console.log("uri = "+uri);
      //let url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+uri+" &radius=16090&type=default&keyword=usc&key=<API_KEY>";
      return request({
      "method": "GET",
      "uri": uri,
      "json": true,
      "resolveWithFullResponse": true
      
    }).then(function(response) {
      if (!repos) {
        repos = [];
      }
          
          if(response.body.status === 'ZERO_RESULTS'){
              let error = {"errorCustom" : "ZERO_RESULTS"};
              return error;
          }
           if(!(response.body.status === 'OK')){
               this.count++;
               
              console.log("inside invalid req check "+this.count);
             // var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken='+next+'&key=<API_KEY>';
              var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken='+next+'&key='+nearbySearchApiKey;
             // console.log("next URL = "+url);
        return entertainment.getNearBySearchResult(url, repos);
          }
          console.log(response.body.status);
      repos = repos.concat(response.body);
      console.log(repos.length + " repos so far");
          
      let bodyResp = response.body;
          let next1 = bodyResp.next_page_token;
         // console.log("next = "+next1);
      
      
          if(bodyResp.hasOwnProperty('next_page_token')){ 
        console.log("There is more.");
        
              next = bodyResp.next_page_token;
              //var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken='+next+'&key=<API_KEY>;
             // var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken='+next+'&key='+nearbySearchApiKey;
              var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken='+next;
              //console.log("next URL = "+url);
        return entertainment.getNearBySearchResult(url, repos);
      }
          
      return repos;
    });
      
     
}
  
};

function main(params) {
  
  return entertainment.getGeocode()
  .then(entertainment.getNearBySearchURL)
  .then(entertainment.getNearBySearchResult);
}

main().then(function(result) {
    console.log("INSIDE MAIN");
    let arrayPlacesNearby = [];
    let jsonObj;
    if(result.hasOwnProperty('errorCustom')){
        console.log("errorCustom = "+result.errorCustom);
        jsonObject = result;
        
    }
    else{ 
    let length = result.length;
    
    let ARRLEN = 0;
    for(let i = 0;i<length;i++){
        let JSONObj = result[i];
        let resultArray = JSONObj.results;
        let resArrLen = resultArray.length;
        console.log("resArrLen = "+resArrLen);
        resArrLen+=ARRLEN;
        let k=0;
        for(let j=ARRLEN;j<resArrLen;j++){
         arrayPlacesNearby[j] = new Object();
            arrayPlacesNearby[j].icon = resultArray[k].icon;
            arrayPlacesNearby[j].name = resultArray[k].name;
            arrayPlacesNearby[j].vicinity = resultArray[k].vicinity;
            arrayPlacesNearby[j].place_id = resultArray[k].place_id;
            arrayPlacesNearby[j].latitude = resultArray[k].geometry.location.lat;
            arrayPlacesNearby[j].longitude = resultArray[k].geometry.location.lng;  
            k++;
        }
        ARRLEN = arrayPlacesNearby.length;
        
    }
    jsonObject = JSON.stringify(arrayPlacesNearby);
    }
    console.log("JSON OBJ created");
     console.log("sending jsonObject");
    res.set('Access-Control-Allow-Origin', '*');
    res.send(jsonObject);
   
    
});
    
});

app.get('/reviews',(req,res) => {
    res.set('Access-Control-Allow-Origin', '*');
    let apiKey = <YELP_API_KEY>;
    const client = yelp.client(apiKey);
    let jsonObj;
    let name = req.query.name;
    let city = req.query.city;
    let state = req.query.state;
    let country = req.query.country;
    console.log("name = "+name+" city= "+city+" state ="+state+" country ="+country);
 
// matchType can be 'lookup' or 'best'
client.businessMatch('best', {
  name: name,
  //name: 'Bluepig Writing Coach',
//  address1: '510 N Coast Hwy 101',
//  address2: 'Encinitas, CA 92024',
  city: city,
  //city: 'South Pasadena',
  state: state,
  //state: 'CA',
  country: country
  //country: 'US'
}).then(response => {
  console.log("1 "+response.jsonBody.businesses.length);
    let len = response.jsonBody.businesses.length;
    if(len === 0){
         let obj = new Object();
        obj.name = "error";
        obj.code = 404;
        var jsonObj = JSON.stringify(obj);
        
        res.send(jsonObj);
        
    } 
 console.log(response.jsonBody.businesses[0].id);
    
    let id;
    for(let i=0;i< response.jsonBody.businesses.length;i++){
        if(name === response.jsonBody.businesses[i].name){
            id=response.jsonBody.businesses[i].id;
            console.log("id = "+id);
           break;
        }
    }
    client.reviews(id).then(response2 => {
  console.log("2 "+response2.jsonBody.reviews[0].text);
      //  res.set('Access-Control-Allow-Origin', '*');
       res.send(response2.jsonBody);
       
}).catch(e => {
  console.log(e);
        console.log("10. status code = "+e.statusCode);
        let obj = new Object();
        obj.name = "error";
        obj.code = e.statusCode;
        var jsonObj = JSON.stringify(obj);
        //res.set('Access-Control-Allow-Origin', '*');
        res.send(jsonObj);
});
    
}).catch(e => {
    
  //console.log(e);
    console.log("11. status code = "+e.statusCode);
   // res.set('Access-Control-Allow-Origin', '*');
   
    res.send(e);
});
   
});

 console.log("outside service");
app.listen(8081,() => console.log('Listening on 8081'));
