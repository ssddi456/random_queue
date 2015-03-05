//
// 一个值班队列
// 每个值班周期的人员随机抽出
// 一个值班周期循环完成前人员不会主动出现重复
// 单个值班周期的人员可以随时增补
// 单个值班周期的人员可以被动替换调整
// 

var debug = require('debug')('random_queue:random_queue');
var util = require('util');
var _ = require('underscore');

function unid ( prefix ) {
  return prefix + '_'
        + (Date.now() + '').slice(-6) + '_'
        + (Math.random() + '').slice(-6);
}

function next_friday ( day ) {
  var d       = new Date( day );
  var weekday = d.getDay();
  var delta   = 5 - weekday;
  delta = delta <= 0 ? 7 + delta : delta;

  return new Date( d.getTime() + delta * 24 * 3600 * 1e3 );
}

function duty () {
  this.start = '';
  this.end   = '';
  this.value = '';
  this.id = unid('duty_');
}

function random_queue_item( val) {
  this.value = val;
  this.id = unid('item_');
  // 
  // waiting
  // on_duty
  // end
  // 
  this.duty_stat = 'waiting';
}

function random_queue () {
  this.base_queue = [];
  this.running_queue = [];

  this.current_item = undefined;

  this.next_check_point = undefined;
  this.chosen_next_item = undefined;

  this.running = false;
  this.after_loop = function(){};
  this.duty_peers = [];
}

function random_item ( arr ) {
  var len = arr.length;
  var idx = Math.floor(Math.random() * arr.length);
  debug('random ', 'len : ', len, 'idx : ', idx );
  return arr[ idx ];
}

