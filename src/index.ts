export type EventEmitterCallbackWithParams<P = EventEmitterSubscriptionParams, D = any> = (
    event: EventEmitterEvent,
    params: P,
    data: D
) => any;

export type EventEmitterCallbackWithoutParams<D = any> = (
    event: EventEmitterEvent,
    data: D
) => any;

export type EventEmitterCallback = EventEmitterCallbackWithParams | EventEmitterCallbackWithoutParams;

export interface EventEmitterEvent {
    name: string;
    [key: string]: any;
}

export interface EventEmitterSubscriptionParams {
    [key: string]: any;
}

export interface EventEmitterSubscription {
    callback: EventEmitterCallback|undefined;
    once?: boolean;
    paramsKey?: string;
}

export interface EventHandlerSubscriptionsList {
    // `key` is event name
    [key: string]: EventEmitterSubscription[];
}

export interface EventEmitterSubscriptionArguments {
    eventName: string;
    params?: EventEmitterSubscriptionParams;
    callback?: EventEmitterCallback;
}

export function getSubscriptionArguments (
    eventName: string,
    params?: EventEmitterSubscriptionParams|EventEmitterCallback,
    callback?: EventEmitterCallback
): EventEmitterSubscriptionArguments {
    if (typeof params === 'function') {
        return {
            eventName,
            callback: params as EventEmitterCallbackWithoutParams
        };
    }

    return {
        eventName,
        callback,
        params
    };
}

export function createSubscription (
    subscriptionProto: Partial<Pick<EventEmitterSubscription, 'once'>>,
    {params, callback}: EventEmitterSubscriptionArguments
): EventEmitterSubscription {
    const subscription: EventEmitterSubscription = {
        ...subscriptionProto,
        callback
    };

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
    params: EventEmitterSubscriptionParams|undefined,
    data: any
) {
    if (params) {
        (callback as EventEmitterCallbackWithParams)(emitterEvent, params, data);
    } else {
        (callback as EventEmitterCallbackWithoutParams)(emitterEvent, data);
    }
}

export class EventEmitter {
    protected subscriptions: EventHandlerSubscriptionsList;

    constructor () {
        this.subscriptions = Object.create(null);
    }

    on (
        eventName: string,
        params?: EventEmitterSubscriptionParams|EventEmitterCallback,
        callback?: EventEmitterCallback
    ): void {
        addEventSubscription(
            eventName,
            this.subscriptions,
            createSubscription({}, getSubscriptionArguments(eventName, params, callback))
        );
    }

    once (
        eventName: string,
        params?: EventEmitterSubscriptionParams|EventEmitterCallback,
        callback?: EventEmitterCallback
    ): void {
        addEventSubscription(
            eventName,
            this.subscriptions,
            createSubscription({once: true}, getSubscriptionArguments(eventName, params, callback))
        );
    }

    off (
        eventName?: string,
        params?: EventEmitterSubscriptionParams|EventEmitterCallback,
        callback?: EventEmitterCallback
    ): void {
        const {subscriptions} = this;
        const argumentsCount: number = arguments.length;

        // remove all eventName subscriptions
        if (argumentsCount === 0 || eventName === undefined) {
            this.subscriptions = Object.create(null);
            return;
        }

        if (argumentsCount === 1) {
            delete subscriptions[eventName];
            return;
        }

        const eventSubscriptions: EventEmitterSubscription[]|undefined = subscriptions[eventName];

        if (!eventSubscriptions) {
            return;
        }

        const {length} = eventSubscriptions;
        const subscriptionToFind: EventEmitterSubscription = createSubscription(
            {},
            getSubscriptionArguments(eventName, params, callback)
        );
        const filteredSubscriptions: EventEmitterSubscription[] = [];
        let filteredSubscriptionsCount: number = 0;

        for (let i = 0; i < length; i++) {
            const existingSubscription: EventEmitterSubscription = eventSubscriptions[i];

            if (
                (subscriptionToFind.callback && existingSubscription.callback !== subscriptionToFind.callback) ||
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
            delete subscriptions[eventName];
        }

        return;
    }

    emit (eventName: string, params?: EventEmitterSubscriptionParams, data?: any): void {
        const {subscriptions} = this;
        const eventSubscriptions: EventEmitterSubscription[]|undefined = subscriptions[eventName];

        if (!eventSubscriptions) {
            return;
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
            const {callback, paramsKey, once} = eventSubscription;
            let isActive: boolean = true;

            if (!paramsKey || (paramsKey === JSON.stringify(params))) {
                if (typeof callback === 'function') {
                    runEventCallback(callback, emitterEvent, params, data);
                }

                // remove if it's a one-time subscription
                isActive = !once;
            }

            if (isActive) {
                filteredSubscriptions[filteredSubscriptionsCount] = eventSubscription;
                filteredSubscriptionsCount++;
            }
        }

        if (filteredSubscriptions[0]) {
            subscriptions[eventName] = filteredSubscriptions;
        } else {
            delete subscriptions[eventName];
        }
    }

    hasListeners (
        eventName?: string,
        params?: EventEmitterSubscriptionParams|EventEmitterCallback,
        callback?: EventEmitterCallback
    ): boolean {
        return this.getListenersCount(eventName, params, callback) > 0;
    }

    getListenersCount (
        eventName?: string,
        params?: EventEmitterSubscriptionParams|EventEmitterCallback,
        callback?: EventEmitterCallback
    ): number {
        const {subscriptions} = this;
        const argumentsCount: number = arguments.length;
        let listenersCount: number = 0;

        // check all subscriptions
        if (argumentsCount === 0 || eventName === undefined) {
            for (const key in subscriptions) {
                if (Object.hasOwnProperty.call(subscriptions, key)) {
                    listenersCount += subscriptions[key].length;
                }
            }

            return listenersCount;
        }

        const eventSubscriptions: EventEmitterSubscription[]|undefined = subscriptions[eventName];

        // check subscriptions only by eventName
        if (argumentsCount === 1 || !eventSubscriptions) {
            return eventSubscriptions ? eventSubscriptions.length : 0;
        }

        const {length} = eventSubscriptions;
        const subscriptionToFind: EventEmitterSubscription = createSubscription(
            {},
            getSubscriptionArguments(eventName, params, callback)
        );

        for (let i = 0; i < length; i++) {
            const existingSubscription: EventEmitterSubscription|undefined = eventSubscriptions[i];

            if (
                existingSubscription &&
                (!subscriptionToFind.callback || existingSubscription.callback === subscriptionToFind.callback) &&
                (!subscriptionToFind.paramsKey || existingSubscription.paramsKey === subscriptionToFind.paramsKey)
            ) {
                listenersCount++;
            }
        }

        return listenersCount;
    }
}
