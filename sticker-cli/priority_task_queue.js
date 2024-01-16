const kItem = Symbol('item');
const Piscina = require('piscina');
const spq = require('shuffled-priority-queue');

class PriorityTaskQueue {
  queue = spq();

  get size () { return this.queue.length; }

  push (value) {
    const queueOptions = value[Piscina.queueOptionsSymbol];
    const priority = queueOptions ? (queueOptions.priority || 0) : 0;
    value[kItem] = this.queue.add({ priority, value });
  }

  remove (value) {
    this.queue.remove(value[kItem]);
  }

  shift () {
    return this.queue.shift().value;
  }
}

module.exports = PriorityTaskQueue;