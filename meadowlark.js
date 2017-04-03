var express = require('express');
var app = express();

app.set('port', process.env.PORT || 3000);
app.set('ip', process.env.IP || 'localhost');
app.disable('x-powered-by');


//Requires
var bodyParser = require('body-parser'),
    formidable = require('formidable');

// Custom scripts
var fortune = require('./lib/fortune.js'),
    dayOfWeek = require('./lib/dayOfWeek.js'),
    copyrightYear = require('./lib/copyrightYear.js'),
    getWeatherData = require('./lib/getWeatherData.js'),
    credentials = require('./credentials.js');


// set up handlebars view engine
var handlebars = require('express-handlebars').create({
    defaultLayout: 'main',
    helpers: {
        copyrightYear: copyrightYear.getCurYear(),
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');






// Startup
app.use(express.static(__dirname + '/public'));

app.use(require('body-parser').urlencoded({ extended: true }));

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret
}))

app.use(function(req, res, next){
    // if there's a flash message, transfer
    // it to the context, then clear it
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
})

app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' &&
        req.query.test === '1';
    next();
});


app.use(function(req, res, next){
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = getWeatherData.getWeatherData();
    next();
})


// Global Variables

var date = new Date();


// ##Routes
app.get('/', function (req, res) {

    res.cookie('monster', 'nom nom');
    res.cookie('signed_monster', 'nom nom', {signed: true});

    res.render('home', {
        dayOfWeek: dayOfWeek.getDayOfWeek()
    });
});


app.get('/home', function (req, res) {
    res.render('home', {
        dayOfWeek: dayOfWeek.getDayOfWeek()
    });
});


app.get('/about', function (req, res) {

    var monster = req.cookies.monster;
    var signedMonster = req.signedCookies.signed_monster;

    console.log('Monster: ' + monster);
    console.log('SignedMonster: ' + signedMonster);

    res.render('about', {
        fortune: fortune.getFortune(),
        pageTestScript: '/qa/tests-about.js'
    });
});



app.get('/tours/hood-river', function (req, res) {
    res.render('tours/hood-river');
});


app.get('/tours/oregon-coast', function (req, res) {
    res.render('tours/oregon-coast');
});


app.get('/tours/request-group-rate', function (req, res) {
    res.render('tours/request-group-rate');
});


app.get('/tours/tours-info', function (req, res) {
    res.render('tours/tours-info', {
        currency: {
            name: 'Canadian dollars',
            abbrev: 'CDN'
        },
        tours: [
            {
                name: 'Hood River',
                price: '$99.95'
            },
            {
                name: 'Oregon Coast',
                price: '$159.95'
            }
        ],
        specialsUrl: '/january-specials',
        currencies: ['USD', 'CDN', 'BTC']
    });
});


app.get('/january-specials', function(req, res){
    res.render('tours/january-specials');
});


app.post('/process-contact', function(req, res){

    var conName = req.body.name;
    var curTime = date.toString();

    console.log('Recieved contact from '+ req.body.name + ' <' + req.body.email + '> ' + curTime);

    // save to database...

    //res.redirect(303, '/thank-you');  //old code
    res.status(303);
    res.render('thank-you', {
        timeStamp: curTime,
        contactName: conName
    });
});


app.get('/thank-you', function (req, res){
    res.render('thank-you');
});


app.get('/nursery-rhyme', function(req, res){
    res.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function(req, res){
    res.json({
        animal: 'squirrel',
        bodyPart: 'tail',
        adjective: 'bushy',
        noun: 'heck'
    });
});

app.get('/newsletter', function(req, res){
    // we will learn about CSRF later...for now, we just
    // provide a dummy value
    res.render('newsletter', { csrf: 'CSRF token goes here' });
});

app.get('/newsletter/archive', function(req, res){
    res.render('newsletter/archive');
});


function NewsletterSignup() {};
NewsletterSignup.prototype.save = function (cb) {
    cb();
};


var VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
'[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
'(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$');


app.post('/newsletter', function(req, res){

    var name = req.body.name || '', email = req.body.email || '';
    //input validation
    if(!email.match(VALID_EMAIL_REGEX)) {
        if(req.xhr) return res.json({ error: 'Invalid name email address.'});
        req.session.flash = {
            type: 'danger',
            intro: 'Validation error!',
            message: 'The email address you entered was not valid.'
        };
        return res.redirect(303, '/newsletter/archive');
    }
    new NewsletterSignup({name: name, email: email}).save(function(err){
        if(err) {
            if(req.xhr) return res.json({ error: 'Database error.'});
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.'
            };
            return res.redirect(303, '/newsletter/archive');
        }
        if(req.xhr) return res.json({ success: true});
        req.session.flash = {
            type: 'success',
            intro: 'Thank you!',
            message: 'You have now been signed up for the newsletter.'
        };
        return res.redirect(303, '/newsletter/archive');
    });
});


app.post('/process', function(req, res){
    var conName = req.body.name;
    var curTime = date.toString();

    if(req.xhr || req.accepts('json,html')==='json'){
        // if there were an error, we would send { error: 'error description' }
        res.send({ success: true });
    } else {
        // if there were an error, we would redirect to an error page
        console.log('Form (from querystring): ' + req.query.form);
        console.log('CSRF token (from hidden form field): ' + req.body._csrf);
        console.log('Name (from visible form field): ' + req.body.name);
        console.log('Email (from visible form field): ' + req.body.email);
        res.status(303);
        res.render('thank-you', {
            timeStamp: curTime,
            contactName: conName
        });
    }
});


app.get('/contest/vacation-photo',function(req,res){
    var now = new Date();
    res.render('contest/vacation-photo',{
        year: now.getFullYear(),month: now.getMonth()
    });
});


app.post('/contest/vacation-photo/:year/:month', function(req, res){

    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files){
        var conName = fields.name;
        var curTime = date.toString();

        if(err) return res.redirect(303, '/error');
        console.log('received fields:');
        console.log(fields);
        console.log('received files:');
        console.log(files);
        res.status(303);
        res.render('thank-you', {
            timeStamp: curTime,
            contactName: conName
        });
    });
});


// Test pages
// Health check for Openshift
app.get('/health', function (req, res) {
    res.status(200);
    res.render('health', {
        layout: 'newpage'
    });
});


// Display header info
app.get('/headers', function (req, res) {
    res.set('Content-Type', 'text/plain');
    var s = '';
    for (var name in req.headers) {
        s += name + ': ' + req.headers[name] + '\n';
    };
    res.send(s);
});


// jQuery test page
app.get('/jquery-test', function (req, res){
    res.render('jquery-test');
})



// Custom 404 page
app.use(function (req, res) {
    res.status(404);
    res.render('404', {
        layout: 'error'
    });
});


// Custom 500 page
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});


app.listen(app.get('port'), app.get('ip'), function () {
    console.log('Express started on http://' + app.get('ip') + ':' + app.get('port') + '; press Ctrl-C to terminate.');
});
