# evitter
[![npm](https://img.shields.io/npm/dm/evitter.svg)](https://www.npmjs.com/package/evitter)
[![npm](https://img.shields.io/npm/v/evitter.svg)](https://www.npmjs.com/package/evitter)
[![npm](https://img.shields.io/npm/l/evitter.svg)](https://www.npmjs.com/package/evitter)

> EventEmitter with parametrized subscriptions

## Features
* :scissors: Zero dependencies
* :rocket: Lightweight and fast
* :package: Easy to use out of the box
* :100: 100% test coverage

## Getting started

* Install with npm:
```shell
npm install --save evitter
```

* Import as ES module:

```js
import {EventEmitter} from 'evitter';
```

or as CommonJS module:
```js
const {EventEmitter} = require('evitter');
```

### API

```js
import {EventEmitter} from 'evitter';

const emitter = new EventEmitter();
const callback = () => {};
const context = {foo: 'bar'};

emitter.on('event1', callback); // simple subscription
emitter.on('event1', callback, context); // subscription with the context for our callback
emitter.on('event2', {param1: 1}, callback); // subscription with parameters
emitter.on('event2', {param1: 2}, callback, context); // subscription with parameters & the context

emitter.emit('event1', 2); // call all 'event1' events
emitter.emit('event2', {param1: 1}, {}); // call all 'event2' events that match parameters
emitter.emit('event2', {param1: 1, params2: 4}, []); // no subscriptions there

emitter.getListenersCount(); // 4
emitter.getListenersCount('event1'); // 2
emitter.getListenersCount('event1', callback); // 2
emitter.getListenersCount('event1', callback, context); // 1
emitter.getListenersCount('event2'); // 2
emitter.getListenersCount('event2', {param1: 1}); // 1
emitter.getListenersCount('event2', {param1: 2}); // 1
emitter.getListenersCount('event2', {param2: 'some'}); // 0

emitter.hasListeners(); // true
emitter.hasListeners('event1'); // true
emitter.hasListeners('event2'); // true
emitter.hasListeners('event3'); // false
emitter.hasListeners('event2', {param1: 1}); // true
emitter.hasListeners('event2', {param2: 'some'}); // false
emitter.hasListeners('event2', {param1: 2}, callback, context); // true

emitter.off(); // unsubscribe from all events
emitter.off('event1'); // unsubscribe from all events with the name 'event1'
emitter.off('event1', callback); // unsubscribe from all events with the name 'event1' and specific callback
emitter.off('event2', {param1: 1}); // unsubscribe from all events with the name 'event2' and specific parameters
emitter.off('event2', {param1: 1}, callback, context); // unsubscribe from all events that match all arguments
```
