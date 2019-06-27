// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: High-level file comment.

package com.ghvz.ghvzapp;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.gms.auth.api.Auth;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInResult;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GetTokenResult;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.iid.FirebaseInstanceId;
import java.io.IOException;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;


public class MainActivity extends AppCompatActivity implements View.OnClickListener,
        GoogleApiClient.OnConnectionFailedListener {
    private static final String TAG = "HVZ";
    private static final int RC_SIGN_IN = 9001;
  private static final String APP_URL = "https://playhvz.com/game/google2018";
    private static final String APP_SERVICE_URL = "http://playhvz-170604.appspot.com/api";
    private static final String TOKEN_KEY = "GOOGLE_SIGN_IN_IDTOKEN";
    private static final MediaType APPLICATION_JSON
            = MediaType.parse("application/json; charset=utf-8");
    private static final int REGISTER_SUCCESS = 0;
    private static final int REGISTER_USER_DEVICE_SUCCESS = 1;
    private static final int REGISTER_FAIL = 2;
    private static final int REGISTER_USER_DEVICE_FAIL = 3;
    private WebView mWebView;
    private FirebaseAuth mAuth;
    private GoogleApiClient mGoogleApiClient;
    private Handler mHandler;
    private Button registerButton;
    private SharedPreferences sharedPreferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        sharedPreferences = this.getPreferences(Context.MODE_PRIVATE);

      registerButton = findViewById(R.id.register_device_button);
        registerButton.setOnClickListener(this);
      mWebView = findViewById(R.id.content_webview);
        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAppCacheEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setLoadsImagesAutomatically(true);

      mHandler = new Handler(new Handler.Callback() {
            @Override
            public boolean handleMessage(Message msg){
              Log.d(TAG, "Starting Handler");
              switch (msg.what) {
                    case REGISTER_SUCCESS:
                        RegisterUserDeviceThread regUsrDevThread = new RegisterUserDeviceThread();
                        regUsrDevThread.start();
                        break;
                    case REGISTER_USER_DEVICE_SUCCESS:
                        break;
                }
                return false;
            }
        });

        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(getString(R.string.default_web_client_id))
                .requestEmail()
                .build();
        mGoogleApiClient = new GoogleApiClient.Builder(this)
                .enableAutoManage(this /* FragmentActivity */, this /* OnConnectionFailedListener */)
                .addApi(Auth.GOOGLE_SIGN_IN_API, gso)
                .build();
        Log.d(TAG, "Got gso " + gso.toString());
        mAuth = FirebaseAuth.getInstance();
        FirebaseUser currentUser = mAuth.getCurrentUser();
        if(sharedPreferences.getString(TOKEN_KEY, null) == null || currentUser == null) {
          Log.d(TAG, "Signing in");
          signIn();
        } else {
          Log.d(TAG, "Got user " + currentUser.toString());
          try {
            currentUser.getIdToken(true)
                  .addOnCompleteListener(new OnCompleteListener<GetTokenResult>() {
                    public void onComplete(@NonNull Task<GetTokenResult> task) {
                      if (task.isSuccessful()) {
                        String url = String.format(
                            APP_URL + "?bridge=remote&signInMethod=accessToken&accessToken=%s",
                            //task.getResult().getToken());
                            sharedPreferences.getString(TOKEN_KEY, ""));
                        // Send token to your backend via HTTPS
                        Log.d(TAG, "opening webview to " + url);
                        mWebView.loadUrl(url);
                        Log.d(TAG, "loadUrl:success");
                      } else {
                        // Handle error -> task.getException();
                      }
                    }
                  });
            }catch(NullPointerException e){

            }
        }

    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Result returned from launching the Intent from GoogleSignInApi.getSignInIntent(...);
        if (requestCode == RC_SIGN_IN) {
            GoogleSignInResult result = Auth.GoogleSignInApi.getSignInResultFromIntent(data);
            if (result.isSuccess()) {
              Log.d(TAG, "GoogleSignIn Success");
                GoogleSignInAccount account = result.getSignInAccount();
                SharedPreferences.Editor editor = sharedPreferences.edit();
                editor.putString(TOKEN_KEY, account.getIdToken());
                editor.apply();
                firebaseAuthWithGoogle(account);
            } else {
                //// TODO: 6/13/17 send failure to webview
            }
        }
    }

    private void firebaseAuthWithGoogle(final GoogleSignInAccount acct) {
        Log.d(TAG, "firebaseAuthWithGoogle:" + acct.getId());
        final AuthCredential credential = GoogleAuthProvider.getCredential(acct.getIdToken(), null);
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(this, new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        if (task.isSuccessful()) {
                          // Sign in success, update UI with the signed-in user's information
                          Log.d(TAG, "signInWithCredential:success");
                          FirebaseUser user = mAuth.getCurrentUser();
                          Log.i(TAG, "SIGN IN SUCCESSFULLY");
                          Toast.makeText(MainActivity.this, "Authentication success.",
                              Toast.LENGTH_SHORT).show();
                          user.getIdToken(true)
                              .addOnCompleteListener(new OnCompleteListener<GetTokenResult>() {
                                public void onComplete(@NonNull Task<GetTokenResult> task) {
                                  if (task.isSuccessful()) {
                                    String url = String.format(
                                        APP_URL + "?bridge=remote&signInMethod=accessToken&accessToken=%s",
                                        sharedPreferences.getString(TOKEN_KEY, ""));
                                    // Send token to your backend via HTTPS
                                    Log.d(TAG, "opening webview to " + url);
                                    mWebView.loadUrl(url);
                                    Log.d(TAG, "loadUrl:success");
                                  } else {
                                    // Handle error -> task.getException();
                                  }
                                }
                              });
                        } else {
                            Log.w(TAG, "signInWithCredential:failure", task.getException());
                            Toast.makeText(MainActivity.this, "Authentication failed.",
                                    Toast.LENGTH_SHORT).show();
                            // TODO: 6/13/17 send failure to webview
                        }

                    }
                });
    }


    private void signIn(){
        Intent signInIntent = Auth.GoogleSignInApi.getSignInIntent(mGoogleApiClient);
        startActivityForResult(signInIntent, RC_SIGN_IN);
    }

    @Override
    public void onClick(View view) {
        switch(view.getId()){
            case R.id.register_device_button:
                startRegister();
                break;
        }
    }

    @Override
    public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {

    }

    private void startRegister(){
        RegisterThread registerThread = new RegisterThread();
        registerThread.start();
    }

    private class RegisterThread extends Thread {
        private OkHttpClient client = new OkHttpClient();
        private static final String ThreadTAG = "Register";

        @Override
        public void run() {
            client = new OkHttpClient();
            try{
                FirebaseUser user = mAuth.getCurrentUser();
              // TODO: handle the case that user is null.

                String json = String.format(
                        "{" +
                                " \"requestingUserId\": null," +
                                " \"requestingUserIdJwt\": null," +
                                " \"requestingPlayerId\": null," +
                                " \"userId\": \"user-%s\"" +
                                "}",
                        user.getUid()
                );
                Log.d(ThreadTAG, "[SENT JSON]: " + json);
                RequestBody body = RequestBody.create(APPLICATION_JSON, json);
                Request request = new Request.Builder()
                        .url(String.format("%s/register", APP_SERVICE_URL))
                        .post(body)
                        .build();
                Response response = client.newCall(request).execute();
                if (response.code() != 200) {
                    Log.e(ThreadTAG, "Invalid response status: " + response.code());
                    mHandler.sendEmptyMessage(REGISTER_FAIL);
                }else{
                    Log.d(ThreadTAG, "Valid response status: " + response.code());
                    mHandler.sendEmptyMessage(REGISTER_SUCCESS);
                }
            }catch (IOException ex){
                mHandler.sendEmptyMessage(REGISTER_FAIL);
                Log.e(ThreadTAG, ex.getMessage());
            }
        }
    }

    private class RegisterUserDeviceThread extends Thread {
        private OkHttpClient client = new OkHttpClient();
        private static final String ThreadTAG = "RegisterUserDevice";

        @Override
        public void run() {
            client = new OkHttpClient();
            try {
                FirebaseUser user = mAuth.getCurrentUser();

                String json = String.format(
                        "{" +
                                //" \"requestingUserToken\": \"%s\"," +
                                " \"requestingUserId\": \"user-%s\"," +
                                " \"requestingUserIdJwt\": null," +
                                " \"requestingPlayerId\": null," +
                                " \"userId\": \"user-%s\"," +
                                " \"deviceToken\": \"%s\"" +
                                "}",
                       // user.getToken(true),
                        user.getUid(),
                        user.getUid(),
                        FirebaseInstanceId.getInstance().getToken()
                );
                Log.d(ThreadTAG, "[SENT JSON]: " + json);
                RequestBody body = RequestBody.create(APPLICATION_JSON, json);
                Request request = new Request.Builder()
                        .url(String.format("%s/registerUserDevice", APP_SERVICE_URL))
                        .post(body)
                        .build();
                Response response = client.newCall(request).execute();
                if (response.code() != 200) {
                    mHandler.sendEmptyMessage(REGISTER_USER_DEVICE_FAIL);
                    Log.e(ThreadTAG, "Invalid response status: " + response.code());
                }else{
                    mHandler.sendEmptyMessage(REGISTER_USER_DEVICE_SUCCESS);
                    Log.d(ThreadTAG, "Valid response status : " + response.code());
                }
            } catch (IOException ex) {
                mHandler.sendEmptyMessage(REGISTER_USER_DEVICE_FAIL);
                Log.e(ThreadTAG, ex.getMessage());
            }
        }

    }

    private void sendUserDeviceLocation(double longitude, double latitude) {
        UpdateLocationThread updateLocationThread = new UpdateLocationThread(longitude, latitude);
        updateLocationThread.start();
    }

    private class UpdateLocationThread extends Thread {
        private OkHttpClient client = new OkHttpClient();
        private static final String ThreadTAG = "UploadLocation";

        public UpdateLocationThread(double longitude, double latitude) {
            this.longitude = longitude;
            this.latitude = latitude;
        }

        private double longitude, latitude;

        @Override
        public void run() {
            OkHttpClient httpClient = new OkHttpClient();

            try {
                String json = String.format("{" +
                                "  \"longitude\": %s," +
                                "  \"latitude\": %s," +
                                "  \"gameId\": \"%s\"," +
                                "  \"playerId\": \"%s\"," +
                                "  \"requestingUserIdJwt\": \"%s\"," +
                                "  \"requestingUserId\": \"%s\"," +
                                "  \"requestingPlayerId\": \"%s\"" +
                                "}", longitude, latitude,
                        getCurrentGameId(), getCurrentPlayerId(), getRequestingUserIdJwt(),
                        getRequestingUserId(), getCurrentPlayerId());

                RequestBody body = RequestBody.create(APPLICATION_JSON, json);
                Request request = new Request.Builder()
                        .url(String.format("%s/updatePlayerMarkers", APP_SERVICE_URL))
                        .post(body)
                        .build();
                Response response = httpClient.newCall(request).execute();
                Log.i("sendLocationReq", json);
                if (response.code() != 200) {
                    Log.e("sendLocationReq", "Invalid response status: " + response.code());
                }
                else {
                    Log.i("sendLocationReq", "Success!");
                }
            } catch (Exception ex) {
                ex.printStackTrace();
                Log.e("sendCurrentLocation", ex.toString());
            }
        }
    }

    private String getCurrentGameId() {
        return "game-test-3274632959878935-1";
    }

    private String getCurrentPlayerId() {
        return "publicPlayer-test-3274632959878935-1";
    }

    private String getRequestingUserId() {
        return "user-test-3274632959878935-1";
    }

    private String getRequestingUserIdJwt() {
        return "1337";
    }

    @Override
    protected void onStart() {
        super.onStart();

    }
}
