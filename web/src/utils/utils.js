function Utils() {}

/*
* Generates a random number to use as an ID. Probability of id collision
* is negligible.
*/
Utils.generateId = function(type, note) {
	if (!type) throw "Utils.generateId() called without a type";
  let result = type + "-";
  if (note)
    result += note + "-";
	return result + Math.random() * Math.pow(2, 52);
}

/*
* Only use for things you would send over the network, like
* objects, strings, arrays, numbers, booleans, null, and undefined.
* Won't work on Date, etc.
*/
Utils.copyOf = function(value) {
  return value && JSON.parse(JSON.stringify(value));
}

Utils.merge = function(...objs) {
  var result = {};
  for (let obj of objs) {
    Utils.mergeInto(result, obj);
  }
  return result;
};

Utils.mergeInto = function(dest, source) {
  for (var key in source) {
    if (dest[key] instanceof Array) {
      let destArray = dest[key];
      assert(source[key] instanceof Array);
      let sourceArray = source[key];
      for (let sourceElement of sourceArray) {
        destArray.push(sourceElement);
      }
      continue;
    }
    if (dest[key] && typeof dest[key] == 'object') {
      let destObj = dest[key];
      assert(typeof source[key] == 'object');
      let sourceObj = source[key];
      Utils.mergeInto(destObj, sourceObj);
      continue;
    }
    dest[key] = source[key];
  }
};

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

Utils.formatTime = function(timestampInMs) {
  var date = new Date(timestampInMs);
  var result = "";
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"];
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

Utils.findIndexById = function(collection, id, expect) {
  expect = expect !== false;
  assert(collection, "Bad arg");
  let index = collection.findIndex((obj) => (obj.id == id));

  if (expect)
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

Utils.getUrlQueryParameters = function() {
  let a = window.location.search.substr(1).split('&');
  if (a == "")
    return {};
  var b = {};
  for (var i = 0; i < a.length; ++i) {
      var p = a[i].split('=', 2);
      if (p.length == 1)
          b[p[0]] = "";
      else
          b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
  }
  return b;
}

Utils.getParameterByName = function(name, defaultValue) {
  let url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  var results = regex.exec(url);
  if (!results || !results[2]) return defaultValue;
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

Utils.get = function(obj, path) {
  if (path.length == 0)
    return obj;
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
  assert(path.length);
  return (function innerSet(obj, path, value) {
    assert(obj);
    if (!path || !path.length) {
      throwError('no path!');
    } else if (path.length == 1) {
      obj[path[0]] = value;
    } else {
      innerSet(obj[path[0]], path.slice(1), value);
    }
  })(obj, path, value);
}
Utils.insert = function(obj, path, index, value) {
  return (function innerInsert(obj, path, index, value) {
    assert(obj);
    if (path.length == 0) {
      if (obj instanceof Array) {
        if (index == null) {
          obj.push(value);
        } else {
          assert(typeof index == 'number');
          obj.splice(index, 0, value);
        }
      } else {
        assert(typeof obj == 'object');
        obj[index] = value;
      }
    } else {
      innerInsert(obj[path[0]], path.slice(1), index, value);
    }
  })(obj, path, index, value);
}
Utils.remove = function(obj, path, index) {
  (function innerRemove(obj, path, index) {
    assert(obj);
    if (path.length == 0) {
      if (obj instanceof Array) {
        assert(typeof index == 'number');
        obj.splice(index, 1);
      } else {
        assert(typeof obj == 'object');
        assert(index in obj);
        delete obj[index];
      }
    } else {
      innerRemove(obj[path[0]], path.slice(1), index);
    }
  })(obj, path, index);
}

Utils.catchAndReturn = function(exceptionType, callback) {
  try {
    callback();
    return true;
  } catch (e) {
    if (e instanceof exceptionType) {
      return false;
    } else {
      throw e;
    }
  }
};

Utils.forEachRowUnder = function(path, value, callback) {
  callback(path);
  if (typeof value == 'object') { // Also catches arrays
    for (var key in value) // If an array, key is the index
      Utils.forEachRowUnder(path.concat([key]), value[key], callback);
  } else {
    callback(path.concat([value]));
  }
}

Utils.forEachPathUnder = function(path, value, callback) {
  callback(path, value);
  if (typeof value == 'object') { // Also catches arrays
    for (var key in value) // If an array, key is the index
      Utils.forEachPathUnder(path.concat([key]), value[key], callback);
  }
}

Utils.matches = function(pattern, path) {
  if (pattern.length != path.length)
    return false;
  for (let i = 0; i < pattern.length; i++)
    if (pattern[i] && pattern[i] != path[i])
      return false;
  return true;
}

Utils.mapKeys = function(map) {
  let result = [];
  for (let key in map)
    result.push(key);
  return result;
};

Utils.Validator = function(expectation, typeNameHandler) {
  this.expectation = expectation;
  this.typeNameHandler = typeNameHandler;
};
Utils.Validator.prototype.validate = function(object) {
  return this.validateInner('(input)', object, this.expectation)
};
Utils.Validator.prototype.validateInner = function(key, object, expectation) {
  if (expectation === undefined) {
    throwError('No expectation for ' + key);
  }
  if (expectation instanceof Utils.Validator.Optional) {
    if (object === undefined)
      return;
    expectation = expectation.expectation;
  }

  if (typeof expectation == 'object') {
    assert(typeof object == 'object');
    for (let innerKey in object) {
      assert(innerKey in expectation, "Extra property", innerKey, "!");
      this.validateInner(innerKey, object[innerKey], expectation[innerKey]);
    }
  } else if (typeof expectation == 'string') {
    if (expectation[0] == '|') {
      if (object === undefined)
        return;
      expectation = expectation.slice(1);
    }

    if (expectation[0] == '?') {
      if (object === null)
        return;
      expectation = expectation.slice(1);
    }

    if (expectation == 'Number') {
      assert(Utils.isNumber(object));
    } else if (expectation == 'Boolean') {
      assert(Utils.isBoolean(object));
    } else if (expectation == 'String') {
      assert(Utils.isString(object));
    } else if (expectation == 'Timestamp') {
      assert(Utils.isTimestampMs(object));
    } else {
      // Undefined is fine, typeNameHandler might just do its own asserting
      assert(typeof this.typeNameHandler == 'function');
      assert(this.typeNameHandler(expectation, object) !== false, 'Does not meet expectations!');
    }
  } else if (typeof expectation == 'function') {
    assert(expectation(object), 'Does not meet expectations!');
  } else {
    throwError('Unknown expectation: ', expectation);
  }
};
Utils.Validator.Optional = function(expectation) {
  this.expectation = expectation;
};
Utils.Validator.optional = function(expectation) {
  return new Utils.Validator.Optional(expectation);
};


Utils.isNumber = (x) => typeof x == 'number';
Utils.isString = (x) => typeof x == 'string';
Utils.isBoolean = (x) => typeof x == 'boolean';
Utils.isTimestampMs = (x) => x > 1470000000000;
