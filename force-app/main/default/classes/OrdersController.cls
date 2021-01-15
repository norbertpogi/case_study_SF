public with sharing class OrdersController {
    public OrdersController() {}

    @AuraEnabled
    public static void insertNewOrder(String orderNumber, Datetime orderDate, String accountId){
        Order__c order = new Order__c(
            Name = orderNumber,
            Order_Date__c =  orderDate,
            Account__c = accountId
        );

        insert order;
    }

    @AuraEnabled
    public static void insertNewOrderLine(String productId, Integer quantity){        
        try {
            Product__c prId = [SELECT Id,Name__c, Image_URL__c, Price__c FROM Product__c where Id = : productId];
            System.debug('productId '+  prId.Id);
            System.debug('productName ' + prId.Name__c);
            System.debug('quantity '+  quantity);
            System.debug('Price__c '+  prId.Price__c);
            
            Order_Line__c orderLine = new Order_Line__c(
                Name = prId.Name__c,
                Product__c = prId.Id,
                Qty__c =  quantity,
                Discount__c = quantity >= 2 ? 5 : 0,
                Image_URL__c = prId.Image_URL__c,
                Price__c = prId.Price__c,
                Total__c = prId.Price__c * quantity
            );
            insert orderLine;
            System.debug('Total__c '+  orderLine.Total__c);
            
        } catch(Exception ex) {
            System.debug('error found: ' + ex.getMessage());
        }
    }

    @AuraEnabled
    public static void updateCartRecordById(String cartId, Integer quantity) {
        try {
            System.debug('before update this quantity: ' + quantity);
            Order_Line__c orderLine = [SELECT Id,Qty__c,Price__c, Discount__c FROM Order_Line__c where Id =: cartId];

            orderLine.Qty__c = quantity;
            orderLine.Discount__c = quantity < 2 ? 0 : 5;
            orderLine.Total__c = orderLine.Price__c * quantity;
            update orderLine;

            System.debug('after update this orderline quantity: ' + orderLine.Qty__c);
            System.debug('total is: ' + orderLine.Total__c);
        } catch (Exception ex) {
            System.debug('error found: ' + ex.getMessage());
        }
    }

    @AuraEnabled
    public static Boolean deleteRecordById(String cartId){
        try {           
            Database.delete(cartId); 
            return true;
        } catch (Exception e) {
            System.debug(e.getMessage());
        }
        return false;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Order_Line__c> getOrderList(){
        try {
            List<Order_Line__c> orderLine = [SELECT Id,Discount__c, Name, Price__c,Product__c,Qty__c,Total__c, Image_URL__c 
            FROM Order_Line__c ORDER BY Id ASC];
            return orderLine;
            
        } catch (Exception e) {
            System.debug('error found in orderLine : ' +  e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }
}
