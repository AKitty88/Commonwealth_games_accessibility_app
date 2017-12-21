import { jsonFileLoader } from './../../services/jsonFileLoader';
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
  LatLng
} from '@ionic-native/google-maps';


import { Platform } from 'ionic-angular';

import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild('map') mapElement: ElementRef;
  map: GoogleMap;


  // - DEPRECATED FIXED: `private _googleMaps: GoogleMaps` no longer needed in constructor
  constructor(public navCtrl: NavController,
    public platform: Platform,
    public JsonFileLoader: jsonFileLoader) {
    //
    console.log("Constructed");
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
      })


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
    console.log("region is" + region);
    var topLat = region.northeast.lat;
    var botLat = region.southwest.lat;
    var leftLong = region.southwest.lng;
    var rightLong = region.northeast.lng;
    console.log("Screenbounds: topLat botLat leftLong rightLong", topLat, botLat, leftLong, rightLong);
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
          long  += data[i].geometry.coordinates[0][j][0];       // TSulli123 resolved the polygon coords long lat into the average centre for marker placement.
          lat   += data[i].geometry.coordinates[0][j][1];
        }
        lat = lat / count;
        long = long / count;


        // Oops.
        // markers.push({
        //   'pos':          pos,
        //   'category':     1,
        //   'parkingType':  "Fatality",                   // -FIXME: for parking only. normalisation or restructure functions.
        //   'close':        [],                           // @TSulli123 -close? to resolve clustering?
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

          // console.log("resolved point lat is ", resolvedPointLat);
        }
        // _ Test code fin.

        if (parseInt(i) == data.length - 1)
          console.log("byebye");                        // hello

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

            this.map.fromLatLngToPoint(marker.getPosition()).then(
              point => {
                console.log("added marker at PIXEL POSITION: ", point[0], ",", point[1] );
            });


            marker.on(GoogleMapsEvent.MARKER_CLICK)
              .subscribe(() => {
                marker.showInfoWindow();

                // Promise! moved alert inside the `promise.then` to take advantage of
                // the promised screen pixel values of lat lng
                this.map.fromLatLngToPoint(marker.getPosition())
                  .then(point => {


                    alert("Marker clicked title:" +
                      marker.getTitle() + "\n" +
                      marker.getPosition() + "\n" +
                      " Promise pt " +
                      point[0] +
                      " " +
                      point[1]
                    );
                  }) // _.then


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
      animation: 'DROP',
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
    let gridCellSize = {
      'pxWidth':  10,                                    // Placeholder values.
      'pxHeight': 10
    }
    let numCategories = 3;                              // - FIXME: Hardcoded numCategories to discern from the datasets given?
    console.log("loadMarkers:: markers added.");
    this.doClusterer(markers, topLat, botLat, leftLong, rightLong, gridCellSize, numCategories);

  } // _loadMarkers()

  // Helper function to scale proportions vs icon size ~~ // - FIXME: cleanup unused functions.
  getMapSizeDegrees(topLat, botLat, leftLong, rightLong) {

  }

  // Helper function to get pixel distance of screen points.
  getPixelDistance( /* lat1, long1, lat2, long2, zoom: number */) {
    //let pixels = this.map.fromLatLngToPoint(new LatLng(0, 0)); // get pixels from the topleft of the div.

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
    console.log("doClusterer:: markersData", markersData[1]);
    // Assign each point to a cluster based on grid cell height and width
    var count = 0;
    while (count < 10) {
      console.log("doClusterer:: marker", markersData[count]);  // - FIXME: doesn't do anything.
      count++;
    }


    for (let i in markersData) {

      //var col = ;
    }

    // Combine adjacent clusters into 'superclusters'. Assume points are naturally clustered.

    // 1. sort list of clusters based on number of points descending.

    // 2. Iterate list of clusters, looking at eight adjacent cells


  }


}
