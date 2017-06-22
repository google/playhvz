
class MergingWriterOperationWrapper {
  constructor(operation) {
    this.operation = operation;
  }
}

// operationsTree: {}
// operation: {insert, path: ["games", 0, "chatRooms"], index: 2, value: {name: "moo"}}



class MergingWriter {
  constructor(destination) {
    this.destination = destination;
  }

  mergeSet(operationsTree, operation, path, value) {
    this.mergeSetInner(operationsTree, operation, path, value);
  }

  mergeSetInner(operationsSubtree, operation, path, value) {
    assert(operationsSubtree);
    assert(typeof operationsSubtree == 'object');
    assert(path.length);
    assert(!(operationsSubtree instanceof MergingWriterOperationWrapper));

    if (operationsSubtree[path[0]] instanceof MergingWriterOperationWrapper) {
      // We've found another mutation. Merge this into that one.
      Utils.set(operationsSubtree.operation.value, path, value);
      return true; // Merged it into an existing operation.
    } else {
      // operationsSubtree[path[0]] could either be undefined, or an object.
      if (path.length == 1) {
        // This is the last step. There are two possibilities:
        // 1. There's nothing at this location.
        // 2. There's already an operation at this location, or at somewhere
        //    below this location. In this case, just overwrite that previous
        //    one. We have a new value now.
        //    In a perfect world, we'd also mark that previous operation as
        //    'merged' since it kind of gets merged into this new operation,
        //    but we don't really have to.
        operationsSubtree[path[0]] = new MergingWriterOperationWrapper(operation);
        return false; // Didn't merge it into an existing operation.
      } else {
        if (!(path[0] in operationsSubtree)) {
          operationsSubtree[path[0]] = {};
        }
        // There's some steps left.
        return this.mergeSet(operationsSubtree[path[0]], operation, path.slice(1), value);
      }
    }
  }

// set 4.x
// insert 4 // suddenly we dont know if we can do anything about the previous 4 and on
// set 4.x
// insert 4
// set 4.x


  mergeInsert(operationsTree, operation, path, index, value) {
    this.mergeSet(operationsTree, operation, path.concat([index]), value);
    // assert(operationsTree);
    // assert(typeof operationsTree == 'object');
    // if (operationsTree instanceof MergingWriterOperationWrapper) {
    //   Utils.insert(operationsTree.operation.value, path, index, value);
    //   return true; // Merged it into an existing operation.
    // } else {
    //   // operationsTree is an object
    //   if (path.length) {
    //     // There's still some steps to go, operationsTree is an object.
    //     if (path[0] in operationsTree) {
    //       // There's still some steps to go, operationsTree is an object, which does contain the next step.
    //       return this.mergeInsert(operationsTree[path[0]], operation, path.slice(1), index, value);
    //     } else {
    //       // There's still some steps to go, operationsTree is an object, which doesnt contain our next step.
    //       for (let step of path) {
    //         operationsTree[nextStep] = {};
    //         operationsTree = operationsTree[nextStep];
    //       }
    //       operationsTree[index] = operation;
    //       return false; // Not merged.
    //     }
    //   } else {
    //     // There's no steps left to go, operationsTree is an object.
    //     if (index in operationsTree) {
    //       // There's no steps left to go, operationsTree is an object which already has something at that index.
    //       // This could happen if we got two inserts at index 4.
    //       // Abort the entire merge.
    //       throw 'Cannot merge';
    //     } else {
    //       // There's no steps left to go, operationsTree is an object which has nothing at that index.
    //       operationsTree[index] = operation;
    //       return false; // Not merged.
    //     }
    //   }
    // }
  }

  batchedWrite(operations) {
    let operationsTree = {};
    for (let operation of operations) {
      if (operation.type == 'insert') {

      }
    }

    this.waitingOperations_ = this.waitingOperations_.concat(operations);
    setTimeout(() => this.flush(), 0);
  }
}
