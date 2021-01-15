import { LightningElement, wire, api, track } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import searchProductsList from "@salesforce/apex/ProductsListController.searchProductsList";
import getAccountNumber from "@salesforce/apex/ProductsListController.getAccountNumber";
import resetProductsQuantity from "@salesforce/apex/ProductsListController.resetProductsQuantity";
import addProductQuantity from "@salesforce/apex/ProductsListController.addProductQuantity";
import decreaseProductQuantity from "@salesforce/apex/ProductsListController.decreaseProductQuantity";
import getOrderCount from "@salesforce/apex/ProductsListController.getOrderCount";
import insertNewOrderLine from "@salesforce/apex/OrdersController.insertNewOrderLine";
import getOrderList from "@salesforce/apex/OrdersController.getOrderList";

export default class ProductList extends LightningElement {
  searchKey = "";
  viewCart = true;
  viewCartFound = false;

  @wire(searchProductsList, { searchKey: "$searchKey" })
  products;
  @api cartBucketList;
  @api productId;
  @api disabled = false;
  @api required = false;
  @api cartBucketFound = false;
  @track hasError = false;
  @track prOrderlId;
  
  selectedAccountRecordId;

  currentQuantity;

  orderNumber;
  accountNumber;
  orderCount;

  //resets the value of quantity of all products to 0 every page refresh
  connectedCallback() {
    resetProductsQuantity().then(() => {
      refreshApex(this.products);
    });
    getOrderList().then((result) => {
      this.cartBucketList = result;
    }).catch((error) => {
      this.showToast("Error", error.body.messeage, "error");
    });
    console.log('connected callback call for orderList ', this.cartBucketList);
  }

  //adds quantity to a product
  addQuantity(event) {
    event.preventDefault();
    this.productId = event.target.dataset.id;

    addProductQuantity({
      productId: this.productId
    }).then(() => {
      refreshApex(this.products);
    });
  }

  //decreases current quantity of a product
  minusQuantity(event) {
    event.preventDefault();
    this.productId = event.target.dataset.id;

    decreaseProductQuantity({
      productId: this.productId
    }).then(() => {
      refreshApex(this.products);
    });
  }

  //search for a specific product by name, description, category, unit
  searchProduct(event) {
    const isEnterKey = event.keyCode === 13;
    if (isEnterKey) {
      this.searchKey = event.target.value;

      if (this.searchKey !== "") {
        searchProductsList({ searchKey: this.searchKey})
          .then((result) => {this.products.data = result; refreshApex(this.products);})
            .catch((error) => {this.products = undefined;
            console.error(error);
          });
      } else {
        refreshApex(this.products);
      }
    }
  }
  showToast(title, variant) {
    const evt = new ShowToastEvent({      
        title: title,
        variant: variant,
        mode: 'dismissable'
    });
    this.dispatchEvent(evt);
    return true;
  }
  validateError =(paramInput)=> {
      return this.hasError = true ? (paramInput == 0 || paramInput == undefined): false;
  }

  insertRecord =(prOrderlId, quantity)=> {    
    insertNewOrderLine({
      productId: prOrderlId,
      quantity: quantity
    }).then((result) => {
        this.showToast("Order successfully added to cart!", "success");        
      }).catch((error) => {
        this.showToast("Error", error.body.messeage, "error");
      });
      this.viewCart = true;
  }
  //adds to cart specific product
  addToCart(event) {
    const quantity = event.target.dataset.quantity;
    this.validateError(quantity);
    this.hasError == true ? this.showToast("Quantity can't be 0!", "error") : false;
    
    this.validateError(this.orderNumber);
    this.hasError == true ? this.showToast("Account can't be empty!", "error") : false;
    
    this.validateError(this.selectedDate);
    this.hasError == true ? this.showToast("Order Date can't be empty!", "error") : false;

    event.preventDefault();

    //this.prDetailId = 
    this.prOrderlId = event.target.dataset.id;
    this.hasError == false ? this.insertRecord(this.prOrderlId, quantity) : null;            
    setTimeout(window.location.reload.bind(window.location), 4000)
  }
  //shows lookup field of Account object
  selectAccountValue(event) {
    event.preventDefault();
    //converts object Object to JSON String
    let jsonString = JSON.stringify(event.detail);
    //converts JSON STRING to, JSON Object
    const jsonObject = JSON.parse(jsonString);
    //Finally, extract id from object
    this.selectedAccountRecordId = jsonObject.value[0];
    this.createOrderNumber();
  }

  @api isValid() {
    if (this.required) {
      this.template.querySelector("lightning-input-field").reportValidity();
    }
  }

  //get selected date from date picker
  getSelectedDate(event) {
    this.selectedDate = event.target.value;

    const currentDate = new Date();
    const twoDaysAfter = new Date(currentDate.setDate(currentDate.getDate() + 2));
    this.selectedDate = new Date(this.selectedDate);

    if (this.selectedDate.getTime() < new Date().getTime()) {
      this.showToast("Order Date can't be less than today!", "error");

    } else if (this.selectedDate.getTime() < twoDaysAfter.getTime()) {
      this.showToast("Order Date should be starting two days from now!", "error");            
    }
  }

  //auto generates Order Number based from Account Number and number of orders from the account selected
  createOrderNumber() {
    getAccountNumber({
      accountId: this.selectedAccountRecordId
    })
      .then((result) => {
        this.orderNumber = "ORDER" + result[0].AccountNumber;
      })
      .catch((error) => {
        console.error(error);
        this.orderNumber = "ORDER";
      });

    getOrderCount({
      accountId: this.selectedAccountRecordId
    }).then((result) => {
      const orderCount = result[0].orderCount;
      this.orderNumber = this.orderNumber + this.zeroPad(orderCount + 1);
    });
  }

  //add leading zeroes to the order count for Order Number
  zeroPad(num) {
    return num.toString().padStart(4, "0");
  }
  viewCartDisplay = () => {
    this.viewCartFound = !this.viewCartFound;
    this.cartBucketFound = true ? Object.keys(this.cartBucketList).length != 0 : false;
  };

  closeViewCartDetail = () => {
    this.viewCartFound = false;
  }
}
