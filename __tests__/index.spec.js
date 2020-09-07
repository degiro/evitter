import {createSubscription, EventEmitter, getSubscriptionArguments} from '../src/index';

describe('EventEmitter', () => {
    const eventName = 'customEvent';
    let emitter;

    beforeEach(() => {
        emitter = new EventEmitter();
    });

    describe('getSubscriptionArguments()', () => {
        it('should prepare arguments for subscription', () => {
            const callback = jest.fn();
            const params = {prop: 1};

            expect(getSubscriptionArguments(eventName, params, callback)).toEqual({
                callback,
                eventName,
                params
            });
            expect(getSubscriptionArguments(eventName, callback)).toEqual({
                callback,
                eventName
            });
            expect(getSubscriptionArguments(eventName, undefined, callback)).toEqual({
                callback,
                eventName
            });
        });
    });

    describe('createSubscription()', () => {
        it('should create a subscription base on the prototype', () => {
            const callback = jest.fn();
            const subscriptionProto = {once: true};
            const subscription = createSubscription(subscriptionProto, {callback});

            expect(subscription).toEqual({
                callback,
                once: true
            });
        });
        it('should create a subscription with parameters', () => {
            const callback = jest.fn();
            const params = {
                prop1: 1,
                prop2: [2, 3]
            };

            expect(createSubscription({once: true}, {callback, params})).toEqual({
                callback,
                once: true,
                paramsKey: JSON.stringify(params)
            });
        });
    });

    describe('#on(), #emit()', () => {
        it('should subscribe and trigger events', () => {
            const callback = jest.fn();
            const unsubscribe = emitter.on(eventName, {prop: 1}, callback);
            expect(emitter.hasListeners()).toBe(true);

            emitter.emit(eventName, {prop: 1}, 9);
            emitter.emit(eventName, {prop: 2}, 8);

            unsubscribe();
            expect(emitter.hasListeners()).toBe(false);
            emitter.emit(eventName, {prop: 1}, 9);
            emitter.emit(eventName, {prop: 2}, 8);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({name: eventName}, 9);
        });

        it('should emit event by params or without them', () => {
            const generalCallback = jest.fn();
            const callback = jest.fn();

            emitter.on(eventName, generalCallback);
            emitter.on(eventName, {prop: 1}, callback);

            emitter.emit(eventName, {prop: 1}, 'value1');
            emitter.emit(eventName, 'value2');

            expect(generalCallback).toHaveBeenCalledTimes(2);
            expect(generalCallback).toHaveBeenNthCalledWith(1, {name: eventName}, 'value1');
            expect(generalCallback).toHaveBeenNthCalledWith(2, {name: eventName}, 'value2');

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenNthCalledWith(1, {name: eventName}, 'value1');
        });

        it('should process events without subscriptions', () => {
            const callback = jest.fn();

            emitter.on('event1', callback);
            emitter.emit('event1');
            expect(callback).toHaveBeenCalledTimes(1);

            emitter.emit('event2');
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('#once()', () => {
        it('should subscribe on the event only for the first trigger', () => {
            const callback = jest.fn();

            emitter.once(eventName, {prop: 1}, callback);

            expect(emitter.hasListeners()).toBe(true);

            emitter.emit(eventName, {prop: 1}, 9);

            expect(emitter.hasListeners()).toBe(false);
        });
    });

    describe('#off()', () => {
        it('should remove all specified handlers for event', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            expect(emitter.hasListeners()).toBe(false);

            const unsubscribeEvent1 = emitter.on(eventName, {prop: 1}, callback1);

            expect(emitter.getListenersCount()).toBe(1);
            expect(emitter.hasListeners()).toBe(true);

            emitter.off(eventName, {prop: 2});
            expect(emitter.getListenersCount()).toBe(1);
            expect(emitter.hasListeners()).toBe(true);

            emitter.off(eventName, {prop: 1});
            expect(emitter.getListenersCount()).toBe(0);
            expect(emitter.hasListeners()).toBe(false);

            unsubscribeEvent1();
            expect(emitter.getListenersCount()).toBe(0);
            expect(emitter.hasListeners()).toBe(false);

            emitter.on(eventName, {prop: 1}, callback1);
            emitter.off(eventName, {prop: 1}, callback2);

            expect(emitter.hasListeners()).toBe(true);

            emitter.off(eventName, {prop: 1}, callback1);

            expect(emitter.hasListeners()).toBe(false);
        });

        it('should check all unsubscribe parameters', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            expect(emitter.getListenersCount()).toBe(1);
        });

        it('should remove all events', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            emitter.on('event2', callback);
            expect(emitter.getListenersCount()).toBe(2);

            emitter.off();
            expect(emitter.getListenersCount()).toBe(0);
        });

        it('should remove all handlers by event name', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            emitter.on('event2', callback);
            expect(emitter.getListenersCount()).toBe(2);

            emitter.off('event1');
            expect(emitter.getListenersCount()).toBe(1);

            emitter.off('event2');
            expect(emitter.getListenersCount()).toBe(0);
        });

        it('should process unknown events', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            expect(emitter.getListenersCount()).toBe(1);

            emitter.off('event2');
            expect(emitter.getListenersCount()).toBe(1);

            emitter.off('event2', {prop: 1});
            expect(emitter.getListenersCount()).toBe(1);
        });
    });

    describe('#hasListeners()', () => {
        it('should check if emitter has event listeners, by params or not', () => {
            const event1 = 'event1';
            const event2 = 'event2';
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const params1 = {};

            emitter.on(event1, params1, callback1);
            emitter.on(event2, callback2);

            expect(emitter.hasListeners()).toBe(true);
            expect(emitter.hasListeners(event1)).toBe(true);
            expect(emitter.hasListeners(event1, params1)).toBe(true);
            expect(emitter.hasListeners(event1, params1, callback1)).toBe(true);
            expect(emitter.hasListeners(event1, callback1)).toBe(true);
            expect(emitter.hasListeners(event2, callback2)).toBe(true);
            expect(emitter.hasListeners(event1, callback2)).toBe(false);
            expect(emitter.hasListeners(event2, params1)).toBe(false);
            expect(emitter.hasListeners(event2, callback1)).toBe(false);
        });
    });

    describe('#getListenersCount()', () => {
        it('should return the number of listeners', () => {
            emitter.on('event1', jest.fn());
            expect(emitter.getListenersCount()).toBe(1);

            emitter.on('event2', jest.fn());
            expect(emitter.getListenersCount()).toBe(2);
            expect(emitter.getListenersCount('event1')).toBe(1);
            expect(emitter.getListenersCount('event2')).toBe(1);

            const callback1 = jest.fn();

            emitter.on('event2', callback1);
            expect(emitter.getListenersCount()).toBe(3);
            expect(emitter.getListenersCount('event1')).toBe(1);
            expect(emitter.getListenersCount('event2')).toBe(2);
            expect(emitter.getListenersCount('event2', callback1)).toBe(1);

            const params = {
                prop: 1
            };

            emitter.on('event2', params, callback1);
            expect(emitter.getListenersCount()).toBe(4);
            expect(emitter.getListenersCount('event1')).toBe(1);
            expect(emitter.getListenersCount('event2')).toBe(3);
            expect(emitter.getListenersCount('event2', callback1)).toBe(2);
            expect(emitter.getListenersCount('event2', params, callback1)).toBe(1);
        });

        it('should process already unsubscribed events', () => {
            const callback = jest.fn();

            emitter.on('event1', callback);
            expect(emitter.getListenersCount('event1')).toBe(1);
            emitter.off();
            expect(emitter.getListenersCount('event1')).toBe(0);
        });

        it('should check all unsubscribe parameters', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            expect(emitter.getListenersCount('event1', {prop: 1}, callback)).toBe(1);
            expect(emitter.getListenersCount('event1', {prop: 2}, callback)).toBe(0);
        });

        it('should process unknown events', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            expect(emitter.getListenersCount('event1', {prop: 1})).toBe(1);
            expect(emitter.getListenersCount('event2', {prop: 1})).toBe(0);
        });
    });
});
