var fs = require('fs');
var path = require('path');
var store_file = path.join(__dirname,'queue.json');
var random_queue = require('./random_queue');
var debug = require('debug')('random_queue:store');
module.exports = {
  save : function( queue ){
    fs.writeFileSync(store_file, JSON.stringify( queue ));
  },
  load : function( queue ){
    var store = JSON.parse(fs.readFileSync( store_file ));

    queue.base_queue = store.base_queue;
    queue.running_queue = store.running_queue;
    queue.current_item = store.current_item;
    queue.check_point = store.check_point;
    queue.chosen_next_item = store.chosen_next_item.val;
    queue.duty_peers = store.duty_peers;

    console.log( queue );
  },
  init : function() {
    var running_queue = new random_queue();
    this.queue = running_queue;
    try{
      this.load( running_queue );
    } catch(e){
      debug('load error', e );
      return;
    }
    running_queue.run();
  }
};