import { Component } from '@angular/core';
import {
  Push,
  PushToken
} from '@ionic/cloud-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public push: Push) {
  	this.push.register().then((t: PushToken) => {
  		return this.push.saveToken(t);
	}).then((t: PushToken) => {
  		console.log('Token saved:', t.token);
	});

	this.push.rx.notification()
  		.subscribe((msg) => {
    	alert(msg.title + ': ' + msg.text);
  	});
  }


}
