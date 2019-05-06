import "bootstrap/dist/css/bootstrap.css"
import "../stylesheets/app.css";

import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
import ecommerce_store_artifacts from '../../build/contracts/EcommerceStore.json'
import ipfsAPI from 'ipfs-api'
import ethUtil from 'ethereumjs-util'
import $ from 'jquery'

const ethereumNodeUrl = ETHEREUM_NODE_URL ? ETHEREUM_NODE_URL : 'http://localhost:8545'
const ipfsApiAddress = {
  protocol: 'http',
  host: IPFS_API_HOST ? IPFS_API_HOST : 'localhost',
  port: IPFS_API_PORT ? IPFS_API_PORT : 5001  
}
const ipfsGatewayUrl = IPFS_GATEWAY_URL ? IPFS_GATEWAY_URL : 'http://ipfs.io'

const EcommerceStore = contract(ecommerce_store_artifacts);
const ipfs = ipfsAPI(ipfsApiAddress);

let reader;
window.App = {
  start: function() {
    EcommerceStore.setProvider(web3.currentProvider);
    
    if($("#index-page").length>0){
      renderStore()
    }
    
    if($('#list-item-page').length>0){
      $("#product-image").change( event => {
        if(event.target.files.length === 0) return
        const file = event.target.files[0]
        reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
      });      
      
      $("#add-item-to-store").submit(event => {
         event.preventDefault();
         const req = $("#add-item-to-store").serialize();
         let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
         let decodedParams = {}
         Object.keys(params)
          .forEach( k => decodedParams[k] = decodeURIComponent(decodeURI(params[k])) )
         saveProduct(reader, decodedParams);
      })      
    }
    
    if($("#product-page").length > 0) { 
      let productId = new URLSearchParams(window.location.search).get('id');
      if(!productId) return $('#msg').html('ERROR: no product id specified.').show();
      renderProductDetails(productId);
      
      $("#bidding").submit(function(event) {
        event.preventDefault();
        $("#msg").hide();
        let amount = $("#bid-amount").val();
        let sendAmount = $("#bid-send-amount").val();
        let secretText = $("#secret-text").val();
        let sealedBid = '0x' + ethUtil.sha3(web3.toWei(amount, 'ether') + secretText).toString('hex');
        let productId = $("#product-id").val();
        
        EcommerceStore.deployed()
          .then(inst => inst.bid(parseInt(productId), sealedBid, {value: web3.toWei(sendAmount), from: web3.eth.accounts[1], gas: 440000}))
          .then(ret => {
              $("#msg").html("Your bid has been successfully submitted!");
              $("#msg").show();
            })
            .catch(err => console.log(err))
      });    
      
      $("#revealing").submit(function(event) {
        event.preventDefault();
        $("#msg").hide();
        let amount = $("#actual-amount").val();
        let secretText = $("#reveal-secret-text").val();
        let productId = $("#product-id").val();
        EcommerceStore.deployed()
          .then(inst => inst.revealBid(parseInt(productId), web3.toWei(amount).toString(), secretText, {from: web3.eth.accounts[1], gas: 440000}))
          .then(ret => {
              $("#msg").show();
              $("#msg").html("Your bid has been successfully revealed!");
            })
            .catch(err => console.log(err))
      });      
      
      $("#finalize-auction").submit(function(event) {
        event.preventDefault();
        $("#msg").hide();
        let productId = $("#product-id").val();
        EcommerceStore.deployed()
          .then(inst => inst.finalizeAuction(parseInt(productId), {from: web3.eth.accounts[9], gas: 4400000}))
          .then(ret => {
             $("#msg").show();
             $("#msg").html("The auction has been finalized and winner declared.");
             //location.reload();
          })
          .catch(err => console.log(err))
      });    
      
      $(".release-funds").click(function() {
        let productId = new URLSearchParams(window.location.search).get('id');
        let account = $(this).data('account')
        EcommerceStore.deployed()
          .then(inst => inst.releaseAmountToSeller(productId, {from: account, gas: 440000}))
          .then(() => $("#msg").html("Your transaction has been submitted. Please wait for few seconds for the confirmation").show())
          .catch(err => console.log(err))
      });

      $(".refund-funds").click(function() {
        let productId = new URLSearchParams(window.location.search).get('id');
        let account = $(this).data('account')
        EcommerceStore.deployed()
          .then(f => f.refundAmountToBuyer(productId, {from: account, gas: 440000}))
          .then(() => $("#msg").html("Your transaction has been submitted. Please wait for few seconds for the confirmation").show())
          .catch(err => console.log(err))
      });
            
    }    
    
  }
};

window.addEventListener('load', function() {
  window.web3 = new Web3(new Web3.providers.HttpProvider(ethereumNodeUrl));
  App.start();
});

function renderStore() {
  let inst
  return EcommerceStore.deployed()
    .then(i => inst = i)
    .then(()=> inst.productIndex())
    .then(next => {
      for(let id=1;id<=next;id++){
        inst.getProduct.call(id)
          .then(p => $("#product-list").append(buildProduct(p)))
      }        
    })
}

function buildProduct(product) {
  let imgUrl = `${ipfsGatewayUrl}/ipfs/${product[3]}`
  let html = `<div>
                <img src="${imgUrl}" width="150px" />
                <div>${product[1]}</div>
                <div>${product[2]}</div>
                <div>${product[5]}</div>
                <div>${product[6]}</div>
                <div>Eether ${product[6]}</div>
              </div>`
  return $(html)
  	.css('cursor','pointer')
  	.click(()=>location.href=`/product.html?id=${product[0]}`);  
}

