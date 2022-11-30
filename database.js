const mysql = require('mysql2');


var connection = mysql.createConnection({
	host: 'localhost',
    database: 'pixie_dust',
    user: 'root',
    password: 'jimson123'
});


connection.connect(function(error){
	if(error)
	{
		throw error;
	}
	else
	{
		console.log('PIXIE DUST DATABASE CONNECTED SUCCESSFULLY!');
	}
});


module.exports = connection;