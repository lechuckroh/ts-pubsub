import {assertEquals} from "./test_deps.ts";
import {newPublisher} from "./mod.ts";

Deno.test("publish", () => {
  const publisher = newPublisher();
  const topic = "tick";
  const callback = async (data: string) => console.log(data);
  publisher.subscribe(topic, callback);
  const removedCallback1 = publisher.unsubscribe(topic, callback);
  assertEquals(removedCallback1, callback);
  const removedCallback2 = publisher.unsubscribe(topic, callback);
  assertEquals(removedCallback2, null);
});
