//
//  ViewController.swift
//  HVZ
//
//  Created by Ashwini Bhatkhande on 6/5/17.
//  Copyright © 2017 Ashwini Bhatkhande. All rights reserved.
//

import UIKit

class ViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    @IBAction func buttonTapped(button: UIButton)
    {
        
        var request = URLRequest(url: URL(string: "https://localhost:8080/api/registerUserDevice")!)
        request.httpMethod = "POST"
        let postString = "{\"requestingUserId\": null, \"requestingPlayerId\": null, requestingUserToken: \"florblebork\", userId: \"my user id\", deviceToken: \"blarg\"}"
        request.httpBody = postString.data(using: .utf8)
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            // check for fundamental networking error
            guard let data = data, error == nil else {
                print("error=\(error)")
                return
            }
            
            // check for http errors
            if let httpStatus = response as? HTTPURLResponse, httpStatus.statusCode != 200 {
                print("statusCode should be 200, but is \(httpStatus.statusCode)")
                print("response = \(response)")
            }
            
            let responseString = String(data: data, encoding: .utf8)
            print("responseString = \(responseString)")
        }
        task.resume()
        

    }
}

