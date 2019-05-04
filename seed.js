EcommerceStore = artifacts.require("./EcommerceStore.sol");
module.exports = function(callback) {
  current_time = Math.round(new Date() / 1000);
  amt_1 = web3.toWei(1, 'ether');
  EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone 5', 'Cell Phones & Accessories', 'QmTvddFbddW2c4GsTks4CbZCiPFZNpaweCLyT5URnzXYZy', 'QmbvkYEnDzpNHVWskxFVoprj8AMfRxBpjLozbJHwyjwQoH', current_time, current_time + 200, 2*amt_1, 0).then(function(f) {console.log(f)})});
  EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone 5s', 'Cell Phones & Accessories', 'QmRbpprDDwSsohHMLZc8wqLHXYsYvTHqDjrna1A56MY9qJ', 'QmVLJ32c7v9eWJcRAyUoua2opug3yK4p6UHS2yUGafsPjm', current_time, current_time + 400, 3*amt_1, 1).then(function(f) {console.log(f)})});
  EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone 6', 'Cell Phones & Accessories', 'QmXbD3unmtFcWTrWc3ewdfkrkbTwiVjfkUw8YkaSA5ri3Q', 'QmYvDgKz3mxF2KtvagFm65FCCxehKBKmfpuN97QJeR4KtD', current_time, current_time + 14, amt_1, 0).then(function(f) {console.log(f)})}); 
  EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone 6s', 'Cell Phones & Accessories', 'QmUnwX6vFZyTrTmPs2G57YE2AFS7egCN8aYfSRduey93qW', 'QmPPoVinic169cJHL1VapZ5TubYw2DTSDZd2a8sbSQG8uY', current_time, current_time + 86400, 4*amt_1, 1).then(function(f) {console.log(f)})});
  EcommerceStore.deployed().then(function(i) {i.addProductToStore('iphone 7', 'Cell Phones & Accessories', 'QmViyWKLxFTUfrDndgQMbVkYpDCqPuMSeE6wp8ssphdCFE', 'QmQt7H3aUHtDApZGX6v37ZxTygPSQxn1Ur3Bay61h3HS3B', current_time, current_time + 86400, 5*amt_1, 1).then(function(f) {console.log(f)})});
  EcommerceStore.deployed().then(function(i) {i.addProductToStore('Jeans', 'Clothing, Shoes & Accessories', 'QmNdPCbeKxSrU11YGiUk1YQ5DWzU8FhvSQ88A8fpEEWdor', 'Qmd4vPrvgeaSt4Rbs5EPY1VCgGmWFPcokUDUpFeLRt2H9M', current_time, current_time + 86400 + 86400 + 86400, 5*amt_1, 1).then(function(f) {console.log(f)})});
  EcommerceStore.deployed().then(function(i) {i.productIndex.call().then(function(f){console.log(f)})});
}