var express = require('express');
var router = express.Router();
var database = require('../database');


router.get("/", function(request, response, next){
	
	// var queryProducts = `
	// 	SELECT p.product_id,
	// 		item,
	// 		category,
	// 		features,
	// 		srp,
	// 		max_char_personalization,
	// 		is_active,
	// 		f.dimensions  AS fdimensions,
	// 		pl.dimensions AS pdimensions,
	// 		po.slots
	// 	FROM products p
	// 		LEFT JOIN folders f
	// 			ON p.product_id = f.product_id
	// 		LEFT JOIN planners pl
	// 			ON p.product_id = pl.product_id
	// 		LEFT JOIN pen_organizers po
	// 			ON p.product_id = po.product_id; 
	// 	`;
	var queryProducts = `
		SELECT p.product_id,
				item,
				category,
				features,
				pr.srp,
				max_char_personalization,
				is_active,
				f.dimensions  AS fdimensions,
				pl.dimensions AS pdimensions,
				po.slots
		FROM products p
		LEFT JOIN folders f
				ON p.product_id = f.product_id
		LEFT JOIN planners pl
				ON p.product_id = pl.product_id
		LEFT JOIN pen_organizers po
				ON p.product_id = po.product_id
		LEFT JOIN (
				SELECT product_id, MAX(effective_date), effective_price as srp
				FROM prices
				WHERE
				DATE(effective_date) <= DATE(NOW())
				GROUP BY product_id
			) pr
			ON p.product_id = pr.product_id;
		`;

	var queryProducts = `
		SELECT p.product_id,
			item,
			category,
			features,
			pr.srp,
			max_char_personalization,
			is_active,
			f.dimensions  AS fdimensions,
			pl.dimensions AS pdimensions,
			po.slots
		FROM products p
		LEFT JOIN folders f
			ON p.product_id = f.product_id
		LEFT JOIN planners pl
			ON p.product_id = pl.product_id
		LEFT JOIN pen_organizers po
			ON p.product_id = po.product_id
		LEFT JOIN (
			SELECT product_id, effective_price as srp FROM prices t1 WHERE t1.effective_date = (SELECT max(t2.effective_date) FROM prices t2 WHERE t1.product_id = t2.product_id)
		) pr
		ON p.product_id = pr.product_id;
			`;


	database.query(queryProducts, function(error, data){

		if(error)
		{
			throw error;
		}
		else
		{
			response.render('product_catalog', {title: 'Pixie Dust Product Catalog', action: 'list', productData:data});
		}

	});

});


router.get("/add", function(request, response, next){

	response.render("product_catalog", {title:'Add a Product', action:'add'});

});


router.post("/add_product_catalog", function(request, response, next){

	var item = request.body.item;
	var category = request.body.category;
	var features = request.body.features;
	var maxCharPersonalization = request.body.max_char_personalization;
	var srp = request.body.srp;
	// var effectiveDate = request.body.effective_date;
	var effectiveDate = new Date().toISOString().split('T')[0];
	var dimensions = request.body.dimensions;
	var slots = request.body.slots;
	var mostRecentId = -1
	
	var queryProducts = `
		INSERT INTO products
				(item,
				category,
				features,
				max_char_personalization,
				is_active)
		VALUES 	("${item}",
				"${category}",
				"${features}",
				"${maxCharPersonalization}",
				1) ;
		`;

	database.query(queryProducts, function(error){

		if(error)
		{
			throw error;
		}	

	});

	var queryID = `
		SELECT product_id
		FROM   products
		WHERE  product_id=
				(
					SELECT Max(product_id)
					FROM   products
				);
		`;

	database.query(queryID, function(error, idData){

		mostRecentId = (idData[0]["product_id"]);

		if(error)
		{
			throw error;
		}

		if (category === "Folder") {

			var querySubtype = `
				INSERT INTO folders (product_id, dimensions)
					VALUES ("${mostRecentId}", "${dimensions}");
				`;
		} else if (category === "Pen Organizer") {
			var querySubtype = `
				INSERT INTO pen_organizers (product_id, slots)
					VALUES ("${mostRecentId}", "${slots}"); 
				`;
		} else if (category === "Planner") {
			var querySubtype = `
				INSERT INTO planners (product_id, dimensions)
					VALUES ("${mostRecentId}", "${dimensions}"); 
			`;
		} 

		database.query(querySubtype, function(error){

			if(error)
			{
				throw error;
			}	

		});

		var queryPrices = `
			INSERT INTO prices
						(product_id,
						effective_date,
						effective_price)
			VALUES      ("${mostRecentId}",
						"${effectiveDate}",
						"${srp}");
			`;

		database.query(queryPrices, function(error){

			if(error)
			{
				throw error;
			}	

		});

		var queryProductEntries = `
		INSERT INTO product_entries
            (product_id, color_id, qty_stock)
			VALUES  ("${mostRecentId}", 1, 0),
					("${mostRecentId}", 2, 0),
					("${mostRecentId}", 3, 0),
					("${mostRecentId}", 4, 0),
					("${mostRecentId}", 5, 0),
					("${mostRecentId}", 6, 0),
					("${mostRecentId}", 7, 0),
					("${mostRecentId}", 8, 0);
		`;

		database.query(queryProductEntries, function(error){

			if(error)
			{
				throw error;
			}	
			else
			{
				response.redirect("/product_catalog");
			}
			
		});
	
	});

});


