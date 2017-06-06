  
## Mobile  
  
### Installing libraries necessary  
Run:  
  
`npm install -g cordova ionic`  
   
 ### Initialize after the first pull   
  
The first time you pull from git there are a lot of things missing. To get up and running do:  
  
`npm install`  
  
### Build the app by:  
`ionic build ios`  
`ionic build android`  
  
### Run ios and android platforms in a browser for easy debugging, run:  
  
`ionic lab`  
  
Install Android Studio and xcode.  
You can open the appropriate app under  
**ghvz/mobile/platforms/[ios,android]**  
and run the app from there.  
  
If you have the write paths setup you can also run on emulators or devices using:  
  
`ionic run ios`  
`ionic run android`  
  
  or some emulate command, I think ionic emulate but look it up, I just run emulators from xcode and android studio cause I don't want to mess with any of that.  
  
  
Remember to rebuild from commandline before running the app from xcode or android studio again. I think `ionic lab` does this for you if you're debugging in the browser emulators.  
  
## Push notifications and other ionic magic
To get the sender_id and ionic app_id see:  
https://docs.google.com/document/d/1f-yPtqUROyq5h9ZmsqJyZ5Z5PrydvK8ev9I--ogdFPo/edit#  
  
## Troubleshooting  
  
When in doubt:
  
`rm -r node_modules/*`   
`npm install`  
  

  ### Debugging Android build issues  
Android Studio updated recently and changed some things which break ionic. You'll see errors about gradle, Android Tools, needing to update to the latest version or trying to change a line to get gradle 3.3. I've seen things man, so if these steps don't fix your problem ask me.  
  
Good luck!  


#### Installing Android aka fixing ANDROID_HOME issues  
If you have android studio installed you're in luck, that's half the battle (and I recommend installing android studio instead of just the sdk tools, AS fixes gradle for you sometimes and it's nice)  

Find where android studio installed the android sdk. Open Android Studio, on Mac click Android Studio->preferences->System Settings->Android SDK and it will show you the path.  
  
Mine was /Users/me/Development/adt-bundle-mac-x86_64-20131030/sdk  

Then:  
`export ANDROID_HOME=/<installation location>/sdk`  
`export PATH=${PATH}:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools`  
  
#### Update Android Studio's tools 
If you're seeing any issues with versions or tools missing, the latest android studio update left some things out. We'll have to add them back.  
  
Go to https://developer.android.com/studio/index.html#downloads and download just the command line tools  
Unzip the file and move the tools directory into your $ANDROID_HOME sdk directory, replacing the tools directy that was there.  

You should be good to go but there's a small chance you'll see some gradle errors while building ionic. See the next section for help on that.  

#### Update Gradle to 3.3  
So you'll see an error that you need to use Gradle 3.3 and it will probably suggest you replace a file name with gradle-3.3. That's great and all but that file gets overwritten every time you try to build so that won't work at all.  

Instead open mobile/platforms/android/cordova/lib/builders/GradleBuilder.js -> find line that sets the distributionUrl and change the file from gradle-2.4.1 or whatever to gradle-3.3  
  
 That's it. The next time you try to build it will get the updated gradle library and you'll be good to go. For added measure you can open android studio and it will probably complain about grandle config or updates or something, just say yeah and let it do it's thing and everything will work well. :)
