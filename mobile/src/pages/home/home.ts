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
  authToken: string;

  constructor(public googleAuth: GoogleAuth, public user: User, public push: Push) {
    this.login();

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

  login() {
    this.googleAuth.login().then(
      (authLoginResult) => {
        this.authToken = authLoginResult.token; 
      },
      (err) => {
        alert('Oops! Trouble signing you in. Error: ' + err);
      }
    );
  }

  logout() {
    this.googleAuth.logout();
  }
}
