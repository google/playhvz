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

package com.app.playhvz.common

import android.app.AlertDialog
import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.DatePicker
import android.widget.TextView
import android.widget.TimePicker
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R
import com.app.playhvz.utils.CompatUtils
import com.google.android.material.button.MaterialButton
import java.text.SimpleDateFormat
import java.util.*


class DateTimePickerDialog(private val onSubmit: (timestamp: Long) -> Unit) : DialogFragment() {

    companion object {
        private val TAG = DateTimePickerDialog::class.qualifiedName
    }

    private lateinit var customView: View
    private lateinit var datePicker: DatePicker
    private lateinit var timePicker: TimePicker
    private lateinit var currentlySelectedDate: TextView
    private lateinit var positiveButton: MaterialButton
    private lateinit var negativeButton: MaterialButton

    private var existingTimestamp = 0L

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView = activity!!.layoutInflater.inflate(R.layout.dialog_datetime_picker, null)
        datePicker = customView.findViewById(R.id.date_picker)
        timePicker = customView.findViewById(R.id.time_picker)
        currentlySelectedDate = customView.findViewById(R.id.current_date)
        positiveButton = customView.findViewById<MaterialButton>(R.id.positive_button)
        negativeButton = customView.findViewById<MaterialButton>(R.id.negative_button)

        setTimeInUi()

        val dialog = AlertDialog.Builder(context!!)
            .setTitle(R.string.datetime_dialog_title)
            .setView(customView)
            .create()

        showDatePicker()
        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Return already inflated custom view
        return customView
    }

    /**
     * Specifies what day and time the picker should display. You don't need to set this
     * to set the picker to the current date and time, that happens automatically.
     */
    fun setDateTime(timestamp: Long) {
        existingTimestamp = timestamp
    }

    private fun setTimeInUi() {
        val calendar: Calendar = GregorianCalendar()
        if (existingTimestamp == 0L) {
            return
        }
        calendar.timeInMillis = existingTimestamp

        datePicker.init(
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DATE),
            /* onDateChangeListener= */ null
        )
        CompatUtils.setHour(timePicker, calendar.get(Calendar.HOUR_OF_DAY))
        CompatUtils.setMinute(timePicker, calendar.get(Calendar.MINUTE))
    }

    private fun showDatePicker() {
        datePicker.visibility = View.VISIBLE
        currentlySelectedDate.visibility = View.GONE
        timePicker.visibility = View.GONE

        positiveButton.setText(getString(R.string.button_next))
        positiveButton.setOnClickListener {
            showTimePicker()
        }
        negativeButton.setText(getString(R.string.button_cancel))
        negativeButton.setOnClickListener {
            this.dismiss()
        }
    }

    private fun showTimePicker() {
        datePicker.visibility = View.GONE
        currentlySelectedDate.visibility = View.VISIBLE
        timePicker.visibility = View.VISIBLE

        val dateFormatter = SimpleDateFormat.getDateInstance()
        val date = GregorianCalendar(datePicker.year, datePicker.month, datePicker.dayOfMonth)
        dateFormatter.calendar = date
        val dateText = dateFormatter.format(date.time)
        currentlySelectedDate.text = getString(R.string.datetime_dialog_selected_date, dateText)

        positiveButton.setText(getString(R.string.button_submit))
        positiveButton.setOnClickListener {
            onSubmit(finalizeDateTime())
            dismiss()
        }
        negativeButton.setText(getString(R.string.button_back))
        negativeButton.setOnClickListener {
            showDatePicker()
        }
    }

    private fun finalizeDateTime(): Long {
        val calendar: Calendar =
            GregorianCalendar(
                datePicker.year,
                datePicker.month,
                datePicker.dayOfMonth,
                CompatUtils.getHour(timePicker),
                CompatUtils.getMinute(timePicker)
            )

        return calendar.timeInMillis
    }
}