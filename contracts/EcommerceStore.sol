pragma solidity ^0.4.13;

import "contracts/Escrow.sol";

contract EcommerceStore {
  enum ProductStatus { Open, Sold, Unsold }
  enum ProductCondition { New, Used }

  struct Bid {
    address bidder;                                           //竞拍者
    uint productId;                                           //商品ID
    uint value;                                               //出价
    bool revealed;                                            //参与拍卖状态
  }
  
  struct Product {
    uint id;                                                  //商品唯一ID
    string name;                                              //商品名称
    string category;                                          //商品分类
    string imageLink;                                         //图片链接
    string descLink;                                          //图片说明链接
    uint auctionStartTime;                                    //拍卖起始时间
    uint auctionEndTime;                                      //拍卖结束时间
    uint startPrice;                                          //起始价格
    address highestBidder;                                    //最高出价者地址
    uint highestBid;                                          //最高出家
    uint secondHighestBid;                                    //次高出价者地址
    uint totalBids;                                           //参与总人数
    ProductStatus status;                                     //商品拍卖状态（开放、已卖出、未卖出）
    ProductCondition condition;                               //商品属性（全新、二手）
    mapping (address => mapping (bytes32 => Bid)) bids;       //加盐竞拍价格
  }  
  
  mapping (address => mapping(uint => Product)) stores;       //每个拍卖人（创建人）对应的商品ID所对应商品详情
  mapping (uint => address) productIdInStore;                 //存储创建者
  uint public productIndex;                                   //商品内部唯一ID
  mapping (uint => address) productEscrow;                    //每件拍卖商品ID托管资金合约地址

  function EcommerceStore() public {                          //构造函数，初始化商品ID=0
    productIndex = 0;
  }

  function addProductToStore(string _name, string _category, string _imageLink, 
    string _descLink, uint _auctionStartTime,
    uint _auctionEndTime, uint _startPrice, uint _productCondition) public {
    require (_auctionStartTime < _auctionEndTime);            //拍卖起始时间必须大于结束时间，否则revert
    productIndex += 1;
    Product memory product = Product(productIndex, _name, _category, _imageLink, _descLink, _auctionStartTime, _auctionEndTime,
                     _startPrice, 0, 0, 0, 0, ProductStatus.Open, ProductCondition(_productCondition));   //构造struct Product的product，暂存内存中

    stores[msg.sender][productIndex] = product;               //将product存在于拍卖人对应的商品ID所对应商品详情结构中
    productIdInStore[productIndex] = msg.sender;              //存储某商品ID对应的拍卖人
  }  
  
  function getProduct(uint _productId) view public returns (uint, string, string, string, string, uint, uint, uint, ProductStatus, ProductCondition) {
    Product memory product = stores[productIdInStore[_productId]][_productId];              //取出某商品ID对应拍卖人所对应的商品详情
    return (product.id, product.name, product.category, product.imageLink, product.descLink, product.auctionStartTime,
        product.auctionEndTime, product.startPrice, product.status, product.condition);     //取出商品详情中各变量的返回值
  }   
  
  function bid(uint _productId, bytes32 _bid) payable public returns (bool) {
    Product storage product = stores[productIdInStore[_productId]][_productId];         //取出某商品ID对应拍卖人所对应的商品详情
    require (now >= product.auctionStartTime);                                          //当前时间需大于等于拍卖开始时间
    require (now <= product.auctionEndTime);                                            //当前时间需小于等于拍卖结束时间
    require (msg.value > product.startPrice);                                           //举牌价格需大于起始价格
    require (product.bids[msg.sender][_bid].bidder == 0);                               //该竞拍者没有重复竞拍

    product.bids[msg.sender][_bid] = Bid(msg.sender, _productId, msg.value, false);     //存储拍卖商品中当前举牌人的举牌信息（举牌人地址、商品ID、举牌价格、中标情况），这是加盐后的byte32，即盲拍，其他人看不到竞拍价格
    product.totalBids += 1;                                                             //举牌人+1
    return true;
  }  

  function stringToUint(string s) pure private returns (uint) {                         //string转uint类型
    bytes memory b = bytes(s);                                                          
    uint result = 0;

    for (uint i = 0; i < b.length; i++) {
      if (b[i] >= 48 && b[i] <= 57) {
        result = result * 10 + (uint(b[i]) - 48);
      }
    }
    return result;
  }  
  
  function revealBid(uint _productId, string _amount, string _secret) public {      //竞拍时间结束，处理竞拍信息，决定中标人
    Product storage product = stores[productIdInStore[_productId]][_productId];
    require (now > product.auctionEndTime);                         //当前时间需大于结束时间
    bytes32 sealedBid = sha3(_amount, _secret);                     //对竞拍价格（amount）加一个秘密数字，再做sha3（加盐），即解锁和确认竞拍人
    Bid memory bidInfo = product.bids[msg.sender][sealedBid];       //存储加盐后的竞拍价格

    require (bidInfo.bidder > 0);                                   //竞拍者存在
    require (bidInfo.revealed == false);                            //未参与拍卖状态

    uint refund;
    uint amount = stringToUint(_amount);

    if(bidInfo.value < amount) {                                    //竞拍价格需高于出价，否则不成立。用户押金要高于其竞拍价格
      refund = bidInfo.value;                                       //将竞拍价格赋值给refund
    } else {
      if (address(product.highestBidder) == 0) {                    //若暂无最高出价者
        product.highestBidder = msg.sender;                         //存储最高出价者地址
        product.highestBid = amount;                                //存储最高出价
        product.secondHighestBid = product.startPrice;              //存储次高出价为起始价格
        refund = bidInfo.value - amount;                            //refund = 用户出价-其用户的拍卖竞价，因为用户仅愿意支付amount
      } else {
        if (amount > product.highestBid) {                          //用户竞价高于当前最高的出价者出价
          product.secondHighestBid = product.highestBid;            //将最高出价者地址赋值给次高出价者地址，使其成为次高出价者
          product.highestBidder.transfer(product.highestBid);       //将其次出价者的支付出价全部返还给竞拍人
          product.highestBidder = msg.sender;                       //将最高出价者地址，变成当前用户
          product.highestBid = amount;                              //将最高出价，设为amount
          refund = bidInfo.value - amount;                          //将用户支付金额（高于竞拍价格）-竞拍价格，差值返还
        } else if (amount > product.secondHighestBid) {             //如果当前出价低于最高价，但高于次高价
          refund = product.secondHighestBid;                        //将次高价格（前一位的）赋值给refund
          product.secondHighestBid = amount;                        //将次高出价，设为amount
        } else {
          refund = amount;                                          //当前用户的出价，低于次高价
        }
      }
    }

    product.bids[msg.sender][sealedBid].revealed = true;          //改为已参与该商品拍卖状态

    if (refund > 0) {                                             //refund不为0时，返还其投标支付的价格
      msg.sender.transfer(refund);
    }
  }      
  
  function highestBidderInfo(uint _productId) view public returns (address, uint, uint) {  //通过读取竞拍商品最高价用户信息并返回
    Product memory product = stores[productIdInStore[_productId]][_productId];
    return (product.highestBidder, product.highestBid, product.secondHighestBid);
  }

  function totalBids(uint _productId) view public returns (uint) {                //返回某竞拍商品参与竞拍总人数
    Product memory product = stores[productIdInStore[_productId]][_productId];
    return product.totalBids;
  }
  
  function finalizeAuction(uint _productId) public {                              //竞拍结束后最终信息
    Product product = stores[productIdInStore[_productId]][_productId];           //读取该竞拍商品信息
    require(now > product.auctionEndTime);                                        //当前时间大于竞拍结束时间
    require(product.status == ProductStatus.Open);                                //当前竞拍状态等于open
    require(product.highestBidder != msg.sender);                                 //最高出价者不为当前访问用户
    require(productIdInStore[_productId] != msg.sender);                          //当前访问用户不是拍卖者
   
    if (product.totalBids == 0) {                                                 //若没人参与
      product.status = ProductStatus.Unsold;                                      //竞拍状态改为未卖出
    } else {                                                                      //将拍卖商品进行确定和划分
      Escrow escrow = (new Escrow).value(product.secondHighestBid)(_productId, product.highestBidder, productIdInStore[_productId], msg.sender);
      productEscrow[_productId] = address(escrow);                                //将该确权地址存储到对应商品ID中
      product.status = ProductStatus.Sold;                                        //商品状态变为售出
      uint refund = product.highestBid - product.secondHighestBid;                
      product.highestBidder.transfer(refund);                                     //将最高出价-次高出价的差值退还给最高出价者
    }
  }
  
  function releaseAmountToSeller(uint _productId) public {                        //付钱给Seller,暂未使用
    Escrow(productEscrow[_productId]).releaseAmountToSeller(msg.sender);
  }

  function refundAmountToBuyer(uint _productId) public {                          //付钱给Buyer,暂未使用
    Escrow(productEscrow[_productId]).refundAmountToBuyer(msg.sender);
  }  

  function escrowInfo(uint _productId) view public returns (address, address, address, bool, uint, uint) {
    return Escrow(productEscrow[_productId]).escrowInfo();                        //返回当前买卖双方记录信息
  }  
  
}