function saveImageOnIpfs(reader) {
  const buffer = Buffer.from(reader.result);
  return ipfs.add(buffer)
    .then( rsp => rsp[0].hash)
    .catch(err => console.error(err))
}

function saveTextBlobOnIpfs(blob) {
  const descBuffer = Buffer.from(blob, 'utf-8');
  return ipfs.add(descBuffer)
    .then( rsp => rsp[0].hash )
    .catch( err => console.error(err))
}

function saveProductToBlockchain(params, imageId, descId) {
  let auctionStartTime = Date.parse(params["product-auction-start"]) / 1000;
  let auctionEndTime = auctionStartTime + parseInt(params["product-auction-end"]) * 24 * 60 * 60
  return EcommerceStore.deployed()
    .then( inst => inst.addProductToStore(params["product-name"], 
                        params["product-category"], 
                        imageId, descId, auctionStartTime,auctionEndTime, 
                        web3.toWei(params["product-price"], 'ether'), 
                        parseInt(params["product-condition"]), 
                        {from: web3.eth.accounts[0], gas: 440000}))
    .then(() =>{
      $("#msg").show();
      $("#msg").html("Your product was successfully added to your store!");    
    })                          
    .catch(err => console.log(err))
}

function saveProduct(reader, decodedParams) {
  let imageId, descId;
  return saveImageOnIpfs(reader)
    .then(id => imageId = id) 
    .then(() => saveTextBlobOnIpfs(decodedParams["product-description"]) )
    .then(id => descId = id)  
    .then(() => saveProductToBlockchain(decodedParams, imageId, descId))
    .catch(err => console.log(err))
}

function displayPrice(amt) {
  return 'Ξ' + web3.fromWei(amt, 'ether');
}

function getCurrentTimeInSeconds(){
  return Math.round(new Date() / 1000);
}

function displayEndHours(seconds) {
  let current_time = getCurrentTimeInSeconds()
  let remaining_seconds = seconds - current_time;

  if (remaining_seconds <= 0) {
    return "Auction has ended";
  }

  let days = Math.trunc(remaining_seconds / (24*60*60));
  remaining_seconds -= days*24*60*60
  let hours = Math.trunc(remaining_seconds / (60*60));
  remaining_seconds -= hours*60*60
  let minutes = Math.trunc(remaining_seconds / 60);
  if (days > 0) {
    return "Auction ends in " + days + " days, " + hours + ", hours, " + minutes + " minutes";
  } else if (hours > 0) {
    return "Auction ends in " + hours + " hours, " + minutes + " minutes ";
  } else if (minutes > 0) {
    return "Auction ends in " + minutes + " minutes ";
  } else {
    return "Auction ends in " + remaining_seconds + " seconds";
  }
}

function renderProductDetails(productId) {
  EcommerceStore.deployed()
    .then(inst => inst.getProduct.call(productId))
    .then(p => {
      let content = "";
      ipfs.cat(p[4])
        .then(function(file) {
          content = file.toString();
          $("#product-desc").append(`<div>${content}</div>`);
        })
        .catch(err => console.log(err))

      $("#product-image").append(`<img src='${ipfsGatewayUrl}/ipfs/${p[3]}' width='250px'/>`);
      $("#product-price").html(displayPrice(p[7]));
      $("#product-name").html(p[1]);
      $("#product-auction-end").html(displayEndHours(p[6]));
      $("#product-id").val(p[0]);
      
      let currentTime = getCurrentTimeInSeconds();
      $("#revealing, #bidding,#finalize-auction,#escrow-info").hide();
      if (parseInt(p[8]) == 1) {
        EcommerceStore.deployed()
          .then(inst =>  {
            $("#escrow-info").show();
            inst.highestBidderInfo.call(productId)
              .then(f => {
                if (f[2].toLocaleString() == '0') {
                  $("#product-status").html("Auction has ended. No bids were revealed");
                } else {
                  $("#product-status").html("Auction has ended. Product sold to " + f[0] + " for " + displayPrice(f[2]) +
                    "The money is in the escrow. Two of the three participants (Buyer, Seller and Arbiter) have to " +
                    "either release the funds to seller or refund the money to the buyer");
                }
              })

            inst.escrowInfo.call(productId)
              .then(f => {
                $("#buyer").html('Buyer: ' + f[0]);
                $("#seller").html('Seller: ' + f[1]);
                $("#arbiter").html('Arbiter: ' + f[2]);
                $("#buyer-vote a").data('account',f[0])
                console.log($("#buyer-vote a")[0],f[0])
                $("#seller-vote a").data('account',f[1])
                $("#arbiter-vote a").data('account',f[2])
                if(f[3] == true) {
                  $("#release-count").html("Amount from the escrow has been released");
                } else {
                  $("#release-count").html(f[4] + " of 3 participants have agreed to release funds");
                  $("#refund-count").html(f[5] + " of 3 participants have agreed to refund the buyer");
                }
              })
              
          })                     
      } else if(parseInt(p[8]) == 2) {
        $("#product-status").html("Product was not sold");
      } else if(currentTime < parseInt(p[6])) {
        $("#bidding").show();
      } else if (currentTime  < (parseInt(p[6])+60) ) {
        $("#revealing").show();
      } else {
        $("#finalize-auction").show();
      }
      
    })
    .catch(err => console.log(err))
}
