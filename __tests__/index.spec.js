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
            expect(emitter.getCallbacks(eventName)).toHaveLength(1);
            expect(emitter.getCallbacks(eventName, {prop: 1})).toHaveLength(1);

            emitter.emit(eventName, {prop: 1}, 9);
            emitter.emit(eventName, {prop: 2}, 8);

            unsubscribe();
            expect(emitter.getCallbacks(eventName)).toHaveLength(0);
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
            expect(emitter.getCallbacks(eventName)).toHaveLength(1);

            emitter.emit(eventName, {prop: 1}, 9);
            expect(emitter.getCallbacks(eventName)).toHaveLength(0);
        });
    });

    describe('#off()', () => {
        it('should remove all specified handlers for event', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            const unsubscribeEvent1 = emitter.on(eventName, {prop: 1}, callback1);

            expect(emitter.getCallbacks(eventName)).toHaveLength(1);

            emitter.off(eventName, {prop: 2});
            expect(emitter.getCallbacks(eventName)).toHaveLength(1);

            emitter.off(eventName, {prop: 1});
            expect(emitter.getCallbacks(eventName)).toHaveLength(0);

            unsubscribeEvent1();
            expect(emitter.getCallbacks(eventName)).toHaveLength(0);

            emitter.on(eventName, {prop: 1}, callback1);
            emitter.off(eventName, {prop: 1}, callback2);
            expect(emitter.getCallbacks(eventName)).toHaveLength(1);

            emitter.off(eventName, {prop: 1}, callback1);
            expect(emitter.getCallbacks(eventName)).toHaveLength(0);
        });

        it('should check all unsubscribe parameters', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            expect(emitter.getCallbacks('event1')).toHaveLength(1);
        });

        it('should remove all events', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            emitter.on('event2', callback);
            expect(emitter.getCallbacks('event1')).toHaveLength(1);
            expect(emitter.getCallbacks('event2')).toHaveLength(1);

            emitter.off();
            expect(emitter.getCallbacks('event1')).toHaveLength(0);
            expect(emitter.getCallbacks('event2')).toHaveLength(0);
        });

        it('should remove all handlers by event name', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            emitter.on('event2', callback);
            expect(emitter.getCallbacks('event1')).toHaveLength(1);
            expect(emitter.getCallbacks('event2')).toHaveLength(1);

            emitter.off('event1');
            expect(emitter.getCallbacks('event1')).toHaveLength(0);
            expect(emitter.getCallbacks('event2')).toHaveLength(1);

            emitter.off('event2');
            expect(emitter.getCallbacks('event1')).toHaveLength(0);
            expect(emitter.getCallbacks('event2')).toHaveLength(0);
        });

        it('should process unknown events', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            expect(emitter.getCallbacks('event1')).toHaveLength(1);
            expect(emitter.getCallbacks('event1', {prop: 1})).toHaveLength(1);
            expect(emitter.getCallbacks('event1', {prop: 2})).toHaveLength(0);

            emitter.off('event2');
            expect(emitter.getCallbacks('event1')).toHaveLength(1);

            emitter.off('event2', {prop: 1});
            expect(emitter.getCallbacks('event1')).toHaveLength(1);
            expect(emitter.getCallbacks('event2')).toHaveLength(0);
        });
    });
});