util._extend(random_queue.prototype,{
  run : function() {
    if( this.running ){
      return;
    }
    if( !this.base_queue.length ){
      return;
    }
    this.running = true;
    if( !this.running_queue.length 
      || this.is_end ()
    ){
      this.build_runnging_queue();
    }
    this.loop();
  },
  build_runnging_queue : function() {
    var r_q = this.running_queue;
    r_q.length = 0;
    this.base_queue.forEach(function( item ) {
      r_q.push( new random_queue_item(item.value));
    });
  },
  is_end : function() {
    return this.running_queue.every(function( item ) {
      return item.duty_stat == 'end';
    });
  },
  start_duty : function( item ) {
    if( this.current_item 
      && this.current_item.id != this.current_item.id
    ){
      this.end_duty();
    }
    this.current_item = item;
    item.duty_stat = 'on_duty';
    var new_duty = new duty();
    new_duty.value = item.value;
    new_duty.start = Date.now();
    this.duty_peers.push( new_duty );
  },
  end_duty : function() {
    debug('end_duty');
    if( !this.current_item ){
      debug('no current_item, can not end_duty');
      return;
    }
    var c_item = this.current_item;
    debug( this.current_item == this.get_item_from_running_queue_with_id(this.current_item.id));
    c_item.duty_stat = 'end';
    var last_duty = this.duty_peers.slice(-1)[0];
    debug( c_item );
    last_duty.end = Date.now();
    this.current_item = undefined;
    if( last_duty.value != c_item.value ){
      debug(
        'end_duty', 
        last_duty.value, c_item.value,
        'mismatch' );
    }
  },
  loop : function (){
    if( Date.now() < this.get_check_point() ){
      debug(' current duty havnt end');
    } else {
      debug('end current duty');
      this.end_duty();
    }

    var next_item;
    if( this.current_item ){

    } else if ( this.chosen_next_item ){

      next_item = this.chosen_next_item;
      this.chosen_next_item = undefined;

    } else {
      var waiting_items = this.running_queue
                            .filter(function( item ) {
                              return item.duty_stat == 'waiting';
                            });
      if( !waiting_items.length ){
        debug('no waiting_items !!!', this.running_queue );
        this.build_runnging_queue();
        next_item = random_item( this.running_queue );
      } else {
        next_item = random_item( waiting_items );
      }
    }

    if( next_item ){
      debug('new duty session');
      this.start_duty(next_item);
    }
    var delta = this.get_check_point() - Date.now();
    debug( 'will update on delta : ', delta / 36e5, ' hour' );
    this.after_loop && this.after_loop();
    this.timer = setTimeout( this.loop.bind(this), delta );
  },
  end : function() {
    if( this.running ){
      clearTimeout( this.timer );
      this.end_duty();
      this.running = false;
    }
  },
  close: function() {
    this.end();
    this.running_queue.length = 0;
    this.current_item =
    this.chosen_next_item = 
    this.next_check_point = undefined;
  },
  get_check_point :function() {

    var now = new Date();
    var next_check_point;

    var a_p;
    var b_p;

    var cp = new Date( this.next_check_point );

    if( this.next_check_point ){
      if ( cp < now.getTime() ){
        next_check_point = Math.max(
                            next_friday( now ).getTime(),
                            next_friday( cp ).getTime());
      } else{
        next_check_point = cp;
      }
    } else {
      next_check_point = next_friday( now ).getTime();
    }

    return (this.next_check_point = next_check_point);
  },
  get_item_from_base_queue_with_id : function(id) {
    return _.find( this.base_queue, function( item ) {
      return item.id == id
    })  
  },
  get_item_from_running_queue_with_id : function(id) {
    return _.find( this.running_queue, function( item ) {
      return item.id == id
    })  
  },
  add_to_queue: function( val ) {
    var item = new random_queue_item(val);
    this.running_queue.push(item);
    return item;
  },
  add_to_base: function( val ) {
    this.base_queue.push(new random_queue_item(val));
  },
  remove_from_base_queue_with_id: function(id) {
    var idx;
    _.find(this.base_queue,function( item, _idx ) {
      return item.id == id && (idx = _idx);
    });
    this.base_queue.splice(idx,1);
  },
  remove_from_running_queue_with_id: function( id ) {
    var idx;
    if( this.current_item && id == this.current_item.id ){
      return;
    }
    _.find(this.running_queue,function( item, _idx ) {
      return item.id == id && (idx = _idx);
    });
    this.running_queue.splice(idx,1);
    if( this.chosen_next_item && this.chosen_next_item.id == id ){
      this.chosen_next_item = undefined;
    }
  },
  change_item_state : function( id, stat ) {
    var item= this.get_item_from_running_queue_with_id(id);
    if( item ){
      if( item.duty_stat == 'on_duty' && stat == 'end' ){
        debug('is current_item', 1,item == this.current_item );
        debug('change_item_state', 'end duty');
        var running = this.running;
        if( this.running ){
          this.end();
          this.run();
        }
        debug('pre item stat', item.duty_stat);
        debug('is current_item', 2,item == this.current_item);
      }
      if( item.duty_stat == 'waiting' && stat == 'on_duty' ){
        var t = this.chosen_next_item;
        if( this.current_item ){
          this.end_duty();
          this.start_duty(item);
        }
        if( t && t.id != item.id ){
          this.chosen_next_item = t;
        } else{
          this.chosen_next_item = undefined;
        }
      }
      return item;
    }
  },
  choose_next: function( id ) {
    var chosen_next_item = this.get_item_from_running_queue_with_id(id);
    if( !chosen_next_item ){
      throw new Error( 'item not found with id : '+id);
    }
    if( chosen_next_item.duty_stat != 'waiting' ){
      chosen_next_item = this.add_to_queue( chosen_next_item.value );
    }

    this.chosen_next_item = chosen_next_item;
  },
  cancel_next:function(id) {
    if( this.chosen_next_item && this.chosen_next_item.id == id ){
      this.chosen_next_item = undefined;
    }
  },
  stat_text : function( stat ) {
    return {
      'end'     : '完成',
      'on_duty' : '值班中',
      'waiting' : '等待'
    }[stat];
  },
  toJSON : function() {
    return{
      running          : this.running,
      base_queue       : this.base_queue,
      running_queue    : this.running_queue,
      current_item     : this.current_item && this.current_item.id,
      next_check_point : this.next_check_point,
      chosen_next_item : this.chosen_next_item && this.chosen_next_item.id,
      duty_peers       : this.duty_peers
    }
  }
});

module.exports = random_queue;
module.exports.duty = duty;
module.exports.random_queue_item = random_queue_item;
