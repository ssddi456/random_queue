# random_queue
a simple onduty queue

可作为独立web服务使用，也可作为一个web组件使用。
将代码下载到本地之后，```npm install```安装依赖。
作为独立服务启动时，默认启动在 3009 端口 可通过指定环境变量 PORT 修改 ： PORT=your_port npm start

可先行指定下一个值班人员。
下一个值班人员如果不提前选出，将会随机抽出。

自动更新时间固定为每周五。
完整数据使用接口读出 ```GET /full_data```，格式为json，
```js
{
  running : Boolean,
  base_queue : [],
  running_queue : [],
  
  current_item : String,
  chosen_next_item : String,

  next_check_point : Date,
  duty_peers : []
}
```

获取当前值班人员为```GET /get_on_duty```, 格式为json,
```js
{
  item: {
          value     : '名字',
          id        : 'item_xxxxx',
          duty_stat : 'on_duty'
        }
}
```

notice ：
数据以文件形式储存，不支持并发操作。