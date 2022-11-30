var express = require('express');
var router = express.Router();
var database = require('../database');


router.get("/", function(request, response, next){

	var queryInventory = `
		SELECT item, product_id,
			sum(CASE WHEN color="red" THEN qty_stock ELSE NULL END) AS red,
			sum(CASE WHEN color="orange" THEN qty_stock ELSE NULL END) AS orange,
			sum(CASE WHEN color="yellow" THEN qty_stock ELSE NULL END) AS yellow,
			sum(CASE WHEN color="green" THEN qty_stock ELSE NULL END) AS green,
			sum(CASE WHEN color="blue" THEN qty_stock ELSE NULL END) AS blue,
			sum(CASE WHEN color="purple" THEN qty_stock ELSE NULL END) AS purple,
			sum(CASE WHEN color="pink" THEN qty_stock ELSE NULL END) AS pink,
			sum(CASE WHEN color="black" THEN qty_stock ELSE NULL END) AS black
		FROM (
			SELECT 
				p.product_id,
				item, 
				color,
				qty_stock
			FROM 
				products p
				LEFT JOIN product_entries pe 
					ON p.product_id = pe.product_id
				LEFT JOIN colors c
					ON pe.color_id = c.color_id
		) AS inventory_table
		GROUP BY item;
	`;

	database.query(queryInventory, function(error, inventoryData){

		if(error)
		{
			throw error;
		}
		else
		{
			var query_products = `SELECT * FROM products`;

			database.query(query_products, function(error, productData){

				if(error)
				{
					throw error;
				}
				else
				{
					response.render('inventory', {title: 'Pixie Dust Inventory', action: 'list', inventoryData:inventoryData, productData:productData, });				
				}

			});
		}

	});

});


router.get('/add/:product_id', function(request, response, next){

	var prodId = request.params.product_id;
	var queryProductEntries = `SELECT * FROM products WHERE product_id = "${prodId}"`;

	database.query(queryProductEntries, function(error, inventoryData){
		
		if(error)
		{
			throw error;
		}
		else
		{
			var querySuppliers = `SELECT * FROM suppliers;`;
		
			database.query(querySuppliers, function(error, supplierData){
		
				if(error)
				{
					throw error;
				}
				else
				{
					response.render('inventory', {title: 'Add Supply', action:'add', inventoryData:inventoryData[0], supplierData:supplierData});
				}
		
			});
		}

	});

});


router.post('/add_supply/:product_id', function(request, response, next){

	var prodId = request.params.product_id;
	var red = request.body.red;
	var orange = request.body.orange;
	var yellow = request.body.yellow;
	var green = request.body.green;
	var purple = request.body.purple;
	var blue = request.body.blue;
	var pink = request.body.pink;
	var black = request.body.black;
	var supplyDate = request.body.supply_date;
	var supplierId = request.body.supplier_id;
	var suppList = [red, orange, yellow, green, blue, purple, pink, black]

	

	for (i = 0; i < suppList.length ; i ++) { 
		var queryColor = `
			UPDATE product_entries
			SET    qty_stock = qty_stock + "${suppList[i]}"
			WHERE  product_id = "${prodId}"
			AND    color_id = "${i+1}"; 
			`;

		database.query(queryColor, function(error, data){

			if(error)
			{
				throw error;
			}

		});
	}

	for (i = 0; i < suppList.length ; i ++) { 
		var querySupplies = `
		INSERT INTO supplies
					(product_id,
					color_id,
					supplier_id,
					supply_date,
					qty_supplied)
		VALUES      ("${prodId}",
					"${i+1}",
					"${supplierId}",
					"${supplyDate}",
					"${suppList[i]}") 
		`;
	
		database.query(querySupplies, function(error, data){
	
			if(error)
			{
				throw error;
			}	
	
		});
	}

	response.redirect("/inventory");

});

module.exports = router;