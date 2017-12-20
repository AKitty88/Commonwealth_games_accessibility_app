import { jsonFileLoader } from './../../services/jsonFileLoader';

import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker,
  MarkerCluster,
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
    console.log("topLat botLat leftLong rightLong", topLat, botLat, leftLong, rightLong);
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
          long += data[i].geometry.coordinates[0][j][0];
          lat += data[i].geometry.coordinates[0][j][1];
        }
        lat = lat / count;
        long = long / count;

        markers.push({
          'pos': pos,
          'type': 1,
          'close': [],
          'added': false,
          'id': i
        })
        // Don't worry about updating markers on slide/zoom events #issue **MarkerClustering first**.
        // 
        if (long >= leftLong &&
          long <= rightLong &&
          lat >= botLat &&
          lat <= topLat) {
          let pos: LatLng = new LatLng(lat, long);
          //console.log("marker puuuush ----)");
          markers.push({
            'pos': pos,
            'type': 1,
            'close': [],
            'added': false,
            'id': i
          })


          var pt = this.map.fromLatLngToPoint(pos);
          // pt.then(point => {
          //   console.log(point[0], point[1], point, "lol");
          // });

          console.log("test latlng to px point:", pt, pt[0], pt[1], pos);
          var resolvedPoint = pt.then(point => {
            return point[0];
          });
          //Promise.resolve(resolvedPoint);

          console.log("resolved point is ", resolvedPoint.then);
        }


        if (parseInt(i) == data.length - 1)
          console.log("byebye");                    // hello

      }

      for (let i in markers) {

        let markerOptions2: MarkerOptions = {
          position: markers[i].pos,
          title: "Fatal",
          icon: "red"
        }

        // this.map.fromLatLngToPoint(markers[i].pos, function (data) {
        //   console.log(data);
        //
        //   //add markers that are close
        // })

        this.map.addMarker(markerOptions2)
          .then((marker: Marker) => {
            marker.on(GoogleMapsEvent.MARKER_CLICK)
              .subscribe(() => {
                marker.showInfoWindow();

                // Promise! moved alert inside the `promise.then` to take advantage of 
                // the promised screen pixel values of lat lng
                this.map.fromLatLngToPoint(marker.getPosition())
                  .then(point => {
                    alert("Marker clicked title:" +
                      marker.getTitle() +
                      marker.getPosition() +
                      " Promise pt " +
                      point[0] +
                      " " +
                      point[1]
                    );
                  })



              });
          });
      }

    });


    // addMarker async faster than for loop
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

    // Test marker
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
    let gridSize = {
      'pxWidth': 200,
      'pxHeight': 400
    }
    let numCategories = 3;                              // - FIXME: 
    console.log("loadMarkers:: markers added.");
    this.doClusterer(markers, topLat, botLat, leftLong, rightLong, gridSize, numCategories);

  }


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
      console.log("doClusterer:: marker", markersData[count]);
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