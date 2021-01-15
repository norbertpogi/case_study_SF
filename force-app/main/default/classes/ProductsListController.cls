public with sharing class ProductsListController {
    public ProductsListController() {

    }
    
    @AuraEnabled(cacheable=true)
    public static List<Product__c> searchProductsList(String searchKey) {

        String key = '%' + searchKey + '%';

        return [SELECT Id, Name__c, Description__c, Gross_Amount__c, Unit__c, Category__c, Image_URL__c, Quantity__c, Photo__c
        FROM Product__c WHERE Name__c LIKE :key OR Category__c LIKE :key OR Description__c 
        LIKE :key ORDER BY Id ASC];
    }

    @AuraEnabled(cacheable=true)
    public static List<Product__c> getAllProductsList() {        
        return [SELECT Id, Name__c, Description__c, Gross_Amount__c, Unit__c, Category__c, Image_URL__c, Quantity__c 
        FROM Product__c ORDER BY Id ASC];

    }

    @AuraEnabled
    public static List<Product__c> getProductsListById(String productId) {
        
        return [SELECT Id, Name__c, Description__c, Gross_Amount__c, Unit__c, Category__c, Image_URL__c, Quantity__c, Photo__c
        FROM Product__c WHERE Id = :productId];

    }

    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountNumber(String accountId) {
        
        return [SELECT AccountNumber FROM Account WHERE Id = :accountId];

    }

    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getOrderCount(String accountId) {
        
        return [SELECT COUNT(Id) orderCount FROM Order__c WHERE Account__c = :accountId];

    }

    @AuraEnabled
    public static void resetProductsQuantity(){
        List<Product__c> products = new List<Product__c>();
        products = getAllProductsList();

        for(Product__c product: products){
            product.Quantity__c = 0;
        }

        update products;
    }

    @AuraEnabled
    public static void addProductQuantity(String productId){
        List<Product__c> products = new List<Product__c>();

        products = getProductsListById(productId);

        for(Product__c product: products){
            product.Quantity__c++;
        }

        update products;
    }

    @AuraEnabled
    public static void decreaseProductQuantity(String productId){
        List<Product__c> products = new List<Product__c>();

        products = getProductsListById(productId);

        for(Product__c product: products){
            
            if(product.Quantity__c > 0){
                product.Quantity__c--;
            } else {
                product.Quantity__c = 0;
            }
        }

        update products;
    }
}
