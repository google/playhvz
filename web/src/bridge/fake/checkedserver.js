
class CheckedServer {
  constructor(idGenerator, inner, methods) {
    this.idGenerator = idGenerator;

    this.inner = inner;
    assert(this.inner.reader);

    this.reader = this.inner.reader;

    for (let [methodName, expectations] of methods) {
      let expectation = methods.get(methodName);
      assert(methodName in this.inner, methodName, "not in server!");
      this[methodName] =
          (...args) => {
            new Utils.Validator(expectations, this.check_.bind(this)).validate(args[0]);
            return this.inner[methodName](...args);
          };
    }
  }

  check_(typeName, value) {
    let shouldExist = true;
    if (typeName.startsWith("!")) {
      shouldExist = false;
      typeName = typeName.slice(1);
    }
    assert(('verify' + typeName) in this.idGenerator);
    assert(value);

    // Such as Bridge.UserId.verify
    this.idGenerator['verify' + typeName](value);

    let found = this.reader.idExists(value, true);
    if (shouldExist) {
      assert(found, 'Couldnt find id:', value);
    } else {
      assert(!found, 'ID is not supposed to exist:', value);
    }
  }
  
  signIn(...args) {
    return this.inner.signIn(...args);
  }
  signOut(...args) {
    return this.inner.signOut(...args);
  }
  getSignedInPromise(...args) {
    return this.inner.getSignedInPromise(...args);
  }
  listenToDatabase(...args) {
    return this.inner.listenToDatabase(...args);
  }
  listenToGameAsAdmin(...args) {
    return this.inner.listenToGameAsAdmin(...args);
  }
  listenToGameAsNonAdmin(...args) {
    return this.inner.listenToGameAsNonAdmin(...args);
  }
  setPlayerId(playerId) {
    return this.inner.setPlayerId(playerId);
  }

}
