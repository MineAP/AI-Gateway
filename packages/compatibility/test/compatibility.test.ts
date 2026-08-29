import { describe, expect, it } from "vitest";

import type { GatewayRequest, GatewayResponse, ProcessingContext } from "@ai-gateway/protocol";
import type { CompatibilityModule } from "../src/module.js";
import { CompatibilityPipeline, PipelineError } from "../src/index.js";

function makeRequest(data: Record<string, unknown>): GatewayRequest {
  return { raw: data, metadata: {} };
}

function makeResponse(data: Record<string, unknown>): GatewayResponse {
  return { raw: data, metadata: {} };
}

describe("CompatibilityPipeline", () => {
  describe("empty pipeline", () => {
    it("returns the request unchanged when no modules are registered", async () => {
      const pipeline = new CompatibilityPipeline();
      const request = makeRequest({ model: "test" });
      const context: ProcessingContext = { metadata: new Map() };

      const result = await pipeline.processRequest(request, context);

      expect(result).toBe(request);
    });

    it("returns the response unchanged when no modules are registered", async () => {
      const pipeline = new CompatibilityPipeline();
      const response = makeResponse({ content: "hello" });
      const context: ProcessingContext = { metadata: new Map() };

      const result = await pipeline.processResponse(response, context);

      expect(result).toBe(response);
    });
  });

  describe("module execution order", () => {
    it("executes request modules in registration order", async () => {
      const order: string[] = [];
      const pipeline = new CompatibilityPipeline();

      pipeline.register({
        name: "a",
        async processRequest(req) {
          order.push("a-request");
          return req;
        },
      });
      pipeline.register({
        name: "b",
        async processRequest(req) {
          order.push("b-request");
          return req;
        },
      });

      await pipeline.processRequest(makeRequest({}), { metadata: new Map() });

      expect(order).toEqual(["a-request", "b-request"]);
    });

    it("executes response modules in registration order", async () => {
      const order: string[] = [];
      const pipeline = new CompatibilityPipeline();

      pipeline.register({
        name: "a",
        async processResponse(res) {
          order.push("a-response");
          return res;
        },
      });
      pipeline.register({
        name: "b",
        async processResponse(res) {
          order.push("b-response");
          return res;
        },
      });

      await pipeline.processResponse(makeResponse({}), { metadata: new Map() });

      expect(order).toEqual(["a-response", "b-response"]);
    });
  });

  describe("context propagation", () => {
    it("shares ProcessingContext across request modules", async () => {
      const pipeline = new CompatibilityPipeline();

      pipeline.register({
        name: "writer",
        async processRequest(req, context) {
          context.metadata.set("key", "value");
          return req;
        },
      });
      pipeline.register({
        name: "reader",
        async processRequest(req, context) {
          const value = context.metadata.get("key");
          return { ...req, metadata: { readValue: value } };
        },
      });

      const result = await pipeline.processRequest(makeRequest({}), { metadata: new Map() });

      expect(result.metadata).toEqual({ readValue: "value" });
    });

    it("shares ProcessingContext between request and response phases", async () => {
      const pipeline = new CompatibilityPipeline();
      const context: ProcessingContext = { metadata: new Map() };

      // Module that writes during request and reads during response
      pipeline.register({
        name: "request-phase",
        async processRequest(req, ctx) {
          ctx.metadata.set("phase", "request-done");
          return req;
        },
        async processResponse(res, ctx) {
          const phase = ctx.metadata.get("phase");
          return { ...res, metadata: { phase } };
        },
      });

      await pipeline.processRequest(makeRequest({}), context);
      const responseResult = await pipeline.processResponse(makeResponse({}), context);

      expect(responseResult.metadata).toEqual({ phase: "request-done" });
    });
  });

  describe("module chaining", () => {
    it("passes module output to the next module in request processing", async () => {
      const pipeline = new CompatibilityPipeline();

      pipeline.register({
        name: "step1",
        async processRequest(req) {
          return { ...req, metadata: { step: 1 } };
        },
      });
      pipeline.register({
        name: "step2",
        async processRequest(req) {
          return { ...req, metadata: { ...req.metadata, step: 2 } };
        },
      });

      const result = await pipeline.processRequest(makeRequest({}), { metadata: new Map() });

      expect(result.metadata).toEqual({ step: 2 });
    });

    it("passes module output to the next module in response processing", async () => {
      const pipeline = new CompatibilityPipeline();

      pipeline.register({
        name: "step1",
        async processResponse(res) {
          return { ...res, metadata: { step: 1 } };
        },
      });
      pipeline.register({
        name: "step2",
        async processResponse(res) {
          return { ...res, metadata: { ...res.metadata, step: 2 } };
        },
      });

      const result = await pipeline.processResponse(makeResponse({}), { metadata: new Map() });

      expect(result.metadata).toEqual({ step: 2 });
    });
  });

  describe("partial module implementations", () => {
    it("skips modules that do not implement processRequest", async () => {
      const pipeline = new CompatibilityPipeline();
      let responseCalled = false;

      pipeline.register({
        name: "response-only",
        async processResponse(res) {
          responseCalled = true;
          return res;
        },
      });

      await pipeline.processRequest(makeRequest({}), { metadata: new Map() });

      expect(responseCalled).toBe(false);
    });

    it("skips modules that do not implement processResponse", async () => {
      const pipeline = new CompatibilityPipeline();
      let requestCalled = false;

      pipeline.register({
        name: "request-only",
        async processRequest(req) {
          requestCalled = true;
          return req;
        },
      });

      await pipeline.processResponse(makeResponse({}), { metadata: new Map() });

      expect(requestCalled).toBe(false);
    });
  });

  describe("failure behavior", () => {
    it("throws PipelineError when a request module fails", async () => {
      const pipeline = new CompatibilityPipeline();

      pipeline.register({
        name: "failing-module",
        async processRequest() {
          throw new Error("transformation failed");
        },
      });

      await expect(
        pipeline.processRequest(makeRequest({}), { metadata: new Map() }),
      ).rejects.toThrow(PipelineError);
    });

    it("throws PipelineError when a response module fails", async () => {
      const pipeline = new CompatibilityPipeline();

      pipeline.register({
        name: "failing-module",
        async processResponse() {
          throw new Error("transformation failed");
        },
      });

      await expect(
        pipeline.processResponse(makeResponse({}), { metadata: new Map() }),
      ).rejects.toThrow(PipelineError);
    });

    it("includes the failing module name in PipelineError", async () => {
      const pipeline = new CompatibilityPipeline();

      pipeline.register({
        name: "broken-module",
        async processRequest() {
          throw new Error("oops");
        },
      });

      try {
        await pipeline.processRequest(makeRequest({}), { metadata: new Map() });
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        const pe = error as PipelineError;
        expect(pe.moduleName).toBe("broken-module");
      }
    });

    it("stops execution on the first failing module", async () => {
      const order: string[] = [];
      const pipeline = new CompatibilityPipeline();

      pipeline.register({
        name: "ok",
        async processRequest(req) {
          order.push("ok");
          return req;
        },
      });
      pipeline.register({
        name: "fail",
        async processRequest() {
          throw new Error("stop here");
        },
      });
      pipeline.register({
        name: "after-fail",
        async processRequest(req) {
          order.push("after-fail");
          return req;
        },
      });

      await expect(
        pipeline.processRequest(makeRequest({}), { metadata: new Map() }),
      ).rejects.toThrow(PipelineError);

      expect(order).toEqual(["ok"]);
    });
  });

  describe("duplicate registration", () => {
    it("throws when registering a module with the same name twice", () => {
      const pipeline = new CompatibilityPipeline();
      const module: CompatibilityModule = {
        name: "unique-module",
        async processRequest(req) {
          return req;
        },
      };

      pipeline.register(module);
      expect(() => pipeline.register(module)).toThrow(/already registered/);
    });
  });
});
