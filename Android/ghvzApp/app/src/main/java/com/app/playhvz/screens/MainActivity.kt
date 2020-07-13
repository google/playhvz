/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.app.playhvz.screens

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.os.Bundle
import android.view.MenuItem
import android.view.View
import androidx.appcompat.widget.Toolbar
import androidx.core.content.ContextCompat
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.NavController
import androidx.navigation.NavDestination
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.NavigationUI
import androidx.navigation.ui.onNavDestinationSelected
import androidx.navigation.ui.setupWithNavController
import com.app.playhvz.R
import com.app.playhvz.app.BaseActivity
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_GAME_ID
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_PLAYER_ID
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.PREFS_FILENAME
import com.app.playhvz.common.playersearch.GlobalPlayerSearchDialog
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.operations.ChatDatabaseOperations
import com.app.playhvz.firebase.utils.FirebaseDatabaseUtil
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.navigation.SingleInstanceNavigator
import com.app.playhvz.screens.signin.SignInActivity
import com.app.playhvz.utils.SystemUtils
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.navigation.NavigationView
import kotlinx.android.synthetic.main.activity_main.*
import kotlinx.coroutines.runBlocking

class MainActivity : BaseActivity(), NavigationView.OnNavigationItemSelectedListener,
    NavController.OnDestinationChangedListener {
    companion object {
        private val TAG = MainActivity::class.qualifiedName

        fun getLaunchIntent(from: Context) = Intent(from, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        }
    }

    private lateinit var appBarConfiguration: AppBarConfiguration
    private lateinit var fab: FloatingActionButton
    private lateinit var bottomNavView: BottomNavigationView
    private lateinit var navDrawerView: NavigationView
    private lateinit var gameViewModel: GameViewModel
    private lateinit var navController: NavController

    private var prefs: SharedPreferences? = null
    private var gameId: String? = null
    private var isAdmin: Boolean = false

    private var fragmentsWithoutBottomNav = arrayOf(
        R.id.nav_chat_room_fragment,
        R.id.nav_chat_info_fragment,
        R.id.nav_declare_allegiance_fragment,
        R.id.nav_game_list_fragment,
        R.id.nav_game_settings_fragment,
        R.id.nav_mission_settings_fragment,
        R.id.nav_quiz_dashboard_fragment,
        R.id.nav_quiz_question_info_fragment,
        R.id.nav_quiz_question_order_fragment,
        R.id.nav_redeem_lifecode_fragment,
        R.id.nav_redeem_reward_fragment,
        R.id.nav_reward_dashboard_fragment,
        R.id.nav_reward_settings_fragment,
        R.id.nav_rules_fragment
    )

    private var fragmentsWithoutBackNavigation = setOf(
        R.id.nav_chat_list_fragment,
        R.id.nav_game_dashboard_fragment,
        R.id.nav_game_list_fragment,
        R.id.nav_mission_dashboard_fragment,
        R.id.nav_player_profile_fragment,
        R.id.nav_sign_out
    )

    // This must NOT be a lambda! https://stackoverflow.com/a/3104265/12094056
    private val gameIdPreferenceListener =
        SharedPreferences.OnSharedPreferenceChangeListener { prefs: SharedPreferences?, key: String? ->
            if (key.equals(CURRENT_GAME_ID) || key.equals(CURRENT_PLAYER_ID)) {
                listenToGameUpdates(prefs?.getString(CURRENT_GAME_ID, null))
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        FirebaseDatabaseUtil.initFirebaseDatabase()
        navController = findNavController(R.id.nav_host_fragment)
        gameViewModel = ViewModelProvider(this).get(GameViewModel::class.java)
        fab = findViewById(R.id.floating_action_button)
        bottomNavView = findViewById(R.id.bottom_navigation_view)
        prefs = getSharedPreferences(PREFS_FILENAME, 0)
        prefs?.registerOnSharedPreferenceChangeListener(gameIdPreferenceListener)

        setupUI()

        val currentGameId: String? = getCurrentGameId()
        val currentPlayerId: String? = getCurrentPlayerId()
        if (currentGameId != null && currentPlayerId != null) {
            listenToGameUpdates(currentGameId)
            NavigationUtil.navigateToGameDashboard(
                navController,
                currentGameId
            )
        } else {
            SystemUtils.clearSharedPrefs(this)
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        val navController = navController
        return navController.navigateUp() || super.onSupportNavigateUp()
    }

    /** Ties Navigation Drawer items to destinations defined by navigation graph. */
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        val navController = navController
        return item.onNavDestinationSelected(navController) || super.onOptionsItemSelected(item)
    }

    /** Navigation Drawer item selection. */
    override fun onNavigationItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            // Admin navigation options
            R.id.nav_admin_chat_list_fragment -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                NavigationUtil.navigateToAdminChatList(
                    navController
                )
            }
            R.id.nav_reward_dashboard_fragment -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                NavigationUtil.navigateToRewardDashboard(
                    navController
                )
            }
            R.id.nav_quiz_dashboard_fragment -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                NavigationUtil.navigateToQuizDashboard(
                    navController
                )
            }
            R.id.nav_game_settings_fragment -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                NavigationUtil.navigateToGameSettings(
                    navController,
                    getCurrentGameId()
                )
            }
            // Player navigation options
            R.id.nav_rules_fragment -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                NavigationUtil.navigateToRules(
                    navController
                )
            }
            R.id.nav_faq_fragment -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                NavigationUtil.navigateToFaq(
                    navController
                )
            }
            R.id.nav_create_chat_with_admin -> {
                item.actionView.visibility = View.VISIBLE
                navigateToAdminChat()
            }
            // General app options
            R.id.nav_game_list_fragment -> {
                SystemUtils.clearSharedPrefs(this)
                drawer_layout.closeDrawer(GravityCompat.START)
                navController.navigate(R.id.nav_game_list_fragment)
            }
            R.id.nav_create_game_fragment -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                NavigationUtil.navigateToCreateGame(
                    navController
                )
            }
            R.id.nav_redeem_lifecode_fragment -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                NavigationUtil.navigateToInfectPlayer(
                    navController
                )
            }
            R.id.nav_redeem_reward_fragment -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                NavigationUtil.navigateToRedeemReward(
                    navController
                )
            }
            R.id.nav_find_player -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                val onPlayerSelected = { playerId: String ->
                    NavigationUtil.navigateToPlayerProfile(
                        navController,
                        gameId!!,
                        playerId
                    )
                }
                val playerSearchDialog = GlobalPlayerSearchDialog(gameId!!, onPlayerSelected)
                playerSearchDialog.show(supportFragmentManager, TAG)
            }
            R.id.nav_sign_out -> {
                drawer_layout.closeDrawer(GravityCompat.START)
                startActivity(SignInActivity.getLaunchIntent(this, /* signOut= */true))
            }
        }
        return true
    }

    override fun onDestinationChanged(
        controller: NavController,
        destination: NavDestination,
        arguments: Bundle?
    ) {
        if (destination.id in fragmentsWithoutBottomNav) {
            fab.visibility = View.GONE
            bottomNavView.visibility = View.GONE
        } else {
            fab.visibility = View.GONE
            bottomNavView.visibility = View.VISIBLE
        }
        updateNavDrawerItems()
    }

    private fun getCurrentGameId(): String? {
        return prefs!!.getString(CURRENT_GAME_ID, null)
    }

    private fun getCurrentPlayerId(): String? {
        return prefs!!.getString(CURRENT_PLAYER_ID, null)
    }

    private fun setupUI() {
        // Set up navigator so that fragments don't call onCreate() twice when the activity is recreated.
        val navHostFragment = supportFragmentManager.findFragmentById(R.id.nav_host_fragment)!!
        val singleInstanceNavigator = SingleInstanceNavigator(
            this,
            navHostFragment.childFragmentManager,
            R.id.nav_host_fragment
        )
        navController.navigatorProvider.addNavigator(singleInstanceNavigator)
        navController.setGraph(R.navigation.nav_graph)

        navDrawerView = findViewById(R.id.nav_view)
        navDrawerView.menu.findItem(R.id.nav_create_chat_with_admin).actionView.visibility =
            View.GONE

        setupToolbar()
        setupBottomNavigationBar()
        setupFab()
    }

    private fun setupToolbar() {
        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        val navDrawerView = findViewById<NavigationView>(R.id.nav_view)
        val navController = navController
        setSupportActionBar(toolbar)
        appBarConfiguration =
            AppBarConfiguration(
                fragmentsWithoutBackNavigation,
                findViewById<DrawerLayout>(R.id.drawer_layout)
            )
        toolbar.setupWithNavController(navController, appBarConfiguration)

        navDrawerView.setupWithNavController(navController)
        navDrawerView.setNavigationItemSelectedListener(this)
        findViewById<BottomNavigationView>(R.id.bottom_navigation_view)
            .setupWithNavController(navController)

        navController.addOnDestinationChangedListener(this)
    }

    private fun setupBottomNavigationBar() {
        //val navHostFragment: NavHostFragment = supportFragmentManager.findFragmentById(R.id.nav_host_fragment);
        NavigationUI.setupWithNavController(bottomNavView, navController)
        bottomNavView.setupWithNavController(navController)
        bottomNavView.setOnNavigationItemSelectedListener { item -> onBottomNavItemSelected(item) }
    }

    /** Bottom Navigation item selection. */
    private fun onBottomNavItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.action_home -> {
                NavigationUtil.navigateToGameDashboard(navController, getCurrentGameId())
            }
            R.id.action_missions -> {
                NavigationUtil.navigateToMissionDashboard(navController)
            }
            R.id.action_chat -> {
                NavigationUtil.navigateToChatList(navController)
            }
            R.id.action_profile -> {
                NavigationUtil.navigateToPlayerProfile(navController, getCurrentGameId(), null)
            }
        }
        return true
    }

    private fun setupFab() {
        fab.setColorFilter(Color.WHITE)
        fab.backgroundTintList = ContextCompat.getColorStateList(this, R.color.colorPrimary)
    }

    private fun listenToGameUpdates(gameId: String?) {
        if (FirebaseProvider.getFirebaseAuth().currentUser == null) {
            // The user signed out and the game id was cleared. Do nothing with game navigation.
            return
        }
        if (gameId.isNullOrEmpty() || getCurrentPlayerId() == null) {
            if (isAdmin) {
                isAdmin = false
                updateNavDrawerItems()
            }
            return
        }
        this.gameId = gameId
        gameViewModel.getGameAndAdminObserver(this, gameId, getCurrentPlayerId()!!) {
            NavigationUtil.navigateToGameList(navController, this)
        }.observe(this, androidx.lifecycle.Observer { serverUpdate ->
            val newIsAdmin = serverUpdate.isAdmin
            if (newIsAdmin != isAdmin) {
                isAdmin = newIsAdmin
                updateNavDrawerItems()
            }
        })
    }

    private fun updateNavDrawerItems() {
        navDrawerView.menu.setGroupVisible(R.id.nav_admin_options, isAdmin)
        navDrawerView.menu.setGroupVisible(R.id.nav_game_options, gameId != null)
    }

    private fun navigateToAdminChat() {
        val gameId = getCurrentGameId()
        val playerId = getCurrentPlayerId()
        if (gameId == null || playerId == null) {
            return
        }
        val onSuccess = { adminChatId: String ->
            navDrawerView.menu.findItem(R.id.nav_create_chat_with_admin).actionView.visibility =
                View.GONE
            drawer_layout.closeDrawer(GravityCompat.START)
            NavigationUtil.navigateToChatRoom(navController, adminChatId, playerId)
        }
        runBlocking {
            EspressoIdlingResource.increment()
            ChatDatabaseOperations.asyncCreateOrGetAdminChat(
                gameId,
                playerId,
                onSuccess,
                {}
            )
            EspressoIdlingResource.decrement()
        }
    }
}
