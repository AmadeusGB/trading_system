#资金托管功能

基于资金托管合约，更新电商合约，前端界面操作。

## 1.启动服务

终端1#，启动以太坊节点：

```
~$ ganache-cli
```

终端2#，启动`ipfs`节点监听程序：

```
~$ ipfs daemon
```


## 2.构建应用

在终端4#构建应用。

进入`sprint`目录：

```
~$ cd ~/repo/sprint
```

编译合约：

```
~/repo/sprint$ truffle compile
```

部署合约：

```
~/repo/sprint$ truffle migrate --reset
```

## 3.运行应用

在终端4#运行应用。

向链上添加一些模拟商品数据：

```
~/repo/sprint$ truffle exec seed.js
```

启动开发服务器：

```
~/repo/sprint$ npm run dev
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