from pyfcm import FCMNotification

SERVER_KEY = "AAAAkad6p4g:APA91bEUcIKcSeONQ2yYpQ0YtAIXqvYWD1vYwbESKQVNhMbtA79pOO842F8O6xQ0-MhNXMaCWd5xCs-LKtaH2f6WOMEqVlUkDUgJezyx2HjKoGhwsF7T92skiY-90cLmJFjJ8CRvd6Xe" 

push_service = FCMNotification(api_key=SERVER_KEY)
 
# Your api-key can be gotten from:  https://console.firebase.google.com/project/<project-name>/settings/cloudmessaging
 
registration_id = "<device registration_id>"
message_title = "Uber update"
message_body = "Hi john, your customized news for today is ready"
result = push_service.notify_single_device(registration_id=registration_id, message_title=message_title, message_body=message_body)
 
print result
 
# Send to multiple devices by passing a list of ids.
registration_ids = ["<device registration_id 1>", "<device registration_id 2>"]
message_title = "Uber update"
message_body = "Hope you're having fun this weekend, don't forget to check today's news"
result = push_service.notify_multiple_devices(registration_ids=registration_ids, message_title=message_title, message_body=message_body)
 
print result