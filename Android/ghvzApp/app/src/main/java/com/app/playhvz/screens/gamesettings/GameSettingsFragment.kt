package com.app.playhvz.screens.gamesettings

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doOnTextChanged
import androidx.emoji.widget.EmojiEditText
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.app.debug.DebugFlags
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.operations.GameDatabaseOperations
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.utils.SystemUtil
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.DocumentReference
import kotlinx.android.synthetic.main.fragment_game_settings.*
import kotlinx.coroutines.runBlocking


/** Fragment for showing a list of Games the user is registered for.*/
class GameSettingsFragment : Fragment() {
    companion object {
        private val TAG = GameSettingsFragment::class.qualifiedName
    }

    lateinit var firestoreViewModel: GameViewModel
    val args: GameSettingsFragmentArgs by navArgs()

    var gameId: String? = null
    var game: Game? = null

    var nameView: EmojiEditText? = null
    var submitButton: Button? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        gameId = args.gameId
        firestoreViewModel = ViewModelProvider(this).get(GameViewModel::class.java)

        println("lizard - game id " + gameId)
        setupObservers()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_game_settings, container, false)
        nameView = view.findViewById(R.id.game_name)
        submitButton = view.findViewById(R.id.submit_button)

        submitButton?.setOnClickListener { _ ->
            if (gameId == null) {
                createGame()
            } else {
                updateGame()
            }
        }

        if (DebugFlags.isDevEnvironment && gameId != null) {
            val deleteButton = view.findViewById<Button>(R.id.delete_button)
            deleteButton.visibility = View.VISIBLE
            deleteButton.setOnClickListener { showDeleteDialog() }
        }

        setupToolbar()
        initializeFields()
        return view
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title =
                if (game == null || game?.name.isNullOrEmpty()) context!!.getString(R.string.game_settings_create_game_toolbar_title)
                else game?.name
            toolbar.setDisplayHomeAsUpEnabled(false)
        }
    }

    fun initializeFields() {
        if (gameId != null) {
            // Disable changing name of already created game
            nameView?.setText(game?.name)
            nameView?.setEnabled(false)
            nameView?.setFocusable(false)
        } else {
            // Setup UI for creating a new game
            nameView?.doOnTextChanged { text, _, _, _ ->
                if (text.isNullOrEmpty()) {
                    submit_button.setEnabled(false)
                } else {
                    submit_button.setEnabled(true)
                }
            }
        }
    }

    private fun createGame() {
        val name = nameView?.text
        val gameCreatedListener = OnSuccessListener<DocumentReference> {
            Toast.makeText(
                context,
                getString(R.string.create_game_success_toast, name),
                Toast.LENGTH_LONG
            ).show()
            SystemUtil.hideKeyboard(context!!)
            if (it == null) {
                NavigationUtil.navigateToGameList(findNavController(), activity!!)
            }
            val editor =
                activity?.getSharedPreferences(SharedPreferencesConstants.PREFS_FILENAME, 0)!!.edit()
            editor.putString(SharedPreferencesConstants.CURRENT_GAME_ID, it.id)
            editor.apply()
            NavigationUtil.navigateToGameDashboard(findNavController(), it.id)
        }
        val gameExistsListener = {
            Toast.makeText(context, "$name already exists!", Toast.LENGTH_LONG).show()
        }
        runBlocking {
            EspressoIdlingResource.increment()
            GameDatabaseOperations.asyncTryToCreateGame(
                name.toString(),
                gameCreatedListener,
                gameExistsListener
            )
            EspressoIdlingResource.decrement()
        }
    }

    private fun updateGame() {

    }

    private fun setupObservers() {
        if (gameId == null) {
            return
        }
        firestoreViewModel.getGame(gameId!!)
            .observe(this, androidx.lifecycle.Observer { serverGame ->
                updateGame(serverGame)
            })
    }

    private fun updateGame(serverGame: Game?) {
        game = serverGame
        setupToolbar()
        initializeFields()
    }

    private fun showDeleteDialog() {
        val confirmationDialog = AlertDialog.Builder(context!!)
        confirmationDialog.setTitle("Really delete ${game?.name}?")
        confirmationDialog.setMessage("This action can't be undone...")
        confirmationDialog.setPositiveButton("Delete") { _, _ ->
            if (gameId != null) {
                runBlocking {
                    EspressoIdlingResource.increment()
                    GameDatabaseOperations.asyncDeleteGame(
                        gameId!!
                    ) {
                        Toast.makeText(
                            context, "Deleted game",
                            Toast.LENGTH_LONG
                        ).show()

                        NavigationUtil.navigateToGameList(findNavController(), activity!!)

                    }
                    EspressoIdlingResource.decrement()
                }
            }
        }
        confirmationDialog.setNegativeButton("Ooops, keep the game!", { _, _ -> })
        confirmationDialog.show()
    }
}