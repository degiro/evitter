export type EventEmitterCallbackWithParams = (
    event: EventEmitterEvent,
    params: EventEmitterSubscriptionParams,
    data: any
) => any;

export type EventEmitterCallbackWithoutParams = (
    event: EventEmitterEvent,
    data: any
) => any;

export type EventEmitterCallback = EventEmitterCallbackWithParams | EventEmitterCallbackWithoutParams;

export interface EventEmitterEvent {
    name: string;
    [key: string]: any;
}

export interface EventEmitterSubscriptionParams {
    [key: string]: any;
}

export interface EventEmitterSubscriptionArguments {
    callback: EventEmitterCallback;
    params?: EventEmitterSubscriptionParams;
    context?: any;
}

export interface EventEmitterSubscription {
    callback: EventEmitterCallback;
    once?: boolean;
    paramsKey?: string;
    context?: any;
}

export interface EventHandlerSubscriptionsList {
    // `key` is event name
    [key: string]: EventEmitterSubscription[];
}

export function getSubscriptionArguments (
    eventName: string,
    params: EventEmitterSubscriptionParams,
    callback: EventEmitterCallback,
    context?: any
) {
    if (typeof params === 'function') {
        context = callback as any;
        callback = params as any;
        params = undefined;
    }

    return {
        callback,
        context,
        eventName,
        params
    };
}

export function createSubscription (
    subscriptionProto: {
        [key: string]: any;
    },
    {params, context, callback}: EventEmitterSubscriptionArguments
): EventEmitterSubscription {
    const subscription: EventEmitterSubscription = subscriptionProto as EventEmitterSubscription;

    subscription.context = context;
    subscription.callback = callback;

    if (params) {
        // IMPORTANT: Params object should contain ONLY JSON values: NOT functions, Date, RegExp, etc.
        subscription.paramsKey = JSON.stringify(params);
    }

    return subscription;
}

export function addEventSubscription (
    eventName: string,
    subscriptions: EventHandlerSubscriptionsList,
    subscription: EventEmitterSubscription
): EventEmitterSubscription {
    subscriptions[eventName] = subscriptions[eventName] || [];
    subscriptions[eventName].push(subscription);

    return subscription;
}

export function runEventCallback (
    callback: EventEmitterCallback,
    emitterEvent: EventEmitterEvent,
    params: EventEmitterSubscriptionParams|void,
    data: any,
    context: any
) {
    if (params) {
        callback.call(context, emitterEvent, params, data);
    } else {
        callback.call(context, emitterEvent, data);
    }
}

export type ListenersCounter<T> = (
    eventName?: string,
    params?: EventEmitterSubscriptionParams,
    callback?: EventEmitterCallback,
    context?: any
) => T;

export interface IEventEmitter {
    hasListeners: ListenersCounter<boolean>;
    getListenersCount: ListenersCounter<number>;
    on (eventName: string, callback: EventEmitterCallback, context?: any): this;
    on (eventName: string, params: EventEmitterSubscriptionParams, callback: EventEmitterCallback, context?: any): this;
    once (eventName: string, callback: EventEmitterCallback, context?: any): this;
    once (
        eventName: string,
        params: EventEmitterSubscriptionParams,
        callback: EventEmitterCallback,
        context?: any
    ): this;
    off (eventName?: string, callback?: EventEmitterCallback, context?: any): this;
    off (
        eventName: string,
        params: EventEmitterSubscriptionParams,
        callback: EventEmitterCallback,
        context?: any
    ): this;
    emit (eventName: string, data?: any): this;
    emit (eventName: string, params: EventEmitterSubscriptionParams, data: any): this;
}

export class EventEmitter implements IEventEmitter {
    protected subscriptions: EventHandlerSubscriptionsList;

    constructor () {
        this.subscriptions = Object.create(null);
    }

    getSubscriptions (): EventHandlerSubscriptionsList {
        return this.subscriptions;
    }

    on (eventName: string, params?: EventEmitterSubscriptionParams, callback?: EventEmitterCallback, context?: any) {
        addEventSubscription(
            eventName,
            this.subscriptions,
            createSubscription({}, getSubscriptionArguments(eventName, params, callback, context))
        );
        return this;
    }

    once (eventName: string, params?: EventEmitterSubscriptionParams, callback?: EventEmitterCallback, context?: any) {
        addEventSubscription(
            eventName,
            this.subscriptions,
            createSubscription({once: true}, getSubscriptionArguments(eventName, params, callback, context))
        );

        return this;
    }

