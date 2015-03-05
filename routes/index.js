var express = require('express');
var router = express.Router();

var store = require('../libs/store');
store.init();

/* GET home page. */
function save_then_go_index( req, res ) {
  store.save( store.queue );
  res.redirect('/');
}
router
  .get('/', function(req, res, next) {
    res.render('index', {
      queue       : store.queue,
      date_format : function( ms ) {
        console.log( ms );
        var d = new Date(ms);
        return (d.getMonth()+1) + '月' 
              + d.getDate() + '日' 
              + d.getHours() + '时';
      }
    });
  })
  .get('/full_data',function( req, res) {
    res.json(store.get_data());
  })
  .post('/run',function( req, res, next ) {
    if( !store.queue.running ){
      store.queue.run();      
    }
    next();
  },save_then_go_index)
  .post('/pause',function( req, res, next ) {
    if( store.queue.running ){
      store.queue.end();      
    }
    next();
  },save_then_go_index)
  .post('/add_base',function( req, res, next ) {
    store.queue.add_to_base(req.body.val);
    next();
  },save_then_go_index)
  .post('/add_current',function( req, res, next ) {
    store.queue.add_to_queue(req.body.val);
    next();
  },save_then_go_index)
  .post('/remove_running_item',function( req, res, next ) {
    store.queue.remove_from_running_queue_with_id(req.body.id);
    next();
  },save_then_go_index)
  .post('/remove_base_item',function( req, res, next ) {
    store.queue.remove_from_base_queue_with_id(req.body.id);
    next();
  },save_then_go_index)
  .post('/set_next',function( req, res, next ) {
    store.queue.choose_next(req.body.id);
    next();
  },save_then_go_index)
  .post('/cancel_next',function( req, res, next ) {
    store.queue.cancel_next(req.body.id);
    next();
  },save_then_go_index)
  .post('/set_stat',function( req, res, next ) {
    store.queue.change_item_state(req.body.id, req.body.stat);
    next();
  },save_then_go_index);

module.exports = router;
