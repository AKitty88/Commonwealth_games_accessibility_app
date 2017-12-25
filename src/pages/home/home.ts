import { jsonFileLoader } from './../../services/jsonFileLoader';

// -TODO use component controller for ionic-native google maps cordova plugin.. and set map Clickable based on ion-menu ([)ionOpen) (ionClosed)
import { GoogleMapsProvider } from './../../providers/google-maps/google-maps';

import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker,
  BaseArrayClass,
  LatLng,
  LatLngBounds
} from '@ionic-native/google-maps';


import { Platform, Events } from 'ionic-angular';

import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';


// - TODO: move to export enums.ts file later
/** 
 * 
 * To assist comprehension when using tuples or accessing an index for a point.
*/
enum GeoAxis {
  long = 0,     // x, should correspond to first element in the tuple.
  lat  = 1,     // y
};
enum CartesianAxis {
  x = 0,        // verify standard order in functions?
  y = 1       
};

//


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
  @ViewChild('map') mapElement: ElementRef;
  map: GoogleMap;
  markersArr: Marker[] = [];



  // - DEPRECATED FIXED: `private _googleMaps: GoogleMaps` no longer needed in constructor
  constructor(public navCtrl:         NavController,
              public platform:        Platform,
              private events:         Events,
              public JsonFileLoader:  jsonFileLoader) {

    
    // Fix #15 by tracking status of ionic side menu presentation and disable overriding click behaviour caused by `cordova-plugin-googlemaps` container.
    console.log("HomePage::Constructed");
    this.events.subscribe("app::menuOpened", () => {
      this.map.setClickable(false);
      console.log("HomePage:: menuOpened event");
    });
    this.events.subscribe("app::menuClosed", () => {
      this.map.setClickable(true);
      console.log("HomePage:: menuClosed event");
    });

  }

  // - FIXME: ngAfterViewInit() vs ionViewDidLoad()
  // @ViewChild('map') maygit pul not yet be available in ionViewDidLoad lifecycle hook.
  ngAfterViewInit() {
    console.log("ngAfterViewInit:: ");

    this.platform.ready().then(() => {
      this.loadMap();
    });


    // setup
  }

  // - MARK: Map functions.
  // Create the map element for view.
  loadMap() {
    console.log("loadMap:: ");

    // Setup GoogleMaps view settings.
    let mapOptions: GoogleMapOptions = {
      'controls': {
        'compass': true,
        'myLocationButton': true,
        'indoorPicker': true,
        'zoom': true                                        // Only for Android?
      },
      camera: {
        target: {
          lat: -27.9623464,
          lng: 153.3880684
        },
        zoom: 15
      }
    };

    let element = this.mapElement.nativeElement;            // last resort?
    this.map = GoogleMaps.create(element, mapOptions);      // - DEPRECATED FIXED: this.map = this._googleMaps.create(element);
    console.log("loadMap:: GoogleMaps element created");

    // Check map is ready before using any methods.
    this.map.one(GoogleMapsEvent.MAP_READY)
      .then(() => {
        console.log("loadMap:: GoogleMaps READY");

        // Populate the map view
        this.loadMarkers();
      });


    /*
      var options = {
        'camera': {
          'target': this.dummyData()[0].position,
          'zoom': 3
        }
      };

      this.map.addMarkerCluster({
        boundsDraw: true,
        markers: this.dummyData(),
        icons: [
          { min: 2, max: 100, url: "./img/blue.png", anchor: { x: 16, y: 16 } },
          { min: 100, max: 1000, url: "./img/yellow.png", anchor: { x: 16, y: 16 } },
          { min: 1000, max: 2000, url: "./img/purple.png", anchor: { x: 24, y: 24 } },
          { min: 2000, url: "./img/red.png", anchor: { x: 32, y: 32 } }
        ]
      })
    */

  }

  loadMarkers() {
    console.log("loadMarkers:: ");
    // const locations: any[] = this.dummyData();

    //
    var region = this.map.getVisibleRegion();
    console.log("loadMarkers::  region is" + region);
    console.log("loadMarkers:: region farleft", region.farLeft, region.farRight, region.nearLeft, region.nearRight);

    // LatLngBounds
    var topLat = region.northeast.lat;      // .nearLeft and .farRight also for top-left, bottom-right of visible region.
    var botLat = region.southwest.lat;
    var leftLong = region.southwest.lng;
    var rightLong = region.northeast.lng;
    console.log("Screenbounds: topLat botLat leftLong rightLong", topLat, botLat, leftLong, rightLong);

    this.getPixelSpanFromMap(this.map);

    let pos: LatLng = new LatLng(0, 0);
    var markers = [];

    // - TODO: Faster performance by pre-sorting the data?
    this.JsonFileLoader.getData().subscribe((data) => {

      data = data.features;
      for (let i in data) {
        // console.log(data[i].geometry.coordinates[0]);
        var count = 0;
        var lat = 0;
        var long = 0;
        for (let j in data[i].geometry.coordinates[0]) {
          count++;
          long  += data[i].geometry.coordinates[0][j][0];   // TSulli123 resolved the polygon coords long lat into the average centre for marker placement.
          lat   += data[i].geometry.coordinates[0][j][1];
        }
        lat = lat / count;
        long = long / count;


        // Oops.
        // markers.push({
        //   'pos':          pos,
        //   'category':     1,
        //   'parkingType':  "Fatality",                   // -FIXME: for parking only. normalisation or restructure functions.
        //   'close':        [],                           // @TSulli123 -close? to resolve clustering? for markers that are close together?                
        //   'added':        false,
        //   'id':           i
        // })


        // Don't worry about updating markers on slide/zoom events #3 #issue **MarkerClustering first**.
        //
        if (long >= leftLong &&
          long <= rightLong &&
          lat >= botLat &&
          lat <= topLat) {
          let pos: LatLng = new LatLng(lat, long);
          let parkingType = data[i].properties.CLASS    // e.g. On-/Off-street
          //console.log("marker puuuush ----)");
          markers.push({                                // See above marker description.
            'pos':          pos,                        // point of Lat Lng
            'category':     1,                          // Previously 'type' to categorise differentiate in pie chart?
            'parkingType':  parkingType,                // -FIXME: for parking only. normalisation or restructure functions.
            'close':        [],                         // @TSulli123 -close? to resolve clustering?
            'added':        false,
            'id':           i
          })

          /*
            // Test code
            var pt = this.map.fromLatLngToPoint(pos);
            // pt.then(point => {
            //   console.log(point[0], point[1], point, "lol");
            // });


            // console.log("test latlng to px point:", pt, pt[0], pt[1], pos);
            var resolvedPointLat = pt.then(point => {
              return point[0];
            });
            //Promise.resolve(resolvedPoint);

            console.log("resolved point lat is ", resolvedPointLat);
          */
        }
        // _ Test code fin.

        if (parseInt(i) == data.length - 1)
          console.log("loadMarkers:: byebye");                        // hello

      }

      for (let i in markers) {                          // From previous screenbounds If-statement latlng validation, markers should contain

        
        let markerOptions2: MarkerOptions = {
          position: markers[i].pos,
          title:    markers[i].parkingType,             // - JOKE: non-fatal title name now.
          icon:     "red",
          animation:"DROP",
          disableAutoPan: true                          // disable auto centering onto the clicked marker.
        }

        // this.map.fromLatLngToPoint(markers[i].pos, function (data) {
        //   console.log(data);
        //
        //   //add markers that are close
        // })
        this.map.addMarker(markerOptions2)
          .then((marker: Marker) => {

            this.markersArr.push(marker);    
            

            marker.on(GoogleMapsEvent.MARKER_CLICK)
              .subscribe(() => {
                marker.showInfoWindow();



                // Promise! moved alert inside the `promise.then` to take advantage of
                // the promised screen pixel values of lat lng
                this.map.fromLatLngToPoint(marker.getPosition())
                  .then(point => {
                    
                    this.setMarkerConfig(marker, point);
                    this.getMarkerPosition(marker, point);  // - FIXME: function name getMarkerPosition doesn't illustrate the coded behaviour.
                    console.log("loadMarkers:: Markers arr from subscribe click", this.markersArr);

                    // bloat test code 
                    let markerOptions3: MarkerOptions = {
                      position: markers[0].pos,
                      title:    markers[0].parkingType,             // - JOKE: non-fatal title name now.
                      icon:     "yellow",
                      animation:"DROP",
                      disableAutoPan: true                          // disable auto centering onto the clicked marker.
                    }
                    
                    let gridCellSize = {
                      'pxWidth':  100,                                    // Placeholder values.
                      'pxHeight': 100
                    }
                    let numCategories = 3;   
                    this.doClusterer(markers, topLat, botLat, leftLong, rightLong, gridCellSize, numCategories); // - FIXME: Hardcoded numCategories to discern from the datasets given?

                    this.map.addMarker(markerOptions3)  // - FIXME: Dropping a marker on click to compare relative pixel distances.
                      .then((marker3: Marker) => {

                        // - BUG: promised property undefined
                        var diff = this.getMarkerPixelDistancePromise(marker, marker3);

                        //let differ = Promise.resolve(diff);
                        //console.log("difference from marker3 is:", diff[0], diff[1]);      // am I breaking a promise? </3. Messy code with unresolved promises everywhere
                        console.log("loadMarkers:: Promise return attempt");
                        diff
                          .then(pointsDiffXY => {
                            console.log("loadMarkers:: points diff click x:", pointsDiffXY[0], "y", pointsDiffXY[1]);


                            // test code mathemagic
                            var aa1 = marker.getPosition();
                            var bb2 = marker3.getPosition();

                            var promise = Promise.all([aa1, bb2])
                              .then(points => this.getPixelDistance(points[0].lat, points[0].lng, points[1].lat, points[1].lng, 15)
                              )
                              .then( prnt => {
                                  console.log("loadMarkers:: getPixDistanceMath", prnt);

                                  console.log("screenheight:", screen.height);
                                  // e.g. Marker -27.972352564267933, lng: 153.3951060846448}
                                  // e.g. -27.95233889780934, lng: 153.38103018701077}
                                  //let pxDistMath = this.getPixelDistance(-27.972352564267933, 153.3951060846448, -27.95233889780934, 153.38103018701077, 15);
                                  var rad = function(x) {
                                    return x * Math.PI / 180;
                                  };
                                  

                                  var getDistance = function(p1, p2) {
                                    var R = 6378137; // Earth’s mean radius in meter
                                    var dLat = rad(p2.lat() - p1.lat());
                                    var dLong = rad(p2.lng() - p1.lng());
                                    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                      Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
                                      Math.sin(dLong / 2) * Math.sin(dLong / 2);
                                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                    var d = R * c;
                                    console.log("dddd ", d);
                                    return d; // returns the distance in meter
                                  };
                                  console.log(getDistance);
                                  // this.getMarkerPixelDistancePromise(marker, marker3);
                                  
                                  // let pxDistmath = this.getPixelDistance();
                                  // console.log("loadMarkers:: pxDistMath", pxDistMath);

                                  
                              }
                            );


                          });

                        console.log("loadMarkers:: marker remove thing ", marker.remove());

                      });

                    //_ bloat test code end.

                  }) // marker3 _.then

              }); // _.subscribe

          }); // _.then

        
      } // _FOR loop


    }); // _Json file loader _.subscribe


    // addMarker async faster than for loop ?
    // console.log(locations[1].phone);
    // let baseArray: BaseArrayClass<any> = new BaseArrayClass<any>(locations);
    // baseArray.mapAsync((mOption: any, callback: (marker: Marker) => void) => {
    //   this.map.addMarker(mOption).then(callback);


    // }).then((markers: Marker[]) => {
    //   console.log(markers[0].get("address"));



    // }
    //   );

    // locations.forEach(element => {
    //   this.map.addMarker(element);
    //   console.log("hi");
    // });

    // Test marker to show display of snippet.
    this.map.addMarker({
      title: 'Commonwealth Games Village',
      snippet: "The Commonwealth Games Village (CGV) and the redevelopment of Parklands, Southport is one of the largest urban renewal projects ever undertaken on the Gold Coast.",
      icon: 'blue',
      animation: 'bounce',
      position: {
        lat: -27.9623464,
        lng: 153.3880684
      }
    }).then((marker: Marker) => {

      //marker.showInfoWindow();                            // Show info window by default
      marker.on(GoogleMapsEvent.MARKER_CLICK)
        .subscribe(() => {
          //marker.showInfoWindow();
          alert('Marker clicked title:' + marker.getTitle());
        });


    });

    //   .then(marker => {
    //     marker.on(GoogleMapsEvent.MARKER_CLICK)
    //       .subscribe(() => {
    //         //marker.showInfoWindow();
    //         //alert('clicked');
    //       });
    //   });

                           
    console.log("loadMarkers:: markers added.");
   
  } // _loadMarkers()

  // - MARK: Event functions
  // menuOpened and menuClosed to fix bug of cordova google maps overriding clickable elements from the background depending on fullscreen layout and menuType..
  // menuOpened() {
  //   this.map.one(GoogleMapsEvent.MAP_READY)
  //     .then(() => {
  //       this.map.setClickable(false);
  //       console.log("menuOpened:: map setClickable false");
  //     });
  // }
  // menuClosed() {
  //   this.map.one(GoogleMapsEvent.MAP_READY)
  //   .then(() => {
  //     this.map.setClickable(true);
  //     console.log("menuOpened:: map setClickable true");
  //   });
  // }

  // Assists debugging
  setMarkerConfig(marker: Marker, point) {
    alert("Marker clicked title:" +
      marker.getTitle() + "\n" +
      marker.getPosition() + "\n" +
      " Promise pt " +
      point[0] +
      " " +
      point[1]
    );
  }

  // - MARK: Map helpers
  // @param: map for map conversion functions and region bounds.
  getPixelSpanFromMap(map: GoogleMap) {
    let region = map.getVisibleRegion();

    // LatLngBounds
    var topLat = region.northeast.lat;      // .nearLeft and .farRight also for top-left, bottom-right of visible region.
    var botLat = region.southwest.lat;
    var leftLong = region.southwest.lng;
    var rightLong = region.northeast.lng;

    let mapSpanXConvert = map.fromLatLngToPoint(region.nearLeft); // y e.g. [0, 528]
    let mapSpanYConvert = map.fromLatLngToPoint(region.farRight); // x e.g. [328, 0]
    Promise.all([mapSpanXConvert, mapSpanYConvert])
      .then(spans => {
        let mapSpanX = spans[0][1];
        let mapSpanY = spans[1][0];
        
        console.log("Screenbounds: Pixels: mapSpanX, mapSpanY", mapSpanX, mapSpanY);
        let mapSpanLong = this.getDifference(leftLong, rightLong);
        let mapSpanLat  = this.getDifference(topLat, botLat);
        console.log("Screenbounds MapSpanLatLong::", mapSpanLong, mapSpanLat);
        let pixelSpanX = mapSpanLong / mapSpanX;
        let pixelSpanY = mapSpanLat / mapSpanY;
        console.log("Screenbound pixelSpan::X Y", pixelSpanX, pixelSpanY);


      });


  }
  // Helper function to scale proportions vs icon size ~~ // - FIXME: cleanup unused functions.
  //getMapSizeDegrees(topLat, botLat, leftLong, rightLong);//
  getMapSizeDegrees(map: GoogleMap) {
    var region = map.getVisibleRegion();
    console.log("getMapSizeDegrees:: region is" + region);

    var topLat = region.northeast.lat;
    var botLat = region.southwest.lat;
    var leftLong = region.southwest.lng;
    var rightLong = region.northeast.lng;

    return [topLat, botLat, leftLong, rightLong];
  }

