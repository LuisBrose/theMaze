/**
 * Constructors for domain elements
 *
 * Gero Wedemann, Hochschule Stralsund
 *
 * TODO: door state
 * TODO: break up into several files for each constructor
 * TODO: use classes
 * TODO: i18n
 */
"use strict";

let persons =[];
let firstPosition;

exports.getFirstPosition = function() {
    return firstPosition;
};

exports.getPersons = function(){
    return persons;
};

exports.getPerson = function(name){
    for (let person of persons) {
        if (person.name==name) { return (person); }
    }
    throw new Error("user \"" + name + "\" not found");
};

/**
 * places, where persons and things can be
 * @param {String} name
 * @param {String} color the CSS color of the place
 * @param {String} description the description of the room
 * @returns {Position}
 * @constructor
 */
exports.Position = function (name, color, description){
    if (!(this instanceof exports.Position)){
        return new Position(name, color, description);
    }
    this.name = name;
    this.color = color;
    this.description = "";
    if (description) {
        this.description = description;
    }

    this.persons = [];
    this.things = [];

    /**
     * @returns {Array} directions where doors are in this room
     */
    this.directions = function () {
        let d =[];
        for (let direction in this) {
            if ( direction.length==1 && /[nswe]/.test(direction) ) {
                d.push(direction);
            }
        }
        return d;
    };

    /**
     * send a message to everybody in this room
     * @param sender
     * @param messageText
     * @returns {exports.Message} a copy of what was sent to all
     */
    this.yell = function(sender, messageText) {
        const m = new exports.Message(sender.name, "all", messageText);
        for (let person of this.persons) {
            person.messages.push(m);
        }
        return m;
    };

    this.toJSON = function() {
        return {
            name: this.name,
            color: this.color,
            description: this.description,
            directions: this.directions(),
            persons: this.persons,
            things: this.things
        }
    };

    this.toJSONall = function(positionsSoFar) {
        positionsSoFar.push(this);
        const nextRooms=[];
        for (let d of ["n", "s", "w", "e"]) {
            if (d in this) {
                let room = this[d].getOtherRoomWOCheck(this);
                if (positionsSoFar.indexOf(room) == -1 ) {
                    nextRooms.push({
                        direction: d,
                        room: (room.toJSONall(positionsSoFar))
                    });
                }
            }
        }
        return {
            name: this.name,
            color: this.color,
            persons: this.persons,
            directions: this.directions(),
            nextRooms: nextRooms
        };
    }
};

/**
 * remove a thing from this.things defined by aThing.name and return it.
 * This can be added to all objects with an Array of Thing called this.thing
 * @param {exports.Thing} aThing
 * @returns {exports.Thing} the thing
 */
function giveThing(aThing) {
    for (let index in this.things) {
        if (this.things[index].name == aThing.name) {
            let theThing = this.things[index];
            this.things.splice(index,1);
            return theThing;
        }
    }
    throw new Error("no such thing");
}

exports.Position.prototype.giveThing = giveThing;

/**
 * get a reference to a thing at the position by its name.
 *
 * @param {string} thingName
 * @returns {exports.Thing}
 */
function getThing(thingName) {
    for (let theThing of this.things) {
        if (theThing.name == thingName) {
            return theThing;
        }
    }
    throw new Error("no such thing at position");
}
exports.Position.prototype.getThing = getThing;

/**
 * doors connection positions. It sets the references in the rooms to the doors.
 * according to exitDirectionRoom1
 * @TODO replace itsOpen etc. by state: alwaysOpen, open, closed, locked
 *
 * @param {exports.Position} room1
 * @param exitDirectionRoom1 {String} direction from room1 to room2. Permitted values: n, s, w, e
 * @param {exports.Position} room2
 * @param {boolean} [itsClosable] true, if the door is closable
 * @param {boolean} [itsOpen] true, if the door is open
 * @param {boolean} [itsLocked] true if the door is locked. Can be opened with on of theKeys
 * @param {Thing[]} [theKeys] a list of things, that can serve as key
 * @returns {exports.Door}
 * @constructor
 */
