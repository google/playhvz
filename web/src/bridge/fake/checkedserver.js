
class CheckedServer {
  constructor(inner, methods) {
    this.inner = inner;
    assert(this.inner.reader);

    this.reader = this.inner.reader;

    for (let [methodName, expectations] of methods) {
      let expectation = methods.get(methodName);
      assert(methodName in this.inner, methodName, "not in server!");
      this[methodName] =
          (...args) => {
            Utils.checkObject(args[0], expectations.required, expectations.optional, this.check_.bind(this));
            return this.inner[methodName](...args);
          };
    }
  }

  check_(typeName, value) {
    if (typeName.startsWith("?")) {
      if (value === null)
        return true;
      typeName = typeName.slice(1); // Example "?UserId" to UserId
    }
    if (typeName == 'Boolean')
      return Utils.isBoolean(value);
    if (typeName == 'String')
      return Utils.isString(value);
    if (typeName == 'Number')
      return Utils.isNumber(value);
    if (typeName == 'TimestampMs')
      return Utils.isTimestampMs(value);

    let shouldExist = true;
    if (typeName.startsWith("!")) {
      shouldExist = false;
      typeName = typeName.slice(1);
    }

    assert(typeName in Bridge);

    // Such as Bridge.UserId.verify
    Bridge[typeName].verify(value);

    let found = this.reader.idExists(value, true);
    if (shouldExist) {
      assert(found, 'Couldnt find id:', value);
    } else {
      assert(!found, 'ID is not supposed to exist:', value);
    }
  }
}
