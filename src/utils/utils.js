function Utils() {}

/*
* Generates a random number to use as an ID. Probability of id collision
* is negligible.
*/
Utils.generateId = function(suffix) {
	if (!suffix) throw "Utils.generateId() called without a suffix";
	return Math.random() * Math.pow(2, 52) + "-" + suffix;
}

/*
* Only use for things you would send over the network, like
* objects, strings, arrays, numbers, booleans, null, and undefined.
* Won't work on Date, etc.
*/
Utils.copyOf = function(value) {
  return value && JSON.parse(JSON.stringify(value));
}

/*
* This function will get all functions of an object. Inherited or not,
* enumerable or not. All functions are included. Inspired by
* http://stackoverflow.com/questions/31054910/get-functions-methods-of-a-class
*/
Utils.getAllFuncNames = function(originalObj) {
  var props = [];
  for (let obj = originalObj; obj; obj = Object.getPrototypeOf(obj)) {
    props = props.concat(Object.getOwnPropertyNames(obj));
  }
  return props.sort().filter(function(e, i, arr) { 
    if (e!=arr[i+1] && typeof originalObj[e] == 'function') return true;
  });
}

/*
* Takes the array, and subtracts all occurrences of the given things.
* subtract([15, 4, 3, 10, 2, 4], 3, 4) would be [15, 10, 2]
*/
Utils.subtract = function(array, ...thingsToSubtract) {
  return array.filter((value) => thingsToSubtract.indexOf(value) == -1);
}

/*
* Function that can be passed to playerArray.sort() to sort players in descending
* order by points. 
*/
Utils.byPoints = function(player1, player2) {
  return parseFloat(player2.points) - parseFloat(player1.points);
}

Utils.showDialog = function(description, label, initialValue, valueIfCanceled) {
  var dialog = document.createElement('paper-dialog');
  var descriptionDiv = document.createElement('div');
  descriptionDiv.appendChild(document.createTextNode(description));
  Polymer.dom(dialog).appendChild(descriptionDiv);
  var input = document.createElement('paper-input');
  if (label)
    input.label = label;
  if (typeof initialValue == 'number')
    input.type = 'number';
  input.value = initialValue;
  Polymer.dom(dialog).appendChild(input);
  var buttonsDiv = document.createElement('div');
  var cancelButton = document.createElement('paper-button');
  cancelButton.setAttribute('dialog-dismiss', '');
  cancelButton.appendChild(document.createTextNode('Cancel'));
  buttonsDiv.appendChild(cancelButton);
  var acceptButton = document.createElement('paper-button');
  acceptButton.setAttribute('dialog-confirm', '');
  acceptButton.setAttribute('autofocus', '');
  acceptButton.appendChild(document.createTextNode('Accept'));
  buttonsDiv.appendChild(acceptButton);
  Polymer.dom(dialog).appendChild(buttonsDiv);
  document.body.appendChild(dialog);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      dialog.addEventListener('iron-overlay-closed', (e) => {
        if (e.detail.canceled)
          resolve(valueIfCanceled);
        else
          resolve(input.value);
      });
      dialog.open();
    });
  });
}
