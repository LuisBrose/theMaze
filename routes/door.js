/**
 * Gero Wedemann, Hochschule Stralsund
 * Oktober 2016, 2019
 */
"use strict";

const express = require('express');
const router = express.Router();
const model = require('../model');

router.get('/:direction', function(req, res, next) {
    try {
        const person = model.getPerson(req.user);
        const direction = req.params.direction;
        // TODO: The following 4 lines should be done in a function of person
        const door = person.position[direction];
        if (door == undefined) {
            throw new Error("in this direction no door");
        }
        res.status(200).jsonp(door);
    }
    catch(err) {
        res.status(422).jsonp({"error":err.message});
    }
});

/**
 * change status of door. Accepts {"action": "open|close|lock|unlock", "key" : "aKey" } key is only needed for un/locking
 */
router.patch('/:direction', function (req, res, next) {
    let door;
    try {
        const person = model.getPerson(req.user);
        // TODO: open, close etc. should be part of person in order to check el.g. if the player is really there he has the right key, there is a door etc.
        door = person.position[req.params.direction];
        if (door == undefined) {
            throw new Error("in this direction no door");
        }
        const action = req.body.action;
        if ( action == "open" || action == "close") {
            door[action]();
        }
        else if ( action == "lock" || action == "unlock") {
            const key = new model.Thing(req.body.key);
            if (!person.hasThing(key)) {
                throw new Error ("The player has not the right key");
            }
            door[action](key);
        }
        else {
            throw new Error ("wrong action. Allowed: open|close|lock|unlock");
        }
    }
    catch(err) {
        res.status(422).jsonp({"error":err.message});
        return;
    }
    res.status(200).jsonp( door );
});


module.exports = router;