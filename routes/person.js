"use strict";

const express = require('express');
/**
 * Gero Wedemann, Hochschule Stralsund
 * Oktober 2016, 2019
 */
"use strict";

const router = express.Router();
const model = require('../model');

/* GET Person listing. */
router.get('/', function(req, res, next) {
    const person = model.getPerson(req.user);
    const p = person.toJSON();
    p.things = person.things;
    res.status(200).jsonp(p);
});

/**
 * move user to next position. expecting as parameter go with value n, s, w, e
 */
router.patch('/', function (req, res, next){
    let person;
    if (req.query.go) {
        const direction = req.query.go;

        try {
            person = model.getPerson(req.user);
            person.go(req.query.go);
        }
        catch (err) {
            res.status(422).send({"error":err.message, "position" : person.position.toJSON()});
            return;
        }
        res.status(200).send(person.position.toJSON());
    }
    else {
        res.status(422).send({"error":"missing parameter 'go'", "position" : person.position.toJSON()});
        return;
    }




});


/**
 * take a thing from current position
 */
router.post('/thing', function (req, res, next) {
    let thingTaken;
    try {
        const person = model.getPerson(req.user);
        thingTaken = person.take(req.body.name);
    }
    catch(err) {
        res.status(422).send({"error":err.message});
        return;
    }
    res.status(200).send(thingTaken);
});

module.exports = router;