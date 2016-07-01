'use strict';
let router = require('koa-router')();
let uuid = require('node-uuid');
let jwt = require('jsonwebtoken');
let config = require('./config');
let jwtMiddleware = require('koa-jwt')({ secret: config.jwt_secret });
let fs = require('fs');
let path = __dirname + '/articles/';
let assert = require('assert');

//
function findPost(id) {  
  return posts.find((post) => {
    return post._id == id;
  });
}


let  monk = require('monk');
let wrap = require('co-monk');
let db = monk(process.env.MONGODB_URI || 'mongodb://localhost/my-courses');
let articles = wrap(db.get('articles'));
let users = wrap(db.get('users'));
let categories = wrap(db.get('categories'));
let ObjectId = require('mongodb').ObjectId; 


router.get('/categories', function*() { 
  var res = yield categories.find({});
  this.body = res;
});


router.get('/posts', function*() {  
  var res = yield articles.find({});
  //articles.findAndModify({ _id: res[0]._id }, { $set: {text:getArticle('article_1.html')} }); 
  this.body = res;
});

router.get('/posts/:tag', function*() {  
  var res = yield articles.find({"tags": this.params.tag}, {sort: {order: 1}});
  this.body = res;
});

router.get('/article/:id', function*() {
  
  var res = yield articles.findOne({_id: ObjectId(this.params.id)});
  res.tags = res.tags.join(',');
  this.body = res;
});

router.get('/post/:name', function*() {
  var res = yield articles.findOne({name: this.params.name.replace(/\-/g,' ').replace(/\*/g,'-')});
  this.body = res;
});

router.post('/post/:id', jwtMiddleware, function*() {
  /*let foundPost = findPost(this.params.id);

  if (foundPost) {
    Object.assign(foundPost, this.request.body);
    this.body = foundPost;
  }
  else {
    this.throw(404);
  }*/
  this.request.body.tags = this.request.body.tags.split(',');
  var res = yield articles.update({ _id: ObjectId(this.params.id) }, this.request.body); 
  this.body = res;
});


router.post('/post', jwtMiddleware, function*() {
  let newDoc = {
    name:this.request.body.name,
    tags:this.request.body.tags.split(','),
    text:this.request.body.text,
    description:this.request.body.description
  };
  var res = yield articles.insert(newDoc);
  Object.assign(newDoc, res);  
  this.body = newDoc;
});

router.post('/login', function*() {
  let email = this.request.body.email;
  let password = this.request.body.password;

  let result = {success: false};
  let res = yield users.find({email:email, password:password});
  console.log(res.length)
  if (res.length) {
    result.success = true;
    result.auth_token = jwt.sign({ email: email }, config.jwt_secret);
  }

  this.body = result;
});

module.exports = router;