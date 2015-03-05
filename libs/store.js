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
    
    queue.running = store.running;
    queue.running_queue = store.running_queue;
    
    queue.current_item = queue.get_item_from_running_queue_with_id(store.current_item.id);
    queue.chosen_next_item = store.chosen_next_item 
      && queue.get_item_from_running_queue_with_id(store.chosen_next_item.id);

    queue.next_check_point = store.next_check_point;
    queue.duty_peers = store.duty_peers;
 
    debug( queue );
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
    if(running_queue.running){
      running_queue.loop();
    }
  },
  get_data : function() {
    return JSON.parse(fs.readFileSync(store_file));
  }
};