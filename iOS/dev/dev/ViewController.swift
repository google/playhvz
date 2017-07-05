//
//  ViewController.swift
//  dev
//
//  Created by Evan Ovadia on 6/27/17.
//
//

import UIKit
import Firebase
import FirebaseAuthUI
import FirebaseGoogleAuthUI
import Alamofire

class MainViewController: UIViewController, FUIAuthDelegate {
    @IBOutlet weak var loginButton: UIButton!
    @IBOutlet weak var logoutButton: UIButton!
    
    @IBOutlet weak var signingInLabel: UILabel!
    @IBOutlet weak var userIdLabel: UILabel!
    @IBOutlet weak var subscribingToNotificationsLabel: UILabel!
    @IBOutlet weak var registeringUserLabel: UILabel!
    @IBOutlet weak var registeringDeviceLabel: UILabel!
    @IBOutlet weak var doneTextView: UITextView!
    
    public var resultText: String? {
        didSet {
            doneTextView.text = resultText
        }
    }
    
    public var userId: String? {
        didSet {
            userIdLabel.text = "User ID: " + (userId ?? "(none)")
        }
    }
    
    public var stage: Int = 0 {
        didSet {
            print("SETTING STAGE TO ", stage)
            signingInLabel.isHidden = (stage <= 0)
            signingInLabel.text =
                (stage == 1 ? "Signing in..." : "Signed in!")
            
            subscribingToNotificationsLabel.isHidden = (stage <= 1)
            subscribingToNotificationsLabel.text =
                (stage == 2 ? "Subscribing to notifications..." : "Subscribed to notifications!")
            
            registeringUserLabel.isHidden = (stage <= 2)
            registeringUserLabel.text =
                (stage == 3 ? "Handshaking with server..." : "Handshaked with server!")
            
            registeringDeviceLabel.isHidden = (stage <= 3)
            registeringDeviceLabel.text =
                (stage == 4 ? "Registering device with server..." : "Registered device with server!")
            
            doneTextView.isHidden = (stage <= 4)
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    /** @fn authUI:didSignInWithUser:error:
     @brief Message sent after the sign in process has completed to report the signed in user or
     error encountered.
     @param authUI The @c FUIAuth instance sending the message.
     @param user The signed in user if the sign in attempt was successful.
     @param error The error that occurred during sign in, if any.
     */
    func authUI(_ authUI: FUIAuth, didSignInWith user: User?, error: Error?) {
        
    }
    
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        Auth.auth().addStateDidChangeListener() { (auth, user) in
            if let user = user {
                print("User is signed in with uid:", user.uid)
                self.presentLogout(user: user)
            } else {
                print("No user is signed in.")
                self.presentLoginScreen()
            }
        }
    }
    
    fileprivate func presentLoginScreen() {
        loginButton.isHidden = false
        logoutButton.isHidden = true
    }
    
    fileprivate func presentLogout(user: User) {
        loginButton.isHidden = true
        logoutButton.isHidden = false
    }
    
    @IBAction func doLogin(_ sender: Any) {
        login(sender: sender)
    }
    
    @IBAction func logout(_ sender: Any) {
        do {
            try Auth.auth().signOut()
            stage = 0
        } catch is NSError {
            resultText = "Error signing out!"
        }
    }
    
    fileprivate func login(sender: Any) {
        stage = 1
        
        let authUI = FUIAuth.defaultAuthUI()
        authUI?.delegate = self
        
        let googleAuthUI = FUIGoogleAuth.init(scopes: [kGoogleUserInfoEmailScope])
        authUI?.providers = [googleAuthUI];
        
        let authViewController = authUI?.authViewController();
        self.present(authViewController!, animated: true, completion: nil)
    }
}

