package com.ghvz.ghvzapp;

import android.accounts.NetworkErrorException;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Message;
import android.os.StrictMode;
import android.support.annotation.NonNull;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.Toast;

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
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.iid.FirebaseInstanceId;

import java.io.IOException;
import java.util.logging.Logger;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;


public class MainActivity extends AppCompatActivity implements View.OnClickListener,
        GoogleApiClient.OnConnectionFailedListener {
    private static final String TAG = "Activity";
    private static final int RC_SIGN_IN = 9001;
    private static final String APP_SERVICE_URL = "http://humansvszombies-24348.appspot.com/api";
    private static final String TOKEN_KEY = "GOOGLE_SING_IN_IDTOKEN";
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

        registerButton = (Button) findViewById(R.id.register_device_button);
        registerButton.setOnClickListener(this);
        mWebView = (WebView) findViewById(R.id.content_webview);
        mHandler = new Handler(new Handler.Callback(){
            @Override
            public boolean handleMessage(Message msg){
                switch(msg.what){
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

        mAuth = FirebaseAuth.getInstance();
        FirebaseUser currentUser = mAuth.getCurrentUser();
        if(sharedPreferences.getString(TOKEN_KEY, null) == null || currentUser == null) {
            signIn();
        }
        else{
            try {
                //mWebView.loadUrl("http://playhvz.com/?userToken=" + currentUser.getToken(true));
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

    private void firebaseAuthWithGoogle(GoogleSignInAccount acct) {
        Log.d(TAG, "firebaseAuthWithGoogle:" + acct.getId());
        AuthCredential credential = GoogleAuthProvider.getCredential(acct.getIdToken(), null);
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
                            // TODO: 6/13/17 send user token to webview
                            //mWebView.loadUrl("http://playhvz.com/?userToken=" + user.getToken(true));
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

                String json = String.format(
                        "{" +
                                " \"requestingUserToken\": \"%s\"," +
                                " \"requestingUserId\": null," +
                                " \"requestingPlayerId\": null," +
                                " \"userId\": \"user-%s\"" +
                                "}",
                        sharedPreferences.getString(TOKEN_KEY, ""),
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
                                " \"requestingUserToken\": \"%s\"," +
                                " \"requestingUserId\": \"user-%s\"," +
                                " \"requestingPlayerId\": null," +
                                " \"userId\": \"user-%s\"," +
                                " \"deviceToken\": \"%s\"" +
                                "}",
                        user.getToken(true),
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
}
