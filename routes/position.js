/**
 * Gero Wedemann, Hochschule Stralsund
 * Oktober 2016, 2019
 */
"use strict";

const express = require('express');
const router = express.Router();
const model = require('../model');

/* GET Poition of User listing. */
router.get('/', function(req, res, next) {
    const person = model.getPerson(req.user);
    res.jsonp(person.position);
});

/**
 * drop a thing from player to current position
 */
router.post('/thing', function (req, res, next) {
    let thingDropped;
    try {
        const person = model.getPerson(req.user);
        thingDropped = person.drop(new model.Thing(req.body.name));
    }
    catch(err) {
        res.status(422).send({"error":err.message});
        return;
    }
    res.status(200).send(thingDropped);
});

module.exports = router;