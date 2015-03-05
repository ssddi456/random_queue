# random_queue
a simple onduty queue

可作为独立web服务使用，也可作为一个web组件使用。
作为独立服务启动时，默认启动在 3009 端口 可通过指定环境变量 PORT 修改 ： PORT=your_port npm start

可先行指定下一个值班人员。
下一个值班人员如果不提前选出，将会随机抽出。
完整数据使用接口读出 '/full_data'。

notice ：
数据以文件形式储存，不支持并发操作。
