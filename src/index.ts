export type EventEmitterCallback<D = any> = (
    event: EventEmitterEvent,
    data: D
) => any;

export interface EventEmitterEvent {
    name: string;
    [key: string]: any;
}

export interface EventEmitterSubscriptionParams {
    [key: string]: any;
}

export type Unsubscribe = () => void;

export type EventEmitterSubscription = Readonly<{
    once?: boolean;
    paramsKey?: string;
    callback: EventEmitterCallback|undefined;
}>;

// `key` is event name
export type EventEmitterSubscriptions = Map<string, Set<EventEmitterSubscription>>;

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
            callback: params as EventEmitterCallback
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
    return {
        ...subscriptionProto,
        callback,
        // IMPORTANT: Params object should contain ONLY JSON values: NOT functions, Date, RegExp, etc.
        paramsKey: params && JSON.stringify(params)
    };
}

export function addEventSubscription (
    eventName: string,
    subscriptions: EventEmitterSubscriptions,
    subscription: EventEmitterSubscription
): Unsubscribe {
    const eventSubscriptions: Set<EventEmitterSubscription> = subscriptions.get(eventName) || new Set();

    eventSubscriptions.add(subscription);
    subscriptions.set(eventName, eventSubscriptions);

    return function unsubscribe () {
        const eventSubscriptions: Set<EventEmitterSubscription>|undefined = subscriptions.get(eventName);

        if (eventSubscriptions) {
            eventSubscriptions.delete(subscription);

            if (!eventSubscriptions.size) {
                subscriptions.delete(eventName);
            }
        }
    };
}

export class EventEmitter {
    protected subscriptions: EventEmitterSubscriptions = new Map<string, Set<EventEmitterSubscription>>();

    on (
        eventName: string,
        params?: EventEmitterSubscriptionParams|EventEmitterCallback,
        callback?: EventEmitterCallback
    ): Unsubscribe {
        return addEventSubscription(
            eventName,
            this.subscriptions,
            createSubscription({}, getSubscriptionArguments(eventName, params, callback))
        );
    }

    once (
        eventName: string,
        params?: EventEmitterSubscriptionParams|EventEmitterCallback,
        callback?: EventEmitterCallback
    ): Unsubscribe {
        return addEventSubscription(
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

        // remove all subscriptions
        if (argumentsCount === 0 || eventName === undefined) {
            subscriptions.clear();
            return;
        }

        if (argumentsCount === 1) {
            subscriptions.delete(eventName);
            return;
        }

        const eventSubscriptions: Set<EventEmitterSubscription>|undefined = subscriptions.get(eventName);

        if (!eventSubscriptions) {
            return;
        }

        const {callback: callbackToMatch, params: paramsArg} = getSubscriptionArguments(eventName, params, callback);
        const paramsKeyToMatch: string|undefined = paramsArg && JSON.stringify(paramsArg);

        eventSubscriptions.forEach((
            subscription: EventEmitterSubscription,
            _: EventEmitterSubscription,
            subscriptions: Set<EventEmitterSubscription>
        ) => {
            const matches: boolean = (
                (!callbackToMatch || subscription.callback === callbackToMatch) &&
                (!paramsKeyToMatch || subscription.paramsKey === paramsKeyToMatch)
            );

            if (matches) {
                subscriptions.delete(subscription);
            }
        });

        if (!eventSubscriptions.size) {
            subscriptions.delete(eventName);
        }
    }

    emit (eventName: string, params?: EventEmitterSubscriptionParams, data?: any): void {
        const {subscriptions} = this;
        const eventSubscriptions: Set<EventEmitterSubscription>|undefined = subscriptions.get(eventName);

        if (!eventSubscriptions) {
            return;
        }

        if (arguments.length < 3) {
            data = params;
            params = undefined;
        }

        const emitterEvent: EventEmitterEvent = {name: eventName};
        const paramsKeyToMatch: string|undefined = params && JSON.stringify(params);

        eventSubscriptions.forEach((
            subscription: EventEmitterSubscription,
            _: EventEmitterSubscription,
            subscriptions: Set<EventEmitterSubscription>
        ) => {
            const {callback, paramsKey} = subscription;

            if (!paramsKey || paramsKey === paramsKeyToMatch) {
                // remove if it's a one-time subscription
                if (subscription.once) {
                    subscriptions.delete(subscription);
                }

                // do not pass params to the callback which doesn't expect them
                callback?.(emitterEvent, data);
            }
        });

        if (!eventSubscriptions.size) {
            subscriptions.delete(eventName);
        }
    }

    getCallbacks (eventName: string, params?: EventEmitterSubscriptionParams): EventEmitterCallback[] {
        const eventSubscriptions: Set<EventEmitterSubscription>|undefined = this.subscriptions.get(eventName);

        if (!eventSubscriptions) {
            return [];
        }

        const callbacks: EventEmitterCallback[] = [];
        const paramsKeyToMatch: string|undefined = params && JSON.stringify(params);

        eventSubscriptions.forEach(({paramsKey, callback}: EventEmitterSubscription) => {
            const matches: boolean = (!paramsKeyToMatch || paramsKey === paramsKeyToMatch);

            if (matches && callback) {
                callbacks.push(callback)
            }
        });

        return callbacks;
    }
}
