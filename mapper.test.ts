import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";

import { IMap } from "./mapper/interfaces/IMap.ts";
import { IContainer } from "./mapper/interfaces/IContainer.ts";

const SUFFIX = Deno.env.get("DOMAIN_SUFFIX") ?? Deno.exit(3);
const MAPPER_PREFIX = Deno.env.get("MAPPER_PREFIX") ?? Deno.exit(4);
const AUTHORIZATION = Deno.env.get("AUTHORIZATION") ?? Deno.exit(2);

const URL = `https://mapper-${MAPPER_PREFIX}.${SUFFIX}:1443`;

interface IResponse {
  code: number;
  msg: string;
}

function container(alias: string, ip: string, port: number) {
  return { alias, ip, port } as IContainer;
}

function map(prefix: string, containers: Array<IContainer>) {
  return { prefix, containers } as IMap;
}

Deno.test(
  "Connection #1",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    const res = await axiod.get(URL, {validateStatus: () => true});
    assertEquals(res.status, 404);
  },
);

Deno.test(
  "Connection #2",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    const res = await axiod.post(`${URL}/add`, {}, {
      headers: {
        "authorization": AUTHORIZATION,
      },
    });
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 1);
  },
);

Deno.test(
  "Add #1 Add normally",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    const res = await axiod.post(
      `${URL}/add`,
      map("test1", [container("test1-1", "1.1.1.1", 80)]),
      {
        headers: {
          "authorization": AUTHORIZATION,
        },
      },
    );
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);
  },
);

Deno.test(
  "Add #2 Add duplicated ones",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    let res = await axiod.post(
      `${URL}/add`,
      map("test2", [container("test2-1", "1.1.1.1", 80)]),
      {
        headers: {
          "authorization": AUTHORIZATION,
        },
      },
    );
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);

    res = await axiod.post(
      `${URL}/add`,
      map("test2", [container("test2-1", "1.1.1.1", 80)]),
      {
        headers: {
          "authorization": AUTHORIZATION,
        },
      },
    );
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 1);
  },
);

Deno.test(
  "Add #3 Add duplicated alias with cover prefix",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    let res = await axiod.post(
      `${URL}/add`,
      map("test3", [container("test3-1", "1.1.1.1", 80)]),
      {
        headers: {
          "authorization": AUTHORIZATION,
        },
      },
    );
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);

    res = await axiod.post(
      `${URL}/add`,
      map("test31", [container("test3-1", "1.1.1.1", 80)]),
      {
        headers: {
          "authorization": AUTHORIZATION,
        },
      },
    );
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 1);
  },
);

Deno.test(
  "Remove #1 Remove normally",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    let res = await axiod.post(
      `${URL}/add`,
      map("test4", [container("test4-1", "1.1.1.1", 80)]),
      {
        headers: {
          "authorization": AUTHORIZATION,
        },
      },
    );
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);

    res = await axiod.post(`${URL}/remove`, map("test4", []), {
      headers: {
        "authorization": AUTHORIZATION,
      },
    });
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);
  },
);

Deno.test(
  "Remove #2 Remove action duplicated",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    let res = await axiod.post(
      `${URL}/add`,
      map("test5", [container("test5-1", "1.1.1.1", 80)]),
      {
        headers: {
          "authorization": AUTHORIZATION,
        },
      },
    );
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);

    res = await axiod.post(`${URL}/remove`, map("test5", []), {
      headers: {
        "authorization": AUTHORIZATION,
      },
    });
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);

    res = await axiod.post(`${URL}/remove`, map("test5", []), {
      headers: {
        "authorization": AUTHORIZATION,
      },
    });
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);
  },
);

Deno.test(
  "Remove #3 Remove with cover prefix",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    let res = await axiod.post(
      `${URL}/add`,
      map("test6", [container("test6-1", "1.1.1.1", 80)]),
      {
        headers: {
          "authorization": AUTHORIZATION,
        },
      },
    );
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);

    res = await axiod.post(
      `${URL}/add`,
      map("test61", [container("test61-1", "1.1.1.1", 80)]),
      {
        headers: {
          "authorization": AUTHORIZATION,
        },
      },
    );
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);

    res = await axiod.post(`${URL}/remove`, map("test6", []), {
      headers: {
        "authorization": AUTHORIZATION,
      },
    });
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);

    res = await axiod.post(
      `${URL}/add`,
      map("test61", [container("test61-1", "1.1.1.1", 80)]),
      {
        headers: {
          "authorization": AUTHORIZATION,
        },
      },
    );
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 1);
  },
);

Deno.test(
  "Reload #1 Reload Nginx",
  { sanitizeResources: false, sanitizeOps: false },
  async () => {
    const res = await axiod.post(`${URL}/reload`, {}, {
      headers: {
        "authorization": AUTHORIZATION,
      },
    });
    assertEquals(res.status, 200);
    assertEquals((res.data as IResponse).code, 0);
  },
);
