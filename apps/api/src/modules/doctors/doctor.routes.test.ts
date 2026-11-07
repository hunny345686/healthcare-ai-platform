import { after, describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildApp } from "../../app.js";

const app = buildApp();

after(async () => {
  await app.close();
});

describe("Doctor API", () => {
  it("should return doctor details", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/doctors/101",
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();

    assert.equal(body.success, true);
    assert.equal(body.doctor.id, "101");
  });

  it("should return 400 for invalid doctor ID", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/doctors/abc",
    });

    assert.equal(response.statusCode, 400);
  });

  it("should return 404 when doctor does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/doctors/999",
    });

    assert.equal(response.statusCode, 404);
  });
});
