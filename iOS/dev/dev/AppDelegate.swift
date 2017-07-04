//
//  AppDelegate.swift
//  dev
//
//  Created by Evan Ovadia on 6/27/17.
//
//

import UIKit
import UserNotifications
import Firebase
import FirebaseInstanceID
import FirebaseMessaging
import FirebaseAuthUI
import FirebaseGoogleAuthUI
import Alamofire

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey : Any]? = nil) -> Bool {
        // Override point for customization after application launch.
        
        if #available(iOS 10.0, *) {
            // For iOS 10 display notification (sent via APNS)
            UNUserNotificationCenter.current().delegate = self
            let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
            UNUserNotificationCenter.current().requestAuthorization(
                options: authOptions,
                completionHandler: {_, _ in })
            // For iOS 10 data message (sent via FCM
            Messaging.messaging().delegate = self
        } else {
            let settings: UIUserNotificationSettings =
                UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
            application.registerUserNotificationSettings(settings)
        }
        
        application.registerForRemoteNotifications()
        
        FirebaseApp.configure()
        
        
        
        Auth.auth().addStateDidChangeListener { (auth, user) in
            if let user = user {
                self.onSignedIn(user)
                // User is signed in. Show home screen
            } else {
                print("Not signed in!")
                // No User is signed in. Show user the login screen
            }
        }
        

        return true
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        
        // cgA-VuI8YJY:APA91bFVmC7UhchyqE0YlcoBX024HlazN7t5RsXVRwtqVjBKY7JhiEmWRDq0uYFEBQtSz365I2MK0neSjLrq6hZYxfnZjVAqbF20y2YgPqgOBeYowQ77Z-jMyJwN1O68vmHF5wINSIFf
        
        // c527293c464a86cebf4de7017bf746c49a0373732ed4f1431f215e096b5d4b00my-
        
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print(token)
        /*
        print("Got token data! (deviceToken)")
        var characterSet: NSCharacterSet = NSCharacterSet( charactersInString: "<>" )
        
        var deviceTokenString: String = ( deviceToken.description as NSString )
            .stringByTrimmingCharactersInSet( characterSet )
            .stringByReplacingOccurrencesOfString( " ", withString: "" ) as String
        
        print( deviceTokenString )*/
    }

    /// This method will be called whenever FCM receives a new, default FCM token for your
    /// Firebase project's Sender ID.
    /// You can send this token to your application server to send notifications to this device.
    public func messaging(_ messaging: Messaging, didRefreshRegistrationToken fcmToken: String) {
        // implement?
    }

    
    // The callback to handle data message received via FCM for devices running iOS 10 or above.
    func application(received remoteMessage: MessagingRemoteMessage) {
        print(remoteMessage.appData)
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }
    
    @available(iOS 9.0, *)
    func application(_ app: UIApplication, open url: URL, options: [UIApplicationOpenURLOptionsKey : Any]) -> Bool {
        let sourceApplication = options[UIApplicationOpenURLOptionsKey.sourceApplication] as! String?
        return self.handleOpenUrl(url, sourceApplication: sourceApplication)
    }
    
    @available(iOS 8.0, *)
    func application(_ application: UIApplication, open url: URL, sourceApplication: String?, annotation: Any) -> Bool {
        return self.handleOpenUrl(url, sourceApplication: sourceApplication)
    }
    
    
    // let credential = FIRFacebookAuthProvider.credential(withAccessToken;FBSDKAccessToken.current().tokenString)

    
    // fileprivate func showAlert(_ message: String) {
        // let alertController = UIAlertController(title: "iOScreator", message:
            //message, preferredStyle: UIAlertControllerStyle.alert)
        // alertController.addAction(UIAlertAction(title: "Dismiss", style: UIAlertActionStyle.default,handler: nil))
    //     self.presentViewController(alertController, animated: true, completion: nil)
    // }
    
    
    
    
    func onSignedIn(_ firebaseUser: User?) {
        
        let firebaseUid: String = firebaseUser!.uid
        print("onSignedIn!", firebaseUid)
        firebaseUser?.getIDTokenForcingRefresh(true) { (firebaseUserIdToken, error) in
            print("got id token!", firebaseUserIdToken)
            
            if let error = error {
                print(error)
                // Handle error
                return;
            }
            
            if let firebaseUserIdToken = firebaseUserIdToken {
                print("in the thing, about to send!")
                
                let parameters: Parameters = [
                    "requestingUserIdJwt": firebaseUserIdToken,
                    "requestingUserId": NSNull(),
                    "requestingPlayerId": NSNull(),
                    "userId": "user-" + firebaseUid,
                ]
                
                let url: String = "https://playhvz-170604.appspot.com/api/register"
                // let url: String = "http://localhost:8080/api/register" doesnt work
                
                // Both calls are equivalent
                Alamofire.request(url, method: .post, parameters: parameters, encoding: JSONEncoding.default).responseJSON { response in
                    
                    print("got response!")
                    debugPrint(response)
                    
                }
            }
        }
        

    }
    
    func handleOpenUrl(_ url: URL, sourceApplication: String?) -> Bool {
        if FUIAuth.defaultAuthUI()?.handleOpen(url, sourceApplication: sourceApplication) ?? false {
            return true
        }
        
        // other URL handling goes here.
        return false
    }

}
