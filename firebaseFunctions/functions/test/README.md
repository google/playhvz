Tests should be run against a locally running firestore emulator.

To run tests once use: firebase emulators:exec "npm test"

To run tests against a running emulator so you can inspect the contents use: 
call firebase emulators:start once, then you can call npm test directly