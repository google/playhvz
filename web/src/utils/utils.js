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

/**
 * Returns a shuffled copy of the given array.
 * @param {Array} a items The array containing the items.
 */
Utils.shuffle = function(a) {
  a = a.slice();
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a;
}

// A nice deterministic shuffle.
// Similar to how humans shuffle cards.
Utils.deterministicShuffle = function(originalArray, numShuffles) {
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

Utils.copyProperties = function(object, snapshotValue, propertyNames) {
  for (let propertyName of propertyNames) {
    let val = snapshotValue[propertyName];
    if (val === undefined)
      val = null;
    object[propertyName] = val;
  }
  return object;
}

Utils.addEmptyLists = function(object, lists) {
  for (let listName of lists) {
    object[listName] = [];
  }
  return object;
}

// Figures out where we should insert an object in an array.
// All objects must have "index" property to guide us.
Utils.findInsertIndex = function(collection, newObjectIndex) {
  assert(collection);
  // For example if we want to insert an object like this:
  // {index: 5}
  // into an array that looks like this:
  // [{index: 0}, {index: 1}, {index: 4}, {index:6}]
  // then we'd want to insert it at index 3, so the resulting array would be:
  // [{index: 0}, {index: 1}, {index: 4}, {index: 5}, {index:6}]
  let insertIndex = collection.findIndex((existing) => existing.index > newObjectIndex);
  // If we couldnt find one greater than us, then we must be the greatest.
  // Insert us at the end.
  if (insertIndex < 0)
    insertIndex = collection.length;
  return insertIndex;
}

Utils.getParameterByName = function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

Utils.get = function(obj, path) {
  return (function innerGet(obj, path) {
    if (!path || !path.length) {
      throwError('no path!');
    } else if (path.length == 1) {
      return obj[path[0]];
    } else {
      return innerGet(obj[path[0]], path.slice(1));
    }
  })(obj, path);
}
Utils.set = function(obj, path, value) {
  return (function innerSet(obj, path, value) {
    if (!path || !path.length) {
      throwError('no path!');
    } else if (path.length == 1) {
      obj[path[0]] = value;
    } else {
      innerSet(obj[path[0]], path.slice(1), value);
    }
  })(obj, path, value);
}
Utils.push = function(obj, path, value) {
  return (function innerPush(obj, path, value) {
    if (!path || !path.length) {
      throwError('no path!');
    } else if (path.length == 1) {
      obj[path[0]].push(value);
    } else {
      innerPush(obj[path[0]], path.slice(1), value);
    }
  })(obj, path, value);
}
Utils.remove = function(obj, path, index) {
  (function innerRemove(obj, path, index) {
    if (!path || !path.length) {
      throwError('no path!');
    } else if (path.length == 1) {
      obj[path[0]].splice(index, 1);
    } else {
      innerRemove(obj[path[0]], path.slice(1), index);
    }
  })(obj, path, index);
}