    off (
        eventName?: string,
        _params?: EventEmitterSubscriptionParams,
        _callback?: EventEmitterCallback,
        _context?: any
    ) {
        const argumentsCount: number = arguments.length;

        // remove all eventName subscriptions
        if (!argumentsCount) {
            this.subscriptions = Object.create(null);
            return this;
        }

        if (argumentsCount === 1) {
            delete this.subscriptions[eventName];
            return this;
        }

        const eventSubscriptions: EventEmitterSubscription[] = this.subscriptions[eventName];

        if (!eventSubscriptions) {
            return this;
        }

        const {length} = eventSubscriptions;
        const subscriptionToFind: EventEmitterSubscription = createSubscription(
            {},
            getSubscriptionArguments.apply(null, arguments)
        );
        const filteredSubscriptions: EventEmitterSubscription[] = [];
        let filteredSubscriptionsCount: number = 0;

        for (let i = 0; i < length; i++) {
            const existingSubscription: EventEmitterSubscription = eventSubscriptions[i];

            if (
                (subscriptionToFind.callback && existingSubscription.callback !== subscriptionToFind.callback) ||
                (subscriptionToFind.context && existingSubscription.context !== subscriptionToFind.context) ||
                (subscriptionToFind.paramsKey && existingSubscription.paramsKey !== subscriptionToFind.paramsKey)
            ) {
                filteredSubscriptions[filteredSubscriptionsCount] = existingSubscription;
                filteredSubscriptionsCount++;
            }
        }

        if (filteredSubscriptions[0]) {
            // save the link to current array
            eventSubscriptions.length = 0;
            eventSubscriptions.push.apply(eventSubscriptions, filteredSubscriptions);
        } else {
            delete this.subscriptions[eventName];
        }

        return this;
    }

    emit (eventName: string, params?: EventEmitterSubscriptionParams, data?: any) {
        const eventSubscriptions: EventEmitterSubscription[] = this.subscriptions[eventName];

        if (!eventSubscriptions) {
            return this;
        }

        const {length} = eventSubscriptions;
        const emitterEvent: EventEmitterEvent = {name: eventName};
        const filteredSubscriptions: EventEmitterSubscription[] = [];
        let filteredSubscriptionsCount: number = 0;

        if (arguments.length < 3) {
            data = params;
            params = undefined;
        }

        for (let i = 0; i < length; i++) {
            const eventSubscription: EventEmitterSubscription = eventSubscriptions[i];

            if (eventSubscription) {
                const {context, callback, paramsKey, once} = eventSubscription;
                let isActive: boolean = true;

                if (!paramsKey || (paramsKey === JSON.stringify(params))) {
                    runEventCallback(callback, emitterEvent, params, data, context);

                    // remove if it's a one-time subscription
                    isActive = !once;
                }

                if (isActive) {
                    filteredSubscriptions[filteredSubscriptionsCount] = eventSubscription;
                    filteredSubscriptionsCount++;
                }
            }
        }

        if (filteredSubscriptions[0]) {
            this.subscriptions[eventName] = filteredSubscriptions;
        } else {
            delete this.subscriptions[eventName];
        }

        return this;
    }

    hasListeners (
        _eventName?: string,
        _params?: EventEmitterSubscriptionParams,
        _callback?: EventEmitterCallback,
        _context?: any
    ) {
        return this.getListenersCount.apply(this, arguments) > 0;
    }

    getListenersCount (
        eventName?: string,
        _params?: EventEmitterSubscriptionParams,
        _callback?: EventEmitterCallback,
        _context?: any
    ) {
        const argumentsCount: number = arguments.length;
        let listenersCount: number = 0;

        // check all subscriptions
        if (argumentsCount === 0) {
            for (const key in this.subscriptions) {
                if (Object.hasOwnProperty.call(this.subscriptions, key)) {
                    listenersCount += this.subscriptions[key].length;
                }
            }

            return listenersCount;
        }

        const eventSubscriptions: EventEmitterSubscription[] = this.subscriptions[eventName];

        // check subscriptions only by eventName
        if (argumentsCount === 1) {
            return eventSubscriptions ? eventSubscriptions.length : 0;
        }

        if (!eventSubscriptions) {
            return listenersCount;
        }

        const {length} = eventSubscriptions;
        const subscriptionToFind: EventEmitterSubscription = createSubscription(
            {},
            getSubscriptionArguments.apply(null, arguments)
        );

        for (let i = 0; i < length; i++) {
            const existingSubscription: EventEmitterSubscription = eventSubscriptions[i];

            if (
                existingSubscription &&
                (!subscriptionToFind.callback || existingSubscription.callback === subscriptionToFind.callback) &&
                (!subscriptionToFind.context || existingSubscription.context === subscriptionToFind.context) &&
                (!subscriptionToFind.paramsKey || existingSubscription.paramsKey === subscriptionToFind.paramsKey)
            ) {
                listenersCount++;
            }
        }

        return listenersCount;
    }
}
