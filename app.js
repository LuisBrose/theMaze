const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const basicAuth = require('basic-auth-connect');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('./swagger.json');

const indexRouter = require('./routes/index');
const personRouter = require('./routes/person');
const positionRouter = require('./routes/position');
const doorRouter = require('./routes/door');

const model = require('./model');
class User {
    constructor(name, passwd) {
        this.name = name;
        /* eindeutige ID*/
        this.passwd = passwd;
    }
}
const localUsers = [ new User("Max", "maxi"), new User("Moritz", "moritzi"), new User("Lempel", "lempeli")] ;
model.createModel(localUsers);

const app = express();
/**
 * aktiviere einfache Authentifizierung
 */
app.use(basicAuth(function (user, pass) {
    // Authentifizierung OK, wenn daten zu einem Nutzer passen
    for (let localUser of localUsers) {
        if (user == localUser.name && pass == localUser.passwd) {
            return true;
        }
    }
    return false;
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/person', personRouter);
app.use('/api/position', positionRouter);
app.use('/api/door', doorRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = app;

