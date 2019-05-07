EcommerceStore = artifacts.require("./EcommerceStore.sol");
Eutil = require('ethereumjs-util');  

module.exports = function(callback){
  amt_1 = web3.toWei(1, 'ether');
  current_time = Math.round(new Date() / 1000);
  
  EcommerceStore.deployed()
    .then(inst => {
      inst.addProductToStore('iphone 6', 'Cell Phones & Accessories', 'QmXbD3unmtFcWTrWc3ewdfkrkbTwiVjfkUw8YkaSA5ri3Q', 
                      'QmYvDgKz3mxF2KtvagFm65FCCxehKBKmfpuN97QJeR4KtD', current_time, current_time + 60, amt_1, 0)
        .then(()=> inst.productIndex())
        .then(lastid => inst.getProduct(lastid))
        .then(product => console.log(product))
        .then(()=>{
          console.log('account 1# bidding...')
          sealedBid = '0x' + Eutil.sha3((2 * amt_1) + 'mysecretacc1').toString('hex');
          return inst.bid(1, sealedBid, {value: 3*amt_1, from: web3.eth.accounts[1]})
        })
        .then(ret => console.log('account 1# bid result',ret))
        .then(()=>{
          console.log('account 2# bidding...')
          sealedBid = '0x' + Eutil.sha3((3 * amt_1) + 'mysecretacc2').toString('hex');
          return inst.bid(1, sealedBid, {value: 4*amt_1, from: web3.eth.accounts[2]})
        })
        .then(ret => console.log('account 2# bid result',ret))
        .then(()=>{
          console.log('account 1# balance',web3.eth.getBalance(web3.eth.accounts[1]))   
          console.log('account 2# balance',web3.eth.getBalance(web3.eth.accounts[2]))   
          console.log('waiting for auction ending...')
          return new Promise((resolve,reject)=> setTimeout(()=>resolve(),60*1000))
        })
        .then(()=>{
          console.log('account 1# revealing...')
          return inst.revealBid(1, (2*amt_1).toString(), 'mysecretacc1', {from: web3.eth.accounts[1]})
        })
        .then(ret => console.log('account 1# reveal result',ret))
        .then(()=>{
          console.log('account 2# revealing...')
          return inst.revealBid(1, (3*amt_1).toString(), 'mysecretacc2', {from: web3.eth.accounts[2]})
        })
        .then(ret => console.log('account 2# reveal result',ret))
        .then(()=> inst.totalBids(1))
        .then(ret => console.log('totalBids',ret))
        .then(()=> inst.highestBidderInfo(1))
        .then(ret => console.log('highestBidderInfo',ret))
        .then(()=>{
          console.log('account 1# balance',web3.eth.getBalance(web3.eth.accounts[1]))
          console.log('account 2# balance',web3.eth.getBalance(web3.eth.accounts[2]))
        })
    });          
}