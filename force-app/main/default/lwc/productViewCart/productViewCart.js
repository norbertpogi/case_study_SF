import { api, LightningElement, track, wire } from "lwc";
import updateCartQuantityById from "@salesforce/apex/OrdersController.updateCartRecordById";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getOrderList from "@salesforce/apex/OrdersController.getOrderList";
import deleteRecordById from "@salesforce/apex/OrdersController.deleteRecordById";
import { refreshApex } from "@salesforce/apex";

export default class ProductViewCart extends LightningElement {
  
  @api cartBucketFound;
  @api cartBucketList;
  @track quantity;
  @track cartId;
  @track netTotal;
  @track grossTotal;
  processing = true;

  getQuantity = (event) => {
    this.quantity = event.target.value;
  };

  connectedCallback() {
      refreshApex(this.getOrderItemList());
      this.calculateGrandTotal();
    }

  getOrderItemList=()=> {       //re initiate method to get the updated value for cartList item
    getOrderList().then((result) => {
        this.cartBucketList = result;                             
        });
        refreshApex(this.cartBucketList);
    }

  updateCart = (event) => {     //update to cart
    this.cartId = event.target.dataset.id;
    updateCartQuantityById({
      cartId: this.cartId,
      quantity: this.quantity
    })
      .then(() => {
        this.showToast("Your cart has been successfully updated!", "success");
      })
      .catch((error) => {
        this.showToast(error.body.messeage, "error");
      });
      setTimeout(window.location.reload.bind(window.location), 3000);        
      this.getOrderItemList();
      this.calculateGrandTotal();
  };

  calculateGrandTotal =()=> {   //calculate net and gross
      let semiGrossTotal = 0;
      let semiDiscount = 0;
      let semiNetTotal = 0;

      this.cartBucketList.forEach(item => {
          semiGrossTotal += item.Price__c;
          semiDiscount += item.Discount__c;
      });
      semiNetTotal = semiGrossTotal - semiDiscount;
      this.grossTotal = semiGrossTotal;
      this.netTotal = semiNetTotal;
  }

  deleteOrder = (event)=> { //remove item from cart
    let idToDelete = event.target.dataset.id;
    let cartList = this.cartBucketList;
    let cartListIndex;
    let cartIdToDelete;

    cartList.forEach(item => {
        if(item.Id === idToDelete) {
            cartListIndex = 1;
        }
    });

    cartIdToDelete = cartList[cartListIndex].Id;
    this.deleteToServer(cartIdToDelete, cartList);          
    this.refreshCartBucketList();
    this.showToast("Item has been successfully removed!!", "sucess"); 
    setTimeout(window.location.reload.bind(window.location), 3000);   
  }

  deleteToServer=(cartIdToDelete, cartList)=> { //final delete method goes to server side
    deleteRecordById({ cartId: cartIdToDelete })
    .then(result => {
        return cartList.splice(cartListIndex, 1) ? result == true : this.showToast("Unable to delete Item!!", "error");       
    })
    .catch(error => console.log(error));
  }

  refreshCartBucketList() {
    this.processing = true;
    refreshApex(this.cartBucketList)
    this.processing = false;
}

  showToast(title, variant) {   //confirmation action
    const evt = new ShowToastEvent({
      title: title,
      variant: variant,
      mode: "dismissable"
    });
    this.dispatchEvent(evt);
  }
}
