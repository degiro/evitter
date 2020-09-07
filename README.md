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
let unsubscribe = emitter.on('event1', callback); // simple subscription

unsubscribe(); // remove subscription
emitter.on('event2', {param1: 1}, callback); // subscription with parameters

emitter.emit('event1', 2); // call all 'event1' events
emitter.emit('event2', {param1: 1}, {}); // call all 'event2' events that match parameters
emitter.emit('event2', {param1: 1, params2: 4}, []); // no subscriptions there

emitter.getCallbacks('event1'); // [callback]
emitter.getCallbacks('event2', {param1: 1}); // [callback]
emitter.getCallbacks('event2', {param1: 2}); // []
emitter.getCallbacks('event2', {param2: 'some'}); // []

emitter.off(); // unsubscribe from all events
emitter.off('event1'); // unsubscribe from all events with the name 'event1'
emitter.off('event1', callback); // unsubscribe from all events with the name 'event1' and specific callback
emitter.off('event2', {param1: 1}); // unsubscribe from all events with the name 'event2' and specific parameters
emitter.off('event2', {param1: 1}, callback); // unsubscribe from all events that match all arguments
```
