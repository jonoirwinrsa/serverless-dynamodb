"use strict";
//Define the modules required to mocha testing
const assert = require("chai").assert;
const http = require ("http");
const expect = require("chai").expect;
const should = require("should");
const seeder = require("../src/seeder.js");
const Plugin = require("../index.js");
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const serverlessMock = require("./serverlessMock");

function get(url) {
  return new Promise(function(resolve, reject) {
    http.get(url, function(incoming) {
      resolve(incoming);
    }).on("error", reject);
  });
}

function getWithRetry(url, retryCount, previousError) {
  retryCount = retryCount || 0;
  if (retryCount >= 30) {
    return Promise.reject(new Error("Exceeded retry count for get of " + url + ": " + previousError.message));
  }
  return get(url)
    .catch(async function(error) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return getWithRetry(url, retryCount + 1, error);
    });
}

describe("Port function",function(){
  let service;
  before(function(){
    this.timeout(60000);
    service = new Plugin(serverlessMock, { stage: "test" });
    return service.installHandler();
  });

  it("Port should return number",function(){
    assert(typeof service.port, "number");
  });

  it("Port value should be >= 0 and < 65536",function() {
    assert(service.port >= 0)
    assert(service.port < 65536)
  });

  // TODO: this test is flakey
  it.skip("Service can be reached on port", async function() {
    this.timeout(40000);
    await service.startHandler()
    await getWithRetry(`http://localhost:${service.port}/`);
  });

  after(async function(){
    await service.endHandler();
  });
});

describe("dynamodbOptions",function(){
  it("should return raw and doc objects of right type",function(){
    const { raw, doc } = Plugin.prototype.dynamodbOptions();
    raw.should.be.instanceOf(DynamoDBClient);
    doc.should.be.instanceOf(DynamoDBDocumentClient);
  });
});

describe ("Start handler function",function(){
  it ("Should not  be null",function(){
    let handler = Plugin.prototype.startHandler;
    assert(handler =! null);
  });
});


describe ("createTable functon",function(){
  it ("Should check as a function",function(){
    const tbl = Plugin.prototype.createTable;
    assert.equal(typeof tbl, "function");
  });
});

describe ("Check the Seeder file",function(){
  it("Table name shoud be a string",function(){
    let tblName = seeder.writeSeeds.name;
    expect(tblName).to.be.a("string");
  });
});