// - FIXME: function name getMarkerPosition doesn't illustrate the coded behaviour.
  getMarkerPosition(marker: Marker, point) {


    this.map.fromLatLngToPoint(marker.getPosition())
      .then( point => {
        console.log("added marker at PIXEL POSITION: ", point[0], ",", point[1]);
        //var arrLength = this.markersArr.push(marker);         // debug
        var arrLength = this.markersArr.length;                 // debug
        console.log("placedMarkersArray Length", arrLength, "array contents", this.markersArr);  // debug
      });

  }


  longToX(lat, offset, radius) {
    return offset - radius * 
      Math.log((1 + Math.sin(lat * Math.PI / 180)   /  
               (1 - Math.sin(lat * Math.PI / 180))) / 2);
  }
  latToY(long, offset, radius) {

    return (offset + radius * long * Math.PI / 180)
  }

  // Helper function to get pixel distance of screen points.
  // FIXME: Difference of x 15.75 and y 1.25 gets a pixel distance 25???.
  getPixelDistance( lat1, long1, lat2, long2, zoom: number) {
    //let pixels = this.map.fromLatLngToPoint(new LatLng(0, 0)); // get pixels from the topleft of the div.

    // google maps zoom level numbers based on earth circumference.
    // hard coded values for conversion. Pythagoras + Mercator mathemagic?
    // 268435456 = half of the earth circumference in pixels at zoom level 21. 
    const OFFSET = 268435456;     // - TODO: global define. - TODO: Move logic to data controller class.
    const RADIUS = 85445659.4471  // offset / pi();

    let x1 = this.longToX(long1, OFFSET, RADIUS);
    let y1 = this.latToY(lat1, OFFSET, RADIUS);
    let x2 = this.longToX(long2, OFFSET, RADIUS);
    let y2 = this.latToY(lat2, OFFSET, RADIUS);
    console.log("getPixelDistance:: Math: x1 y1 x2 y2", x1, y1, x2, y2);
    // pythag
   

    // - TODO: resolve bit-shift vs powers of two faster operation?
    let dist = Math.sqrt( Math.pow((x1 - x2), 2) +  Math.pow((y1 - y2), 2) ) >> (21 - zoom);
    console.log("getPixelDistance:: dist is", dist);
    return dist;

  }

  /**
   * doClusterer:
   * @description: Don't need mathematically precise clustering. Just some way of consolidating markers to avoid noise:
   * Avoid overlapping markers
   *
   * @param: markersData
   * @argument: markersData:
   * - markersData: array of markers with an attribute (key-value) of 'pos' of type LatLng.
   * Naive grid-based clustering? O(n) time?
   * 2006 Google Maps Hacks #69:
   */
  // Don't need mathematically precise clustering.
  // Just some way of consolidating markers to avoid noise:
  // - overlapping markers
  // -
  // -
  //
  doClusterer(markersData,
              /*view and grid cell bounds*/
              topLat, botLat,
              leftLong, rightLong,
              gridsize, numCategories) {
    // Check limit granularity of pie chart categories display.
    // just process data array to determine categories? data structures? pre-sort? count the distribution.
    //
    var clusters = [];

    console.log(Object.keys(markersData));
    console.log("doClusterer:: markersData mm", markersData[0].pos );
    //console.log("doClusterer:: markersData mzm", markersData[0].id );
    var testMarkerAccessInFunction = markersData.pop();   // undefined?
    console.log("doClusterer:: markersData pop", testMarkerAccessInFunction);
    // Assign each point to a cluster based on grid cell height and width
    var count = 0;
    console.log("doClusterer:: markersData count", markersData.length);
    /*while (count < 10) {
      console.log("doClusterer:: marker", markersData[count]);  // - FIXME: doesn't do anything.
      count++;
    }*/



    for (let i in markersData) {

      //var col = ;
    }





    // Combine adjacent clusters into 'superclusters'. Assume points are naturally clustered.

    // 1. sort list of clusters based on number of points descending.

    // 2. Iterate list of clusters, looking at eight adjacent cells

  }

  getDifference(a, b) {
    return (a > b) ? (a - b) : (b - a);                 // Math.abs might return incorrect results?
  }

  // Helper function to return a tuple [x, y] that corresponds to the difference in pixel values of two points.
  getDifferenceXY(pxPtA, pxPtB){
    var ptDiffXY = [-1, -1];

    console.log("ptA", pxPtA, "ptB", pxPtB);
    ptDiffXY[0] = this.getDifference(pxPtA[0], pxPtB[0]);
    ptDiffXY[1] = this.getDifference(pxPtA[1], pxPtB[1]);

    console.log("ptX diff is", ptDiffXY[0], "ptY diff is", ptDiffXY[1]);
    
    return ptDiffXY;
  }


  getMarkerPixelDistancePromise(marker1: Marker, marker2: Marker): Promise<number[]> {
    // this.map.fromLatLngToPoint(marker1.getPosition()).then(point => {marker1.getPosition()
    var diff = [-1, -1];                          // negative distance indicates error code.. not async
    var getPxPtFromMarker1 = this.map.fromLatLngToPoint(marker1.getPosition());
    var getPxPtFromMarker2 = this.map.fromLatLngToPoint(marker2.getPosition());


    // -- test code -DELETEME:  test promise.all first. then return the promise after verifying it works.
    var promise = Promise.all([getPxPtFromMarker1, getPxPtFromMarker2])
                    .then(points => this.getDifferenceXY(points[0], points[1])
                  );

    return promise;

    // return new Promise(function(resolve, reject) {
    //   // var getPxPtFrommarker() = this.map.fromLatLngToPoint();


    // })
   
    /*
      return Promise.all
      this.map.fromLatLngToPoint(marker1.getPosition())
      .then(pxPtA => {


        this.map.fromLatLngToPoint(marker2.getPosition())
          .then(pxPtB => {
            console.log("Marker 1 PIXEL POSITION: ", pxPtA[0], ",", pxPtA[1]);
            console.log("Marker 2 PIXEL POSITION: ", pxPtB[0], ",", pxPtB[1]);
            let diffX = this.getDifference(pxPtA[0], pxPtB[0]);
            let diffY = this.getDifference(pxPtA[1], pxPtB[1]);
            console.log("Distance between Marker 1 and 2 =", diffX, diffY);


            diff = [diffX, diffY];                        // - COOL: tuples!
            return diff;
          });

          
      });
    
    */

      // return diff;
  }

  // 
  cluster() {
    // should take parameters for markers array, distance(cluster radius), zoom (map scale), categories

    let zoom = 15;
    let distance = 80;                 // pixels.
    var markers   = [];
    var clustered = [];                 // ? should multi-dimensional array based on category?

    // Cook Cl
    //-27.969021, 153.382553
    //-27.969076, 153.38263

    let ptsLatDiff = this.getDifference(-27.969021, -21.969076);
    let ptsLongDif = this.getDifference(153.382553, 153.38263);

    console.log("cluster::", ptsLatDiff, ptsLongDif);

    let ptsLatToX

    // out of cluster is -27.972198, 153.384456
    // Compare markers
    while (markers.length > 0 ) { // does .length update on pop? ono.

      var marker = markers.pop;
      var cluster = [];
      
      for (let i in markers) {
        var pixels = 1;
      }
    }

  } // _cluster()

}
