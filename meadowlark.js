var express = require('express');
var app = express();

app.set('port', process.env.PORT || 3000);
app.set('ip', process.env.IP || 'localhost');
app.disable('x-powered-by');


//Requires
var bodyParser = require('body-parser');

// Custom scripts
var fortune = require('./lib/fortune.js');
var dayOfWeek = require('./lib/dayOfWeek.js');
var copyrightYear = require('./lib/copyrightYear.js');
var getWeatherData = require('./lib/getWeatherData.js');


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


// Global Variables
var urlEncodedParser = bodyParser.urlencoded({ extended: false });

var date = new Date();



// Startup
app.use(express.static(__dirname + '/public'));


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




// ##Routes
app.get('/', function (req, res) {
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


app.post('/process-contact', urlEncodedParser, function(req, res){

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
})


app.get('/thank-you', function (req, res){
    res.render('thank-you');
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
    res.render('404');
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
