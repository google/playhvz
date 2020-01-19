package com.app.playhvz.screens.gamelist

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.TextInputDialog
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_GAME_ID
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.operations.GameDatabaseOperations
import com.app.playhvz.firebase.viewmodels.GameListViewModel
import com.app.playhvz.navigation.NavigationUtil
import kotlinx.coroutines.runBlocking


/** Fragment for showing a list of Games the user is registered for.*/
class GameListFragment : Fragment(), GameListAdapter.IFragmentNavigator {
    companion object {
        private val TAG = GameListFragment::class.qualifiedName
    }

    lateinit var firestoreViewModel: GameListViewModel
    lateinit var gameListAdapter: GameListAdapter

    private var ownedGameList: List<Game> = emptyList()
    private var participantGameList: List<Game> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        firestoreViewModel = GameListViewModel()
        gameListAdapter = GameListAdapter(emptyList(), context!!, this)
        setupObservers()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_game_list, container, false)
        val gameListRecyclerView = view.findViewById<RecyclerView>(R.id.game_list)
        gameListRecyclerView.layoutManager = LinearLayoutManager(context)
        gameListRecyclerView.adapter = gameListAdapter
        setupFab()
        return view
    }

    override fun onGameClicked(gameId: String) {
        val editor =
            activity?.getSharedPreferences(SharedPreferencesConstants.PREFS_FILENAME, 0)!!.edit()
        editor.putString(CURRENT_GAME_ID, gameId)
        editor.apply()
        NavigationUtil.navigateToGameDashboard(findNavController(), gameId)
    }

    private fun setupObservers() {
        firestoreViewModel.getParticipantGames()
            .observe(this, androidx.lifecycle.Observer { serverGameList ->
                updateParticipantGameList(serverGameList)
            })

        firestoreViewModel.getOwnedGames()
            .observe(this, androidx.lifecycle.Observer { serverGameList ->
                updateOwnedGameList(serverGameList)
            })
    }

    private fun setupFab() {
        /*val floatingActionButton =
            activity?.findViewById<FloatingActionButton>(R.id.floating_action_button)

        floatingActionButton?.setOnClickListener {
            joinGame()
        }*/
    }

    /** Update data and notify view and adapter of change. */
    private fun updateOwnedGameList(updatedGameList: List<Game>) {
        ownedGameList = updatedGameList
        updateView()
        gameListAdapter.setData(buildAdapterList())
        gameListAdapter.notifyDataSetChanged()
    }

    /** Update data and notify view and adapter of change. */
    private fun updateParticipantGameList(updatedGameList: List<Game>) {
        participantGameList = updatedGameList
        updateView()
        gameListAdapter.setData(buildAdapterList())
        gameListAdapter.notifyDataSetChanged()
    }

    private fun updateView() {
        if (this.view == null) {
            return
        }
        val view = this.view as View
        view.findViewById<ProgressBar>(R.id.game_list_loading_spinner).visibility = View.GONE
        if (isGameListEmpty()) {
            view.findViewById<LinearLayout>(R.id.empty_game_list_view)?.visibility = View.VISIBLE
            view.findViewById<RecyclerView>(R.id.game_list).visibility = View.GONE
            setupEmptyListView(view)
        } else {
            view.findViewById<LinearLayout>(R.id.empty_game_list_view)?.visibility = View.GONE
            view.findViewById<RecyclerView>(R.id.game_list).visibility = View.VISIBLE
        }
    }

    private fun setupEmptyListView(view: View) {
        view.findViewById<Button>(R.id.join_button)?.setOnClickListener {
            joinGame()
        }
    }

    private fun joinGame() {
        val joinGameDialog = JoinGameDialog()
       /* joinGameDialog.setPositiveButtonCallback {
            val gameName = joinGameDialog.getGameNameProposal()

            val gameJoinedListener = {
                Toast.makeText(context, "Joined the game!", Toast.LENGTH_LONG).show()
            }
            val gameDoesNotExistsListener = {
                Toast.makeText(context, "$gameName does not exist!", Toast.LENGTH_LONG).show()
            }
            runBlocking {
                EspressoIdlingResource.increment()
                GameDatabaseOperations.asyncTryToJoinGame(
                    gameName,
                    gameJoinedListener,
                    gameDoesNotExistsListener
                )
                EspressoIdlingResource.decrement()
            }
        }*/
        activity?.supportFragmentManager?.let { joinGameDialog.show(it, TAG) }
    }

    private fun isGameListEmpty(): Boolean {
        return ownedGameList.isEmpty() && participantGameList.isEmpty()
    }

    private fun buildAdapterList(): List<Any> {
        val listBuilder = arrayListOf<Any>()
        listBuilder.add(context?.resources!!.getString(R.string.game_list_player_header))
        listBuilder.addAll(participantGameList)
        listBuilder.add(View.OnClickListener { joinGame() })
        if (ownedGameList.isNotEmpty()) {
            listBuilder.add(context?.resources!!.getString(R.string.game_list_admin_header))
            listBuilder.addAll(ownedGameList)
        }
        return listBuilder
    }

}