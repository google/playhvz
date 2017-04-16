install ionic and cordova, run:

npm install -g cordova ionic




...................................................
The first time you pull from git there are a lot of things missing. To get up and running do:

npm install
ionic platform add ios
ionic platform add android
(open ghvz/mobile/platforms/ios/ghv.xcodeproj in xcode,
click "ghvz" on the left, under the "General" tab go to "Signing" and add your apple account under "Team")
ionic build
....................................................





After you make changes you can build the app by:

ionic build

- or -

ionic build ios
ionic build android







To debug in a browser, run:

ionic lab





Install Android Studio and xcode.
You can open the appropriate app under
ghvz/mobile/platforms/[ios,android]
and run the app from there.



Remember to rebuild before running the app again to make
sure all your changes get translated to ios and android.
Using ionic lab should do this for you I think.