router.get('/edit/:product_id', function(request, response){

	var id = request.params.product_id;
	// var queryItem = `SELECT * FROM products WHERE product_id = "${id}";`;

	var queryItem = `
		SELECT pr.srp, p.product_id, item, category, features, max_char_personalization 
		FROM products p
		LEFT JOIN (
			SELECT product_id, MAX(effective_price) as srp
			FROM prices
			WHERE
			DATE(effective_date) <= DATE(NOW())
			GROUP BY product_id
		) pr
			ON p.product_id = pr.product_id
		WHERE p.product_id = "${id}" ;
		`;

	database.query(queryItem, function(error, data){
		
		if(error)
		{
			throw error;
		}
		else
		{
			var today = new Date();
			response.render('product_catalog', {title: 'Edit an Item', action:'edit', productData:data[0], effectiveDate:today.toISOString().split('T')[0]});
		}

	});

});


router.post('/edit/:product_id', function(request, response){

	var id = request.params.product_id;
	var features = request.body.features;
	var maxCharPersonalization = request.body.max_char_personalization;
	var srp = request.body.srp;
	var effectiveDate = request.body.effective_date;
	
	// var queryItem = `
	// 	SELECT * FROM products WHERE product_id = "${id}";
	// 	`;

	var queryItem = `
		SELECT product_id, MAX(effective_date), effective_price as srp
		FROM prices
		WHERE
		DATE(effective_date) <= DATE(NOW())
		AND product_id = "${id}"
		GROUP BY product_id;
	`;

	database.query(queryItem, function(error, data){

		if(error)
		{
			throw error;
		}
					
		if (data[0].srp != srp) {

			var queryPrices = `
			INSERT INTO prices (product_id, effective_date, effective_price) 
				VALUES ("${id}", "${effectiveDate}", "${srp}");
			`;

			database.query(queryPrices, function(error, data){

				if(error)
				{
					throw error;
				}	

			});

		}
	
	});


	// var query = `
	// 	UPDATE products
	// 	SET    features = "${features}",
	// 		   max_char_personalization = "${maxCharPersonalization}",
	// 		   srp = "${srp}"
	// 	WHERE  product_id = ${id};
	// 	`;

	var query = `
		UPDATE products
		SET    features = "${features}",
			   max_char_personalization = "${maxCharPersonalization}"
		WHERE  product_id = ${id};
		`;

	database.query(query, function(error){

		if(error)
		{
			throw error;
		}
		else
		{
			response.redirect("/product_catalog");
		}

	});


});


router.get('/delete/:id', function(request, response){

	var id = request.params.id; 

	var queryItem = `
		UPDATE products
		SET    is_active = 0
		WHERE  product_id = ${id};
		`;

	database.query(queryItem, function(error, data){

		if(error)
		{
			throw error;
		}
		else
		{
			response.redirect("/product_catalog");
		}

	});

});


module.exports = router;