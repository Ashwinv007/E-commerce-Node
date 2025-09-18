var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs=require('express-handlebars');
var session = require('express-session');
var Handlebars=require('handlebars');
const passport=require('./config/passport');
Handlebars.registerHelper("inc", function(value, options){
  return parseInt(value) + 1;
})

Handlebars.registerHelper("renderStars",function(ratingValue){
  let rating=parseInt(ratingValue,10);
  let stars='';

  for(let i=1;i<=5;i++){
    stars +=(i<=rating) ? '★' : '☆';
  }
  return stars
})

Handlebars.registerHelper('setIndex',function(value,options){
  return value[0].username
})

Handlebars.registerHelper('getStringDate',function(value){
  return value.toDateString()
})


// Handlebars.registerHelper('seperate',function(value){
  
// })

Handlebars.registerHelper('getEmail',function(value){
  console.log('helllllllllllllllllllllllllllllllllo')
  console.log(value[0])
  return value[0].email
})

Handlebars.registerHelper('getIndex',function(value){
  return value[1]
})

Handlebars.registerHelper('fileIndex',function(){
  return 0;
})
Handlebars.registerHelper('getOrder',function(value){
  console.log('testiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii;ng')
  console.log(value)
 
  console.log(value.productName)
  return value.product[0].productName
})




var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');


var app = express();
var fileUpload = require('express-fileupload')
var db = require('./config/connection')
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname + '/views/layout/',partialsDir:__dirname + '/views/partials/'}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({
  secret: 'Key',
  cookie: {maxAge: 600000}
}))
db.connect((err)=>{
  if (err)console.log('Error connecting to database' + err)
  else console.log('Connected to database')

})

app.use(passport.initialize());
app.use(passport.session());
app.use('/', usersRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;