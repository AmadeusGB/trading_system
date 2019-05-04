# sprint-5：商品详情页

展示商品详细信息，提供竞价和揭示出价的操作界面。

## 1.启动服务

终端1#，启动以太坊节点：

```
~$ ganache-cli
```

终端2#，启动`ipfs`节点监听程序：

```
~$ ipfs daemon
```

如果`ipfs`节点还未初始化，请参考结尾部分的”初始化ipfs“。

## 2.构建应用

在终端4#构建应用。

进入`sprint-5`目录：

```
~$ cd ~/repo/sprint-5
```

编译合约：

```
~/repo/sprint-5$ truffle compile
```

部署合约：

```
~/repo/sprint-5$ truffle migrate --reset
```

如果重新启动了节点仿真器，也可以不加`--reset`选项。

## 3.运行应用

在终端4#运行应用。

向链上添加一些模拟商品数据：

```
~/repo/sprint-5$ truffle exec seed.js
```

启动开发服务器：

```
~/repo/sprint-5$ npm run dev
```

在练习环境中刷新嵌入浏览器，查看网页效果。点击商品进入详情页，或者修改
嵌入浏览器的地址栏，例如：

```
http://8080.5208b19150ceaf44c4ea59e0f43c6fed.x.hubwiz.com/product.html?id=1
```

## 附：初始化ipfs

初始化本地仓库：

```
~$ ipfs init
```

配置`CORS`以便允许跨域AJAX调用：

```
~$ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
```

配置`API`允许外部访问：
```
~$ ipfs config --json Addresses.API '"/ip4/0.0.0.0/tcp/5001"'
```

配置`HTTP`网关允许外部访问，并将监听端口修改为`5000`：

```
~$ ipfs config --json Addresses.Gateway '"/ip4/0.0.0.0/tcp/5000"'
```