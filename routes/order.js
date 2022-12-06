var express = require('express');
var router = express.Router();
var database = require('../database');


router.get('/', function(req, res, next) {

    var queryAgents = `
        SELECT agt_id,
               Concat(agt_first_name, ' ', agt_last_name) "agent"
        FROM   agents
        ORDER  BY agt_id; 
        `;

    database.query(queryAgents, function(error, agtData){

        var queryProvinces = `
        SELECT *
        FROM provinces 
        ORDER BY name;
        `

        database.query(queryProvinces, function(error, provData){

            var queryProducts = `
            SELECT *
            FROM products 
            WHERE is_active=1
            ORDER BY product_id;
            `
            database.query(queryProducts, function(error, productData){

                res.render('order', { title: 'Express', action: 'add', agtData : agtData, provData:provData, productData:productData });
        
            });   
    
        });   

    });      

});


router.get('/get_data', function(request, response, next){

    var type = request.query.type;
    var searchQuery = request.query.parent_value;

    if(type == 'load_cust')
    {
        var query_customers = `
            SELECT Concat(cust_first_name, ' ', cust_last_name) AS name,
                cust_id                                      AS id
            FROM   customers
            WHERE  agt_id = '${searchQuery}';  
            `;

        database.query(query_customers, function(error, custData){

            var data_arr = [];
            custData.forEach(function(row){
                data_arr.push(row);
                });
            response.json(data_arr);
    
        });
    } 
    else if(type == 'load_city')
    {
        var queryCities = `
            SELECT name, id
            FROM cities 
            WHERE province_id = '${searchQuery}' 
            `;

        database.query(queryCities, function(error, citiesData){

            var data_arr = [];
            citiesData.forEach(function(row){
                data_arr.push(row);
                });
            response.json(data_arr);
    
        });
    } 

});


router.post("/add_order", function(request, response, next){

    var today = new Date(); 
	var NoTimeDate = today.getFullYear()+'/'+(today.getMonth()+1)+'/'+today.getDate(); 
    var custId = request.body.cust;
    var orderDate = NoTimeDate;
    var gift = request.body.gift;
    var subtotalAmtList = [];
    var deliverAddressLine1 = request.body.deliver_address_line_1;
    var deliverAddressLine2 =  request.body.deliver_address_line_2;
    var deliverCityId =  request.body.city;
    var expectedDeliverDate = request.body.expected_deliver_date;
    var colList = request.body.color;
    var itemList = request.body.item;
    var personalizationList = request.body.personalization;
    var qtyList = request.body.qty;
    var discountList = request.body.discount;
    var recipientsList = request.body.recipients.split(/\s*,\s*/);
    

    if (typeof personalizationList === 'string') {
        personalizationList = [personalizationList];
    }
    
    var queryCust= `
        SELECT Concat(cust_first_name, ' ', cust_last_name) "agent" FROM customers WHERE cust_id = "${custId}";
        `;

    database.query(queryCust, function(error, custData){
        recipientsList.unshift(custData[0].agent);
    });  

    var queryProducts = `
        SELECT product_id, MAX(effective_price) as srp
        FROM prices
        WHERE
        DATE(effective_date) <= DATE(NOW())
        GROUP BY product_id;
        `;
    database.query(queryProducts, function(error, productData){
        
        for (i = 0; i < itemList.length ; i ++) {
            var y = itemList[i];
            subtotalAmtList.push((productData.find(x => x.product_id === parseInt(y)).srp)*(1-discountList[i])*(qtyList[i]));
        }

        var queryOrders = `
            INSERT INTO orders
                    (cust_id,
                    order_status,
                    order_date,
                    expected_deliver_date,
                    gift,
                    total_amt,
                    deliver_address_line_1,
                    deliver_address_line_2,
                    deliver_city_id)
            VALUES  ("${custId}",
                    "ordered",
                    "${orderDate}",
                    "${expectedDeliverDate}",
                    "${gift}",
                    "${subtotalAmtList.reduce((a, b) => a + b, 0)}",
                    "${deliverAddressLine1}",
                    "${deliverAddressLine2}",
                    "${deliverCityId}");
            `;

        database.query(queryOrders, function(error, orderData){

            if(error)
            {
                throw error;
            }	

            var queryId = `
                SELECT order_id
                FROM   orders
                WHERE  order_id=
                    (
                    SELECT Max(order_id)
                    FROM   orders
                    );
                `;

            var mostRecentId = -1

            database.query(queryId, function(error, idData){
                
                mostRecentId = idData[0]["order_id"];
                
                var count = 0;
                var counter = 0;
                while (count < itemList.length) {

                    var queryOrderItems = `
                        INSERT INTO order_items
                                (order_id,
                                item_no,
                                product_id,
                                color_id,
                                qty_ordered,
                                discount,
                                personalization,
                                subtotal_amt)
                        VALUES  ("${mostRecentId}",
                                "${count+1}",
                                "${itemList[count]}",
                                "${colList[count]}",
                                "${qtyList[count]}",
                                "${discountList[count]}",
                                "${personalizationList[count]}",
                                "${subtotalAmtList[count]}");
                    `;
                    database.query(queryOrderItems, function(error, orderItemsData) {

                        counter++;

                        if (counter === (itemList.length)) {

                            var counterrr = 0;
                                    
                            for (j = 0; j < recipientsList.length; j ++) {

                                var queryRecipients = `
                                    INSERT INTO recipients
                                            (order_id, recipient_name)
                                    VALUES  ("${mostRecentId}", "${recipientsList[j]}");
                                    `;


                                database.query(queryRecipients, function(error, recipientsData) {
                                    counterrr++;
                                    if(error)
                                    {
                                        throw error;
                                    }
                                    console.log(counterrr);
                                    if (counterrr === (recipientsList.length - 1)) {
                                        for (l = 0; l < itemList.length ; l++) { 
                                            var queryColor = `
                                                UPDATE product_entries
                                                SET    qty_stock = qty_stock - "${qtyList[l]}"
                                                WHERE  product_id = "${itemList[l]}"
                                                AND    color_id = "${colList[l]}"; 
                                                `;
                                    
                                            database.query(queryColor, function(error, data){
                                    
                                                if(error)
                                                {
                                                    throw error;
                                                }
                                            });
                                        }
                                    }

                                });
                        
                            }
                        
                        }

                    }); 

                    count++;

                }

                response.redirect("/order");
            
            });

        });
        
    });   
    

});


module.exports = router;
