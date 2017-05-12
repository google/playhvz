import { Component } from '@angular/core';
import {
  GoogleAuth,
  User,
  Push,
  PushToken
} from '@ionic/cloud-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public googleAuth: GoogleAuth, public user: User, public push: Push) {
  this.googleAuth.login().then((authLoginResult) => {
    console.log("BLAHDSLKFJSLDFJS");
    console.log('user: ', authLoginResult);  
    console.log(authLoginResult.token); 
  });

  	this.push.register().then((t: PushToken) => {
  		return this.push.saveToken(t);})
    .then((t: PushToken) => {
  		console.log('Token saved:', t.token);
	   });

	this.push.rx.notification()
  		.subscribe((msg) => {
    	alert(msg.title + ': ' + msg.text);
  	});
  }

  loginUser() {
    console.log("SPLIG");
    this.googleAuth.login().then((authLoginResult) => {
    console.log("BLAHDSLKFJSLDFJS");
    console.log('user: ', authLoginResult);  
    console.log(authLoginResult.token); 
  });
  }

}