exports.Door = function(room1, exitDirectionRoom1, room2, itsClosable, itsOpen, itsLocked, theKeys) {
    if (!(this instanceof exports.Door)){
        return new exports.Door(room1, exitDirectionRoom1, room2, itsClosable, itsOpen, itsLocked, theKeys);
    }
    this.room1 = room1;
    this.room2 = room2;

    let closable = true;
    if ( arguments.length>3 ) {
        closable = itsClosable;
    }

    let open = true;
    if ( arguments.length>4 ) {
        if (!itsOpen && !closable) {
            throw new Error("a not closable door cannot be closed");
        }
        open = itsOpen;
    }

    let locked = false;
    let keys=[];
    if (arguments.length >6) {
        if (itsOpen && itsLocked) {
            throw new Error ("open door cannot be locked");
        }
        locked = itsLocked;
        keys = theKeys;
    }

    let oppositeExit = {
        "n" : "s",
        "s" : "n",
        "w" : "e",
        "e" : "w"
    };

    if (!(oppositeExit.hasOwnProperty(exitDirectionRoom1))) {
        throw new Error("Not existing direction");
    }
    room1[exitDirectionRoom1]=this;
    room2[oppositeExit[exitDirectionRoom1]]=this;

    this.isOpen =function() {
        return open;
    };
    this.open = function(key) {
        if (locked) {
            throw new Error("Door is locked");
        }
        if (open) {
            throw new Error("door already open");
        }
        open=true;
    };
    this.close = function() {
        if (!closable) {
            throw new Error("cannot close not closable door");
        }
        if (!open) {
            throw new Error("cannot close already closed door");
        }
        open = false;
    };

    this.isLocked = function() {
        return locked;
    };
    this.lock = function( key ) {
        if (open) {
            throw Error("cannot lock open door");
        }
        if (locked) {
            throw Error("door already locked");
        }
        for (let aKey of keys) {
            if (aKey.name == key.name) {
                locked = true;
                return;
            }
        }
        throw Error("wrong key");
    };

    this.unlock = function( key ) {
        if (!locked) {
            throw Error("door already unlocked");
        }
        for (let aKey of keys) {
            if (aKey.name == key.name) {
                locked = false;
                return;
            }
        }
        throw Error("wrong key");
    };

    this.getOtherRoom = function (room) {
        if (!open) {
            throw new Error("door is closed");
        }
        return this.getOtherRoomWOCheck(room);
    };

    this.getOtherRoomWOCheck = function(room) {
        switch (room) {
            case this.room1:
                return room2;
            case this.room2:
                return room1;
            default:
                throw new Error("wrong room for this door given");
        }
    };

    this.toJSON = function() {
        return {
            "closable": closable,
            "open": open,
            "locked" : locked
        }
    };
};

exports.Person = function (name, position) {
    if (!(this instanceof exports.Person)){
        return new exports.Person(name);
    }
    this.name = name;
    this.maximLoad = 5;
    this.maximumThings = 5;
    this.position = position;
    position.persons.push(this);
    this.things=[];
    this.messages=[];

    this.load = function() {
        let sum = 0;
        for (let t of this.things) {
            sum += t.load;
        }
        return sum;
    };

    this.go = function(direction){
        if (!(this.position[direction])) {
            throw new Error("direction " + direction + " not possible");
        }
        let nextDoor = this.position[direction];
        this.position.persons = this.position.persons.filter(p => p !== this);
        this.position = nextDoor.getOtherRoom(this.position);
        this.position.persons.push(this);
    };

    /**
     *
     * @param {string} aThingName
     * @returns {exports.Thing|*}
     */
    this.take = function(aThingName) {
        if ( this.things.length >= 5 ) {
            throw new Error("My knapsack is full");
        }
        let aThing = this.position.getThing(aThingName);
        if (this.load() + aThing.load > this.maximLoad) {
            throw new Error ("cannot carry more");
        }
        let thing = this.position.giveThing(aThing);
        this.things.push(thing);
        return thing;
    };

    this.drop = function(aThing){
        let thing = this.giveThing(aThing);
        this.position.things.push(thing);
        return thing;
    };

    this.hasThing = function(thing) {
        for (let aThing of this.things){
            if (thing.name == aThing.name) {
                return true;
            }
        }
        return false;
    };

    this.toJSON = function() {
        return {
            name: this.name
        };
    }
};
exports.Person.prototype.giveThing = giveThing;

exports.Thing = function(name, load) {
    this.name = name;
    this.load = 1;
    if (load) {
        this.load = load;
    }
    this.toJSON = function() {
        return {
            name: this.name,
        };
    }
};

exports.Message = function(sender, recipient, messageText) {
    this.date = new Date();
    this.sender = sender;
    this.recipient = recipient;
    this.text = messageText;
};

/**
 * creates the gamefield with all players. This will change significantly in the final version.
 * Do not rely on its actual version.
 * @param users which should be added as players
 */
exports.createModel = function(users) {
    if (persons.length != 0) { //construct only once
        return;
    }
    const garten1 = new exports.Position("Garten", "LawnGreen", "Ein schöner Garten. Vor Ihnen steht ein prächtiges Haus.");
    const garten2 = new exports.Position("Garten mit Sträuchern", "ForestGreen", "Ein schöner Garten mit Sträuchern");
    const vorraum = new exports.Position("Einfacher Raum", "LightGrey", "Ein karger Raum");
    const schatzkammer = new exports.Position("Schatzkammer", "Gold", "Schätze ohne Ende. Wir sind reich!");
    const thronraum = new exports.Position("Thronraum", "Purple", "Ein prächtig ausgestatter Raum mit einem großen Thron");
    const thronraum2 = new exports.Position("Thronraum", "Purple", "Ein prächtig ausgestatter Raum mit einem großen Thron");

    firstPosition = garten1;

    const key = new exports.Thing("Schlüssel");

    new exports.Door(garten2, "e",garten1, false);
    new exports.Door(garten1, "n", vorraum);
    new exports.Door(vorraum, "e", schatzkammer, true, false, true, [key]);
    new exports.Door(vorraum, "n", thronraum);

/*
    new exports.Door(thronraum2, "n", thronraum2);
    new exports.Door(thronraum2, "e", thronraum2);
    new exports.Door(thronraum2, "s", thronraum2);
    new exports.Door(thronraum2, "w", thronraum2);
*/

    garten1.things.push(new exports.Thing("Blume"));
    vorraum.things.push(key);
    schatzkammer.things.push(new exports.Thing("Ring"));
    schatzkammer.things.push(new exports.Thing("Krone"));

    for (let user of users) {
        persons.push(new exports.Person(user.name, garten1));
    }
};
