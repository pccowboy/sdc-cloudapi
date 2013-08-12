// Copyright 2013 Joyent, Inc. All rights reserved.

var util = require('util');
var sprintf = util.format;
var test = require('tap').test;
var common = require('../common');
var machinesCommon = require('./common');
var checkMachine = machinesCommon.checkMachine;
var checkWfJob = machinesCommon.checkWfJob;
var waitForWfJob = machinesCommon.waitForWfJob;
var TAP_CONF = {
    timeout: 'Infinity '
};

module.exports = function (suite, client, machine, callback) {
    if (!machine) {
        TAP_CONF.skip = true;
    }
    // FireWall Rules:
    var RULE_UUID;
    var RULES_URL = '/my/fwrules';
    var RULE_URL = RULES_URL + '/%s';
    var RULE_JOB_UUID;

    function checkRule(t, rule) {
        t.ok(rule.id, 'rule id ok');
        t.ok(rule.rule, 'rule text ok');
        t.ok(typeof (rule.enabled) !== 'undefined', 'rule enabled defined');
    }


    suite.test('ListRules (empty set)', TAP_CONF, function (t) {
        client.get(RULES_URL, function (err, req, res, body) {
            t.ifError(err, 'Error');
            t.equal(200, res.statusCode, 'Status Code');
            t.ok(Array.isArray(body), 'isArray(body)');
            t.equal(body.length, 0, 'empty array');
            t.end();
        });
    });


    suite.test('AddRule', TAP_CONF, function (t) {
        client.post(RULES_URL, {
            rule: 'FROM vm ' + machine +
                ' TO subnet 10.99.99.0/24 ALLOW tcp port 80'
        }, function (err, req, res, body) {
            t.ifError(err, 'Error');
            t.ok(body, 'body OK');
            checkRule(t, body);
            RULE_UUID = body.id;
            t.equal(201, res.statusCode, 'Status Code');
            t.equal(body.enabled, false, 'rule enabled');
            t.ok(res.headers['x-joyent-jobid'], 'jobid header');
            RULE_JOB_UUID = res.headers['x-joyent-jobid'];
            t.end();
        });
    });


    suite.test('RuleAdd Job', TAP_CONF, function (t) {
        waitForWfJob(client, RULE_JOB_UUID, function (err) {
            t.ifError(err, 'error');
            t.end();
        });
    });


    suite.test('ListRules (not empty set)', TAP_CONF, function (t) {
        client.get(RULES_URL, function (err, req, res, body) {
            t.ifError(err, 'Error');
            t.equal(200, res.statusCode, 'Status Code');
            t.ok(Array.isArray(body), 'isArray(rules)');
            t.ok(body.length, 'rules length');
            checkRule(t, body[0]);
            t.end();
        });
    });


    suite.test('List Rule Machines (not empty set)', TAP_CONF, function (t) {
        var p = sprintf(RULE_URL, RULE_UUID) + '/machines';
        client.get(p, function (err, req, res, body) {
            t.ifError(err, 'Error');
            t.equal(200, res.statusCode, 'Status Code');
            t.ok(Array.isArray(body), 'isArray(machines)');
            t.ok(body.length, 'machines length');
            body.forEach(function (m) {
                checkMachine(t, m);
            });
            t.end();
        });
    });


    suite.test('List Machine Rules (not empty set)', TAP_CONF, function (t) {
        var u = '/my/machines/' + machine + '/fwrules';
        client.get(u, function (err, req, res, body) {
            t.ifError(err, 'Error');
            t.equal(200, res.statusCode, 'Status Code');
            t.ok(Array.isArray(body), 'isArray(rules)');
            t.ok(body.length, 'rules length');
            checkRule(t, body[0]);
            t.end();
        });
    });


    suite.test('GetRule', TAP_CONF, function (t) {
        client.get(sprintf(RULE_URL, RULE_UUID),
            function (err, req, res, body) {
            t.ifError(err);
            t.equal(200, res.statusCode);
            checkRule(t, body);
            t.end();
        });
    });


    suite.test('UpdateRule', TAP_CONF, function (t) {
        client.post(sprintf(RULE_URL, RULE_UUID), {
            rule: 'FROM vm ' + machine +
                ' TO subnet 10.99.99.0/24 ALLOW tcp (port 80 AND port 443)'
        }, function (err, req, res, body) {
            t.ifError(err);
            t.equal(200, res.statusCode);
            t.ok(res.headers['x-joyent-jobid'], 'jobid header');
            RULE_JOB_UUID = res.headers['x-joyent-jobid'];
            t.end();
        });
    });


    suite.test('RuleUpdate Job', TAP_CONF, function (t) {
        waitForWfJob(client, RULE_JOB_UUID, function (err) {
            t.ifError(err, 'error');
            t.end();
        });
    });


    suite.test('GetUpdatedRule', TAP_CONF, function (t) {
        client.get(sprintf(RULE_URL, RULE_UUID),
            function (err, req, res, body) {
            t.ifError(err);
            t.equal(200, res.statusCode);
            checkRule(t, body);
            t.end();
        });
    });


    suite.test('EnableRule', TAP_CONF, function (t) {
        client.post(sprintf(RULE_URL, RULE_UUID) + '/enable', {
        }, function (err, req, res, body) {
            t.ifError(err);
            t.equal(200, res.statusCode);
            t.ok(res.headers['x-joyent-jobid'], 'jobid header');
            RULE_JOB_UUID = res.headers['x-joyent-jobid'];
            t.end();
        });
    });


    suite.test('EnableRule Job', TAP_CONF, function (t) {
        waitForWfJob(client, RULE_JOB_UUID, function (err) {
            t.ifError(err, 'error');
            t.end();
        });
    });


    suite.test('GetEnabledRule', TAP_CONF, function (t) {
        client.get(sprintf(RULE_URL, RULE_UUID),
            function (err, req, res, body) {
            t.ifError(err);
            t.equal(200, res.statusCode);
            checkRule(t, body);
            t.end();
        });
    });


    suite.test('DeleteRule', TAP_CONF, function (t) {
        client.del(sprintf(RULE_URL, RULE_UUID), function (err, req, res) {
            t.ifError(err);
            t.equal(204, res.statusCode);
            t.ok(res.headers['x-joyent-jobid'], 'jobid header');
            RULE_JOB_UUID = res.headers['x-joyent-jobid'];
            t.end();
        });
    });

    callback();
};
