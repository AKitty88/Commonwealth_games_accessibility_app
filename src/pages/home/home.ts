
import {
  GoogleMaps,
  GoogleMap,
  // GoogleMapsEvent,
  // GoogleMapOptions,
  // CameraPosition,
  // MarkerOptions,
  Marker
 } from '@ionic-native/google-maps';

import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild('map') mapElement: ElementRef;
  map: GoogleMap;

  constructor(public navCtrl: NavController, 
              private _googleMaps: GoogleMaps) {
    // 

  }

// - FIXME: ngAfterViewInit() vs ionViewDidLoad()
// @ViewChild('map') may not yet be available in ionViewDidLoad lifecycle hook.
ngAfterViewInit() {
  this.initMap();
}

initMap() {
  let element = this.mapElement.nativeElement; // last resort?
  this.map = this._googleMaps.create(element);
}
  // ionViewDidLoad() {

  // }

}