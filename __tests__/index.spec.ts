import {createSubscription, EventEmitter, EventEmitterCallback, getSubscriptionArguments} from '../src/index';

describe('EventEmitter', () => {
    const eventName: string = 'customEvent';
    let emitter: EventEmitter;

    beforeEach(() => {
        emitter = new EventEmitter();
    });

    describe('getSubscriptionArguments()', () => {
        it('should prepare arguments for subscription', () => {
            const callback = jest.fn();
            const params = {prop: 1};
            const context = Object.create(null);

            expect(getSubscriptionArguments(eventName, params, callback, context)).toEqual({
                callback,
                context,
                eventName,
                params
            });
            expect(getSubscriptionArguments(eventName, callback, context)).toEqual({
                callback,
                context,
                eventName,
                params: undefined
            });
        });
    });

    describe('createSubscription()', () => {
        it('should create a subscription base on the prototype', () => {
            const callback = jest.fn();
            const subscriptionProto = {once: true};
            const subscription = createSubscription(subscriptionProto, {context: this, callback});

            expect(subscription).toEqual({
                callback,
                context: this,
                once: true
            });
        });
        it('should create a subscription with parameters', () => {
            const callback = jest.fn();
            const params = {
                prop1: 1,
                prop2: [2, 3]
            };

            expect(createSubscription({once: true}, {context: this, callback, params})).toEqual({
                callback,
                context: this,
                once: true,
                paramsKey: JSON.stringify(params)
            });
        });
    });

    describe('#constructor()', () => {
        it('should create a subscriptions map', () => {
            expect(emitter.getSubscriptions()).toEqual({});
        });
    });

    describe('#on(), #emit()', () => {
        it('should subscribe and trigger events', () => {
            const callback = jest.fn<EventEmitterCallback>();

            emitter.on(eventName, {prop: 1}, callback);

            expect(emitter.hasListeners()).toBeTruthy();

            emitter.emit(eventName, {prop: 1}, 9);
            emitter.emit(eventName, {prop: 2}, 8);

            expect(callback.mock.calls.length).toBe(1);
            expect(callback.mock.calls[0][0]).toEqual({
                name: eventName
            });
            expect(callback.mock.calls[0][1]).toEqual({prop: 1});
            expect(callback.mock.calls[0][2]).toBe(9);
        });

        it('should emit event by params or without them', () => {
            const generalCallback = jest.fn();
            const callbackByParams = jest.fn();

            emitter.on(eventName, generalCallback);
            emitter.on(eventName, {prop: 1}, callbackByParams);

            emitter.emit(eventName, {prop: 1}, 'value1');
            emitter.emit(eventName, 'value2' as any);

            expect(generalCallback.mock.calls.length).toBe(2);
            expect(callbackByParams.mock.calls.length).toBe(1);
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

            expect(emitter.hasListeners()).toBeTruthy();

            emitter.emit(eventName, {prop: 1}, 9);

            expect(emitter.hasListeners()).toBeFalsy();
        });
    });

    describe('#off()', () => {
        it('should remove all specified handlers for event', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            expect(emitter.hasListeners()).toBeFalsy();

            emitter.on(eventName, {prop: 1}, callback1);
            emitter.off(eventName, {prop: 2});

            expect(emitter.hasListeners()).toBeTruthy();

            emitter.off(eventName, {prop: 1});

            expect(emitter.getListenersCount()).toBe(0);
            expect(emitter.hasListeners()).toBeFalsy();

            emitter.on(eventName, {prop: 1}, callback1);
            emitter.off(eventName, {prop: 1}, callback2);

            expect(emitter.hasListeners()).toBeTruthy();

            emitter.off(eventName, {prop: 1}, callback1);

            expect(emitter.hasListeners()).toBeFalsy();
        });

        it('should check all unsubscribe parameters', () => {
            const callback = jest.fn();
            const context1 = {foo: 'bar1'};
            const context2 = {foo: 'bar2'};

            emitter.on('event1', {prop: 1}, callback, context1);
            expect(emitter.getListenersCount()).toBe(1);

            emitter.off('event1', {prop: 1}, callback, context2);
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
            const event1: string = 'event1';
            const event2: string = 'event2';
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const params1 = {};

            emitter.on(event1, params1, callback1 as any);
            emitter.on(event2, callback2);

            expect(emitter.hasListeners()).toBeTruthy();
            expect(emitter.hasListeners(event1)).toBeTruthy();
            expect(emitter.hasListeners(event1, params1)).toBeTruthy();
            expect(emitter.hasListeners(event1, params1, callback1 as any)).toBeTruthy();
            expect(emitter.hasListeners(event1, callback1)).toBeTruthy();
            expect(emitter.hasListeners(event2, callback2)).toBeTruthy();
            expect(emitter.hasListeners(event1, callback2)).toBeFalsy();
            expect(emitter.hasListeners(event2, params1)).toBeFalsy();
            expect(emitter.hasListeners(event2, callback1)).toBeFalsy();
        });
    });

    describe('#getListenersCount()', () => {
        it('should return the number of listeners', () => {
            emitter.on('event1', jest.fn() as EventEmitterCallback);
            expect(emitter.getListenersCount()).toBe(1);

            emitter.on('event2', jest.fn() as EventEmitterCallback);
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
            const context1 = {foo: 'bar1'};
            const context2 = {foo: 'bar2'};

            emitter.on('event1', {prop: 1}, callback, context1);
            expect(emitter.getListenersCount('event1', {prop: 1}, callback, context1)).toBe(1);
            expect(emitter.getListenersCount('event1', {prop: 1}, callback, context2)).toBe(0);
        });

        it('should process unknown events', () => {
            const callback = jest.fn();

            emitter.on('event1', {prop: 1}, callback);
            expect(emitter.getListenersCount('event1', {prop: 1})).toBe(1);
            expect(emitter.getListenersCount('event2', {prop: 1})).toBe(0);
        });
    });
});
