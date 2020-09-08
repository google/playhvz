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

package com.app.playhvz.screens.gamestats

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.ActionBar
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.globals.CrossClientConstants.Companion.getAliveColor
import com.app.playhvz.common.globals.CrossClientConstants.Companion.getDeadColor
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Stat
import com.app.playhvz.firebase.operations.GameDatabaseOperations
import com.app.playhvz.navigation.NavigationUtil
import com.github.mikephil.charting.charts.LineChart
import com.github.mikephil.charting.charts.PieChart
import com.github.mikephil.charting.data.*
import com.github.mikephil.charting.formatter.PercentFormatter
import kotlinx.coroutines.runBlocking


class GameStatsFragment : Fragment() {
    companion object {
        private val TAG = GameStatsFragment::class.qualifiedName
    }

    private var gameId: String? = null

    private lateinit var chartContainer: ConstraintLayout
    private lateinit var currentPopulationChart: PieChart
    private lateinit var errorLabel: TextView
    private lateinit var populationOverTime: LineChart
    private lateinit var progressBar: ProgressBar
    private lateinit var toolbar: ActionBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        toolbar = (activity as AppCompatActivity).supportActionBar!!
        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
        if (gameId == null) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }
        setupToolbar()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_game_stats, container, false)
        progressBar = view.findViewById(R.id.progress_bar)
        errorLabel = view.findViewById(R.id.error_label)
        chartContainer = view.findViewById(R.id.chart_container)
        currentPopulationChart = view.findViewById(R.id.current_population_chart)
        populationOverTime = view.findViewById(R.id.population_over_time_chart)

        val onSuccess = { stats: Stat ->
            EspressoIdlingResource.decrement()
            progressBar.visibility = View.GONE
            errorLabel.visibility = View.GONE
            chartContainer.visibility = View.VISIBLE
            displayStats(stats)
        }
        val onFail = {
            EspressoIdlingResource.decrement()
            errorLabel.visibility = View.VISIBLE
            progressBar.visibility = View.GONE
            chartContainer.visibility = View.GONE
        }
        progressBar.visibility = View.VISIBLE
        runBlocking {
            EspressoIdlingResource.increment()
            GameDatabaseOperations.asyncGetGameStats(gameId!!, onSuccess, onFail)
        }
        return view
    }

    fun setupToolbar() {
        toolbar.title = getString(R.string.navigation_drawer_game_stats)
    }

    private fun displayStats(stats: Stat) {
        setCurrentPopulationData(stats)
        setPopulationOverTimeData(stats)
    }

    private fun setCurrentPopulationData(stats: Stat) {
        val entries: ArrayList<PieEntry> = ArrayList()
        entries.add(
            PieEntry(
                stats.currentHumanCount + 0.0f,
                resources.getString(R.string.allegiance_option_human)
            )
        )
        entries.add(
            PieEntry(
                stats.currentZombieCount + 0.0f,
                resources.getString(R.string.allegiance_option_zombie)
            )
        )

        val dataSet = PieDataSet(entries, "")
        dataSet.setDrawIcons(false)
        dataSet.sliceSpace = 3f
        dataSet.selectionShift = 5f

        val colors: ArrayList<Int> = ArrayList()
        colors.add(getAliveColor(requireContext()))
        colors.add(getDeadColor(requireContext()))
        dataSet.colors = colors

        val data = PieData(dataSet)
        data.setValueFormatter(PercentFormatter(currentPopulationChart))
        data.setValueTextSize(12f)
        data.setValueTextColor(Color.WHITE)

        currentPopulationChart.setUsePercentValues(true);
        currentPopulationChart.data = data
        currentPopulationChart.description.isEnabled = false
        currentPopulationChart.highlightValues(null)
        currentPopulationChart.invalidate()
    }


    private fun setPopulationOverTimeData(stats: Stat) {
        val totalPlayers = stats.currentHumanCount + stats.currentZombieCount
        val humanValues: MutableList<Entry> = mutableListOf()
        val zombieValues: MutableList<Entry> = mutableListOf()

        for (stat in stats.statsOverTime) {
            humanValues.add(
                Entry(
                    stat.interval.toFloat(),
                    (totalPlayers - stat.infectionCount - stats.starterZombieCount).toFloat()
                )
            )
            zombieValues.add(
                Entry(
                    stat.interval.toFloat(),
                    (stats.starterZombieCount + stat.infectionCount).toFloat()
                )
            )
        }

        val humanLine =
            LineDataSet(humanValues, resources.getString(R.string.allegiance_option_human))
        humanLine.lineWidth = 1.75f
        humanLine.circleRadius = 5f
        humanLine.circleHoleRadius = 2.5f
        humanLine.color = getAliveColor(requireContext())
        humanLine.setCircleColor(getAliveColor(requireContext()))
        humanLine.highLightColor = getAliveColor(requireContext())
        humanLine.setDrawValues(false)

        val zombieLine =
            LineDataSet(zombieValues, resources.getString(R.string.allegiance_option_zombie))
        zombieLine.lineWidth = 1.75f
        zombieLine.circleRadius = 5f
        zombieLine.circleHoleRadius = 2.5f
        zombieLine.color = getDeadColor(requireContext())
        zombieLine.setCircleColor(getDeadColor(requireContext()))
        zombieLine.highLightColor = getDeadColor(requireContext())
        zombieLine.setDrawValues(false)

        populationOverTime.description.isEnabled = false
        populationOverTime.setDrawBorders(true)
        populationOverTime.setTouchEnabled(true)
        populationOverTime.isDragEnabled = true
        populationOverTime.setScaleEnabled(true)
        populationOverTime.setPinchZoom(false)

        populationOverTime.data = LineData(humanLine, zombieLine)
        populationOverTime.axisLeft.spaceTop = 40f
        populationOverTime.axisRight.isEnabled = false
        populationOverTime.xAxis.isEnabled = false
        populationOverTime.invalidate()
    }
}