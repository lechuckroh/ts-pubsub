export type SubscribeCallback<T> = (data: T) => Promise<any>;

export interface SubscribeOption {
  single?: boolean;
}

export interface Publisher {
  /**
   * Subscribe topic.
   * @param topic Topic to subscribe
   * @param callback subscribe callback function
   * @param option subscribe option
   */
  subscribe: <T>(
    topic: string,
    callback: SubscribeCallback<T>,
    option?: SubscribeOption,
  ) => void;

  /**
   * Unsubscribe topic.
   * @param topic Topic to unsubscribe
   * @param callback callback function to remove
   * @return removed callback function
   */
  unsubscribe: <T>(
    topic: string,
    callback: SubscribeCallback<T>,
  ) => SubscribeCallback<T> | null;

  publish: <T>(topic: string, data: T) => void;
}

class Subscriber<T> {
  private callCount: number;

  constructor(
    private callback: SubscribeCallback<T>,
    private option?: SubscribeOption,
  ) {
    this.callCount = 0;
  }

  public getCallback() {
    return this.callback;
  }

  public increaseCallCount() {
    this.callCount++;
  }

  public isUnsubscribeRequired(): boolean {
    if (this.option?.single) {
      if (this.callCount > 0) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Default Publisher implementation class
 */
class DefaultPublisher implements Publisher {
  private subscribersByTopic = new Map<string, Subscriber<any>[]>();

  subscribe<T>(
    topic: string,
    callback: SubscribeCallback<T>,
    option?: SubscribeOption,
  ) {
    const subscriber = new Subscriber(callback, option);
    this.getOrAddSubscribers(topic).push(subscriber);
  }

  private getOrAddSubscribers(topic: string): Subscriber<any>[] {
    let subscribers = this.subscribersByTopic.get(topic);
    if (subscribers == null) {
      subscribers = [];
      this.subscribersByTopic.set(topic, subscribers);
    }
    return subscribers;
  }

  private getSubscribers(topic: string): Subscriber<any>[] | undefined {
    return this.subscribersByTopic.get(topic);
  }

  unsubscribe<T>(
    topic: string,
    callback: SubscribeCallback<T>,
  ): SubscribeCallback<T> | null {
    const subscribers = this.getSubscribers(topic);
    if (subscribers == null) {
      return null;
    }

    // remove
    for (let i=0; i<subscribers.length; i++) {
      const subscriber = subscribers[i];
      if (callback === subscriber.getCallback()) {
        subscribers.splice(i, 1);
        return callback;
      }
    }

    return null;
  }

  publish<T>(topic: string, data: T) {
    const subscribers = this.getSubscribers(topic);
    subscribers?.forEach(async (subscriber, index) => {
      const callback = subscriber.getCallback();
      try {
        await callback(data);

        subscriber.increaseCallCount();

        // unsubscribe if required
        if (subscriber.isUnsubscribeRequired()) {
          subscribers.splice(index, 1);
        }
      } catch (e) {
        console.error(e);
      }
    });
  }
}

/**
 * Create a Publisher instance
 */
export function newPublisher(): Publisher {
  return new DefaultPublisher();
}
