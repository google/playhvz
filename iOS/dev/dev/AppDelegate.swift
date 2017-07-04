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
    
    var backendUrl: String = "https://playhvz-170604.appspot.com/api/"
    // var backendUrl: String = "http://localhost:8080/api/"
    
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey : Any]? = nil) -> Bool {
        // Override point for customization after application launch.
        
        FirebaseApp.configure()
        
        Auth.auth().addStateDidChangeListener() { (auth, user) in
            let viewController = self.window!.rootViewController as! MainViewController
            if let user = user {
                print("User is signed in with uid:", user.uid)
                viewController.userId = "user-" + user.uid
                self.onSignedIn(user)
            } else {
                viewController.resultText = "Hit the sign in button above to set up your device for notifications."
            }
        }

        return true
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
    
    func handleOpenUrl(_ url: URL, sourceApplication: String?) -> Bool {
        if FUIAuth.defaultAuthUI()?.handleOpen(url, sourceApplication: sourceApplication) ?? false {
            return true
        }
        
        // other URL handling goes here.
        return false
    }
    
    func onSignedIn(_ firebaseUser: User?) {
        registerForNotifications()
    }
    
    func registerForNotifications() {
        let viewController = self.window!.rootViewController as! MainViewController
        viewController.stage = 2
        
        let application = UIApplication.shared
        
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
        
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
        print("APN token: ", deviceToken.map { String(format: "%02.2hhx", $0) }.joined())
        print("Firebase device token: ", Messaging.messaging().fcmToken!)
        
        registerWithBackend()
    }
    
    /// This method will be called whenever FCM receives a new, default FCM token for your
    /// Firebase project's Sender ID.
    /// You can send this token to your application server to send notifications to this device.
    func messaging(_ messaging: Messaging, didRefreshRegistrationToken fcmToken: String) {
        print("Firebase registration token: \(fcmToken)")
        registerWithBackend()
    }
    
    func registerWithBackend() {
        let viewController = self.window!.rootViewController as! MainViewController
        viewController.stage = 3
        
        let firebaseUser = Auth.auth().currentUser
        let firebaseUid: String = firebaseUser!.uid
        firebaseUser?.getIDTokenForcingRefresh(true) { (firebaseUserIdToken, error) in
            
            if let error = error {
                viewController.resultText = "Error: " + error.localizedDescription
                return;
            }
            
            let parameters: Parameters = [
                "requestingUserIdJwt": firebaseUserIdToken!,
                "requestingUserId": NSNull(),
                "requestingPlayerId": NSNull(),
                "userId": "user-" + firebaseUid]
            
            // Both calls are equivalent
            Alamofire.request(self.backendUrl + "register", method: .post, parameters: parameters, encoding: JSONEncoding.default).responseJSON { response in
                
                self.onRegisteredWithBackend()
            }
        }
    }
    
    func onRegisteredWithBackend() {
        self.registerDeviceWithBackend()
    }
    
    func registerDeviceWithBackend() {
        let viewController = self.window!.rootViewController as! MainViewController
        viewController.stage = 4
        
        
        
        let firebaseUser = Auth.auth().currentUser
        let firebaseUid: String = firebaseUser!.uid
        firebaseUser?.getIDTokenForcingRefresh(true) { (firebaseUserIdToken, error) in
            
            if let error = error {
                viewController.resultText = "Error: " + error.localizedDescription
                return;
            }
            
            let deviceToken = Messaging.messaging().fcmToken
            
            let parameters: Parameters = [
                "requestingUserIdJwt": firebaseUserIdToken!,
                "requestingUserId": "user-" + firebaseUid,
                "requestingPlayerId": NSNull(),
                "userId": "user-" + firebaseUid,
                "deviceToken": deviceToken!]
            
            // Both calls are equivalent
            Alamofire.request(self.backendUrl + "registerUserDevice", method: .post, parameters: parameters, encoding: JSONEncoding.default).responseJSON { response in
                
                self.onRegisteredDeviceWithBackend()
            }
        }
    }
    
    func onRegisteredDeviceWithBackend() {
        let viewController = self.window!.rootViewController as! MainViewController
        viewController.stage = 5
        
        viewController.resultText = "You're all set up! You can now receive notifications about the game, and other players can send you notifications via '@playername' in chat rooms."
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
    
}
