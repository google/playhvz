function Utils() {}

Utils.setDeterministicGenerator = function() {
  var idsByType = {};
  Utils.generateId = (type) => {
    if (!(type in idsByType)) {
      idsByType[type] = 1;
    }
    return idsByType[type]++ + "-" + type;
  }
};

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

Utils.filter = function(value, filter) {
  if (value instanceof HTMLElement)
    value = value.textContent;
  if (typeof value == 'boolean') {
    filter = (filter.localeCompare("true") == 0);
    return value == filter;
  }
  if (typeof value == 'number') {
    filter = +filter;
    return value == filter;
  }
  value = ("" + value).toLocaleLowerCase();
  filter = ("" + filter).toLocaleLowerCase();
  return value.indexOf(filter) >= 0;
}

Utils.compare = function(aValue, bValue) {
  const aBoolish = (typeof aValue == 'boolean');
  const bBoolish = (typeof bValue == 'boolean');
  if (aBoolish && bBoolish) {
    return (a ? 1 : 0) - (b ? 1 : 0);
  }
  const aIntish = (+aValue == aValue);
  const bIntish = (+bValue == bValue);
  if (aIntish && bIntish) {
    const diff = +aValue - +bValue;
    if (diff)
      return diff;
    else
      return 0;
  }
  if (aValue instanceof HTMLElement)
    aValue = aValue.textContent;
  if (bValue instanceof HTMLElement)
    bValue = bValue.textContent;
  const aString = "" + aValue;
  const bString = "" + bValue;
  const diff = aString.localeCompare(bString);
  if (diff)
    return diff;
  else
    return 0;
}

Utils.formatTime = function(timestampInSeconds) {
  var date = new Date(timestampInSeconds * 1000);
  var result = "";
  var months = [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"];
  result += months[date.getMonth()] + ' ';
  result += date.getDate() + ' ';
  var am = date.getHours() <= 12;
  result += (am ? date.getHours() : date.getHours() - 12);
  result += ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + (am ? 'am' : 'pm');
  return result;
}

function throwError(...message) {
  console.error(...message);
  debugger;
  throw message;
}

function assert(condition, ...message) {
  if (!condition)
    throwError(...message);
  return condition;
}

Utils.findIndexById = function(collection, id) {
  assert(collection, "Bad arg");
  let index = collection.findIndex((obj) => (obj.id == id));
  assert(index >= 0, "Not found!", collection, id);
  return index;
}

// A nice deterministic shuffle.
// Similar to how humans shuffle cards.
Utils.shuffle = function(originalArray, numShuffles) {
  function innerShuffle(array) {
    let newArray = [];
    let arrayA = array.slice(0, array.length / 2);
    let arrayB = array.slice(array.length / 2, array.length); // might be 1 bigger than arrayA
    while (arrayA.length || arrayB.length) {
      arrayA.length && newArray.push(arrayA.pop());
      arrayB.length && newArray.push(arrayB.pop());
    }
    return newArray;
  }
  let array = originalArray.slice();
  for (let i = 0; i < numShuffles; i++) {
    array = innerShuffle(array);
  }
  return array;
}
