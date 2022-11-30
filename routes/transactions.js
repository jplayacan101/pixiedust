var express = require('express');
var router = express.Router();
var database = require('../database');


router.get("/", function(request, response, next){

	var today = new Date(); 

	var queryOrders = `
		SELECT order_id,
				order_date,
				Concat(a.agt_first_name, ' ', a.agt_last_name)   "agent",
				Concat(c.cust_first_name, ' ', c.cust_last_name) "customer",
				total_amt
		FROM    orders o,
				customers c,
				agents a
		WHERE 	o.cust_id = c.cust_id
				AND a.agt_id = c.agt_id
		ORDER   BY order_id; 
		`;

	database.query(queryOrders, function(error, data){		

		if(error)
		{
			throw error;
		}
		else
		{
			response.render('transactions', {title: 'Pixie Dust Agent Transactions', action: 'list', orderData:data, today:today});
		}

	});

});


router.get('/view/:order_id', function(request, response, next){

	var id = request.params.order_id;
	var queryOrder = `
		SELECT  Concat(c.cust_first_name, ' ', c.cust_last_name) "customer",
				Concat(o.deliver_address_line_1, ', ',
				Coalesce(o.deliver_address_line_2, ''),
				' ', ct.name, ', ', p.name, ', ', ct.zipcode)           "address",
				expected_deliver_date,
				gift,
				order_id,
				order_date,
				Concat(a.agt_first_name, ' ', a.agt_last_name)   "agent",
				total_amt
		FROM    orders o,
				customers c,
				agents a,
				cities ct,
				provinces p,
				products pr
		WHERE   o.cust_id = c.cust_id
				AND a.agt_id = c.agt_id
				AND order_id = "${id}"
				AND o.deliver_city_id = ct.id
				AND ct.province_id = p.id
		ORDER   BY order_id; 
		`;

	database.query(queryOrder, function(error, orderData){

		if(error)
		{
			throw error;
		}
		else
		{
			var queryOrderItems = `
				SELECT item, c.color, personalization, qty_ordered, discount, subtotal_amt
				FROM order_items o, products p, colors c
				WHERE order_id = "${id}"
				AND o.product_id = p.product_id
				AND o.color_id = c.color_id; 
				`;

			database.query(queryOrderItems, function(error, orderItemsData){
				if(error)
				{
					throw error;
				}
				else
				{
					var queryRecipients = `SELECT recipient_name FROM recipients WHERE order_id = "${id}"`;

					database.query(queryRecipients, function(error, recipientsData){
						if(error)
						{
							throw error;
						}
						else
						{
							response.render('transactions', {title: 'Pixie Dust Order Form', action:'view', orderData:orderData[0], orderItemsData:orderItemsData, recipientsData:recipientsData});
						}
					});
				}
			});
		}
	});

});


module.exports = router;